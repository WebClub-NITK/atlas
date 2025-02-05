# backend/atlas_backend/urls.py
from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # Auth routes
    path('auth/signup', views.signup, name='signup'),
    path('auth/login', views.signin, name='signin'),
    path('auth/refresh', views.token_refresh, name='token_refresh'),
    
    # Challenge routes
    path('challenges', views.get_challenges, name='get_challenges'),
    path('challenges/<int:challenge_id>',views.get_challenge_by_id, name='get_challenge_by_id'),
    path('challenges/<int:challenge_id>/submit', views.submit_flag, name='submit_flag'),
    path('challenges/<int:challenge_id>/start', views.start_challenge, name='start_challenge'),
    path('challenges/<int:challenge_id>/stop', views.stop_challenge, name='stop_challenge'),
    
    # Team routes
    path('teams', views.get_teams, name='get_teams'),
    path('teams/profile', views.team_profile, name='team_profile'), # through the access token only
    path('teams/<int:team_id>/score', views.get_team_score, name='get_team_score'),
    path('teams/<int:team_id>/submissions', views.get_submission_history, name='get_submission_history'),

    # Scoreboard route
    path('scoreboard', views.get_scoreboard, name='get_scoreboard'),
    # path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Admin routes
    path('auth/admin/login', views.admin_login, name='admin_login'),
    path('api/admin/challenges', views.admin_get_challenges, name='admin_get_challenges'),
    path('api/admin/challenges/create', views.create_challenge, name='create_challenge'),
    path('api/admin/challenges/<int:challenge_id>/update', views.update_challenge, name='update_challenge'),
    path('api/admin/challenges/<int:challenge_id>/delete', views.delete_challenge, name='delete_challenge'),
    path('api/admin/challenges/<int:challenge_id>', views.get_challenge_detail, name='get_challenge_by_id'),
    path('api/admin/challenges/<int:challenge_id>/submissions', views.get_challenge_submissions, name='get_challenge_submissions'),
    path('api/admin/submissions', views.get_all_submissions, name='get_all_submissions'),
    path('api/admin/containers', views.get_containers, name='get_containers'),
    path('api/admin/container/<str:container_id>/stop', views.admin_stop_container, name='admin_stop_container'),
]