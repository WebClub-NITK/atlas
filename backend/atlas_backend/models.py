from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager, Group
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth.hashers import make_password, check_password
from django.db.models import CharField, TextField, IntegerField, BooleanField, DateTimeField
from django.core.validators import RegexValidator
import re
import uuid

def validate_team_name(value):
    pattern = r'^[a-zA-Z0-9][a-zA-Z0-9_.-]*$'
    if not re.match(pattern, value):
        raise ValidationError(
            'Name must start with alphanumeric character and only contain alphanumeric characters, '
            'dots, underscores, or hyphens'
        )

class Team(models.Model):
    name = models.CharField(
        max_length=100,
        unique=True
    )

    access_code = models.CharField(max_length=20, unique=True, blank=True, null=True)
    team_email = models.EmailField(blank=True)
    team_owner = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, blank=True, related_name='owned_teams')
    challenges = models.ManyToManyField("Challenge", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    password = models.CharField(max_length=128, default=make_password('default_password'))
    team_score = models.IntegerField(default=0)
    is_banned = models.BooleanField(default=False)
    is_hidden = models.BooleanField(default=False)

    def __str__(self):
        return self.name

    def set_password(self, raw_password):
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password)
    
    def generate_access_code(self):
        """Generate a unique access code for team joining"""
        return str(uuid.uuid4())[:8].upper()
        
    def add_member(self, user):
        """Add a user to the team"""
        if user.team:
            return False, "User already belongs to a team"
        if self.members.count() >= self.team_size:
            return False, "Team is already at maximum capacity"
        user.team = self
        user.save()
        return True, "Successfully added to team"

    def save(self, *args, **kwargs):
        self.name = self.name.lower()
        if not self.access_code:
            self.access_code = self.generate_access_code()
        super().save(*args, **kwargs)

class User(AbstractUser):
    username = models.CharField(max_length=100, unique=True)
    email = models.EmailField(unique=True)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, null=True, blank=True, related_name="members")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.email} - {self.team.name if self.team else 'No Team'}"

    def has_role(self, role_name):
        return self.groups.filter(name=role_name).exists()
    
    
    def join_team(self, access_code):
        """Join a team using access code"""
        if self.team:
            return False, "You are already in a team"
            
        try:
            team = Team.objects.get(access_code=access_code)
            # if team.members.count() >= team.team_size:
            #     return False, "Team is already at maximum capacity"
                
            self.team = team
            self.save()
            return True, f"Successfully joined team {team.name}"
        except Team.DoesNotExist:
            return False, "Invalid team access code"
    
    def leave_team(self):
        """Leave current team"""
        if not self.team:
            return False, "You are not in a team"
        
        # Handle team ownership transfer if user is the team owner
        if hasattr(self.team, 'team_owner') and self.team.team_owner == self:
            other_members = self.team.members.exclude(id=self.id)
            if other_members.exists():
                # Transfer ownership to another team member
                self.team.team_owner = other_members.first()
                self.team.save()
            else:
                # Delete team if no other members
                team_to_delete = self.team
                self.team = None
                self.save()
                team_to_delete.delete()
                return True, "You left the team and it was deleted (no members left)"
        
        self.team = None
        self.save()
        return True, "You have left the team"

class Challenge(models.Model):
    CATEGORY_CHOICES = [
        ('web', 'Web'),
        ('crypto', 'Cryptography'),
        ('pwn', 'Binary Exploitation'),
        ('reverse', 'Reverse Engineering'),
        ('forensics', 'Forensics'),
        ('misc', 'Miscellaneous'),
    ]

    title = models.CharField(
        max_length=200,
        unique=True
    )
    description = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    docker_image = models.CharField(max_length=200)
    flag = models.CharField(max_length=200)
    max_points = models.IntegerField(validators=[MinValueValidator(0)])
    max_team_size = models.IntegerField(default=3)
    max_attempts = models.IntegerField(default=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_hidden = models.BooleanField(default=False)
    hints = models.JSONField(default=list, blank=True, help_text="""
        List of hint objects with format:
        [
            {
                "content": "Hint text",
                "cost": "Percentage of max points (0-100)"
            }
        ]
    """)
    file_links = models.JSONField(default=list, blank=True)
    port = models.IntegerField(blank=True, null=True)
    ssh_user = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return self.title


class Container(models.Model):
    team = models.ForeignKey(
        Team, on_delete=models.CASCADE, related_name="containers")
    challenge = models.ForeignKey(
        Challenge, on_delete=models.CASCADE, related_name="containers")
    container_id = models.CharField(max_length=100, primary_key=True)
    ssh_host = models.CharField(max_length=200)
    ssh_port = models.IntegerField()
    ssh_user = models.CharField(max_length=100)
    ssh_password = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.team.name} - {self.challenge.title}"

class Submission(models.Model):
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="submissions")
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE, related_name="submissions")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submissions', default=1)
    flag_submitted = models.CharField(max_length=200, default="")
    is_correct = models.BooleanField(default=False)
    points_awarded = models.IntegerField(validators=[MinValueValidator(0)])
    attempt_number = models.IntegerField(default=1)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]
        unique_together = [['team', 'challenge', 'attempt_number']]

    def __str__(self):
        return f"{self.team.name} - {self.challenge.title}"

class HintPurchase(models.Model):
    team = models.ForeignKey(Team, on_delete=models.CASCADE)
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE)
    hint_index = models.IntegerField()
    hint_cost_percentage = models.IntegerField()
    points_deducted = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('team', 'challenge', 'hint_index')
