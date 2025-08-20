from django.conf import settings
from datetime import datetime, timedelta
import jwt
from django.core.mail import send_mail
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from ..models import User
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
