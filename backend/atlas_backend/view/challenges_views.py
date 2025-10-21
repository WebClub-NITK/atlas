from django.shortcuts import get_object_or_404
from django.conf import settings
from django.db.models import Sum, Count, Q
from django.core.exceptions import ValidationError
from datetime import datetime, timedelta
import jwt
import json
import time
from django.core.mail import send_mail
from django.contrib.auth.hashers import make_password, check_password
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from django.core.cache import cache
from django.db import transaction
from django.http import QueryDict
from ..models import User, Challenge, Submission, Team, Container, HintPurchase, validate_team_name, ThemeConfig
from ..serializers import ChallengeSerializer, TeamSerializer, SubmissionSerializer, UserSerializer, ThemeConfigSerializer
import re
from docker_plugin import DockerPlugin
import logging, json

logger = logging.getLogger('atlas_backend')

class ChallengeListView(generics.ListAPIView):
    """Get all challenges available to the user"""
    permission_classes = [IsAuthenticated]
    serializer_class = ChallengeSerializer

    def get_queryset(self):
        return Challenge.objects.filter(is_hidden=False)

    def list(self, request, *args, **kwargs):
        if not request.user.team:
            return Response(
                {'error': 'You must be in a team to access challenges'},
                status=status.HTTP_403_FORBIDDEN
            )

        queryset = self.get_queryset()
        challenges_list = list(queryset.values(
            'id', 'title', 'description', 'category', 'max_points', 
            'file_links', 'docker_image', 'max_attempts', 'hints'
        ))

        team_submissions = list(Submission.objects.filter(team=request.user.team).values('challenge_id', 'is_correct'))

        # Create a lookup for submissions
        submission_map = {}
        for sub in team_submissions:
            challenge_id = sub['challenge_id']
            if challenge_id not in submission_map:
                submission_map[challenge_id] = {'tries': 0, 'is_correct': False}
            submission_map[challenge_id]['tries'] += 1
            if sub['is_correct']:
                submission_map[challenge_id]['is_correct'] = True

        for chal in challenges_list:
            sub_data = submission_map.get(chal['id'], {'tries': 0, 'is_correct': False})
            chal['is_correct'] = sub_data['is_correct']
            chal['tries'] = sub_data['tries']
            
            hints = chal.get('hints', [])
            hints = hints if isinstance(hints, list) else json.loads(hints)
            chal['hint_count'] = len(hints)
            del chal['hints'] # Remove hint content from list view

        return Response(challenges_list)

class ChallengeDetailView(APIView):
    """Returns challenge details by id"""
    permission_classes = [IsAuthenticated]

    def get(self, request, challenge_id):
        if not request.user.team:
            return Response({"error": "You must be in a team to access challenges"}, status=status.HTTP_400_BAD_REQUEST)
        
        challenge = get_object_or_404(Challenge, id=challenge_id)
        if challenge.is_hidden and not request.user.is_superuser:
            return Response({"error": "Challenge not found"}, status=status.HTTP_404_NOT_FOUND)
        
        hint_purchases = HintPurchase.objects.filter(team=request.user.team, challenge=challenge)
        purchased_hint_indices = hint_purchases.values_list('hint_index', flat=True)
        total_points_deducted = sum(ph.points_deducted for ph in hint_purchases)
        
        correct_solves = Submission.objects.filter(
            challenge=challenge, is_correct=True
        ).values('team').distinct().count()
        total_teams = Team.objects.filter(is_hidden=False).count()
        solve_rate = (correct_solves / total_teams) * 100 if total_teams > 0 else 0

        hints = challenge.hints if isinstance(challenge.hints, list) else json.loads(challenge.hints)
        hint_data = []
        for i, hint in enumerate(hints):
            is_purchased = i in purchased_hint_indices
            hint_info = {'index': i, 'cost': hint['cost'], 'purchased': is_purchased}
            if is_purchased:
                hint_info['content'] = hint['content']
            hint_data.append(hint_info)

        remaining_points = max(0, challenge.max_points - total_points_deducted)

        return Response({
            "challenge": {
                "id": challenge.id, "title": challenge.title, "description": challenge.description,
                "category": challenge.category, "max_points": challenge.max_points,
                "max_attempts": challenge.max_attempts, "remaining_points": remaining_points,
                "total_points_deducted": total_points_deducted, "hints": hint_data,
                "file_links": challenge.file_links, "docker_image": challenge.docker_image,
                "solve_rate": solve_rate
            }
        })

