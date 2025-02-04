from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # Auth routes
    path('auth/signup', views.signup, name='signup'),
    path('auth/login', views.signin, name='signin'),
    path('auth/refresh', views.token_refresh, name='token_refresh'),
    path('auth/forgot-password', views.request_password_reset, name='request_password_reset'),  
    path('auth/reset-password', views.reset_password, name='reset_password'),  
    
    # Challenge routes
    path('challenges', views.get_challenges, name='get_challenges'),
    path('challenges/<int:challenge_id>', views.get_challenge_by_id, name='get_challenge_by_id'),
    path('challenges/<int:challenge_id>/submit', views.submit_flag, name='submit_flag'),
    path('challenges/<int:challenge_id>/startContainer', views.start_challenge, name='start_challenge'),

    # Team routes
    path('teams', views.get_teams, name='get_teams'),
    path('teams/profile', views.team_profile, name='team_profile'),
    path('teams/<int:team_id>/score', views.get_team_score, name='get_team_score'),
    path('teams/<int:team_id>/submissions', views.get_submission_history, name='get_team_submissions'),
    # path('teams/create', views.create_team, name='create_team'),
    # path('teams/<int:team_id>', views.update_delete_team, name='update_delete_team'),
    # path('teams/bulk-delete', views.bulk_delete_teams, name='bulk_delete_teams'),
    # path('teams/bulk-update', views.bulk_update_teams, name='bulk_update_teams'),

    # Container routes
    # path('admin/containers', views.get_containers, name='get_containers'),  
    # path('admin/containers/<str:container_id>/stop', views.stop_container, name='stop_container'),  
    # path('admin/containers/<str:container_id>/start', views.start_container, name='start_container'),  
    # path('admin/containers/<str:container_id>', views.delete_container, name='delete_container'), 

    # Scoreboard route
    path('scoreboard', views.get_scoreboard, name='get_scoreboard'),

    # Admin routes
    path('auth/admin/login', views.admin_login, name='admin_login'),
    path('api/admin/challenges', views.admin_get_challenges, name='admin_get_challenges'),
    path('api/admin/challenges/create', views.create_challenge, name='create_challenge'),
    path('api/admin/challenges/<int:challenge_id>/update', views.update_challenge, name='update_challenge'),
    path('api/admin/challenges/<int:challenge_id>/delete', views.delete_challenge, name='delete_challenge'),
    path('api/admin/challenges/<int:challenge_id>', views.get_challenge_detail, name='get_admin_challenge_detail'),
    path('api/admin/challenges/<int:challenge_id>/submissions', views.get_challenge_submissions, name='get_challenge_submissions'),
    path('api/admin/submissions', views.get_all_submissions, name='get_all_submissions'),
    # path('api/admin/dashboard/stats', views.get_dashboard_stats, name='get_dashboard_stats'), 
]