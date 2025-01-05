from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator

from django.contrib.auth.models import Group
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator
from django.contrib.auth.models import BaseUserManager

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get('is_superuser') is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)

    def get_by_natural_key(self, email):
        """
        Enable authentication with email instead of username
        """
        return self.get(email=email)


class Team(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    team_size = models.IntegerField(default=1)
    challenge = models.ForeignKey('Challenge', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name  

class User(AbstractUser):
    email = models.EmailField(unique=True)
    role = models.ForeignKey(Group, on_delete=models.SET_NULL, null=True)
    team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    groups = models.ManyToManyField(
        'auth.Group',
        related_name='atlas_users',
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='atlas_users',
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email

class Challenge(models.Model):
    CATEGORY_CHOICES = [
        ('web', 'Web'),
        ('crypto', 'Cryptography'),
        ('pwn', 'Binary Exploitation'),
        ('reverse', 'Reverse Engineering'),
        ('forensics', 'Forensics'),
        ('misc', 'Miscellaneous'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    docker_image = models.CharField(max_length=200)
    flag = models.CharField(max_length=200)
    max_points = models.IntegerField(validators=[MinValueValidator(0)])
    max_team_size = models.IntegerField(default=4)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    flag_answer = models.CharField(max_length=200,default='')

    def __str__(self):
        return self.title

class Container(models.Model):
    STATUS_CHOICES = [
        ('running', 'Running'),
        ('exited', 'Exit'),
        ('error', 'Error'),
    ]

    team = models.ForeignKey(Team, on_delete=models.CASCADE)
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE)
    container_id = models.CharField(max_length=100)
    ssh_host = models.CharField(max_length=200)
    ssh_port = models.IntegerField()
    ssh_user = models.CharField(max_length=100)
    ssh_key = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='stopped')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.team.name} - {self.challenge.title}"

class Submission(models.Model):
    team = models.ForeignKey(Team, on_delete=models.CASCADE)
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE)
    points_awarded = models.IntegerField(validators=[MinValueValidator(0)])
    timestamp = models.DateTimeField(auto_now_add=True)
    flag_submitted = models.CharField(max_length=200,default='')
    is_correct = models.BooleanField(default=False)
    attempt_number = models.IntegerField(default=1)

    def __str__(self):
        return f"{self.team.name} - {self.challenge.title}"

    class Meta:
        ordering = ['-timestamp']
