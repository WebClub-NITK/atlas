from django.db.models import Count, Q, Avg, Sum
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from ..models import Submission, Challenge, Team, User
from django.db.models.functions import TruncDate, TruncHour
from datetime import timedelta
from ..serializers import (
    TeamProgressSerializer, ChallengeSolveRateSerializer, 
    SubmissionTimelineSerializer, UserContributionSerializer,
    CategoryAnalyticsSerializer, TimeBasedAnalyticsSerializer
)
import logging

logger = logging.getLogger(__name__)


class ScoreboardAPIView(APIView):
    """Get scoreboard data"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Check if user has a team
            if not request.user.team:
                return Response(
                    {'error': 'You must be in a team to view the scoreboard'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            teams = Team.objects.annotate(
                member_count=Count('members', distinct=True),
                solved_count=Count('submissions', filter=Q(
                    submissions__is_correct=True))
            ).order_by('-team_score')  # Use team_score field directly

            scoreboard_data = []
            for rank, team in enumerate(teams, 1):
                team_data = {
                    'rank': rank,
                    'team_id': team.id,
                    'team_name': team.name,
                    'total_score': team.team_score, 
                    'member_count': team.member_count,
                    'solved_challenges': team.solved_count,
                    'last_solve': team.submissions.filter(
                        is_correct=True
                    ).order_by('-timestamp').first().timestamp if team.solved_count > 0 else None
                }
                scoreboard_data.append(team_data)

            return Response(scoreboard_data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AnalyticsViewSet(viewsets.ViewSet):
    """
    Analytics ViewSet providing various analytics endpoints
    """
    
    @action(detail=False, methods=['get'])
    def team_progress(self, request):
        """Get team progress analytics"""
        teams = Team.objects.annotate(
            solved_challenges=Count(
                'submissions', 
                filter=Q(submissions__is_correct=True),
                distinct=True
            ),
            total_points=Sum(
                'submissions__points_awarded',
                filter=Q(submissions__is_correct=True)
            ),
            member_count=Count('members', distinct=True)
        ).order_by('-total_points')
        
        serializer = TeamProgressSerializer(teams, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def challenge_solve_rates(self, request):
        """Get challenge solve rate analytics"""
        total_teams = Team.objects.count()
        
        if total_teams == 0:
            return Response([])
        
        challenges = Challenge.objects.annotate(
            solve_count=Count(
                'submissions',
                filter=Q(submissions__is_correct=True),
                distinct=True
            ),
            total_attempts=Count('submissions'),
            avg_attempts=Avg('submissions__attempt_number')
        ).annotate(
            solve_rate=Count(
                'submissions',
                filter=Q(submissions__is_correct=True),
                distinct=True
            ) * 100.0 / total_teams if total_teams > 0 else 0
        ).order_by('-solve_rate')
        
        serializer = ChallengeSolveRateSerializer(challenges, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def submission_timeline(self, request):
        """Get submission timeline"""

        # TODO: Filter over the duration of CTF
        
        submissions = Submission.objects.select_related('team', 'challenge', 'user').order_by('-timestamp')
        serializer = SubmissionTimelineSerializer(submissions, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def user_contributions(self, request):
        """Get individual user contribution analytics"""
        users = User.objects.annotate(
            submission_count=Count('submissions'),
            correct_submissions=Count(
                'submissions',
                filter=Q(submissions__is_correct=True)
            ),
            total_points=Sum(
                'submissions__points_awarded',
                filter=Q(submissions__is_correct=True)
            )
        ).filter(submission_count__gt=0).order_by('-total_points')
        
        serializer = UserContributionSerializer(users, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def category_analytics(self, request):
        """Get analytics by challenge category"""
        categories = Challenge.objects.values('category').annotate(
            challenge_count=Count('id'),
            total_submissions=Count('submissions'),
            solved_count=Count(
                'submissions',
                filter=Q(submissions__is_correct=True),
                distinct=True
            ),
            avg_difficulty=Avg('difficulty')
        ).order_by('category')
        
        serializer = CategoryAnalyticsSerializer(categories, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def time_based_analytics(self, request):
        """Get time-based submission analytics"""
        # TODO: Return submissions over the duration of the ctf and other data only sending date as of now
        daily_stats = Submission.objects.annotate(
            date=TruncDate('timestamp')
        ).values('date').annotate(
            submissions=Count('id'),
            correct_submissions=Count('id', filter=Q(is_correct=True)),
            unique_teams=Count('team', distinct=True),
            unique_users=Count('user', distinct=True)
        ).order_by('date')
        
        serializer = TimeBasedAnalyticsSerializer(daily_stats, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def dashboard_summary(self, request):
        """Get overall dashboard summary statistics"""
        total_teams = Team.objects.count()
        total_users = User.objects.count()
        total_challenges = Challenge.objects.count()
        total_submissions = Submission.objects.count()
        correct_submissions = Submission.objects.filter(is_correct=True).count()
        
        # Recent activity (last 24 hours)
        recent_cutoff = timezone.now() - timedelta(hours=24)
        recent_submissions = Submission.objects.filter(timestamp__gte=recent_cutoff).count()
        recent_teams_active = Submission.objects.filter(
            timestamp__gte=recent_cutoff
        ).values('team').distinct().count()
        
        # Top performing team
        top_team = Team.objects.annotate(
            total_points=Sum('submissions__points_awarded', filter=Q(submissions__is_correct=True))
        ).order_by('-total_points').first()
        
        # Challenge difficulty distribution
        difficulty_distribution = Challenge.objects.values('difficulty').annotate(
            count=Count('id')
        ).order_by('difficulty')
        
        return Response({
            'totals': {
                'teams': total_teams,
                'users': total_users,
                'challenges': total_challenges,
                'submissions': total_submissions,
                'correct_submissions': correct_submissions,
                'success_rate': (correct_submissions / total_submissions * 100) if total_submissions > 0 else 0
            },
            'recent_activity': {
                'submissions_24h': recent_submissions,
                'active_teams_24h': recent_teams_active
            },
            'top_team': {
                'name': top_team.name if top_team else None,
                'points': top_team.total_points if top_team and hasattr(top_team, 'total_points') else 0
            },
            'difficulty_distribution': list(difficulty_distribution)
        })


class TeamProgressView(APIView):
    """Dedicated view for team progress analytics"""
    
    def get(self, request):
        teams = Team.objects.annotate(
            solved_challenges=Count('submissions', filter=Q(submissions__is_correct=True), distinct=True),
            total_points=Sum('submissions__points_awarded', filter=Q(submissions__is_correct=True)),
            member_count=Count('members', distinct=True)
        ).order_by('-total_points')
        
        serializer = TeamProgressSerializer(teams, many=True)
        return Response(serializer.data)


class ChallengeAnalyticsView(APIView):
    """Dedicated view for challenge analytics"""
    
    def get(self, request):
        total_teams = Team.objects.count()
        
        if total_teams == 0:
            return Response([])
        
        challenges = Challenge.objects.annotate(
            solve_count=Count('submissions', filter=Q(submissions__is_correct=True), distinct=True),
            total_attempts=Count('submissions'),
            avg_attempts=Avg('submissions__attempt_number')
        ).annotate(
            solve_rate=Count('submissions', filter=Q(submissions__is_correct=True), distinct=True) * 100.0 / total_teams if total_teams > 0 else 0
        ).order_by('-solve_rate')
        
        serializer = ChallengeSolveRateSerializer(challenges, many=True)
        return Response(serializer.data)


class UserTeamProgressView(APIView):
    """Get team progress overview and submission timeline"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        if not user.team:
            return Response({"error": "User is not part of any team"}, status=status.HTTP_400_BAD_REQUEST)
        
        team = user.team
        
        # Basic team stats
        total_challenges = Challenge.objects.filter(is_hidden=False).count()
        solved_challenges = Submission.objects.filter(
            team=team, is_correct=True
        ).values('challenge').distinct().count()
        
        total_submissions = Submission.objects.filter(team=team).count()
        correct_submissions = Submission.objects.filter(team=team, is_correct=True).count()
        
        # Category performance
        category_stats = []
        if hasattr(Challenge, 'CATEGORY_CHOICES'):
            for category, category_name in Challenge.CATEGORY_CHOICES:
                solved_in_category = Submission.objects.filter(
                    team=team,
                    challenge__category=category,
                    is_correct=True
                ).values('challenge').distinct().count()
                
                total_in_category = Challenge.objects.filter(category=category, is_hidden=False).count()
                
                category_stats.append({
                    'category': category_name,
                    'solved': solved_in_category,
                    'total': total_in_category,
                    'percentage': (solved_in_category / total_in_category * 100) if total_in_category > 0 else 0
                })
        
        # Recent submissions timeline (last 30 days)
        twenty_four_hours_ago = timezone.now() - timedelta(hours=24)
        hourly_submissions = Submission.objects.filter(
            team=team,
            timestamp__gte=twenty_four_hours_ago
        ).annotate(
            hour=TruncHour('timestamp')
        ).values('hour').annotate(
            total=Count('id'),
            correct=Count('id', filter=Q(is_correct=True)),
            points=Sum('points_awarded', filter=Q(is_correct=True))
        ).order_by('hour')
        
        # Recent submission details
        recent_submissions = Submission.objects.filter(team=team).select_related(
            'user', 'challenge'
        ).order_by('-timestamp')[:20]
        
        submission_list = []
        for sub in recent_submissions:
            submission_list.append({
                'challenge_name': sub.challenge.title,
                'challenge_category': sub.challenge.category,
                'user_name': sub.user.username,
                'points': sub.points_awarded,
                'is_correct': sub.is_correct,
                'timestamp': sub.timestamp,
                'attempt_number': sub.attempt_number
            })
        
        data = {
            'team_name': team.name,
            'team_score': team.team_score,
            'total_challenges': total_challenges,
            'solved_challenges': solved_challenges,
            'completion_rate': (solved_challenges / total_challenges * 100) if total_challenges > 0 else 0,
            'accuracy_rate': (correct_submissions / total_submissions * 100) if total_submissions > 0 else 0,
            'category_performance': category_stats,
            'hourly_timeline': list(hourly_submissions),
            'recent_submissions': submission_list
        }
        
        return Response(data)


