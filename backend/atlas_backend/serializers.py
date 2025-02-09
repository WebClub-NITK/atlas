from rest_framework import serializers
from .models import User, Challenge, Team, Submission, Container

class UserSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(source='team.name',read_only=True)
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'team', 'team_name']

class SignupSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)

class ChallengeSerializer(serializers.ModelSerializer):
    is_solved = serializers.SerializerMethodField()

    class Meta:
        model = Challenge
        fields = [
            'id', 
            'title', 
            'description', 
            'max_points', 
            'category',
            'docker_image', 
            'is_hidden', 
            'hints', 
            'file_links', 
            'is_solved'
        ]

    def get_is_solved(self, obj):
        user_team = self.context.get('user_team')
        if not user_team:
            return False
        return Submission.objects.filter(
            team=user_team,
            challenge=obj,
            is_correct=True
        ).exists()

class TeamSerializer(serializers.ModelSerializer):
    members = UserSerializer(many=True, read_only=True)
    total_score = serializers.IntegerField(source='team_score', read_only=True)
    member_count = serializers.IntegerField(read_only=True)
    solved_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Team
        fields = ['id', 'name', 'description', 'team_size', 'members', 
                 'total_score', 'member_count', 'solved_count', 'challenges',
                 'max_attempts_per_challenge'] 

class SubmissionSerializer(serializers.ModelSerializer):
    challenge_name = serializers.CharField(source='challenge.title', read_only=True)
    submitted_by = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Submission
        fields = ['id', 'challenge_name', 'submitted_by', 'flag_submitted', 
                 'is_correct', 'points_awarded', 'attempt_number', 'timestamp']