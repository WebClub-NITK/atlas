from django.shortcuts import get_object_or_404
from django.conf import settings
from django.db.models import Sum, Count, Q
from datetime import datetime, timedelta
import jwt
from django.core.mail import send_mail
from django.contrib.auth.hashers import make_password, check_password
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from django.core.cache import cache
from .models import User, Challenge, Submission, Team, Container
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
    if Team.objects.filter(name=data['teamName']).exists():
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
            team_email=data['teamEmail']
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

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


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
        'hints',
        'file_links',
        'docker_image'
    )

    # Convert QuerySet to list for JSON serialization
    challenges_list = list(challenges)

    logger.info(f"Challenges: {challenges_list}")

    return Response(challenges_list)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_challenge_by_id(request, challenge_id):
    try:
        challenge = Challenge.objects.get(id=challenge_id)
        if (challenge.is_hidden):
            return Response({"error": "Challenge not found"}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({
                "challenge": {
                    "id": challenge.id,
                    "title": challenge.title,
                    "description": challenge.description,
                    "category": challenge.category,
                    "max_points": challenge.max_points,
                    "hints": challenge.hints,
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
        logger.info('Challenge: %s', challenge)
        logger.info('Request data: %s', request.data)
        flag = request.data.get('flag', '').strip()

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

        if submission_count >= request.user.team.max_attempts_per_challenge:
            return Response(
                {'error': f'Maximum {request.user.team.max_attempts_per_challenge} attempts allowed for this challenge'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        # Check if already solved
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

        submission = Submission.objects.create(
            team=request.user.team,
            challenge=challenge,
            user=request.user,
            flag_submitted=flag,
            is_correct=is_correct,
            # need to handle hints logic here
            points_awarded=challenge.max_points if is_correct else 0,
            attempt_number=attempt_number
        )

        if is_correct:
            request.user.team.challenges.add(challenge)

        return Response({
            'message': 'Correct flag!' if is_correct else 'Incorrect flag',
            'points_awarded': submission.points_awarded,
            'is_correct': is_correct,
            'attempt_number': attempt_number,
            'attempts_remaining': request.user.team.max_attempts_per_challenge - attempt_number,
            'timestamp': submission.timestamp.isoformat()
        })

    except Exception as e:
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

        # container name constraints [a-zA-Z0-9][a-zA-Z0-9_.-]
        container_id, password = client.run_container(
            challenge.docker_image,
            port=22,
            container_name=f"{request.user.team.name.replace(" ", "_")}-{challenge.title.replace(" ", "_")}"
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
    teams = Team.objects.annotate(
        total_score=Sum('submissions__points_awarded', default=0),
        member_count=Count('members', distinct=True),
        solved_count=Count('submissions', filter=Q(
            submissions__is_correct=True))
    ).order_by('-total_score')

    serializer = TeamSerializer(teams, many=True)
    return Response(serializer.data)


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

        # Calculate total score
        total_score = Submission.objects.filter(
            team=team,
            is_correct=True
        ).aggregate(
            total_score=Sum('points_awarded')
        )['total_score'] or 0

        # Get solved challenges
        solved_challenges = Challenge.objects.filter(
            submissions__team=team,
            submissions__is_correct=True
        ).distinct().count()

        return Response({
            'team_name': team.name,
            'total_score': total_score,
            'solved_challenges': solved_challenges
        })

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_submission_history(request, team_id=None):
    """
    Get submission history for a team
    """
    try:
        # Determine which team's history to get
        if team_id:
            team = get_object_or_404(Team, id=team_id)
        else:
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
    """
    Get scoreboard for all teams
    """
    try:
        teams = Team.objects.annotate(
            total_score=Sum('submissions__points_awarded', default=0),
            member_count=Count('members', distinct=True),
            solved_count=Count('submissions', filter=Q(
                submissions__is_correct=True))
        ).order_by('-total_score')

        # Create serializable response data
        scoreboard_data = []
        for rank, team in enumerate(teams, 1):
            team_data = {
                'rank': rank,
                'team_id': team.id,
                'team_name': team.name,
                'total_score': team.total_score,
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
    # Check if user is superuser
    if not request.user.is_superuser:
        return Response(
            {"error": "Only administrators can create challenges"},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        data = request.data

        # Validate required fields
        required_fields = ['title', 'description',
                           'category', 'docker_image', 'flag', 'max_points']
        for field in required_fields:
            if not data.get(field):
                return Response(
                    {"error": f"{field} is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        try:
            if request.FILES.get('docker_image'):
                client = DockerPlugin()
                image_id = client.add_image(
                    request.FILES['docker_image'].read()
                )
            else:
                image_id = None
        except Exception as e:
            logger.info(f"Error adding image: {str(e)}")
            return Response({"error": "Failed to add Docker image", "exception": f"${e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Create challenge
        challenge = Challenge.objects.create(
            title=data['title'],
            description=data['description'],
            category=data['category'],
            docker_image=image_id,
            flag=data['flag'],
            max_points=int(data['max_points']),
            max_team_size=3,  # Fixed as 3
            is_hidden=data.get('is_hidden', False),
            hints=data.get('hints', []),
            file_links=data.get('file_links', []),
            port=22,
            ssh_user='atlas'
        )

        return Response({
            "message": "Challenge created successfully",
            "challenge_id": challenge.id
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response(
            {"error": "Failed to create challenge", "exception": f"{e}"},
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
            submissions__is_correct=True
        ).distinct().count()

        # Get total score
        total_score = team.submissions.filter(
            is_correct=True
        ).aggregate(total=Sum('points_awarded'))['total'] or 0

        # Get team rank
        team_rank = Team.objects.annotate(
            score=Sum('submissions__points_awarded',
                      filter=Q(submissions__is_correct=True))
        ).filter(
            score__gt=total_score
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
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
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