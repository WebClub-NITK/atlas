# backend/atlas_backend/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Auth routes
    path('auth/register', views.signup, name='signup'),
    path('auth/login', views.signin, name='signin'),
    path('auth/forgot-password', views.request_password_reset, name='request_password_reset'),
    path('auth/reset-password', views.reset_password, name='reset_password'),
    
    # Challenge routes
    path('challenges', views.get_challenges, name='get_challenges'),
    path('challenges/<int:challenge_id>/submit', views.submit_flag, name='submit_flag'),
    path('challenges/<int:challenge_id>/start', views.start_challenge, name='start_challenge'),
    
    # Team routes
    path('teams', views.get_teams, name='get_teams'),
    path('teams/create', views.create_team, name='create_team'),
    path('teams/join', views.join_team, name='join_team'),
    path('teams/leave', views.leave_team, name='leave_team'),
    
    # Scoreboard route
    path('scoreboard', views.get_scoreboard, name='get_scoreboard'),
    
    # User routes
    path('user/update-info', views.update_user_info, name='update_user_info'),
    path('user/profile', views.get_user_profile, name='get_user_profile'),
    path('user/team/history', views.get_team_history, name='get_team_history'),
]
