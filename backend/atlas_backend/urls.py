from django.urls import path
from . import views


urlpatterns = [
    path('auth/register', views.signup, name='signup'),
    path('auth/login', views.signin, name='signin'),
    path('auth/forgot-password', views.request_password_reset, name='request_password_reset'),
    path('auth/reset-password', views.reset_password, name='reset_password'),
    path('challenges', views.get_challenges, name='get_challenges'),
    path('challenges/<int:challenge_id>/submit', views.submit_flag, name='submit_flag'),
    path('create_challenge', views.create_challenge, name='create_challenge'),

]