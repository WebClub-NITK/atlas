from django.urls import path, include
from .view import auth_views, challenges_views, admin_views
from . import views
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # Auth routes
    path('auth/signup', auth_views.Register.as_view(), name='register'),
    path('auth/login', auth_views.SignIn.as_view(), name='signin'),
    path('auth/refresh', auth_views.TokenRefresh.as_view(), name='token_refresh_custom'),
    path('auth/forgot-password', auth_views.RequestPasswordReset.as_view(), name='request_password_reset'),  
    path('auth/reset-password', auth_views.ResetPassword.as_view(), name='reset_password'),  
    path('auth/admin/login', auth_views.AdminLogin.as_view(), name='admin_login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Challenge routes
    path('challenges', challenges_views.ChallengeListView.as_view(), name='get_challenges'),
    path('challenges/<int:challenge_id>', challenges_views.ChallengeDetailView.as_view(), name='get_challenge_by_id'),
    path('challenges/<int:challenge_id>/submit', challenges_views.SubmitFlagView.as_view(), name='submit_flag'),
    path('challenges/<int:challenge_id>/start', challenges_views.StartChallengeView.as_view(), name='start_challenge'),
    path('challenges/<int:challenge_id>/stop', challenges_views.StopChallengeView.as_view(), name='stop_challenge'),
    path('challenges/<int:challenge_id>/purchase-hint', challenges_views.PurchaseHintView.as_view(), name='purchase-hint'),
    path('challenges/<int:challenge_id>/submissions', challenges_views.ChallengeSubmissionHistoryView.as_view(), name='get_challenge_submission_history'),

    # Team routes
    path('teams', challenges_views.TeamListView.as_view(), name='get_teams'),
    path('teams/profile', auth_views.TeamProfile.as_view(), name='team_profile'),
    path('teams/score', challenges_views.TeamScoreView.as_view(), name='get_my_team_score'),
    path('teams/<int:team_id>/score', challenges_views.TeamScoreView.as_view(), name='get_team_score'),
    path('teams/performance', challenges_views.TeamPerformanceView.as_view(), name='team_performance'),
    path('teams/submissions', challenges_views.SubmissionHistoryView.as_view(), name='get_submission_history'),
    path('teams/contributions', challenges_views.TeamContributionsView.as_view(), name='team_contributions'),
    path('teams/create', auth_views.CreateTeam.as_view(), name='create_team'),
    path('teams/join', auth_views.JoinTeam.as_view(), name='join_team'),
    path('teams/leave', auth_views.LeaveTeam.as_view(), name='leave_team'),
    path('teams/status', auth_views.TeamStatus.as_view(), name='team_status'),
    path('teams/update', auth_views.UpdateTeam.as_view(), name='update_team_api'),

    # Scoreboard route
    path('scoreboard', challenges_views.ScoreboardView.as_view(), name='get_scoreboard'),
    path('scoreboard/graph', challenges_views.ScoreboardGraphView.as_view(), name='get_scoreboard_graph'),

    # Theme route
    path('api/theme/', views.theme_config_view, name='theme_config'),

    # Admin routes
    path('api/admin/challenges', admin_views.AdminChallengeListView.as_view(), name='admin_get_challenges'),
    path('api/admin/challenges/create', admin_views.ChallengeCreateView.as_view(), name='create_challenge'),
    path('api/admin/challenges/<int:challenge_id>', admin_views.ChallengeDetailView.as_view(), name='admin_challenge_detail'),
    path('api/admin/challenges/<int:challenge_id>/submissions', admin_views.ChallengeSubmissionsView.as_view(), name='get_challenge_submissions'),
    path('api/admin/submissions', admin_views.ChallengeSubmissionsView.as_view(), name='get_all_submissions'),
    path('api/admin/dashboard/stats', admin_views.DashboardStatsView.as_view(), name='dashboard-stats'),
    path('api/admin/teams/<int:team_id>/', admin_views.TeamDetailView.as_view(), name='admin_team_detail'),
    path('api/admin/teams/<int:team_id>/submissions', admin_views.TeamSubmissionsAdminView.as_view(), name='get_team_submissions_admin'),
    path('api/admin/teams/<int:team_id>/performance', challenges_views.TeamPerformanceView.as_view(), name='admin_team_performance'),
    path('api/admin/containers', admin_views.ContainerListView.as_view(), name='get_containers'),
    path('api/admin/containers/<str:container_id>/stop', admin_views.AdminContainerDetailView.as_view(), name='admin_stop_container'),
]