from rest_framework import serializers
from .models import User, Challenge, Team, Submission, Container

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'team']

class SignupSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)

class ChallengeSerializer(serializers.ModelSerializer):
    is_solved = serializers.SerializerMethodField()
    attempts = serializers.SerializerMethodField()

    class Meta:
        model = Challenge
        fields = [
            'id', 
            'title', 
            'description', 
            'category', 
            'max_points',
            'max_team_size', 
            'docker_image', 
            'is_solved', 
            'attempts',
            'created_at',
            'updated_at'
        ]
        extra_kwargs = {
            'flag': {'write_only': True}  # Never expose flag in API responses
        }

    def get_is_solved(self, obj):
        team = self.context.get('user_team')
        return team and obj.submissions.filter(team=team, is_correct=True).exists()

    def get_attempts(self, obj):
        team = self.context.get('user_team')
        return team and obj.submissions.filter(team=team).count() or 0

class TeamSerializer(serializers.ModelSerializer):
    members = UserSerializer(many=True, read_only=True)
    total_score = serializers.IntegerField(read_only=True)
    member_count = serializers.IntegerField(read_only=True)
    solved_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Team
        fields = ['id', 'name', 'description', 'team_size', 'members', 
                 'total_score', 'member_count', 'solved_count', 'challenges']

class SubmissionSerializer(serializers.ModelSerializer):
    challenge_name = serializers.CharField(source='challenge.title')
    submitted_by = serializers.CharField(source='user.username')
    
    class Meta:
        model = Submission
        fields = ['id', 'challenge_name', 'submitted_by', 'flag_submitted', 
                 'is_correct', 'points_awarded', 'attempt_number', 'timestamp']
