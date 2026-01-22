from django.urls import path
from .views.auth_views import (
    RegisterAPIView, SignInAPIView, TokenRefreshAPIView, ResetPasswordAPIView, RequestPasswordResetAPIView
)
from .views.challenge_views import (
    ChallengeDetailAPIView, StartChallengeAPIView, StopChallengeAPIView, SubmitFlagAPIView,
    PurchaseHintAPIView, ChallengeListView
)
from .views.team_views import (
    CreateTeamAPIView, LeaveTeamAPIView, JoinTeamAPIView, TeamProfileAPIView,
    TeamsListAPIView, TeamScoreAPIView, SubmissionHistoryAPIView, UpdateTeamAPIView, TeamStatusAPIView
)
from .views.admin_views import (
    AdminLoginAPIView, AdminChallengeViewSet, AdminStopContainerAPIView, TeamProfileAdminAPIView,
    TeamSubmissionsAdminAPIView, DashboardStatsAPIView, DeleteTeamAPIView, AdminUpdateTeamAPIView,
    ContainersListAPIView, AllSubmissionsAPIView, ChallengeSubmissionsAPIView

)
from .views.analytics_views import (
    AnalyticsViewSet, TeamProgressView, ChallengeAnalyticsView,
    UserTeamProgressView, TeamMemberContributionsView, ScoreboardAPIView
)
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'api/admin/challenges', AdminChallengeViewSet, basename='admin-challenges')
router.register(r'api/analytics', AnalyticsViewSet, basename='analytics')


urlpatterns = [
    # Auth routes
    path('auth/signup/', RegisterAPIView.as_view(), name='register'),
    path('auth/login/', SignInAPIView.as_view(), name='signin'),
    path('auth/refresh/', TokenRefreshAPIView.as_view(), name='token_refresh'),
    path('auth/forgot-password/', RequestPasswordResetAPIView.as_view(), name='request_password_reset'),  
    path('auth/reset-password/', ResetPasswordAPIView.as_view(), name='reset_password'),  
    
    # Challenge routes
    path('challenges/', ChallengeListView.as_view(), name='get_challenges'),
    path('challenges/<int:challenge_id>/', ChallengeDetailAPIView.as_view(), name='get_challenge_by_id'),
    path('challenges/<int:challenge_id>/submit/', SubmitFlagAPIView.as_view(), name='submit_flag'),
    path('challenges/<int:challenge_id>/start/', StartChallengeAPIView.as_view(), name='start_challenge'),
    path('challenges/<int:challenge_id>/stop/', StopChallengeAPIView.as_view(), name='stop_challenge'),
    path('challenges/<int:challenge_id>/purchase-hint/', PurchaseHintAPIView.as_view(), name='purchase-hint'),

    # Team routes
    path('teams/', TeamsListAPIView.as_view(), name='get_teams'),
    path('teams/profile/', TeamProfileAPIView.as_view(), name='team_profile'),
    path('teams/<int:team_id>/score/', TeamScoreAPIView.as_view(), name='get_team_score'),
    path('teams/submissions/', SubmissionHistoryAPIView.as_view(), name='get_submission_history'),
    path('teams/create/', CreateTeamAPIView.as_view(), name='create_team'),
    path('teams/join/', JoinTeamAPIView.as_view(), name='join_team'),
    path('teams/leave/', LeaveTeamAPIView.as_view(), name='leave_team'),
    path('teams/status/', TeamStatusAPIView.as_view(), name='team_status'),
    path('teams/update/', UpdateTeamAPIView.as_view(), name='update_team_api'),

    # Scoreboard route
    path('scoreboard/', ScoreboardAPIView.as_view(), name='get_scoreboard'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),


    # Admin routes
    path('auth/admin/login/', AdminLoginAPIView.as_view(), name='admin_login'),
    path('api/admin/challenges/<int:challenge_id>/submissions/', ChallengeSubmissionsAPIView.as_view(), name='get_challenge_submissions'),
    path('api/admin/submissions/', AllSubmissionsAPIView.as_view(), name='get_all_submissions'),
    path('api/admin/dashboard/stats/', DashboardStatsAPIView.as_view(), name='dashboard-stats'),
    path('api/admin/teams/<int:team_id>/delete/', DeleteTeamAPIView.as_view(), name='delete-team'),
    path('api/admin/teams/<int:team_id>/update/', AdminUpdateTeamAPIView.as_view(), name='update-team'),
    path('api/admin/containers/', ContainersListAPIView.as_view(), name='get_containers'),
    path('api/admin/containers/<str:container_id>/stop/', AdminStopContainerAPIView.as_view(), name='admin_stop_container'),
    path('api/admin/teams/<int:team_id>/', TeamProfileAdminAPIView.as_view(), name='get_team_profile_admin'),
    path('api/admin/teams/<int:team_id>/submissions/', TeamSubmissionsAdminAPIView.as_view(), name='get_team_submissions_admin'),

    # Analytics
    path('api/analytics/team-progress/', TeamProgressView.as_view(), name='team-progress'),
    path('api/analytics/user-team-progress/', UserTeamProgressView.as_view(), name='team-progress'),
    path('api/analytics/team-member-contributions/', TeamMemberContributionsView.as_view(), name='team-progress'),
    path('api/analytics/challenge-analytics/', ChallengeAnalyticsView.as_view(), name='challenge-analytics'),
]

urlpatterns += router.urls
