from django.urls import path
from . import views

urlpatterns = [
    path('auth/register', views.signup, name='signup'),
    path('auth/login', views.signin, name='signin'),
    path('auth/forgot-password', views.request_password_reset, name='request_password_reset'),
    path('auth/reset-password', views.reset_password, name='reset_password'),
    path('challenges', views.get_challenges, name='get_challenges'),
    path('challenges/<int:challenge_id>', views.get_challenge_by_id, name='get_challenge_by_id'),
    path('challenges/<int:challenge_id>/submit', views.submit_flag, name='submit_flag'),
    path('challenges/<int:challenge_id>/start', views.start_challenge, name='start_challenge'),
    path('challenges/create', views.create_challenge, name='create_challenge'),
    path('challenges/<int:challenge_id>/update', views.update_challenge, name='update_challenge'),
    path('challenges/<int:challenge_id>/delete', views.delete_challenge, name='delete_challenge'),
    path('teams', views.get_teams, name='get_teams'),
    path('teams/join', views.join_team, name='join_team'),
    path('teams/create', views.create_team, name='create_team'),
    path('teams/leave', views.leave_team, name='leave_team'),
    path('scoreboard', views.get_scoreboard, name='get_scoreboard'),
]