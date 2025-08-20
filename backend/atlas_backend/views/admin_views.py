from django.shortcuts import get_object_or_404
from django.conf import settings
from django.core.exceptions import ValidationError
from datetime import datetime, timedelta
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.exceptions import ValidationError
from django.http import QueryDict
from ..models import User, Challenge, Submission, Team, Container
from docker_plugin import DockerPlugin
import logging
import json


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


# Challenge CRUD
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_get_challenges(request):
    # Check if user is superuser
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

@api_view(['POST'])
@permission_classes([IsAdminUser])
def create_challenge(request):
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



        # Convert is_hidden from string to boolean
        is_hidden = str(data.get('is_hidden', 'false')).lower() == 'true'

        # Handle docker image optionally
        image_id = None
        if request.FILES.get('docker_image'):
            try:
                client = DockerPlugin(base_url=settings.DOCKER_HOST,key_file=settings.SSH_KEY_FILE)
                image_id = client.add_image(request.FILES['docker_image'].read())
            except Exception as e:
                return Response(
                    {"error": "Failed to add Docker image", "exception": f"{str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        max_attempts = data.get('max_attempts')
        # Create challenge
        challenge = Challenge.objects.create(
            title=title,
            description=data['description'],
            category=data['category'],
            docker_image=image_id if image_id else '',
            flag=data['flag'],
            max_points=int(data['max_points']),
            max_team_size=3,
            max_attempts=max_attempts,
            is_hidden=is_hidden,  # Use converted boolean
            hints=data.get('hints', []),
            file_links=data.get('file_links', []),
            port=data.get('port', 22),
            ssh_user=data.get('ssh_user', None),
        )

        return Response({
            "message": "Challenge created successfully",
            "challenge_id": challenge.id
        }, status=status.HTTP_201_CREATED)

    except ValidationError as e:  # Catch validation errors
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response(
            {"error": "Failed to create challenge", "exception": f"{str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def update_challenge(request, challenge_id):
    if not request.user.is_superuser:
        return Response(
            {"error": "Only administrators can update challenges"},
            status=status.HTTP_403_FORBIDDEN
        )
    try:
        challenge = Challenge.objects.get(id=challenge_id)
        data = request.data

        # Handle form data properly
        if isinstance(data, QueryDict):
            data = data.dict()

        # Convert max_points with validation
        if 'max_points' in data:
            try:
                data['max_points'] = int(data['max_points'] or 0)  # Default to 0 if None/empty
            except (ValueError, TypeError):
                data['max_points'] = 0

        # Convert is_hidden to boolean
        if 'is_hidden' in data:
            data['is_hidden'] = str(data['is_hidden']).lower() == 'true'

        # Parse JSON strings for hints and file_links
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

@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def delete_challenge(request, challenge_id):
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
