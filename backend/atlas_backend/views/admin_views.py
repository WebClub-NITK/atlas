from django.shortcuts import get_object_or_404
from django.conf import settings
from django.core.exceptions import ValidationError
from datetime import datetime, timedelta
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from ..models import User, Challenge, Submission, Team, Container
from ..serializers import AdminChallengeSerializer
from docker_plugin import DockerPlugin
import logging

logger = logging.getLogger('atlas_backend')


@api_view(['POST'])
@permission_classes([AllowAny])
def admin_login(request):
    """
    Admin login endpoint that only authenticates superusers
    """
    try:
        data = request.data
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return Response(
                {'error': 'Email and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Attempt to find a superuser with the provided email
            user = User.objects.get(email=email, is_superuser=True)
            
            # Verify the password
            if not user.check_password(password):
                raise User.DoesNotExist
                
            # Generate tokens for admin
            refresh = RefreshToken.for_user(user)
            refresh['user_id'] = user.id
            refresh['username'] = user.username
            refresh['email'] = user.email
            refresh['is_admin'] = True
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'is_admin': True
                }
            })
            
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid admin credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
            
    except Exception as e:
        return Response(
            {'error': f'Admin login failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_containers(request):
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
            status=status.HTTP_500_internal_server_error
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_stop_container(request, container_id):
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


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_dashboard_stats(request):
    if not request.user.is_superuser:
        return Response(
            {"error": "Only administrators can access this"},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        stats = {
            'teams': {
                'total': Team.objects.count(),
                'active': Team.objects.filter(submissions__timestamp__gte=datetime.now() - timedelta(days=1)).distinct().count()
            },
            'challenges': {
                'total': Challenge.objects.count(),
                'active': Challenge.objects.filter(is_hidden=False).count(),
                'solved': Challenge.objects.filter(submissions__is_correct=True).distinct().count()
            },
            'containers': {
                'total': Container.objects.count(),
                'running': Container.objects.filter(created_at__gte=datetime.now() - timedelta(minutes=10)).count()
            },
            'submissions': {
                'total': Submission.objects.count(),
                'correct': Submission.objects.filter(is_correct=True).count(),
                'last_24h': Submission.objects.filter(timestamp__gte=datetime.now() - timedelta(days=1)).count()
            }
        }
        return Response(stats)
    except Exception as e:
        return Response(
            {"error": f"Failed to fetch dashboard stats: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def delete_team(request, team_id):
    if not request.user.is_superuser:
        return Response(
            {"error": "Only administrators can perform this action"},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        team = Team.objects.get(id=team_id)
        # Delete associated containers first
        Container.objects.filter(team=team).delete()
        # Delete team and cascade to related objects
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

@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def update_team(request, team_id):
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


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_team_submissions_admin(request, team_id):
    """
    Get all submissions for a specific team (admin view)
    """
    # Check if user is superuser
    if not request.user.is_superuser:
        return Response(
            {"error": "Only administrators can access this endpoint"},
            status=status.HTTP_401_UNAUTHORIZED
        )

    try:
        # Get team or return 404
        team = get_object_or_404(Team, id=team_id)

        # Get all submissions for the team
        submissions = Submission.objects.filter(team=team).order_by('-timestamp')

        # Format submissions data for response
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


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_team_profile_admin(request, team_id):
    """
    Get detailed team profile information for admin
    """
    # Check if user is superuser
    if not request.user.is_superuser:
        return Response(
            {"error": "Only administrators can access this endpoint"},
            status=status.HTTP_401_UNAUTHORIZED
        )

    try:
        # Get team or return 404
        team = get_object_or_404(Team, id=team_id)

        # Get team members
        team_members = User.objects.filter(team=team)

        # Get team statistics
        solved_challenges = Challenge.objects.filter(
            submissions__team=team,
            submissions__is_correct=True,
        ).distinct().count()

        # Get team rank
        team_rank = Team.objects.filter(
            team_score__gt=team.team_score
        ).count() + 1

        # Get recent activity (last 5 correct submissions)
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


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_challenge_detail(request, challenge_id):
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


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_challenge_submissions(request, challenge_id):
    """
    Get submissions for a challenge
    """
    if not request.user.is_superuser:
        return Response(
            {"error": "Only administrators can access this"},
            status=status.HTTP_403_FORBIDDEN
        )
    try:
        challenge = get_object_or_404(Challenge, id=challenge_id)
        submissions = Submission.objects.filter(challenge=challenge)

        # Serialize submission data
        submissions_data = [{
            'id': sub.id,
            'team': {
                'id': sub.team.id,
                'name': sub.team.name
            },
            # 'user': {
            #     'id': sub.user.id,
            #     'email': sub.user.email,
            #     'username': sub.user.username
            # },
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


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_all_submissions(request):
    """
    Get all submissions
    """
    if not request.user.is_superuser:
        return Response(
            {"error": "Only administrators can access this"},
            status=status.HTTP_403_FORBIDDEN
        )
    try:
        submissions = Submission.objects.all().order_by('-timestamp')

        # Serialize submission data
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


class AdminChallengeViewSet(viewsets.ModelViewSet):
    """
    CRUD for challenges [ Admin Only ]:

    - GET    /api/admin/challenges/
    - POST   /api/admin/challenges/
    - PATCH  /api/admin/challenges/{id}/
    - DELETE /api/admin/challenges/{id}/
    - GET    /api/admin/challenges/{id}/
    """
    queryset = Challenge.objects.all()
    serializer_class = AdminChallengeSerializer
    permission_classes = [IsAdminUser]

    # Accept PUT by delegating to PATCH logic
    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return super().update(request, *args, **kwargs)