from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError
from django.conf import settings
from django.db.models import Sum, Count, Max, Q
from django.db import IntegrityError
from datetime import datetime, timedelta
import jwt
from django.core.mail import send_mail

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, Challenge, Submission, Team, Container
from .serializers import SignupSerializer, ChallengeSerializer, TeamSerializer, SubmissionSerializer, UserSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    serializer = SignupSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        
        refresh['user'] = {
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'isAdmin': user.is_staff,
            'teamId': user.team.id if user.team else None
        }
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def signin(request):
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    user = authenticate(email=email, password=password)
    if user:
        refresh = RefreshToken.for_user(user)
        
        refresh['user'] = {
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'isAdmin': user.is_staff,
            'teamId': user.team.id if user.team else None
        }
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })
    return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_challenges(request):
    challenges = Challenge.objects.all()
    serializer = ChallengeSerializer(
        challenges, 
        many=True,
        context={'user_team': request.user.team}
    )
    return Response(serializer.data)

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
    if not request.user.is_staff:
        return Response(
            {'error': 'Only administrators can create challenges'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        data = request.data
        required_fields = ['title', 'description', 'category', 'docker_image', 'flag', 'max_points']
        
        # Validate required fields
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            return Response(
                {'error': f'Missing required fields: {", ".join(missing_fields)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate category
        valid_categories = dict(Challenge.CATEGORY_CHOICES)
        if data['category'] not in valid_categories:
            return Response(
                {'error': f'Invalid category. Valid categories are: {", ".join(valid_categories.keys())}'},
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
            max_team_size=int(data.get('max_team_size', 4))
        )

        return Response(
            ChallengeSerializer(challenge).data,
            status=status.HTTP_201_CREATED
        )

    except ValueError as e:
        return Response(
            {'error': 'Invalid numeric value provided'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
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