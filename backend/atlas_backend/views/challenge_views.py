from django.shortcuts import get_object_or_404
from django.conf import settings
from datetime import timedelta
import json
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.cache import cache
from django.db import transaction
from ..models import Challenge, Submission, Container, HintPurchase
from rest_framework import status, generics
from ..serializers import ChallengeListSerializer
from django.db import transaction
from django.utils import timezone
from rest_framework.views import APIView
from docker_plugin import DockerPlugin
import time
import logging

logger = logging.getLogger('atlas_backend')


class ChallengeAuthMixin:
    """Mixin for common challenge authentication and permissions"""
    permission_classes = [IsAuthenticated]
    
    def check_team_membership(self):
        """Ensure user is in a team"""
        if not self.request.user.team:
            return Response(
                {'error': 'You must be in a team to access challenges'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return None
    
    def check_team_ban_status(self):
        """Check if team is banned"""
        if self.request.user.team and self.request.user.team.is_banned:
            return Response(
                {'error': 'Your team has been banned'},
                status=status.HTTP_403_FORBIDDEN
            )
        return None
    
    def get_challenge_or_404(self, challenge_id):
        """Get challenge and check visibility"""
        try:
            challenge = Challenge.objects.get(id=challenge_id)
            if challenge.is_hidden and not self.request.user.is_superuser:
                return None, Response(
                    {"error": "Challenge not found"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            return challenge, None
        except Challenge.DoesNotExist:
            return None, Response(
                {"error": "Challenge not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )


class ChallengeDetailAPIView(ChallengeAuthMixin, APIView):
    """Get challenge by ID with hints and point calculations"""
    
    def get(self, request, challenge_id):
        # Check team membership
        error_response = self.check_team_membership()
        if error_response:
            return error_response
        
        # Get challenge
        challenge, error_response = self.get_challenge_or_404(challenge_id)
        if error_response:
            return error_response
        
        try:
            # Get purchased hints for the team
            purchased_hints = []
            total_points_deducted = 0
            
            if request.user.team:
                hint_purchases = HintPurchase.objects.filter(
                    team=request.user.team,
                    challenge=challenge
                )
                purchased_hints = hint_purchases.values_list('hint_index', flat=True)
                total_points_deducted = sum(ph.points_deducted for ph in hint_purchases)

            # Prepare hints with purchase status but hide content for unpurchased hints
            hints = challenge.hints
            if isinstance(hints, str):
                hints = json.loads(hints)
            
            hint_data = []
            for i, hint in enumerate(hints):
                hint_info = {
                    'index': i,
                    'cost': hint['cost'],
                    'purchased': i in purchased_hints
                }
                
                # Only include content for purchased hints
                if i in purchased_hints:
                    hint_info['content'] = hint['content']
                    
                hint_data.append(hint_info)

            # Calculate remaining points after hint deductions
            remaining_points = max(0, challenge.max_points - total_points_deducted)

            return Response({
                "challenge": {
                    "id": challenge.id,
                    "title": challenge.title,
                    "description": challenge.description,
                    "category": challenge.category,
                    "max_points": challenge.max_points,
                    "max_attempts": challenge.max_attempts,
                    "remaining_points": remaining_points,
                    "total_points_deducted": total_points_deducted,
                    "hints": hint_data,
                    "file_links": challenge.file_links,
                    "docker_image": challenge.docker_image
                }
            })
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class StartChallengeAPIView(ChallengeAuthMixin, APIView):
    """Start a challenge container"""
    
    def post(self, request, challenge_id):
        # Check team membership
        error_response = self.check_team_membership()
        if error_response:
            return Response(
                {'error': 'You must be in a team to start challenges'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check team ban status
        error_response = self.check_team_ban_status()
        if error_response:
            return error_response
            
        challenge = get_object_or_404(Challenge, id=challenge_id)

        existing_container = Container.objects.filter(
            team=request.user.team,
            challenge=challenge,
            created_at__gte=timezone.now() - timedelta(minutes=10)
        ).first()

        if existing_container:
            return Response({
                'host': existing_container.ssh_host,
                'port': existing_container.ssh_port,
                'ssh_user': existing_container.ssh_user,
                'ssh_password': existing_container.ssh_password,
                'created_at': existing_container.created_at,
            })

        try:
            client = DockerPlugin(base_url=settings.DOCKER_HOST, key_file=settings.SSH_KEY_FILE)

            container_id, password = client.run_container(
                challenge.docker_image,
                port=challenge.port,
                container_name=f"{request.user.team.name.replace(' ', '_')}-{challenge.title.replace(' ', '_')}"
            )

            timeout = 30
            start_time = time.time()
            while True:
                ports = client.get_container_ports(container_id)
                if ports:
                    break
                time.sleep(1)
                if time.time() - start_time > timeout:
                    return Response(
                        {'error': 'Timeout waiting for container ports'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
            container = Container.objects.create(
                team=request.user.team,
                challenge=challenge,
                container_id=container_id,
                ssh_host=settings.SSH_HOST_URL,
                ssh_port=ports[f'{challenge.port}/tcp'][0]['HostPort'],
                ssh_user=challenge.ssh_user,
                ssh_password=password,
            )

            if challenge.ssh_user:
                return Response({
                    'host': container.ssh_host,
                    'port': container.ssh_port,
                    'ssh_user': container.ssh_user,
                    'ssh_password': container.ssh_password,
                    'created_at': container.created_at
                })
            else:
                return Response({
                    'host': container.ssh_host,
                    'port': container.ssh_port,
                    'created_at': container.created_at
                })

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class StopChallengeAPIView(ChallengeAuthMixin, APIView):
    """Stop a challenge container"""
    
    def post(self, request, challenge_id):
        # Check team membership
        error_response = self.check_team_membership()
        if error_response:
            return Response(
                {'error': 'You must be in a team to start challenges'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            challenge = get_object_or_404(Challenge, id=challenge_id)

            existing_container = Container.objects.filter(
                team=request.user.team,
                challenge=challenge,
                created_at__gte=timezone.now() - timedelta(minutes=10)
            ).first()

            if existing_container:
                client = DockerPlugin(base_url=settings.DOCKER_HOST, key_file=settings.SSH_KEY_FILE)
                client.stop_container(existing_container.container_id)
                existing_container.delete()
                return Response({'message': 'Container stopped'}, status=status.HTTP_200_OK)
            else:
                return Response({'message': 'No active container found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SubmitFlagAPIView(ChallengeAuthMixin, APIView):
    """Submit flag for a challenge"""
    
    def post(self, request, challenge_id):
        # Check team membership
        error_response = self.check_team_membership()
        if error_response:
            return Response(
                {'error': 'You must be in a team to submit flags'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check team ban status
        error_response = self.check_team_ban_status()
        if error_response:
            return error_response

        try:
            challenge = get_object_or_404(Challenge, id=challenge_id)
            flag = request.data.get('flag_submitted', '').strip()
            
            if not flag:
                return Response(
                    {'error': 'Flag is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get submission count for attempt limiting
            submission_count = Submission.objects.filter(
                team=request.user.team,
                challenge=challenge
            ).count()

            if submission_count >= challenge.max_attempts:
                return Response(
                    {'error': f'Maximum {challenge.max_attempts} attempts allowed for this challenge'},
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )

            with transaction.atomic():
                if Submission.objects.filter(
                    team=request.user.team,
                    challenge=challenge,
                    is_correct=True
                ).exists():
                    return Response(
                        {'error': 'Challenge already solved'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                attempt_number = submission_count + 1
                is_correct = challenge.flag == flag

                # Calculate points after hint deductions
                points_awarded = challenge.max_points
                if is_correct:
                    # Get all purchased hints for this challenge
                    hint_purchases = HintPurchase.objects.filter(
                        team=request.user.team,
                        challenge=challenge
                    )
                    
                    # Calculate total points to deduct (direct deduction)
                    total_points_deducted = sum(purchase.points_deducted for purchase in hint_purchases)
                    
                    # Calculate final points
                    points_awarded = max(0, challenge.max_points - total_points_deducted)
                    
                    # Log the point calculation for debugging
                    logger.info(f"Flag submission: challenge={challenge_id}, " +
                               f"max_points={challenge.max_points}, " +
                               f"total_deducted={total_points_deducted}, " +
                               f"awarded={points_awarded}")

                submission = Submission.objects.create(
                    team=request.user.team,
                    challenge=challenge,
                    user=request.user,
                    flag_submitted=flag,
                    is_correct=is_correct,
                    points_awarded=points_awarded if is_correct else 0,
                    attempt_number=attempt_number
                )

                if is_correct:
                    request.user.team.challenges.add(challenge)
                    request.user.team.team_score += points_awarded
                    request.user.team.save()

            return Response({
                'message': 'Correct flag!' if is_correct else 'Incorrect flag',
                'points_awarded': submission.points_awarded,
                'is_correct': is_correct,
                'attempt_number': attempt_number,
                'attempts_remaining': challenge.max_attempts - attempt_number,
                'timestamp': submission.timestamp.isoformat(),
                'new_team_score': request.user.team.team_score if is_correct else None
            })

        except Exception as e:
            logger.error(f"Error in submit_flag: {str(e)}")
            return Response(
                {'error': 'Submission error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PurchaseHintAPIView(ChallengeAuthMixin, APIView):
    """Purchase a hint for a challenge"""
    
    def post(self, request, challenge_id):
        # Check team membership
        error_response = self.check_team_membership()
        if error_response:
            return error_response

        try:
            challenge = Challenge.objects.get(id=challenge_id)
            hint_index = request.data.get('hintIndex')

            if hint_index is None or hint_index >= len(challenge.hints):
                return Response({"error": "Invalid hint index"}, status=status.HTTP_400_BAD_REQUEST)
                
            hints = challenge.hints if isinstance(challenge.hints, list) else json.loads(challenge.hints)
            hint = hints[hint_index]
            
            # Check if hint already purchased
            hint_key = f"hint_{request.user.team.id}_{challenge.id}_{hint_index}"
            hint_purchase = HintPurchase.objects.filter(
                team=request.user.team,
                challenge=challenge,
                hint_index=hint_index
            ).first()
            
            if hint_purchase or cache.get(hint_key):
                # Get all purchased hints
                purchased_hints = HintPurchase.objects.filter(
                    team=request.user.team,
                    challenge=challenge
                )
                # Calculate total points deducted directly
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
                # Direct point deduction - hint cost is the number of points to deduct
                points_deducted = hint['cost']

                HintPurchase.objects.create(
                    team=request.user.team,
                    challenge=challenge, 
                    hint_index=hint_index,
                    hint_cost_percentage=hint['cost'],  # Keep for backward compatibility
                    points_deducted=points_deducted
                )
                
                cache.set(hint_key, True)

                # Calculate total points deducted
                purchased_hints = HintPurchase.objects.filter(
                    team=request.user.team,
                    challenge=challenge
                )
                total_points_deducted = sum(ph.points_deducted for ph in purchased_hints)
                remaining_points = max(0, challenge.max_points - total_points_deducted)

            # Log the hint purchase details for debugging
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


class ChallengeListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ChallengeListSerializer

    def get_queryset(self):
        return Challenge.objects.filter(is_hidden=False)

    def list(self, request, *args, **kwargs):
        if not request.user.team:
            return Response(
                {'error': 'You must be in a team to access challenges'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data

        # Add submission information
        submissions = Submission.objects.filter(
            team=request.user.team
        ).values('challenge_id', 'is_correct', 'id')
        
        for chal in data:
            chal_submissions = [s for s in submissions if s['challenge_id'] == chal['id']]
            chal['is_correct'] = any(s['is_correct'] for s in chal_submissions)
            chal['tries'] = len(chal_submissions)

        return Response(data)
