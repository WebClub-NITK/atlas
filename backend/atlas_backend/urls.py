from django.urls import path
from .views import admin_views, auth_views, challenge_views, team_views, analytics_views
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # Auth routes
    path('auth/signup/', auth_views.register, name='register'),
    path('auth/login/', auth_views.signin, name='signin'),
    path('auth/refresh/', auth_views.token_refresh, name='token_refresh'),
    path('auth/forgot-password/', auth_views.request_password_reset, name='request_password_reset'),  
    path('auth/reset-password/', auth_views.reset_password, name='reset_password'),  
    
    # Challenge routes
    path('challenges/', challenge_views.get_challenges, name='get_challenges'),
    path('challenges/<int:challenge_id>/', challenge_views.get_challenge_by_id, name='get_challenge_by_id'),
    path('challenges/<int:challenge_id>/submit/', challenge_views.submit_flag, name='submit_flag'),
    path('challenges/<int:challenge_id>/start/', challenge_views.start_challenge, name='start_challenge'),
    path('challenges/<int:challenge_id>/stop/', challenge_views.stop_challenge, name='stop_challenge'),
    path('challenges/<int:challenge_id>/purchase-hint/', challenge_views.purchase_hint, name='purchase-hint'),

    # Team routes
    path('teams/', team_views.get_teams, name='get_teams'),
    path('teams/profile/', team_views.team_profile, name='team_profile'),
    path('teams/<int:team_id>/score/', team_views.get_team_score, name='get_team_score'),
    path('teams/submissions/', team_views.get_submission_history, name='get_submission_history'),
    path('teams/create/', team_views.create_team_api, name='create_team'),
    path('teams/join/', team_views.join_team_api, name='join_team'),
    path('teams/leave/', team_views.leave_team_api, name='leave_team'),
    path('teams/status/', team_views.team_status_api, name='team_status'),
    path('teams/update/', team_views.update_team_api, name='update_team_api'),

    # Scoreboard route
    path('scoreboard/', analytics_views.get_scoreboard, name='get_scoreboard'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),


    # Admin routes
    path('auth/admin/login/', admin_views.admin_login, name='admin_login'),
    path('api/admin/challenges/', admin_views.admin_get_challenges, name='admin_get_challenges'),
    path('api/admin/challenges/create/', admin_views.create_challenge, name='create_challenge'),
    path('api/admin/challenges/<int:challenge_id>/update/', admin_views.update_challenge, name='update_challenge'),
    path('api/admin/challenges/<int:challenge_id>/delete/', admin_views.delete_challenge, name='delete_challenge'),
    path('api/admin/challenges/<int:challenge_id>/', admin_views.get_challenge_detail, name='get_challenge_detail'),
    path('api/admin/challenges/<int:challenge_id>/submissions/', admin_views.get_challenge_submissions, name='get_challenge_submissions'),
    path('api/admin/submissions/', admin_views.get_all_submissions, name='get_all_submissions'),
    path('api/admin/dashboard/stats/', admin_views.get_dashboard_stats, name='dashboard-stats'),
    path('api/admin/teams/<int:team_id>/delete/', admin_views.delete_team, name='delete-team'),
    path('api/admin/teams/<int:team_id>/update/', admin_views.update_team, name='update-team'),
    path('api/admin/containers/', admin_views.get_containers, name='get_containers'),
    path('api/admin/containers/<str:container_id>/stop/', admin_views.admin_stop_container, name='admin_stop_container'),
    path('api/admin/teams/<int:team_id>/', admin_views.get_team_profile_admin, name='get_team_profile_admin'),
    path('api/admin/teams/<int:team_id>/submissions/', admin_views.get_team_submissions_admin, name='get_team_submissions_admin'),
]