import React, { useState, useEffect } from 'react';
import { getScoreboard, getScoreboardTimeline } from '../api/scoreboard';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const TOP_N = 10;

const colors = [
  '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#6366f1', '#f43f5e'
];

// A distinct color for the current user's own team line
const MY_TEAM_COLOR = '#ffffff';

function Scoreboard() {
  const [teams, setTeams] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [chartTeams, setChartTeams] = useState([]); // only teams shown in the chart
  const [myTeamInChart, setMyTeamInChart] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const myTeamName = user?.teamName?.toLowerCase() || null;

  useEffect(() => {
    const fetchScoreboard = async () => {
      try {
        setLoading(true);
        const [scoreData, timelineData] = await Promise.all([
          getScoreboard(),
          getScoreboardTimeline()
        ]);

        setTeams(scoreData);

        if (timelineData && timelineData.length > 0) {
          // Sort timeline teams by their final score (highest first)
          const sorted = [...timelineData].sort((a, b) => {
            const aScore = a.timeline.length > 0 ? a.timeline[a.timeline.length - 1].score : 0;
            const bScore = b.timeline.length > 0 ? b.timeline[b.timeline.length - 1].score : 0;
            return bScore - aScore;
          });

          // Take top N teams
          let selectedTeams = sorted.slice(0, TOP_N);

          // Always include the current user's own team if not already in top N
          const myTeamData = sorted.find(t => t.team_name.toLowerCase() === myTeamName);
          const alreadyInChart = selectedTeams.some(t => t.team_name.toLowerCase() === myTeamName);

          if (myTeamData && !alreadyInChart) {
            selectedTeams = [...selectedTeams, myTeamData];
            setMyTeamInChart(true);
          } else {
            setMyTeamInChart(alreadyInChart);
          }

          const teamNames = selectedTeams.map(t => t.team_name);
          setChartTeams(selectedTeams);

          // Build unified timeline
          const allTimestamps = new Set();
          selectedTeams.forEach(team => {
            team.timeline.forEach(point => allTimestamps.add(point.timestamp));
          });

          const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => new Date(a) - new Date(b));
          const currentScores = {};
          teamNames.forEach(name => currentScores[name] = 0);

          const processedData = sortedTimestamps.map(timestamp => {
            const dataPoint = {
              time: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              fullTime: new Date(timestamp).toLocaleString()
            };

            selectedTeams.forEach(team => {
              const match = team.timeline.find(p => p.timestamp === timestamp);
              if (match) {
                currentScores[team.team_name] = match.score;
              }
              dataPoint[team.team_name] = currentScores[team.team_name];
            });

            return dataPoint;
          });

          if (processedData.length > 0) {
            const startPoint = { time: 'Start', fullTime: 'Start' };
            teamNames.forEach(name => startPoint[name] = 0);
            processedData.unshift(startPoint);
          }

          setChartData(processedData);
        }

      } catch (err) {
        console.error('Error fetching scoreboard:', err);
        if (err.response?.status === 403 && err.response?.data?.error?.includes('team')) {
          setError("You must join or create a team to view the scoreboard");
          navigate('/team-setup');
        } else {
          setError("Failed to load scoreboard");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchScoreboard();
  }, [navigate, myTeamName]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500 p-6">{error}</div>;

  return (
    <div className={`min-h-screen p-6`}>
      <div className="max-w-6xl mx-auto">
        <h1 className={`text-2xl font-bold mb-8 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`}>
          Scoreboard
        </h1>

        {chartData.length > 0 && (
          <div className={`mb-8 p-6 rounded-lg shadow ${isDarkMode ? 'bg-[#1a1a1a]' : 'bg-[#FFF7ED]'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-neutral-200' : 'text-gray-900'}`}>
                Points Over Time
              </h2>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${isDarkMode ? 'bg-neutral-700 text-neutral-300' : 'bg-orange-100 text-orange-700'}`}>
                Top {Math.min(TOP_N, chartTeams.length)} Teams
                {myTeamInChart && ` + Your Team`}
              </span>
            </div>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#2a2a2a' : '#e5e7eb'} />
                  <XAxis
                    dataKey="time"
                    stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                    tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                  />
                  <YAxis
                    stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                    tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#1f1f1f' : '#ffffff',
                      borderColor: isDarkMode ? '#404040' : '#e5e7eb',
                      color: isDarkMode ? '#f3f4f6' : '#111827',
                      borderRadius: '8px',
                    }}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullTime || label}
                  />
                  <Legend
                    wrapperStyle={{ color: isDarkMode ? '#d1d5db' : '#374151', fontSize: 13 }}
                  />
                  {chartTeams.map((team, index) => {
                    const isMyTeam = team.team_name.toLowerCase() === myTeamName;
                    return (
                      <Line
                        key={team.team_name}
                        type="stepAfter"
                        dataKey={team.team_name}
                        stroke={isMyTeam ? MY_TEAM_COLOR : colors[index % colors.length]}
                        strokeWidth={isMyTeam ? 4 : 2.5}
                        strokeDasharray={isMyTeam ? '0' : undefined}
                        dot={{ r: isMyTeam ? 5 : 3, strokeWidth: 2 }}
                        activeDot={{ r: 7 }}
                        animationDuration={1500}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
            {myTeamInChart === false && myTeamName && (
              <p className={`text-xs mt-2 text-center ${isDarkMode ? 'text-neutral-500' : 'text-gray-400'}`}>
                Your team is not in the top {TOP_N} yet — keep solving!
              </p>
            )}
          </div>
        )}

        {/* Leaderboard Table */}
        <div className={`overflow-x-auto rounded-lg shadow ${isDarkMode ? 'bg-[#1a1a1a]' : 'bg-[#FFF7ED]'}`}>
          <table className="min-w-full">
            <thead>
              <tr className={`border-b ${isDarkMode ? 'border-neutral-800' : 'border-neutral-200'}`}>
                <th className={`px-4 py-3 text-left text-sm font-semibold ${isDarkMode ? 'text-neutral-200' : 'text-gray-900'}`}>Rank</th>
                <th className={`px-4 py-3 text-left text-sm font-semibold ${isDarkMode ? 'text-neutral-200' : 'text-gray-900'}`}>Team</th>
                <th className={`px-4 py-3 text-right text-sm font-semibold ${isDarkMode ? 'text-neutral-200' : 'text-gray-900'}`}>Solved</th>
                <th className={`px-4 py-3 text-right text-sm font-semibold ${isDarkMode ? 'text-neutral-200' : 'text-gray-900'}`}>Score</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-neutral-800' : 'divide-neutral-200'}`}>
              {teams.map((team, index) => {
                const isMyTeam = team.team_name?.toLowerCase() === myTeamName;
                return (
                  <tr
                    key={team.team_id || `team-${index}`}
                    className={`transition-colors ${
                      isMyTeam
                        ? isDarkMode ? 'bg-neutral-700 hover:bg-neutral-600' : 'bg-orange-50 hover:bg-orange-100'
                        : isDarkMode ? 'hover:bg-neutral-800' : 'hover:bg-neutral-50'
                    }`}
                  >
                    <td className={`px-4 py-3 font-mono font-bold ${
                      index === 0 ? 'text-yellow-400' :
                      index === 1 ? 'text-gray-400' :
                      index === 2 ? 'text-orange-500' :
                      isDarkMode ? 'text-neutral-400' : 'text-gray-500'
                    }`}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </td>
                    <td className={`px-4 py-3 font-medium`}>
                      <span style={{ color: colors[index % colors.length] }}>
                        {team.team_name}
                      </span>
                      {isMyTeam && (
                        <span className={`ml-2 text-xs px-1.5 py-0.5 rounded font-semibold ${isDarkMode ? 'bg-neutral-600 text-white' : 'bg-orange-200 text-orange-800'}`}>
                          You
                        </span>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-right text-sm ${isDarkMode ? 'text-neutral-400' : 'text-gray-500'}`}>
                      {team.solved_challenges ?? '-'}
                    </td>
                    <td className={`px-4 py-3 text-right font-bold ${isDarkMode ? 'text-neutral-200' : 'text-gray-900'}`}>
                      {team.total_score}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Scoreboard;