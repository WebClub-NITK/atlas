from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.core.exceptions import ValidationError

from django.conf import settings
import jwt
from rest_framework.permissions import IsAuthenticated
from datetime import datetime, timedelta
from .models import User, Role,Challenge
from .serializers import UserSerializer, SignupSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    serializer = SignupSerializer(data=request.data)
    if serializer.is_valid():
        
        validated_data = serializer.validated_data

        
        user = User(
            username=validated_data['username'],
            email=validated_data['email']
        )
        user.set_password(validated_data['password'])  # Hash the password
        user.save()

        
        default_role, _ = Role.objects.get_or_create(name='user')
        user.role = default_role
        user.save()

       
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



@api_view(['POST'])
@permission_classes([AllowAny])
def signin(request):
    username = request.data.get('username')
    password = request.data.get('password')

    
    if not username or not password:
        return Response({'error': 'Username and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(username=username, password=password)
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
        
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        
        send_mail(
            'Password Reset Request',
            f'Click the following link to reset your password: {reset_url}',
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
        
        return Response({'message': 'Password reset email sent'})
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    token = request.data.get('token')
    new_password = request.data.get('new_password')
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        user = User.objects.get(id=payload['user_id'])
        user.set_password(new_password)
        user.save()
        return Response({'message': 'Password reset successful'})
    except (jwt.ExpiredSignatureError, jwt.DecodeError, User.DoesNotExist):
        return Response({'error': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)


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

    except ValidationError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return Response({"error": "Something went wrong. Please try again."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)