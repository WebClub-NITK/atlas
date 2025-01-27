from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError
from django.conf import settings
from django.db.models import Sum, Count, Max, Q
from django.db import IntegrityError
from datetime import datetime, timedelta
import jwt
from django.core.mail import send_mail
from django.contrib.auth.hashers import make_password, check_password

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken

from .models import User, Challenge, Submission, Team, Container
from .serializers import SignupSerializer, ChallengeSerializer, TeamSerializer, SubmissionSerializer, UserSerializer

import logging

logger = logging.getLogger('atlas_backend')

@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    data = request.data
    try:
        # Create team first
        team = Team.objects.create(
            name=data['teamName'],
            team_email=data['teamEmail'],
            team_size=3,
            password=make_password(data['password'])
        )

        # Create users for all team members
        users = []
        
        # Create required first member
        member1 = User.objects.create_user(
            username=data['member1Name'],
            email=data['member1Email'],
            password=data['password'],
            team=team
        )
        users.append(member1)

        # Create optional members if provided
        if data.get('member2Email'):
            member2 = User.objects.create_user(
                username=data['member2Name'],
                email=data['member2Email'],
                password=data['password'],
                team=team
            )
            users.append(member2)

        if data.get('member3Email'):
            member3 = User.objects.create_user(
                username=data['member3Name'],
                email=data['member3Email'],
                password=data['password'],
                team=team
            )
            users.append(member3)

        # Generate token based on first team member
        refresh = RefreshToken.for_user(member1)
        refresh['team_id'] = team.id
        refresh['team_name'] = team.name
        refresh['team_email'] = team.team_email
        refresh['member_count'] = len(users)
        refresh['member_emails'] = [user.email for user in users]

        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def signin(request):
    team_name = request.data.get('teamName')
    password = request.data.get('password')
    
    if not team_name or not password:
        return Response(
            {'error': 'Team name and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        team = Team.objects.get(name=team_name)
        if not check_password(password, team.password):
            raise Team.DoesNotExist

        # Get the first team member as the "main" user for authentication
        team_member = User.objects.filter(team=team).first()
        if not team_member:
            return Response(
                {'error': 'No team members found'},
                status=status.HTTP_400_BAD_REQUEST
            )

        team_members = User.objects.filter(team=team)
            
        refresh = RefreshToken.for_user(team_member)
        
        # Add required claims
        refresh['user_id'] = team_member.id
        refresh['username'] = team_member.username
        refresh['email'] = team_member.email
        
        # Add custom team claims
        refresh['team_id'] = team.id
        refresh['team_name'] = team.name
        refresh['team_email'] = team.team_email
        refresh['member_count'] = team_members.count()
        refresh['member_emails'] = [member.email for member in team_members]
        
        logger.info('Generated token with payload: %s', {
            'user_id': team_member.id,
            'username': team_member.username,
            'email': team_member.email,
            'team_id': team.id,
            'team_name': team.name,
            'team_email': team.team_email,
            'member_count': team_members.count(),
        })
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })
    except Team.DoesNotExist:
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_challenges(request):
    logger.info("=== GET /challenges ===")
    logger.info(f"Auth header: {request.headers.get('Authorization')}")
    logger.info(f"User: {request.user}")
    logger.info(f"Is authenticated: {request.user.is_authenticated}")
    
    # Fetch only non-hidden challenges
    challenges = Challenge.objects.filter(is_hidden=False).values(
        'id',
        'title',
        'description',
        'category',
        'max_points',
        'hints',
        'file_links',
        'docker_image'
    )
    
    # Convert QuerySet to list for JSON serialization
    challenges_list = list(challenges)
    
    logger.info(f"Challenges: {challenges_list}")
    
    return Response(challenges_list)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_flag(request, challenge_id):
    if not request.user.team:
        return Response(
            {'error': 'You must be in a team to submit flags'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    challenge = get_object_or_404(Challenge, id=challenge_id)
    flag = request.data.get('flag')
    
    if not flag:
        return Response(
            {'error': 'Flag is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    existing_submission = Submission.objects.filter(
        team=request.user.team,
        challenge=challenge
    ).first()
    
    if existing_submission:
        if existing_submission.is_correct:
            return Response(
                {'error': 'Challenge already solved'},
                status=status.HTTP_400_BAD_REQUEST
            )
        attempt_number = existing_submission.attempt_number + 1
        existing_submission.delete()  # Remove previous attempt
    else:
        attempt_number = 1
    
    is_correct = challenge.flag == flag
    points = challenge.max_points if is_correct else 0
    
    try:
        submission = Submission.objects.create(
            team=request.user.team,
            challenge=challenge,
            user=request.user,
            flag_submitted=flag,
            is_correct=is_correct,
            points_awarded=points,
            attempt_number=attempt_number
        )
        
        return Response({
            'message': 'Correct flag!' if is_correct else 'Incorrect flag',
            'points_awarded': points,
            'is_correct': is_correct,
            'attempt_number': attempt_number
        })
    except IntegrityError:
        return Response(
            {'error': 'Submission error occurred'},
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_challenge(request, challenge_id):
    if not request.user.team:
        return Response(
            {'error': 'You must be in a team to start challenges'},
            status=status.HTTP_400_BAD_REQUEST
        )
        
    challenge = get_object_or_404(Challenge, id=challenge_id)
    
    existing_container = Container.objects.filter(
        team=request.user.team,
        challenge=challenge,
        status='running'
    ).first()
    
    if existing_container:
        return Response({
            'host': existing_container.ssh_host,
            'port': existing_container.ssh_port,
            'username': existing_container.ssh_user,
            'container_id': existing_container.id,
            'ssh_key': existing_container.ssh_key
        })
    
    try:
        from .docker_plugin import DockerManager
        docker_mgr = DockerManager()
        
        container_info = docker_mgr.create_container(
            challenge.docker_image,
            team_id=request.user.team.id,
            challenge_id=challenge_id
        )
        
        container = Container.objects.create(
            team=request.user.team,
            challenge=challenge,
            container_id=container_info['container_id'],
            ssh_host=container_info['host'],
            ssh_port=container_info['port'],
            ssh_user=container_info['username'],
            ssh_key=container_info.get('ssh_key', ''),
            status='running'
        )
        
        return Response({
            'host': container.ssh_host,
            'port': container.ssh_port,
            'username': container.ssh_user,
            'container_id': container.id,
            'ssh_key': container.ssh_key
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_teams(request):
    teams = Team.objects.annotate(
        total_score=Sum('submissions__points_awarded', default=0),
        member_count=Count('members', distinct=True),
        solved_count=Count('submissions', filter=Q(submissions__is_correct=True))
    ).order_by('-total_score')
    
    serializer = TeamSerializer(teams, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_team(request):
    if request.user.team:
        return Response(
            {'error': 'You are already in a team'},
            status=status.HTTP_400_BAD_REQUEST
        )
        
    name = request.data.get('name')
    description = request.data.get('description', '')
    team_size = request.data.get('team_size', 4)
    
    if not name:
        return Response(
            {'error': 'Team name is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        team = Team.objects.create(
            name=name,
            description=description,
            team_size=team_size
        )
        request.user.team = team
        request.user.save()
        
        return Response(TeamSerializer(team).data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_team(request):
    if request.user.team:
        return Response(
            {'error': 'You are already in a team'},
            status=status.HTTP_400_BAD_REQUEST
        )
        
    team_id = request.data.get('team_id')
    if not team_id:
        return Response(
            {'error': 'Team ID is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        team = Team.objects.get(id=team_id)
        current_size = team.members.count()
        
        if current_size >= team.team_size:
            return Response(
                {'error': 'Team is full'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        request.user.team = team
        request.user.save()
        return Response({'message': 'Successfully joined team'})
    except Team.DoesNotExist:
        return Response(
            {'error': 'Team not found'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_team(request):
    if not request.user.team:
        return Response(
            {'error': 'You are not in a team'},
            status=status.HTTP_400_BAD_REQUEST
        )
        
    request.user.team = None
    request.user.save()
    return Response({'message': 'Successfully left team'})

@api_view(['GET'])
@permission_classes([AllowAny])
def get_scoreboard(request):
    teams = Team.objects.annotate(
        total_score=Sum('submissions__points_awarded', default=0),
        member_count=Count('members', distinct=True),
        solved_count=Count('submissions', filter=Q(submissions__is_correct=True))
    ).order_by('-total_score')
    
    serializer = TeamSerializer(teams, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    email = request.data.get('email')
    if not email:
        return Response(
            {'error': 'Email is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(email=email)
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, settings.SECRET_KEY, algorithm='HS256')
        
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        
        # Send email if SMTP is configured
        if hasattr(settings, 'EMAIL_HOST'):
            send_mail(
                'Password Reset Request',
                f'Click here to reset your password: {reset_url}',
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            return Response({'message': 'Password reset email sent'})
        
        # For development, return the reset URL
        return Response({
            'message': 'Password reset token generated', 
            'reset_url': reset_url
        })
        
    except User.DoesNotExist:
        # Return success to prevent email enumeration
        return Response({'message': 'If email exists, reset instructions will be sent'})

@api_view(['POST']) 
@permission_classes([AllowAny])
def reset_password(request):
    token = request.data.get('token')
    new_password = request.data.get('new_password')
    
    if not token or not new_password:
        return Response(
            {'error': 'Token and new password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Validate password
        if len(new_password) < 8:
            return Response(
                {'error': 'Password must be at least 8 characters'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify and decode token
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=['HS256'],
            options={'verify_exp': True}
        )
        
        user = User.objects.get(id=payload['user_id'])
        user.set_password(new_password)
        user.save()

        return Response({'message': 'Password reset successful'})

    except jwt.ExpiredSignatureError:
        return Response(
            {'error': 'Reset link has expired'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    except (jwt.InvalidTokenError, User.DoesNotExist):
        return Response(
            {'error': 'Invalid reset token'},
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_challenge(request):
    # Check if user is superuser
    if not request.user.is_superuser:
        return Response(
            {"error": "Only administrators can create challenges"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        data = request.data
        
        # Validate required fields
        required_fields = ['title', 'description', 'category', 'docker_image', 'flag', 'max_points']
        for field in required_fields:
            if not data.get(field):
                return Response(
                    {"error": f"{field} is required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Create challenge
        challenge = Challenge.objects.create(
            title=data['title'],
            description=data['description'],
            category=data['category'],
            docker_image=data['docker_image'],
            flag=data['flag'],
            max_points=int(data['max_points']),
            max_team_size=3,  # Fixed as 3
            is_hidden=data.get('is_hidden', False),
            hints=data.get('hints', []),
            file_links=data.get('file_links', [])
        )

        return Response({
            "message": "Challenge created successfully",
            "challenge_id": challenge.id
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response(
            {"error": "Failed to create challenge"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def update_challenge(request, challenge_id):
    try:
        challenge = Challenge.objects.get(id=challenge_id)
        data = request.data

        # Update fields if they exist in request
        fields = [
            'title', 'description', 'category', 'docker_image',
            'flag', 'max_points', 'is_hidden', 'hints', 'file_links'
        ]
        
        for field in fields:
            if field in data:
                setattr(challenge, field, data[field])

        challenge.save()
        return Response({"message": "Challenge updated successfully"})
        
    except Challenge.DoesNotExist:
        return Response(
            {"error": "Challenge not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error updating challenge: {str(e)}")
        return Response(
            {"error": "Failed to update challenge"}, 
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
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_user_info(request):
    serializer = UserSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_team_history(request):
    if not request.user.team:
        return Response({'error': 'User not in a team'}, status=status.HTTP_400_BAD_REQUEST)
    
    submissions = Submission.objects.filter(team=request.user.team)
    serializer = SubmissionSerializer(submissions, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def team_profile(request):
    try:
        # Get token from authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'No token provided'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Extract token and decode it
        token = auth_header.split(' ')[1]
        decoded_token = AccessToken(token)
        
        # Get team info from token
        team_id = decoded_token['team_id']
        team_name = decoded_token['team_name']
        team_email = decoded_token['team_email']
        member_count = decoded_token['member_count']
        member_emails = decoded_token['member_emails']
        
        # Get team from database using team_id from token
        team = Team.objects.get(id=team_id)
        
        # Get team members using team_id
        team_members = User.objects.filter(team_id=team_id)
        
        # Get team statistics
        solved_challenges = Challenge.objects.filter(
            submissions__team=team,
            submissions__is_correct=True
        ).distinct().count()
        
        # Get total score
        total_score = team.submissions.filter(is_correct=True).aggregate(
            total=Sum('challenge__points')
        )['total'] or 0
        
        # Get team rank
        teams_ranking = Team.objects.annotate(
            score=Sum('submissions__challenge__points', 
                     filter=Q(submissions__is_correct=True))
        ).order_by('-score')
        team_rank = list(teams_ranking.values_list('id', flat=True)).index(team_id) + 1
        
        # Get recent activity
        recent_submissions = team.submissions.filter(
            is_correct=True
        ).order_by('-submitted_at')[:5]
        
        response_data = {
            'id': team_id,
            'name': team_name,
            'team_email': team_email,
            'members': [{
                'id': member.id,
                'username': member.username,
                'email': member.email
            } for member in team_members],
            'total_score': total_score,
            'solved_challenges': solved_challenges,
            'rank': team_rank,
            'recent_activity': [{
                'id': sub.id,
                'challenge_name': sub.challenge.name,
                'points': sub.challenge.points,
                'solved_at': sub.submitted_at.isoformat()
            } for sub in recent_submissions]
        }
        
        return Response(response_data)
        
    except Exception as e:
        print(f"Error in team_profile: {str(e)}")
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def token_refresh(request):
    try:
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'error': 'Refresh token required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        refresh = RefreshToken(refresh_token)
        return Response({
            'access': str(refresh.access_token),
        })
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_401_UNAUTHORIZED
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def admin_login(request):
    try:
        email = request.data.get('email')
        password = request.data.get('password')
        
        # Get superuser by email
        user = User.objects.get(email=email, is_superuser=True)
        
        if not user.check_password(password):
            raise User.DoesNotExist

        refresh = RefreshToken.for_user(user)
        
        # Add admin claims to token
        refresh['is_admin'] = True
        refresh['email'] = user.email
        refresh['user_id'] = user.id

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })
        
    except User.DoesNotExist:
        return Response(
            {'error': 'Invalid admin credentials'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )
    except Exception as e:
        return Response(
            {'error': 'Login failed'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
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
            'created_at': challenge.created_at,
            'updated_at': challenge.updated_at,
            'is_hidden': challenge.is_hidden,
            'hints': challenge.hints,
            'file_links': challenge.file_links
        }
        return Response(data)
    except Challenge.DoesNotExist:
        return Response(
            {"error": "Challenge not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )

