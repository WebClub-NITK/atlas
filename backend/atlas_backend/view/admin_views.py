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
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from django.core.cache import cache
from django.db import transaction
from django.http import QueryDict
from ..models import User, Challenge, Submission, Team, Container, HintPurchase, validate_team_name, ThemeConfig
from ..serializers import SignupSerializer, ChallengeSerializer, TeamSerializer, SubmissionSerializer, UserSerializer, ThemeConfigSerializer
import re
from docker_plugin import DockerPlugin
import logging
from django.utils import timezone
from django.db.models.functions import TruncHour

logger = logging.getLogger('atlas_backend')


class ChallengeCreateView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, *args, **kwargs):
        if not request.user.is_superuser:
            return Response(
                {"error": "Only administrators can create challenges"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            data = request.data

            # Validate required fields
            required_fields = ['title', 'description', 'category', 'flag', 'max_points']
            for field in required_fields:
                if not data.get(field):
                    return Response(
                        {"error": f"{field} is required"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            title = data.get('title')

            is_hidden = str(data.get('is_hidden', 'false')).lower() == 'true'

            # handle docker image optionally
            image_id = None
            if request.FILES.get('docker_image'):
                try:
                    client = DockerPlugin(base_url=settings.DOCKER_HOST, key_file=settings.SSH_KEY_FILE)
                    image_id = client.add_image(request.FILES['docker_image'].read())
                except Exception as e:
                    return Response(
                        {"error": "Failed to add Docker image", "exception": f"{str(e)}"},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )

            max_attempts = data.get('max_attempts')
            # create challenge
            challenge = Challenge.objects.create(
                title=title,
                description=data['description'],
                category=data['category'],
                docker_image=image_id if image_id else '',
                flag=data['flag'],
                max_points=int(data['max_points']),
                max_team_size=3,
                max_attempts=max_attempts,
                is_hidden=is_hidden,
                hints=data.get('hints', []),
                file_links=data.get('file_links', []),
                port=data.get('port', 22),
                ssh_user=data.get('ssh_user', None),
            )

            return Response({
                "message": "Challenge created successfully",
                "challenge_id": challenge.id
            }, status=status.HTTP_201_CREATED)

        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"error": "Failed to create challenge", "exception": f"{str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ChallengeDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, challenge_id, *args, **kwargs):
        try:
            challenge = Challenge.objects.get(id=challenge_id)
            data = {
                'id': challenge.id,
                'title': challenge.title,
                'description': challenge.description,
                'category': challenge.category,
                'docker_image': challenge.docker_image,
                'flag': challenge.flag,
                'max_points': challenge.max_points,
                'max_team_size': challenge.max_team_size,
                'max_attempts': challenge.max_attempts,
                'created_at': challenge.created_at,
                'updated_at': challenge.updated_at,
                'is_hidden': challenge.is_hidden,
                'hints': challenge.hints,
                'file_links': challenge.file_links,
                'ssh_user' : challenge.ssh_user,
                'port' : challenge.port,
            }
            return Response(data)
        except Challenge.DoesNotExist:
            return Response(
                {"error": "Challenge not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    def patch(self, request, challenge_id, *args, **kwargs):
        if not request.user.is_superuser:
            return Response(
                {"error": "Only administrators can update challenges"},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            challenge = Challenge.objects.get(id=challenge_id)
            data = request.data

            if isinstance(data, QueryDict):
                data = data.dict()

            if 'max_points' in data:
                try:
                    data['max_points'] = int(data['max_points'] or 0)  # default to 0 if None/empty
                except (ValueError, TypeError):
                    data['max_points'] = 0

            if 'is_hidden' in data:
                data['is_hidden'] = str(data['is_hidden']).lower() == 'true'

            # parse JSON strings for hints and file_links
            if 'hints' in data and isinstance(data['hints'], str):
                try:
                    data['hints'] = json.loads(data['hints'])
                except json.JSONDecodeError:
                    data['hints'] = challenge.hints
            
            if 'file_links' in data and isinstance(data['file_links'], str):
                try:
                    data['file_links'] = json.loads(data['file_links'])
                except json.JSONDecodeError:
                    data['file_links'] = challenge.file_links

            # Handle docker image file if present
            if request.FILES.get('docker_image'):
                try:
                    client = DockerPlugin(base_url=settings.DOCKER_HOST,key_file=settings.SSH_KEY_FILE)
                    image_id = client.add_image(request.FILES['docker_image'].read())
                    data['docker_image'] = image_id
                except Exception as e:
                    logger.error(f"Docker image upload error: {str(e)}")
                    raise Exception("Failed to upload docker image")

            if 'ssh_user' in data:
                try:
                    data ['ssh_user'] = data['ssh_user'] or None
                except Exception as e:
                    raise Exception("Failed to upload ssh user :" + str(e))
            
            if 'port' in data:
                try:
                    data['port'] = int(data['port'])
                except Exception as e:
                    raise Exception("Failed to upload port :" + str(e))
                
            if 'max_attempts' in data:
                try:
                    data['max_attempts'] = int(data['max_attempts'])
                except Exception as e:
                    raise Exception("Failed to upload max attempts :" + str(e))
            

            # Update fields
            for field, value in data.items():
                if hasattr(challenge, field) and value is not None:
                    setattr(challenge, field, value)

            challenge.save()
            return Response({"message": "Challenge updated successfully"})

        except Challenge.DoesNotExist:
            return Response(
                {"error": "Challenge not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error updating challenge: {str(e)}")
            return Response(
                {"error": f"Failed to update challenge: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def delete(self, request, challenge_id, *args, **kwargs):
        try:
            challenge = Challenge.objects.get(id=challenge_id)
            challenge.delete()
            logger.info(f"Challenge {challenge_id} deleted successfully")
            return Response({"message": "Challenge deleted successfully"}, status=status.HTTP_200_OK)

        except Challenge.DoesNotExist:
            logger.error(f"Challenge {challenge_id} not found")
            return Response({"error": "Challenge not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error deleting challenge {challenge_id}: {str(e)}")
            return Response(
                {"error": "An error occurred while deleting the challenge"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AdminChallengeListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, *args, **kwargs):
        if not request.user.is_superuser:
            return Response(
                {"error": "Only administrators can access this"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            challenges = Challenge.objects.all()
            data = []
            for challenge in challenges:
                data.append({
                    'id': challenge.id,
                    'title': challenge.title,
                    'description': challenge.description,
                    'category': challenge.category,
                    'docker_image': challenge.docker_image,
                    'max_attempts': challenge.max_attempts,
                    'flag': challenge.flag,
                    'max_points': challenge.max_points,
                    'max_team_size': challenge.max_team_size,
                    'is_hidden': challenge.is_hidden,
                    'hints': challenge.hints,
                    'file_links': challenge.file_links,
                    'created_at': challenge.created_at,
                    'updated_at': challenge.updated_at
                })
            return Response(data)
        except Exception as e:
            return Response(
                {"error": "Failed to fetch challenges"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ChallengeSubmissionsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, challenge_id, *args, **kwargs):
        if not request.user.is_superuser:
            return Response(
                {"error": "Only administrators can access this"},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            challenge = get_object_or_404(Challenge, id=challenge_id)
            submissions = Submission.objects.filter(challenge=challenge)

            submissions_data = [{
                'id': sub.id,
                'team': {
                    'id': sub.team.id,
                    'name': sub.team.name
                },
                'challenge': {
                    'id': sub.challenge.id,
                    'title': sub.challenge.title
                },
                'flag_submitted': sub.flag_submitted,
                'is_correct': sub.is_correct,
                'points_awarded': sub.points_awarded,
                'attempt_number': sub.attempt_number,
                'timestamp': sub.timestamp.isoformat()
            } for sub in submissions]

            return Response(submissions_data)
        except Challenge.DoesNotExist:
            return Response(
                {"error": "Challenge not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to fetch submissions: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AllSubmissionsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, *args, **kwargs):
        if not request.user.is_superuser:
            return Response(
                {"error": "Only administrators can access this"},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            submissions = Submission.objects.all().order_by('-timestamp')

            submissions_data = [{
                'id': sub.id,
                'team': {
                    'id': sub.team.id,
                    'name': sub.team.name
                },
                'user': {
                    'id': sub.user.id,
                    'email': sub.user.email,
                    'username': sub.user.username
                },
                'challenge': {
                    'id': sub.challenge.id,
                    'title': sub.challenge.title
                },
                'flag_submitted': sub.flag_submitted,
                'is_correct': sub.is_correct,
                'points_awarded': sub.points_awarded,
                'attempt_number': sub.attempt_number,
                'timestamp': sub.timestamp.isoformat()
            } for sub in submissions]

            return Response({
                'total_submissions': len(submissions_data),
                'submissions': submissions_data
            })
        except Exception as e:
            return Response(
                {"error": f"Failed to fetch submissions: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ContainerListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, *args, **kwargs):
        if not request.user.is_superuser:
            return Response(
                {"error": "Only administrators can access this"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            containers = Container.objects.all()
            data = []
            for container in containers:
                data.append({
                    'team': {
                        'id': container.team.id,
                        'name': container.team.name
                    },
                    'challenge': {
                        'id': container.challenge.id,
                        'title': container.challenge.title
                    },
                    'container_id': container.container_id,
                    'ssh_host': container.ssh_host,
                    'ssh_port': container.ssh_port,
                    'ssh_user': container.ssh_user,
                    'ssh_password': container.ssh_password,
                    'created_at': container.created_at,
                    'updated_at': container.updated_at
                })
            return Response(data)
        except Exception as e:
            return Response(
                {"error": f"Failed to fetch containers: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AdminContainerDetailView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, container_id, *args, **kwargs):
        try:
            if not request.user.is_superuser:
                return Response(
                    {"error": "Only administrators can access this"},
                    status=status.HTTP_403_FORBIDDEN
                )

            container = Container.objects.get(container_id=container_id)
            client = DockerPlugin(base_url=settings.DOCKER_HOST,key_file=settings.SSH_KEY_FILE)
            client.stop_container(container.container_id)
            container.delete()
            return Response({"message": "Container stopped successfully"}, status=status.HTTP_200_OK)
        except Container.DoesNotExist:
            return Response(
                {"error": "Container not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to stop container: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DashboardStatsView(APIView):
    """Returns submissions in the past 24 hours"""
    permission_classes = [IsAdminUser]

    def get(self, request):
        cache_key = 'dashboard_stats'
        cached_stats = cache.get(cache_key)
        if cached_stats:
            return Response(cached_stats)

        total_teams = Team.objects.count()
        total_challenges = Challenge.objects.count()
        
        total_subs = Submission.objects.count()
        correct_subs = Submission.objects.filter(is_correct=True).count()
        
        now = timezone.now()
        last_24_hours = now - timedelta(hours=24)
        
        submissions = Submission.objects.filter(
            timestamp__gte=last_24_hours
        ).annotate(
            hour=TruncHour('timestamp')
        ).values('hour').annotate(
            count=Count('id')
        ).order_by('hour')

        submission_timeline = [
            {'hour': item['hour'].isoformat(), 'count': item['count']}
            for item in submissions
        ]

        stats = {
            "teams": {
                "total": total_teams,
            },
            "challenges": {
                "total": total_challenges,
            },
            "containers": {
                "running": Container.objects.count(),
            },
            "submissions": {
                "total": total_subs,
                "correct": correct_subs,
            },
            "submission_timeline": submission_timeline,
        }

        cache.set(cache_key, stats, 300) # cache for 5 minutes

        return Response(stats)

class TeamDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get_object(self, team_id):
        return get_object_or_404(Team, id=team_id)

    def get(self, request, team_id, format=None):
        team = self.get_object(team_id)
        serializer = TeamSerializer(team)
        return Response(serializer.data)
    
    def patch(self, request, team_id, *args, **kwargs):
        if not request.user.is_superuser:
            return Response(
                {"error": "Only administrators can perform this action"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            team = Team.objects.get(id=team_id)
            
            if 'name' in request.data:
                team.name = request.data['name']
            if 'email' in request.data:
                team.team_email = request.data['email']
            if 'is_hidden' in request.data: 
                team.is_hidden = request.data['is_hidden']
            if 'is_banned' in request.data:  
                team.is_banned = request.data['is_banned']
            if 'password' in request.data and request.data['password']:
                team.set_password(request.data['password'])
                
            team.save()
            
            return Response({
                'id': team.id,
                'name': team.name,
                'email': team.team_email,
                'is_hidden': team.is_hidden,
                'is_banned': team.is_banned,
                'total_score': team.team_score,
                'member_count': team.members.count()
            })
        except Team.DoesNotExist:
            return Response(
                {"error": "Team not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Failed to update team {team_id}: {str(e)}")
            return Response(
                {"error": f"Failed to update team: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def delete(self, request, team_id, *args, **kwargs):
        if not request.user.is_superuser:
            return Response(
                {"error": "Only administrators can perform this action"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            team = Team.objects.get(id=team_id)
            Container.objects.filter(team=team).delete()
            team.delete()
            return Response({"message": "Team deleted successfully"})
        except Team.DoesNotExist:
            return Response(
                {"error": "Team not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to delete team: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class HintPurchaseView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, challenge_id, *args, **kwargs):
        try:
            challenge = Challenge.objects.get(id=challenge_id)
            hint_index = request.data.get('hintIndex')

            if hint_index is None or hint_index >= len(challenge.hints):
                return Response({"error": "Invalid hint index"}, status=status.HTTP_400_BAD_REQUEST)
                
            hints = challenge.hints if isinstance(challenge.hints, list) else json.loads(challenge.hints)
            hint = hints[hint_index]
            
            hint_key = f"hint_{request.user.team.id}_{challenge.id}_{hint_index}"
            hint_purchase = HintPurchase.objects.filter(
                team=request.user.team,
                challenge=challenge,
                hint_index=hint_index
            ).first()
            
            if hint_purchase or cache.get(hint_key):
                purchased_hints = HintPurchase.objects.filter(
                    team=request.user.team,
                    challenge=challenge
                )
                total_points_deducted = sum(ph.points_deducted for ph in purchased_hints)
                remaining_points = max(0, challenge.max_points - total_points_deducted)
                
                return Response({
                    "hint": hint,
                    "alreadyPurchased": True,
                    "maxPoints": challenge.max_points,
                    "remainingPoints": remaining_points,
                    "pointsDeducted": total_points_deducted
                })

            with transaction.atomic():
                points_deducted = hint['cost']

                HintPurchase.objects.create(
                    team=request.user.team,
                    challenge=challenge, 
                    hint_index=hint_index,
                    hint_cost_percentage=hint['cost'],
                    points_deducted=points_deducted
                )
                
                cache.set(hint_key, True)

                purchased_hints = HintPurchase.objects.filter(
                    team=request.user.team,
                    challenge=challenge
                )
                total_points_deducted = sum(ph.points_deducted for ph in purchased_hints)
                remaining_points = max(0, challenge.max_points - total_points_deducted)

            logger.info(f"Hint purchased: challenge={challenge_id}, hint_index={hint_index}, " +
                       f"cost={hint['cost']} points, points_deducted={points_deducted}, " +
                       f"remaining_points={remaining_points}")

            return Response({
                "hint": hint,
                "alreadyPurchased": False,
                "remainingPoints": remaining_points,
                "maxPoints": challenge.max_points,
                "pointsDeducted": points_deducted,
                "totalPointsDeducted": total_points_deducted
            })

        except Challenge.DoesNotExist:
            return Response({"error": "Challenge not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error purchasing hint: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    
class TeamSubmissionsAdminView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, team_id, *args, **kwargs):
        if not request.user.is_superuser:
            return Response(
                {"error": "Only administrators can access this endpoint"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            team = get_object_or_404(Team, id=team_id)
            submissions = Submission.objects.filter(team=team).order_by('-timestamp')

            submissions_data = []
            for submission in submissions:
                submissions_data.append({
                    'id': submission.id,
                    'challenge_name': submission.challenge.title,
                    'category': submission.challenge.category,
                    'points': submission.points_awarded,
                    'flag_submitted': submission.flag_submitted,
                    'is_correct': submission.is_correct,
                    'submitted_at': submission.timestamp.isoformat()
                })

            return Response(submissions_data)

        except Team.DoesNotExist:
            return Response(
                {"error": "Team not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error fetching team submissions: {str(e)}")
            return Response(
                {"error": "Failed to fetch team submissions"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        
class TeamProfileAdminView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, team_id, *args, **kwargs):
        if not request.user.is_superuser:
            return Response(
                {"error": "Only administrators can access this endpoint"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            team = get_object_or_404(Team, id=team_id)
            team_members = User.objects.filter(team=team)
            solved_challenges = Challenge.objects.filter(
                submissions__team=team,
                submissions__is_correct=True,
            ).distinct().count()
            team_rank = Team.objects.filter(
                team_score__gt=team.team_score
            ).count() + 1
            recent_submissions = team.submissions.filter(
                is_correct=True
            ).order_by('-timestamp')[:5]

            recent_activity = [{
                'id': sub.id,
                'challenge_name': sub.challenge.title,
                'points': sub.points_awarded,
                'solved_at': sub.timestamp.isoformat()
            } for sub in recent_submissions]

            response_data = {
                'id': team.id,
                'name': team.name,
                'team_email': team.team_email,
                'members': [{
                    'id': member.id,
                    'username': member.username,
                    'email': member.email
                } for member in team_members],
                'total_score': team.team_score,
                'solved_challenges': solved_challenges,
                'rank': team_rank,
                'is_hidden': team.is_hidden,
                'is_banned': team.is_banned,
                'recent_activity': recent_activity
            }

            return Response(response_data)

        except Team.DoesNotExist:
            return Response(
                {"error": "Team not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error fetching team profile: {str(e)}")
            return Response(
                {"error": "Failed to fetch team profile"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
