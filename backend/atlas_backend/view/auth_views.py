from django.shortcuts import get_object_or_404
from django.conf import settings
from django.db.models import Sum, Count, Q
from django.core.exceptions import ValidationError
from datetime import datetime, timedelta
import jwt
from django.core.mail import send_mail
from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.decorators import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from ..models import User, Team, validate_team_name
import logging
from smtplib import SMTPException

logger = logging.getLogger('atlas_backend')

# User Registration (Individual, without team)
class Register(APIView):
    """User registration endpoint"""
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            # Get user info
            username = request.data.get('username')
            email = request.data.get('email')
            password = request.data.get('password')

            # Validate all required fields
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
            }, 
            status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Registration failed: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

class CreateTeam(APIView):
    """Endpoint to create a new team"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            team_name = request.data.get('name')
            team_email = request.data.get('email')
            team_password = request.data.get('password')

            if not team_name:
                return Response(
                    {'error': 'Team name is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
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


class JoinTeam(APIView):
    """Endpoint to join a team using access code"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
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
            
            if team.is_banned:
                return Response(
                    {'error': 'This team has been banned'},
                    status=status.HTTP_400_BAD_REQUEST
                )

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

            
class LeaveTeam(APIView):
    """API endpoint to leave current team"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
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

class TeamStatus(APIView):
    """Check if user has a team and get team details"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
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

class UpdateTeam(APIView):
    """API endpoint to update team information"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        if not user.team:
            pass

        team = user.team
        data = request.data

        if 'name' in data and data['name']:
            if Team.objects.filter(name__iexact = data['name']).exclude(id=team.id).exists():
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

class RequestPasswordReset(APIView):
    """API endpoint to request password change"""

    permission_classes = [AllowAny]

    def post(self, request):
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

            #TODO: CHANGE LATER
            reset_url = f"http://localhost:3000/reset-password?token={token}"

            # Send email if SMTP is configured
            if hasattr(settings, 'EMAIL_HOST'):
                try:
                    send_mail(
                        'Password Reset Request',
                        f'Click here to reset your password: {reset_url}',
                        settings.DEFAULT_FROM_EMAIL,
                        [email],
                        fail_silently=False,
                    )
                    return Response({'message': 'Password reset email sent'})
                except (SMTPException, ConnectionRefusedError) as e:
                    logger.error(f"Failed to send password reset email: {e}")
                    # Fallback for dev environment if email fails to send
                    return Response({
                        'message': 'Email server is not configured correctly. For development, use this reset URL.',
                        'reset_url': reset_url
                    }, status=status.HTTP_503_SERVICE_UNAVAILABLE)


            # For development, return the reset URL if no email host is configured
            return Response({
                'message': 'Password reset token generated',
                'reset_url': reset_url
            })

        except User.DoesNotExist:
            # Return success to prevent email enumeration
            return Response({'message': 'If email exists, reset instructions will be sent'})

class ResetPassword(APIView):
    """API endpoint to reset password"""

    permission_classes = [AllowAny]

    def post(self, request):
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

class TeamProfile(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get current user's team profile"""
        try:
            user = request.user

            if not user.team:
                return Response(
                    {'error': 'You must be in a team to view team profile', 'has_team': False},
                    status=status.HTTP_403_FORBIDDEN
                )

            team = user.team
            members = team.members.all()

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


class SignIn(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        """Authenticate user and return JWT tokens"""
        try:
            username = request.data.get('username')
            password = request.data.get('password')

            if not username or not password:
                return Response(
                    {'error': 'Username and password are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            user = authenticate(username=username, password=password)
            if not user:
                return Response(
                    {'error': 'Invalid credentials'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            refresh = RefreshToken.for_user(user)
            refresh['user_id'] = user.id
            refresh['username'] = user.username
            refresh['email'] = user.email

            if user.team:
                refresh['team_id'] = user.team.id
                refresh['team_name'] = user.team.name
                refresh['is_team_owner'] = user.team.team_owner_id == user.id
                refresh['team_email'] = user.team.team_email
                refresh['member_count'] = user.team.members.count()
                refresh['team_access_code'] = user.team.access_code
                refresh['member_emails'] = [m.email for m in user.team.members.all()]

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

class TokenRefresh(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        """Refresh JWT token"""
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'error': 'Refresh token is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            refresh = RefreshToken(refresh_token)

            user_id = refresh.get('user_id')
            user = User.objects.get(id=user_id)

            new_refresh = RefreshToken.for_user(user)
            new_refresh['user_id'] = user.id
            new_refresh['username'] = user.username
            new_refresh['email'] = user.email

            if 'is_admin' in refresh:
                new_refresh['is_admin'] = refresh['is_admin']

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


class AdminLogin(APIView):
    """Admin login endpoint that only authenticates superusers"""
    permission_classes = [AllowAny]

    def post(self, request):
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
                user = User.objects.get(email=email, is_superuser=True)

                if not user.check_password(password):
                    raise User.DoesNotExist

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