class TeamMemberContributionsView(APIView):
    """Get team member contributions comparison"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        if not user.team:
            return Response({"error": "User is not part of any team"}, status=status.HTTP_400_BAD_REQUEST)
        
        team = user.team
        members = team.members.all()
        
        # Get contributions for each member
        member_stats = []
        total_team_points = 0
        
        for member in members:
            member_submissions = Submission.objects.filter(user=member, team=team)
            correct_submissions = member_submissions.filter(is_correct=True)
            
            solved_challenges = correct_submissions.values('challenge').distinct().count()
            total_points = correct_submissions.aggregate(total=Sum('points_awarded'))['total'] or 0
            total_attempts = member_submissions.count()
            success_rate = (correct_submissions.count() / total_attempts * 100) if total_attempts > 0 else 0
            
            # Recent activity (last 7 days)
            seven_days_ago = timezone.now() - timedelta(days=7)
            recent_activity = member_submissions.filter(timestamp__gte=seven_days_ago).count()
            
            member_stats.append({
                'username': member.username,
                'email': member.email,
                'is_current_user': member.id == user.id,
                'is_team_owner': team.team_owner == member if team.team_owner else False,
                'solved_challenges': solved_challenges,
                'total_points': total_points,
                'total_attempts': total_attempts,
                'success_rate': success_rate,
                'recent_activity': recent_activity
            })
            total_team_points += total_points
        
        # Calculate contribution percentages
        for member in member_stats:
            if total_team_points > 0:
                member['contribution_percentage'] = (member['total_points'] / total_team_points * 100)
            else:
                member['contribution_percentage'] = 0
        
        # Sort by points (descending)
        member_stats.sort(key=lambda x: x['total_points'], reverse=True)
        
        # Current user's detailed stats
        current_user_stats = next((member for member in member_stats if member['is_current_user']), None)
        
        # User's category performance
        user_category_stats = []
        if hasattr(Challenge, 'CATEGORY_CHOICES'):
            for category, category_name in Challenge.CATEGORY_CHOICES:
                user_solved_in_category = Submission.objects.filter(
                    user=user,
                    team=team,
                    challenge__category=category,
                    is_correct=True
                ).values('challenge').distinct().count()
                
                user_category_stats.append({
                    'category': category_name,
                    'solved': user_solved_in_category
                })
        
        data = {
            'team_name': team.name,
            'member_count': len(member_stats),
            'members': member_stats,
            'current_user': current_user_stats,
            'user_category_performance': user_category_stats
        }
        
        return Response(data)
