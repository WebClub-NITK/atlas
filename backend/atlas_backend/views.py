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
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from django.core.cache import cache
from django.db import transaction
from django.http import QueryDict
from .models import User, Challenge, Submission, Team, Container, HintPurchase, validate_team_name
from .serializers import SignupSerializer, ChallengeSerializer, TeamSerializer, SubmissionSerializer, UserSerializer
import re
from docker_plugin import DockerPlugin
import logging

logger = logging.getLogger('atlas_backend')

# User Registration (Individual, without team)
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """User registration endpoint"""
    try:
        # Get user data
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        
        # Validate required fields
        if not username or not email or not password:
            return Response(
                {'error': 'Username, email, and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check for duplicate username
        if User.objects.filter(username__iexact=username).exists():
            return Response(
                {'error': 'Username already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Check for duplicate email
        if User.objects.filter(email__iexact=email).exists():
            return Response(
                {'error': 'Email already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )
        
        # Generate tokens for automatic login
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            },
            'refresh': str(refresh),
            'access': str(refresh.access_token)
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': f'Registration failed: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_team_api(request):
    """API endpoint to create a new team"""
    try:
        # Get and validate team data
        team_name = request.data.get('name')
        team_email = request.data.get('email')
        team_password = request.data.get('password')
        
        if not team_name:
            return Response(
                {'error': 'Team name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate team name
        try:
            validate_team_name(team_name)
        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Check if team name already exists
        if Team.objects.filter(name__iexact=team_name).exists():
            return Response(
                {'error': 'Team name already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Create the team with proper owner field
        team = Team.objects.create(
            name=team_name,
            team_email=team_email if team_email else '',
            team_owner=request.user  # Use team_owner field from model
        )
        
        # Set team password if provided
        if team_password:
            team.set_password(team_password)
            team.save()
        
        # Add user to the team
        user = request.user
        user.team = team
        user.save()
        
        # Generate new token with team information
        refresh = RefreshToken.for_user(user)
        refresh['user_id'] = user.id
        refresh['username'] = user.username
        refresh['email'] = user.email
        
        # Add team information to token
        refresh['team_id'] = team.id
        refresh['team_name'] = team.name
        refresh['team_email'] = team.team_email
        refresh['is_team_owner'] = True  # User is definitely the owner as they created it
        refresh['member_count'] = 1  # Initially only the creator
        refresh['team_access_code'] = team.access_code
        
        # Return success response with access code and updated tokens
        return Response({
            'team': {
                'id': team.id,
                'name': team.name,
                'access_code': team.access_code,
                'member_count': 1
            },
            'refresh': str(refresh),
            'access': str(refresh.access_token)
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': f'Team creation failed: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_team_api(request):
    """API endpoint to join a team using access code"""
    user = request.user
    
    if user.team:
        return Response(
            {'error': 'You are already in a team'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    access_code = request.data.get('access_code')
    
    if not access_code:
        return Response(
            {'error': 'Access code is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        team = Team.objects.get(access_code=access_code)
        
        # Check if team is banned
        if team.is_banned:
            return Response(
                {'error': 'This team has been banned'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Add user to team
        user.team = team
        user.save()
        
        # Generate new token with team information
        refresh = RefreshToken.for_user(user)
        refresh['user_id'] = user.id
        refresh['username'] = user.username
        refresh['email'] = user.email
        
        # Add team information to token
        refresh['team_id'] = team.id
        refresh['team_name'] = team.name
        refresh['team_email'] = team.team_email
        refresh['is_team_owner'] = team.team_owner_id == user.id
        refresh['member_count'] = team.members.count()
        refresh['team_access_code'] = team.access_code
        
        return Response({
            'team': {
                'id': team.id,
                'name': team.name,
                'access_code': team.access_code,
                'member_count': team.members.count()
            },
            'refresh': str(refresh),
            'access': str(refresh.access_token)
        })
        
    except Team.DoesNotExist:
        return Response(
            {'error': 'Invalid team access code'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': f'Failed to join team: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_team_api(request):
    """API endpoint to leave current team"""
    user = request.user
    
    if not user.team:
        return Response(
            {'error': 'You are not in a team'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        success, message = user.leave_team()
        
        if success:
            # Create a new token without team information
            refresh = RefreshToken.for_user(user)
            refresh['user_id'] = user.id
            refresh['username'] = user.username
            refresh['email'] = user.email
            
            return Response({
                'message': message,
                'refresh': str(refresh),
                'access': str(refresh.access_token)
            })
        else:
            return Response(
                {'error': message},
                status=status.HTTP_400_BAD_REQUEST
            )
    except Exception as e:
        return Response(
            {'error': f'Failed to leave team: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def team_status_api(request):
    """Check if user has a team and get team details"""
    user = request.user
    
    if not user.team:
        return Response({
            'has_team': False,
            'message': 'You are not in a team. Please create or join a team.'
        })
    
    team = user.team
    team_members = team.members.all()
    
    return Response({
        'has_team': True,
        'team': {
            'id': team.id,
            'name': team.name,
            'team_email': team.team_email,
            'access_code': team.access_code,
            'is_owner': team.team_owner_id == user.id,
            'total_score': team.team_score,
            'current_members': team_members.count(),
            'members': [{
                'id': member.id,
                'username': member.username,
                'email': member.email,
                'is_owner': team.team_owner_id == member.id
            } for member in team_members]
        }
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_team_api(request):
    """API endpoint to update team information"""
    user = request.user
    
    if not user.team:
        return Response(
            {'error': 'You are not in a team'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    team = user.team
    
    data = request.data
    
    # Update fields if provided
    if 'name' in data and data['name']:
        # Check if new name is available
        if Team.objects.filter(name__iexact=data['name']).exclude(id=team.id).exists():
            return Response(
                {'error': 'Team name already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        team.name = data['name']
        

    
    try:
        team.save()
        return Response({
            'message': 'Team information updated successfully',
            'team': {
                'id': team.id,
                'name': team.name,
                'team_email': team.team_email,
                'access_code': team.access_code,
                'is_owner': team.team_owner_id == user.id,
                'total_score': team.team_score,
                'current_members': team.members.count()
            }
        })
    except Exception as e:
        return Response(
            {'error': f'Failed to update team: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_challenges(request):
    """Get all challenges available to the user"""
    logger.info("=== GET /challenges ===")
    
    # Check if user has a team
    if not request.user.team:
        return Response(
            {'error': 'You must be in a team to access challenges'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Fetch only non-hidden challenges
    challenges = Challenge.objects.filter(is_hidden=False).values(
        'id',
        'title',
        'description',
        'category',
        'max_points',
        'file_links',
        'docker_image',
        'max_attempts'
    )
    
    # Convert QuerySet to list for JSON serialization
    challenges_list = list(challenges)

    submissions = list(Submission.objects.filter(team=request.user.team).values('challenge_id', 'is_correct', 'id'))

    for sub in submissions:
        for chal in challenges_list:
            if sub['challenge_id'] == chal['id']:
                chal['is_correct'] = sub['is_correct'] or chal.get('is_correct',False)
                chal['tries'] = chal.get('tries',0) + 1
                break
            
    # Add hint count information without revealing content
    for chal in challenges_list:
        challenge = Challenge.objects.get(id=chal['id'])
        hints = challenge.hints if isinstance(challenge.hints, list) else json.loads(challenge.hints)
        chal['hint_count'] = len(hints)

    logger.info(f"Challenges: {challenges_list}")

    return Response(challenges_list)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_challenge_by_id(request, challenge_id):
    try:
        if not request.user.team:
            return Response({"error": "You must be in a team to access challenges"}, status=status.HTTP_400_BAD_REQUEST)
        
        challenge = Challenge.objects.get(id=challenge_id)
        if challenge.is_hidden:
            return Response({"error": "Challenge not found"}, status=status.HTTP_404_NOT_FOUND)
        if challenge.is_hidden and not request.user.is_superuser:
            return Response({"error": "Challenge not found"}, status=status.HTTP_404_NOT_FOUND)
        
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
    except Challenge.DoesNotExist:
        return Response({"error": "Challenge not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_flag(request, challenge_id):
    try:
        if not request.user.team:
            return Response(
                {'error': 'You must be in a team to submit flags'},
                status=status.HTTP_403_FORBIDDEN
            )

        challenge = get_object_or_404(Challenge, id=challenge_id)
        flag = request.data.get('flag_submitted', '').strip()

        if request.user.team.is_banned:
            return Response(
                {'error': 'Your team has been banned'},
                status=status.HTTP_403_FORBIDDEN
            )
            
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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_challenge(request, challenge_id):
    if not request.user.team:
        return Response(
            {'error': 'You must be in a team to start challenges'},
            status=status.HTTP_403_FORBIDDEN
        )

    if request.user.team.is_banned:
        return Response(
            {'error': 'Your team has been banned'},
            status=status.HTTP_403_FORBIDDEN
        )
        
    challenge = get_object_or_404(Challenge, id=challenge_id)

    existing_container = Container.objects.filter(
        team=request.user.team,
        challenge=challenge,
        created_at__gte=datetime.now() - timedelta(seconds=challenge.timeout)   
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
        client = DockerPlugin()

        container_id, password = client.run_container(
            challenge.docker_image,
            port=22,
            timeout=challenge.timeout,
            container_name=f"{request.user.team.name.replace(' ', '_')}-{challenge.title.replace(' ', '_')}"
        )

        import time
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
            ssh_host=settings.DOCKER_HOST_IP,
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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def stop_challenge(request, challenge_id):
    try:
        if not request.user.team:
            return Response(
                {'error': 'You must be in a team to start challenges'},
                status=status.HTTP_403_FORBIDDEN
            )

        challenge = get_object_or_404(Challenge, id=challenge_id)

        existing_container = Container.objects.filter(
            team=request.user.team,
            challenge=challenge,
            created_at__gte=datetime.now() - timedelta(seconds=challenge.timeout)
        ).first()

        if existing_container:
            client = DockerPlugin()
            client.stop_container(existing_container.container_id)
            existing_container.delete()
            return Response({'message': 'Container stopped'}, status=status.HTTP_200_OK)
        else:
            return Response({'message': 'No active container found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_teams(request):
    # Only show non-hidden teams for regular users
    teams = Team.objects.filter(is_hidden=False).annotate(
        member_count=Count('members', distinct=True),
        solved_count=Count('submissions', filter=Q(
            submissions__is_correct=True), distinct=True)
    ).order_by('-team_score', 'created_at')

    if request.user.is_superuser:
        teams = Team.objects.annotate(
            member_count=Count('members', distinct=True),
            solved_count=Count('submissions', filter=Q(
                submissions__is_correct=True), distinct=True)
        ).order_by('-team_score', 'created_at')
    response_data = [{
        'id': team.id,
        'name': team.name,
        'email': team.team_email,
        'member_count': team.member_count,
        'total_score': team.team_score,
        'solved_count': team.solved_count,
        'is_banned': team.is_banned,  
        'is_hidden': team.is_hidden  
    } for team in teams]

    return Response(response_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_team_score(request, team_id=None):
    """
    Get team score. If team_id is provided, get that team's score.
    Otherwise, get the logged-in user's team score.
    """
    try:
        if not request.user.team:
            return Response({
                'error': 'You must be in a team to get your score',
                'status': status.HTTP_403_FORBIDDEN
            })
        # Determine which team to get score for
        if team_id:
            team = get_object_or_404(Team, id=team_id)
        else:
            team = request.user.team
            if not team:
                return Response(
                    {'error': 'User not associated with any team'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        total_score = team.team_score

        solved_challenges = team.challenges.count()

        return Response({
            'team_name': team.name,
            'total_score': team.team_score,
            'solved_challenges': solved_challenges
        })

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_submission_history(request):
    """
    Get submission history for a team
     """
    try:
        # Determine which team's history to get
        team = request.user.team
        if not team:
            return Response(
                {'error': 'User not associated with any team'},
                status=status.HTTP_403_FORBIDDEN
            )

        submissions = Submission.objects.filter(team=team).order_by(
            'challenge', '-timestamp'
        )

        history = {}
        for submission in submissions:
            challenge_id = submission.challenge.id
            if challenge_id not in history:
                history[challenge_id] = {
                    'challenge_name': submission.challenge.title,
                    'category': submission.challenge.category,
                    'max_points': submission.challenge.max_points,
                    'points_awarded': submission.points_awarded,
                    'attempts': [],
                    'is_solved': False,
                    'attempts_used': 0
                }

            history[challenge_id]['attempts'].append({
                'timestamp': submission.timestamp,
                'submitted_by': submission.user.email,
                'is_correct': submission.is_correct,
                'points_awarded': submission.points_awarded,
                'attempt_number': submission.attempt_number
            })

            history[challenge_id]['attempts_used'] += 1
            if submission.is_correct:
                history[challenge_id]['is_solved'] = True

        return Response(history)

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_scoreboard(request):
    """Get scoreboard data"""
    try:
        # Check if user has a team
        if not request.user.team:
            return Response(
                {'error': 'You must be in a team to view the scoreboard'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        teams = Team.objects.annotate(
            member_count=Count('members', distinct=True),
            solved_count=Count('submissions', filter=Q(
                submissions__is_correct=True))
        ).order_by('-team_score')  # Use team_score field directly

        scoreboard_data = []
        for rank, team in enumerate(teams, 1):
            team_data = {
                'rank': rank,
                'team_id': team.id,
                'team_name': team.name,
                'total_score': team.team_score, 
                'member_count': team.member_count,
                'solved_challenges': team.solved_count,
                'last_solve': team.submissions.filter(
                    is_correct=True
                ).order_by('-timestamp').first().timestamp if team.solved_count > 0 else None
            }
            scoreboard_data.append(team_data)

        return Response(scoreboard_data)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


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
                client = DockerPlugin()
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
                client = DockerPlugin()
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
@permission_classes([IsAuthenticated])
def team_profile(request):
    """Get current user's team profile"""
    try:
        user = request.user
        
        # Check if user has a team
        if not user.team:
            return Response(
                {'error': 'You must be in a team to view team profile', 'has_team': False},
                status=status.HTTP_403_FORBIDDEN
            )
            
        team = user.team
        members = team.members.all()
        
        # Format response with correct field names
        response = {
            'id': team.id,
            'name': team.name,
            'team_email': team.team_email,
            'access_code': team.access_code,
            'total_score': team.team_score,
            'team_owner': {
                'id': team.team_owner.id,
                'username': team.team_owner.username,
                'email': team.team_owner.email
            } if team.team_owner else None,
            'is_owner': team.team_owner_id == user.id,
            'members': [{
                'id': member.id,
                'username': member.username,
                'email': member.email,
                'is_owner': team.team_owner_id == member.id
            } for member in members]
        }
        
        return Response(response)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to retrieve team profile: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def signin(request):
    """Authenticate user and return JWT tokens"""
    try:
        # Validate required fields
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response(
                {'error': 'Username and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Authenticate user
        from django.contrib.auth import authenticate
        user = authenticate(username=username, password=password)
        
        if not user:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Generate JWT tokens with team information
        refresh = RefreshToken.for_user(user)
        refresh['user_id'] = user.id
        refresh['username'] = user.username
        refresh['email'] = user.email
        
        # Add team information if user has a team
        if user.team:
            refresh['team_id'] = user.team.id
            refresh['team_name'] = user.team.name
            # Use team_owner_id field from model
            refresh['is_team_owner'] = user.team.team_owner_id == user.id
            refresh['team_email'] = user.team.team_email
            refresh['member_count'] = user.team.members.count()
            refresh['team_access_code'] = user.team.access_code
            
            # Optional: include team member emails
            member_emails = [member.email for member in user.team.members.all()]
            refresh['member_emails'] = member_emails
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'has_team': user.team is not None
            }
        })
    except Exception as e:
        return Response(
            {'error': f'Login failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


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
        client = DockerPlugin()
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
                'running': Container.objects.count()
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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def purchase_hint(request, challenge_id):
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

@api_view(['POST'])
@permission_classes([AllowAny])
def token_refresh(request):
    """Refresh JWT token"""
    try:
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'error': 'Refresh token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken(refresh_token)
        
        # Get user from the refresh token
        user_id = refresh.get('user_id')
        user = User.objects.get(id=user_id)
        
        # Generate a new refresh token
        new_refresh = RefreshToken.for_user(user)
        new_refresh['user_id'] = user.id
        new_refresh['username'] = user.username
        new_refresh['email'] = user.email
        
        # Copy over the is_admin flag if it exists
        if 'is_admin' in refresh:
            new_refresh['is_admin'] = refresh['is_admin']
        
        # Add team information if user has a team
        if user.team:
            new_refresh['team_id'] = user.team.id
            new_refresh['team_name'] = user.team.name
        
        return Response({
            'refresh': str(new_refresh),
            'access': str(new_refresh.access_token)
        })
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_401_UNAUTHORIZED
        )

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