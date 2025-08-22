from django.urls import path
from .views import admin_views, auth_views, challenge_views, team_views, analytics_views
from .views.admin_views import AdminChallengeViewSet
from .views.challenge_views import ChallengeListView
from .views.analytics_views import (
    AnalyticsViewSet, TeamProgressView, ChallengeAnalyticsView,
    UserTeamProgressView, TeamMemberContributionsView
)
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'api/admin/challenges', AdminChallengeViewSet, basename='admin-challenges')
router.register(r'api/analytics', AnalyticsViewSet, basename='analytics')


urlpatterns = [
    # Auth routes
    path('auth/signup/', auth_views.register, name='register'),
    path('auth/login/', auth_views.signin, name='signin'),
    path('auth/refresh/', auth_views.token_refresh, name='token_refresh'),
    path('auth/forgot-password/', auth_views.request_password_reset, name='request_password_reset'),  
    path('auth/reset-password/', auth_views.reset_password, name='reset_password'),  
    
    # Challenge routes
    path('challenges/', ChallengeListView.as_view(), name='get_challenges'),
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
    path('api/admin/challenges/<int:challenge_id>/submissions/', admin_views.get_challenge_submissions, name='get_challenge_submissions'),
    path('api/admin/submissions/', admin_views.get_all_submissions, name='get_all_submissions'),
    path('api/admin/dashboard/stats/', admin_views.get_dashboard_stats, name='dashboard-stats'),
    path('api/admin/teams/<int:team_id>/delete/', admin_views.delete_team, name='delete-team'),
    path('api/admin/teams/<int:team_id>/update/', admin_views.update_team, name='update-team'),
    path('api/admin/containers/', admin_views.get_containers, name='get_containers'),
    path('api/admin/containers/<str:container_id>/stop/', admin_views.admin_stop_container, name='admin_stop_container'),
    path('api/admin/teams/<int:team_id>/', admin_views.get_team_profile_admin, name='get_team_profile_admin'),
    path('api/admin/teams/<int:team_id>/submissions/', admin_views.get_team_submissions_admin, name='get_team_submissions_admin'),

    # Analytics
    path('api/analytics/team-progress/', TeamProgressView.as_view(), name='team-progress'),
    path('api/analytics/user-team-progress/', UserTeamProgressView.as_view(), name='team-progress'),
    path('api/analytics/team-member-contributions/', TeamMemberContributionsView.as_view(), name='team-progress'),
    path('api/analytics/challenge-analytics/', ChallengeAnalyticsView.as_view(), name='challenge-analytics'),
]

urlpatterns += router.urls
