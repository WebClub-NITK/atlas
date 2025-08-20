from rest_framework import serializers
from .models import User, Challenge, Team, Submission
from docker_plugin import DockerPlugin
from django.core.exceptions import ValidationError
from django.conf import settings


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
            'max_attempts',
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
                'is_banned', 'is_hidden'] 

class SubmissionSerializer(serializers.ModelSerializer):
    challenge_name = serializers.CharField(source='challenge.title', read_only=True)
    submitted_by = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Submission
        fields = ['id', 'challenge_name', 'submitted_by', 'flag_submitted', 
                 'is_correct', 'points_awarded', 'attempt_number', 'timestamp']

class AdminChallengeSerializer(serializers.ModelSerializer):
    title = serializers.CharField(required=True)
    description = serializers.CharField(required=True)
    category = serializers.CharField(required=True)
    flag = serializers.CharField(required=True)
    max_points = serializers.IntegerField(required=True)

    docker_image = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    is_hidden = serializers.BooleanField(required=False, default=False)
    hints = serializers.JSONField(required=False, default=list)
    file_links = serializers.JSONField(required=False, default=list)
    max_attempts = serializers.IntegerField(required=False, allow_null=True)
    ssh_user = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    port = serializers.IntegerField(required=False, default=22)

    class Meta:
        model = Challenge
        fields = "__all__"

    def create(self, validated_data):
        request = self.context.get("request")

        # Docker image upload if provided
        if request and request.FILES.get("docker_image"):
            if DockerPlugin is None:
                raise ValidationError("DockerPlugin not available")
            try:
                client = DockerPlugin(
                    base_url=settings.DOCKER_HOST,
                    key_file=settings.SSH_KEY_FILE,
                )
                image_id = client.add_image(request.FILES["docker_image"].read())
                validated_data["docker_image"] = image_id
            except Exception as e:
                raise ValidationError(f"Failed to add Docker image: {str(e)}")

        validated_data.setdefault("max_team_size", 3)
        validated_data.setdefault("port", 22)
        validated_data.setdefault("ssh_user", None)

        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get("request")

        if request and request.FILES.get("docker_image"):
            if DockerPlugin is None:
                raise ValidationError("DockerPlugin not available")
            try:
                client = DockerPlugin(
                    base_url=settings.DOCKER_HOST,
                    key_file=settings.SSH_KEY_FILE,
                )
                image_id = client.add_image(request.FILES["docker_image"].read())
                validated_data["docker_image"] = image_id
            except Exception as e:
                raise ValidationError(f"Failed to upload docker image: {str(e)}")

        if "max_points" in validated_data:
            validated_data["max_points"] = int(validated_data.get("max_points") or 0)
        if "port" in validated_data:
            validated_data["port"] = int(validated_data.get("port") or 22)
        if "max_attempts" in validated_data:
            validated_data["max_attempts"] = int(validated_data.get("max_attempts") or 0)
        if "is_hidden" in validated_data:
            validated_data["is_hidden"] = bool(validated_data["is_hidden"])

        return super().update(instance, validated_data)

    # Output formatting
    def to_representation(self, instance):
        rep = super().to_representation(instance)
        return {
            "id": rep["id"],
            "title": rep["title"],
            "description": rep["description"],
            "category": rep["category"],
            "docker_image": rep["docker_image"],
            "flag": rep["flag"],
            "max_points": rep["max_points"],
            "max_team_size": rep["max_team_size"],
            "max_attempts": rep["max_attempts"],
            "created_at": rep["created_at"],
            "updated_at": rep["updated_at"],
            "is_hidden": rep["is_hidden"],
            "hints": rep["hints"],
            "file_links": rep["file_links"],
            "ssh_user": rep["ssh_user"],
            "port": rep["port"],
        }