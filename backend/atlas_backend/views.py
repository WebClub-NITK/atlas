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
from .models import User, Challenge, Submission, Team, Container, HintPurchase, validate_atlas_name
from .serializers import SignupSerializer, ChallengeSerializer, TeamSerializer, SubmissionSerializer, UserSerializer
import re
from docker_plugin import DockerPlugin
import logging

logger = logging.getLogger('atlas_backend')


@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    data = request.data
    # Required fields validation
    required_fields = ['teamName', 'teamEmail',
                       'password', 'member1Name', 'member1Email']
    for field in required_fields:
        if not data.get(field):
            return Response(
                {'error': f'{field} is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

    # Email format validation
    email_fields = ['teamEmail', 'member1Email']
    for field in email_fields:
        email = data.get(field)
        if not re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', email):
            return Response(
                {'error': f'Invalid email format for {field}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    # Check if team name already exists
    if Team.objects.filter(name__iexact=data['teamName']).exists():
        return Response(
            {'error': 'Team name already exists'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check if team email already exists
    if Team.objects.filter(team_email=data['teamEmail']).exists():
        return Response(
            {'error': 'Team email already exists'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Create team
        team = Team.objects.create(
            name=data['teamName'],
            team_email=data['teamEmail'],
            team_score=0
        )
        team.set_password(data['password'])
        team.save()

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

    except ValidationError as e: 
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def signin(request):
    team_name = request.data.get('teamName', '').lower()
    password = request.data.get('password')

    if not team_name or not password:
        return Response(
            {'error': 'Team name and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        team = Team.objects.filter(name__iexact=team_name).first()
        if not team or not check_password(password, team.password):
            raise Team.DoesNotExist

        if team.is_banned:
            return Response(
                {'error': 'This team has been banned'},
                status=status.HTTP_403_FORBIDDEN
            )
            
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
    except Exception as e:
        logger.error(f"Error during signin: {str(e)}")
        return Response(
            {'error': 'Signin failed'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
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
                status=status.HTTP_400_BAD_REQUEST
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
            status=status.HTTP_400_BAD_REQUEST
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
        created_at__gte=datetime.now() - timedelta(minutes=10)
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
                status=status.HTTP_400_BAD_REQUEST
            )

        challenge = get_object_or_404(Challenge, id=challenge_id)

        existing_container = Container.objects.filter(
            team=request.user.team,
            challenge=challenge,
            created_at__gte=datetime.now() - timedelta(minutes=10)
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
                status=status.HTTP_400_BAD_REQUEST
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
    try:
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
    try:
        # Get token from authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response(
                {'error': 'No token provided'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Extract token and decode it
        token = auth_header.split(' ')[1]
        decoded_token = AccessToken(token)

        # Get team info from token
        team_id = decoded_token['team_id']

        # Get team from database
        team = Team.objects.get(id=team_id)

        # Get team members
        team_members = User.objects.filter(team_id=team_id)

        # Get team statistics
        solved_challenges = Challenge.objects.filter(
            submissions__team=team,
            submissions__is_correct=True,
        ).distinct().count()

        # Get total score
        total_score = team.team_score

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
            'id': team_id,
            'name': team.name,
            'team_email': team.team_email,
            'members': [{
                'id': member.id,
                'username': member.username,
                'email': member.email
            } for member in team_members],
            'total_score': total_score,
            'solved_challenges': solved_challenges,
            'rank': team_rank,
            'recent_activity': recent_activity
        }

        return Response(response_data)

    except Exception as e:
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