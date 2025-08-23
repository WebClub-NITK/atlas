from django.shortcuts import get_object_or_404
from django.db.models import Count, Q
from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from ..models import Submission, Team, validate_team_name
from rest_framework.views import APIView
import logging

logger = logging.getLogger('atlas_backend')


class TeamAuthMixin:
    """Mixin for common team authentication and permissions"""
    permission_classes = [IsAuthenticated]
    
    def get_user_team(self):
        """Get the current user's team"""
        return self.request.user.team
    
    def require_team_membership(self):
        """Ensure user is in a team"""
        if not self.get_user_team():
            return Response(
                {'error': 'You are not in a team'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return None
    
    def generate_token_with_team_info(self, user, team=None):
        """Generate JWT token with team information"""
        refresh = RefreshToken.for_user(user)
        refresh['user_id'] = user.id
        refresh['username'] = user.username
        refresh['email'] = user.email
        
        if team:
            refresh['team_id'] = team.id
            refresh['team_name'] = team.name
            refresh['team_email'] = team.team_email
            refresh['is_team_owner'] = team.team_owner_id == user.id
            refresh['member_count'] = team.members.count()
            refresh['team_access_code'] = team.access_code
        
        return refresh


class CreateTeamAPIView(TeamAuthMixin, APIView):
    """API endpoint to create a new team"""
    
    def post(self, request):
        try:
            # Get and validate team data
            team_name = request.data.get('name')
            team_email = request.data.get('email')
            team_password = request.data.get('password')
            
            if not team_name:
                return Response(
                    {'error': 'Team name is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate team name
            try:
                validate_team_name(team_name)
            except ValidationError as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Check if team name already exists
            if Team.objects.filter(name__iexact=team_name).exists():
                return Response(
                    {'error': 'Team name already exists'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Create the team with proper owner field
            team = Team.objects.create(
                name=team_name,
                team_email=team_email if team_email else '',
                team_owner=request.user  # Use team_owner field from model
            )
            
            # Set team password if provided
            if team_password:
                team.set_password(team_password)
                team.save()
            
            # Add user to the team
            user = request.user
            user.team = team
            user.save()
            
            # Generate new token with team information
            refresh = self.generate_token_with_team_info(user, team)
            refresh['is_team_owner'] = True  # User is definitely the owner as they created it
            refresh['member_count'] = 1  # Initially only the creator
            
            # Return success response with access code and updated tokens
            return Response({
                'team': {
                    'id': team.id,
                    'name': team.name,
                    'access_code': team.access_code,
                    'member_count': 1
                },
                'refresh': str(refresh),
                'access': str(refresh.access_token)
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Team creation failed: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )


class JoinTeamAPIView(TeamAuthMixin, APIView):
    """API endpoint to join a team using access code"""
    
    def post(self, request):
        user = request.user
        
        if user.team:
            return Response(
                {'error': 'You are already in a team'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        access_code = request.data.get('access_code')
        
        if not access_code:
            return Response(
                {'error': 'Access code is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            team = Team.objects.get(access_code=access_code)
            
            # Check if team is banned
            if team.is_banned:
                return Response(
                    {'error': 'This team has been banned'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Add user to team
            user.team = team
            user.save()
            
            # Generate new token with team information
            refresh = self.generate_token_with_team_info(user, team)
            
            return Response({
                'team': {
                    'id': team.id,
                    'name': team.name,
                    'access_code': team.access_code,
                    'member_count': team.members.count()
                },
                'refresh': str(refresh),
                'access': str(refresh.access_token)
            })
            
        except Team.DoesNotExist:
            return Response(
                {'error': 'Invalid team access code'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to join team: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LeaveTeamAPIView(TeamAuthMixin, APIView):
    """API endpoint to leave current team"""
    
    def post(self, request):
        user = request.user
        
        if not user.team:
            return Response(
                {'error': 'You are not in a team'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            success, message = user.leave_team()
            
            if success:
                # Create a new token without team information
                refresh = self.generate_token_with_team_info(user)
                
                return Response({
                    'message': message,
                    'refresh': str(refresh),
                    'access': str(refresh.access_token)
                })
            else:
                return Response(
                    {'error': message},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            return Response(
                {'error': f'Failed to leave team: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TeamStatusAPIView(TeamAuthMixin, APIView):
    """Check if user has a team and get team details"""
    
    def get(self, request):
        user = request.user
        
        if not user.team:
            return Response({
                'has_team': False,
                'message': 'You are not in a team. Please create or join a team.'
            })
        
        team = user.team
        team_members = team.members.all()
        
        return Response({
            'has_team': True,
            'team': {
                'id': team.id,
                'name': team.name,
                'team_email': team.team_email,
                'access_code': team.access_code,
                'is_owner': team.team_owner_id == user.id,
                'total_score': team.team_score,
                'current_members': team_members.count(),
                'members': [{
                    'id': member.id,
                    'username': member.username,
                    'email': member.email,
                    'is_owner': team.team_owner_id == member.id
                } for member in team_members]
            }
        })


class UpdateTeamAPIView(TeamAuthMixin, APIView):
    """API endpoint to update team information"""
    
    def post(self, request):
        user = request.user
        
        error_response = self.require_team_membership()
        if error_response:
            return error_response
        
        team = user.team
        data = request.data
        
        # Update fields if provided
        if 'name' in data and data['name']:
            # Check if new name is available
            if Team.objects.filter(name__iexact=data['name']).exclude(id=team.id).exists():
                return Response(
                    {'error': 'Team name already exists'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            team.name = data['name']
        
        try:
            team.save()
            return Response({
                'message': 'Team information updated successfully',
                'team': {
                    'id': team.id,
                    'name': team.name,
                    'team_email': team.team_email,
                    'access_code': team.access_code,
                    'is_owner': team.team_owner_id == user.id,
                    'total_score': team.team_score,
                    'current_members': team.members.count()
                }
            })
        except Exception as e:
            return Response(
                {'error': f'Failed to update team: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TeamsListAPIView(APIView):
    """Get list of teams with scores and stats"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Only show non-hidden teams for regular users
        teams = Team.objects.filter(is_hidden=False).annotate(
            member_count=Count('members', distinct=True),
            solved_count=Count('submissions', filter=Q(
                submissions__is_correct=True), distinct=True)
        ).order_by('-team_score', 'created_at')

        if request.user.is_superuser:
            teams = Team.objects.annotate(
                member_count=Count('members', distinct=True),
                solved_count=Count('submissions', filter=Q(
                    submissions__is_correct=True), distinct=True)
            ).order_by('-team_score', 'created_at')
            
        response_data = [{
            'id': team.id,
            'name': team.name,
            'email': team.team_email,
            'member_count': team.member_count,
            'total_score': team.team_score,
            'solved_count': team.solved_count,
            'is_banned': team.is_banned,  
            'is_hidden': team.is_hidden  
        } for team in teams]

        return Response(response_data)


class TeamScoreAPIView(TeamAuthMixin, APIView):
    """Get team score for specific team or current user's team"""
    
    def get(self, request, team_id=None):
        try:
            if not request.user.team:
                return Response({
                    'error': 'You must be in a team to get your score',
                    'status': status.HTTP_403_FORBIDDEN
                })
                
            # Determine which team to get score for
            if team_id:
                team = get_object_or_404(Team, id=team_id)
            else:
                team = request.user.team
                if not team:
                    return Response(
                        {'error': 'User not associated with any team'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            total_score = team.team_score
            solved_challenges = team.challenges.count()

            return Response({
                'team_name': team.name,
                'total_score': team.team_score,
                'solved_challenges': solved_challenges
            })

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SubmissionHistoryAPIView(TeamAuthMixin, APIView):
    """Get submission history for a team"""
    
    def get(self, request):
        try:
            # Determine which team's history to get
            team = request.user.team
            if not team:
                return Response(
                    {'error': 'User not associated with any team'},
                    status=status.HTTP_403_FORBIDDEN
                )

            submissions = Submission.objects.filter(team=team).order_by(
                'challenge', '-timestamp'
            )

            history = {}
            for submission in submissions:
                challenge_id = submission.challenge.id
                if challenge_id not in history:
                    history[challenge_id] = {
                        'challenge_name': submission.challenge.title,
                        'category': submission.challenge.category,
                        'max_points': submission.challenge.max_points,
                        'points_awarded': submission.points_awarded,
                        'attempts': [],
                        'is_solved': False,
                        'attempts_used': 0
                    }

                history[challenge_id]['attempts'].append({
                    'timestamp': submission.timestamp,
                    'submitted_by': submission.user.email,
                    'is_correct': submission.is_correct,
                    'points_awarded': submission.points_awarded,
                    'attempt_number': submission.attempt_number
                })

                history[challenge_id]['attempts_used'] += 1
                if submission.is_correct:
                    history[challenge_id]['is_solved'] = True

            return Response(history)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TeamProfileAPIView(TeamAuthMixin, APIView):
    """Get current user's team profile"""
    
    def get(self, request):
        try:
            user = request.user
            
            # Check if user has a team
            if not user.team:
                return Response(
                    {'error': 'You must be in a team to view team profile', 'has_team': False},
                    status=status.HTTP_403_FORBIDDEN
                )
                
            team = user.team
            members = team.members.all()
            
            # Format response with correct field names
            response = {
                'id': team.id,
                'name': team.name,
                'team_email': team.team_email,
                'access_code': team.access_code,
                'total_score': team.team_score,
                'team_owner': {
                    'id': team.team_owner.id,
                    'username': team.team_owner.username,
                    'email': team.team_owner.email
                } if team.team_owner else None,
                'is_owner': team.team_owner_id == user.id,
                'members': [{
                    'id': member.id,
                    'username': member.username,
                    'email': member.email,
                    'is_owner': team.team_owner_id == member.id
                } for member in members]
            }
            
            return Response(response)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to retrieve team profile: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
