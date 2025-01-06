from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate
from django.contrib.auth.models import Group  # Add this import
from django.core.exceptions import ValidationError
from django.conf import settings

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from datetime import datetime, timedelta
import jwt

from .models import User, Challenge,Submission
from .serializers import UserSerializer, SignupSerializer, ChallengeSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    serializer = SignupSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()  
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



@api_view(['POST'])
@permission_classes([AllowAny])
def signin(request):
    email = request.data.get('email')  # Changed from username
    password = request.data.get('password')

    if not email or not password:  # Updated error message
        return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(email=email, password=password)  # Changed to use email
    if user:
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })
    return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    email = request.data.get('email')
    try:
        user = User.objects.get(email=email)
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, settings.SECRET_KEY, algorithm='HS256')
        
        reset_url = f"{settings.FRONTEND_URL}/auth/reset-password?token={token}"
        
        # to uncomment after smtp configuration
        # send_mail(
        #     'Password Reset Request',
        #     f'Click the following link to reset your password: {reset_url}',
        #     settings.DEFAULT_FROM_EMAIL,
        #     [email],
        #     fail_silently=False,
        # )
        
        return Response({'message': 'Password reset token generated', 'reset_url': reset_url})
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    token = request.query_params.get('token')  # Get token from URL query parameter
    new_password = request.data.get('new_password')
    confirm_password = request.data.get('confirm_password')
    
    if not token:
        return Response(
            {'error': 'Reset token is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not new_password or not confirm_password:
        return Response(
            {'error': 'New password and password confirmation are required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if new_password != confirm_password:
        return Response(
            {'error': 'Passwords do not match'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if len(new_password) < 8:
        return Response(
            {'error': 'Password must be at least 8 characters long'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        user = User.objects.get(id=payload['user_id'])
        user.set_password(new_password)
        user.save()
        return Response({'message': 'Password reset successful'})
    except jwt.ExpiredSignatureError:
        return Response({'error': 'Reset token has expired'}, status=status.HTTP_400_BAD_REQUEST)
    except jwt.DecodeError:
        return Response({'error': 'Invalid reset token'}, status=status.HTTP_400_BAD_REQUEST)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception:
        return Response({'error': 'Password reset failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_challenges(request):
    challenges = Challenge.objects.all()
    serializer = ChallengeSerializer(challenges, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_flag(request, challenge_id):
    flag = request.data.get('flag')
    challenge = get_object_or_404(Challenge, id=challenge_id)
    team = request.user.team  

    if challenge.flag == flag:
        
        Submission.objects.create(
            team=team,
            challenge=challenge,
            points_awarded=challenge.max_points
        )
        return Response({'message': 'Correct flag!', 'points_awarded': challenge.max_points}, status=status.HTTP_200_OK)
    return Response({'message': 'Incorrect flag'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_challenge(request):
    
    data = request.data
    
    
    try:
        
        title = data.get("title")
        description = data.get("description")
        category = data.get("category")
        docker_image = data.get("docker_image")
        flag = data.get("flag")
        max_points = data.get("max_points")
        max_team_size = data.get("max_team_size", 4)  

        if not title or not description or not category or not docker_image or not flag or max_points is None:
            raise ValidationError("All fields are required")

        valid_categories = dict(Challenge.CATEGORY_CHOICES)
        if category not in valid_categories:
            raise ValidationError(f"Invalid category. Valid categories are: {', '.join(valid_categories.values())}")

        challenge = Challenge.objects.create(
            title=title,
            description=description,
            category=category,
            docker_image=docker_image,
            flag=flag,
            max_points=max_points,
            max_team_size=max_team_size
        )

        return Response({
            "message": "Challenge created successfully!",
            "challenge_id": challenge.id
        }, status=status.HTTP_201_CREATED)

    except ValidationError:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    except Exception:
        return Response({"error": "Something went wrong. Please try again."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)