from django.db.models import Count, Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..models import Team



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_scoreboard(request):
    """Get scoreboard data"""
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