class SubmitFlagView(APIView):
    """Handles flag submissions for a challenge"""
    permission_classes = [IsAuthenticated]

    def post(self, request, challenge_id):
        team = request.user.team
        if not team:
            return Response({'error': 'You must be in a team to submit flags'}, status=status.HTTP_403_FORBIDDEN)
        if team.is_banned:
            return Response({'error': 'Your team has been banned'}, status=status.HTTP_403_FORBIDDEN)

        challenge = get_object_or_404(Challenge, id=challenge_id)
        flag = request.data.get('flag_submitted', '').strip()
        if not flag:
            return Response({'error': 'Flag is required'}, status=status.HTTP_400_BAD_REQUEST)

        submission_count = Submission.objects.filter(team=team, challenge=challenge).count()
        if submission_count >= challenge.max_attempts:
            return Response({'error': f'Maximum {challenge.max_attempts} attempts allowed'}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        with transaction.atomic():
            if Submission.objects.filter(team=team, challenge=challenge, is_correct=True).exists():
                return Response({'error': 'Challenge already solved'}, status=status.HTTP_400_BAD_REQUEST)

            attempt_number = submission_count + 1
            is_correct = (challenge.flag == flag)
            points_awarded = 0

            if is_correct:
                hint_purchases = HintPurchase.objects.filter(team=team, challenge=challenge)
                total_points_deducted = sum(p.points_deducted for p in hint_purchases)
                points_awarded = max(0, challenge.max_points - total_points_deducted)
                
                team.team_score += points_awarded
                team.challenges.add(challenge)
                team.save()

            submission = Submission.objects.create(
                team=team, challenge=challenge, user=request.user, flag_submitted=flag,
                is_correct=is_correct, points_awarded=points_awarded, attempt_number=attempt_number
            )

        return Response({
            'message': 'Correct flag!' if is_correct else 'Incorrect flag',
            'points_awarded': submission.points_awarded, 'is_correct': is_correct,
            'attempt_number': attempt_number, 'attempts_remaining': challenge.max_attempts - attempt_number,
            'timestamp': submission.timestamp.isoformat(),
            'new_team_score': team.team_score if is_correct else None
        })

class StartChallengeView(APIView):
    """Starts a Docker container for a challenge"""
    permission_classes = [IsAuthenticated]

    def post(self, request, challenge_id):
        team = request.user.team
        if not team:
            return Response({'error': 'You must be in a team to start challenges'}, status=status.HTTP_403_FORBIDDEN)
        if team.is_banned:
            return Response({'error': 'Your team has been banned'}, status=status.HTTP_403_FORBIDDEN)
        
        challenge = get_object_or_404(Challenge, id=challenge_id)
        if not challenge.docker_image:
            return Response({'error': 'This challenge does not have a container.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check for an existing, recent container
        existing_container = Container.objects.filter(
            team=team, challenge=challenge, created_at__gte=datetime.now() - timedelta(minutes=10)
        ).first()
        if existing_container:
            return Response({
                'host': existing_container.ssh_host, 'port': existing_container.ssh_port,
                'ssh_user': existing_container.ssh_user, 'ssh_password': existing_container.ssh_password,
                'created_at': existing_container.created_at
            })

        try:
            client = DockerPlugin(base_url=settings.DOCKER_HOST, key_file=settings.SSH_KEY_FILE)
            container_name = f"{team.name.replace(' ', '_')}-{challenge.title.replace(' ', '_')}"
            container_id, password = client.run_container(challenge.docker_image, port=challenge.port, container_name=container_name)

            # Poll for port mapping
            ports = None
            for _ in range(15): # Poll for 15 seconds
                ports = client.get_container_ports(container_id)
                if ports and f'{challenge.port}/tcp' in ports:
                    break
                time.sleep(1)
            
            if not ports or f'{challenge.port}/tcp' not in ports:
                client.stop_container(container_id) # Cleanup
                return Response({'error': 'Timeout waiting for container ports'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            host_port = ports[f'{challenge.port}/tcp'][0]['HostPort']
            container = Container.objects.create(
                team=team, challenge=challenge, container_id=container_id,
                ssh_host=settings.SSH_HOST_URL, ssh_port=host_port,
                ssh_user=challenge.ssh_user, ssh_password=password
            )

            response_data = {
                'host': container.ssh_host, 'port': container.ssh_port,
                'created_at': container.created_at
            }
            if challenge.ssh_user:
                response_data.update({'ssh_user': container.ssh_user, 'ssh_password': container.ssh_password})
            
            return Response(response_data)
        except Exception as e:
            logger.error(f"Error starting container: {e}")
            return Response({'error': 'Failed to start container'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class StopChallengeView(APIView):
    """Stops a Docker container for a challenge"""
    permission_classes = [IsAuthenticated]

    def post(self, request, challenge_id):
        team = request.user.team
        if not team:
            return Response({'error': 'You must be in a team'}, status=status.HTTP_403_FORBIDDEN)

        challenge = get_object_or_404(Challenge, id=challenge_id)
        container = Container.objects.filter(team=team, challenge=challenge).first()

        if container:
            try:
                client = DockerPlugin(base_url=settings.DOCKER_HOST, key_file=settings.SSH_KEY_FILE)
                client.stop_container(container.container_id)
                container.delete()
                return Response({'message': 'Container stopped successfully'})
            except Exception as e:
                logger.error(f"Error stopping container {container.container_id}: {e}")
                return Response({'error': 'Failed to stop container'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({'message': 'No active container found for this challenge'}, status=status.HTTP_404_NOT_FOUND)

class TeamListView(generics.ListAPIView):
    """Lists teams for the public scoreboard"""
    permission_classes = [IsAuthenticated]
    serializer_class = TeamSerializer

    def get_queryset(self):
        qs = Team.objects.annotate(
            member_count=Count('members', distinct=True),
            solved_count=Count('submissions', filter=Q(submissions__is_correct=True), distinct=True)
        ).order_by('-team_score', 'created_at')
        
        if not self.request.user.is_superuser:
            qs = qs.filter(is_hidden=False)
        return qs

class TeamScoreView(APIView):
    """Returns the score for a specific team or the users team"""
    permission_classes = [IsAuthenticated]

    def get(self, request, team_id=None):
        team = None
        if team_id:
            team = get_object_or_404(Team, id=team_id)
        elif request.user.team:
            team = request.user.team
        else:
            return Response({'error': 'You are not in a team'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'team_name': team.name,
            'total_score': team.team_score,
            'solved_challenges': team.challenges.count()
        })

class SubmissionHistoryView(APIView):
    """Returns the submission history for the users team"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        team = request.user.team
        if not team:
            return Response({'error': 'User not associated with any team'}, status=status.HTTP_403_FORBIDDEN)

        submissions = Submission.objects.filter(team=team).select_related('challenge', 'user').order_by('challenge', '-timestamp')
        history = {}
        for sub in submissions:
            chal_id = sub.challenge.id
            if chal_id not in history:
                history[chal_id] = {
                    'challenge_name': sub.challenge.title, 'category': sub.challenge.category,
                    'max_points': sub.challenge.max_points, 'points_awarded': 0,
                    'attempts': [], 'is_solved': False, 'attempts_used': 0
                }
            
            history[chal_id]['attempts'].append({
                'timestamp': sub.timestamp, 'submitted_by': sub.user.email,
                'is_correct': sub.is_correct, 'points_awarded': sub.points_awarded,
                'attempt_number': sub.attempt_number
            })
            history[chal_id]['attempts_used'] += 1
            if sub.is_correct:
                history[chal_id]['is_solved'] = True
                history[chal_id]['points_awarded'] = sub.points_awarded

        return Response(list(history.values()))

class ChallengeSubmissionHistoryView(APIView):
    """Returns submission history for a specific challenge for the users team"""
    permission_classes = [IsAuthenticated]

    def get(self, request, challenge_id):
        team = request.user.team
        if not team:
            return Response({'error': 'You must be in a team to view submissions'}, status=status.HTTP_403_FORBIDDEN)

        challenge = get_object_or_404(Challenge, id=challenge_id)
        
        submissions = Submission.objects.filter(
            team=team, 
            challenge=challenge
        ).order_by('-timestamp').values('timestamp', 'flag_submitted', 'is_correct')

        return Response(list(submissions))

class ScoreboardView(APIView):
    """Returns the main scoreboard data"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.team:
            return Response({'error': 'You must be in a team to view the scoreboard'}, status=status.HTTP_403_FORBIDDEN)

        cache_key = 'scoreboard_data'
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)

        teams = Team.objects.filter(is_hidden=False).annotate(
            solved_count=Count('submissions', filter=Q(submissions__is_correct=True), distinct=True)
        ).order_by('-team_score')

        scoreboard_data = []
        for rank, team in enumerate(teams, 1):
            scoreboard_data.append({
                'rank': rank, 'team_id': team.id, 'team_name': team.name,
                'total_score': team.team_score, 'solved_challenges': team.solved_count,
            })
        
        cache.set(cache_key, scoreboard_data, 300) # cache for 5 minutes
        return Response(scoreboard_data)

class ScoreboardGraphView(APIView):
    """Returns time series data for the top 5 teams score progression."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.team:
            return Response({'error': 'You must be in a team to view the scoreboard'}, status=status.HTTP_403_FORBIDDEN)

        cache_key = 'scoreboard_graph_data'
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)

        top_teams = Team.objects.filter(is_hidden=False).order_by('-team_score')[:5]
        team_ids = [team.id for team in top_teams]

        correct_submissions = Submission.objects.filter(
            team_id__in=team_ids,
            is_correct=True
        ).order_by('timestamp').values('team_id', 'timestamp', 'points_awarded')

        submissions_by_team = {team_id: [] for team_id in team_ids}
        for sub in correct_submissions:
            submissions_by_team[sub['team_id']].append(sub)

        data = []
        for team in top_teams:
            performance_data = []
            current_score = 0
            performance_data.append({'timestamp': team.created_at.isoformat(), 'score': 0})

            for sub in submissions_by_team[team.id]:
                current_score += sub['points_awarded']
                performance_data.append({'timestamp': sub['timestamp'].isoformat(), 'score': current_score})
            
            data.append({
                'team_id': team.id,
                'team_name': team.name,
                'performance': performance_data
            })

        cache.set(cache_key, data, 300) # cache for 5 mins
        return Response(data)

class TeamPerformanceView(APIView):
    """Returns time-series data for team performance graphs."""
    permission_classes = [IsAuthenticated]

    def get(self, request, team_id=None):
        team = None
        team_id = request.query_params.get('team_id')

        if team_id and request.user.is_superuser:
            team = get_object_or_404(Team, id=team_id)
        elif not team_id and request.user.team:
            team = request.user.team
        else:
            return Response({'error': 'Permission denied or not in a team'}, status=status.HTTP_403_FORBIDDEN)

        correct_submissions = Submission.objects.filter(
            team=team, 
            is_correct=True
        ).order_by('timestamp').values('timestamp', 'points_awarded')

        performance_data = []
        current_score = 0
        
        performance_data.append({
            'timestamp': team.created_at,
            'score': 0
        })

        for sub in correct_submissions:
            current_score += sub['points_awarded']
            performance_data.append({
                'timestamp': sub['timestamp'],
                'score': current_score
            })
        
        return Response(performance_data)


class PurchaseHintView(APIView):
    """Handles the logic for a team purchasing a hint for a challenge"""
    permission_classes = [IsAuthenticated]

    def post(self, request, challenge_id):
        team = request.user.team
        if not team:
            return Response({'error': 'You must be in a team to purchase hints'}, status=status.HTTP_403_FORBIDDEN)

        challenge = get_object_or_404(Challenge, id=challenge_id)
        hint_index = request.data.get('hintIndex')
        
        hints = challenge.hints if isinstance(challenge.hints, list) else json.loads(challenge.hints)
        if hint_index is None or not (0 <= hint_index < len(hints)):
            return Response({"error": "Invalid hint index"}, status=status.HTTP_400_BAD_REQUEST)
        
        hint = hints[hint_index]
        
        # use a transaction to ensure atomicity
        with transaction.atomic():
            hint_purchase, created = HintPurchase.objects.get_or_create(
                team=team, challenge=challenge, hint_index=hint_index,
                defaults={'points_deducted': hint['cost']}
            )

            # if the hint was just created, its a new purchase
            is_new_purchase = created

        # recalculate total deductions regardless of whether it was a new purchase
        all_purchases = HintPurchase.objects.filter(team=team, challenge=challenge)
        total_points_deducted = sum(p.points_deducted for p in all_purchases)
        remaining_points = max(0, challenge.max_points - total_points_deducted)

        return Response({
            "hint": hint,
            "alreadyPurchased": not is_new_purchase,
            "remainingPoints": remaining_points,
            "maxPoints": challenge.max_points,
            "pointsDeducted": hint['cost'], # The cost of this specific hint
            "totalPointsDeducted": total_points_deducted # The total cost of all hints for this challenge
        })

class TeamContributionsView(APIView):
    """
    Returns member wise contribution stats (solves and points).
    Points are attributed to the member who made the first correct submission per challenge.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        team = request.user.team
        if not team:
            return Response({"error": "You are not on a team"}, status=status.HTTP_400_BAD_REQUEST)

        # Prepare member base
        members = list(team.members.all().values("id", "username"))
        stats = {
            m["id"]: {
                "member_id": m["id"],
                "username": m["username"],
                "solves": 0,
                "points": 0
            } for m in members
        }

        # earliest correct submissions per challenge
        correct_subs = (
            Submission.objects
            .filter(team=team, is_correct=True)
            .select_related("user", "challenge")
            .order_by("challenge_id", "timestamp")
        )

        seen_challenges = set()
        for sub in correct_subs:
            if sub.challenge_id in seen_challenges:
                continue
            seen_challenges.add(sub.challenge_id)
            id = getattr(sub.user, "id", None)
            if id in stats:
                stats[id]["solves"] += 1
                stats[id]["points"] += sub.points_awarded

        # sort by points desc, then solves desc, then username
        ordered = sorted(
            stats.values(),
            key=lambda x: (-x["points"], -x["solves"], x["username"].lower() if x["username"] else "")
        )

        total_points_sum = sum(m["points"] for m in ordered)
        return Response({
            "team_id": team.id,
            "team_name": team.name,
            "team_score": team.team_score,
            "sum_contribution_points": total_points_sum,
            "members": ordered
        })