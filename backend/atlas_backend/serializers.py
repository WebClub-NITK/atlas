from rest_framework import serializers
from django.contrib.auth.models import Group
from .models import User, Challenge


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'team', 'created_at', 'updated_at']


class SignupSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'password']
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def create(self, validated_data):
        user = User(
            username=validated_data['username'],
            email=validated_data['email']
        )
        user.set_password(validated_data['password'])
        user.save()

       
        default_group, _ = Group.objects.get_or_create(name='user')
        user.role = default_group  
        user.save()

        return user

class ChallengeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Challenge
        fields = ['id', 'title', 'description', 'category', 'docker_image', 'flag', 'max_points', 'max_team_size', 'created_at', 'updated_at', 'file_links', 'hints']