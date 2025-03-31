import React, { useState, useEffect } from 'react';
import { getScoreboard } from '../api/scoreboard';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNavigate } from "react-router-dom"

function Scoreboard() {
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isDarkMode } = useTheme();
  const navigate = useNavigate()

  useEffect(() => {
    const fetchScoreboard = async () => {
      try {
        setLoading(true);
        const data = await getScoreboard();
        setTeams(data);
      } catch (err) {
        console.error('Error fetching scoreboard:', err);
        
        // Handle team requirement error
        if (err.response?.status === 403 && err.response?.data?.error?.includes('team')) {
          setError("You must join or create a team to view the scoreboard")
          navigate('/team-setup')
        } else {
          setError("Failed to load scoreboard")
        }
      } finally {
        setLoading(false);
      }
    };

    fetchScoreboard();
  }, [navigate]);

  if (loading) return <LoadingSpinner/>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className={`min-h-screen p-6`}>
      <div className="max-w-6xl mx-auto">
        <h1 className={`text-2xl font-bold mb-8 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`}>
          Scoreboard
        </h1>
        
        <div className="overflow-x-auto bg-[#FFF7ED] rounded-lg shadow">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Rank</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Team</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {teams.map((team, index) => (
                <tr 
                  key={team.id || `team-${index}`}
                  className="hover:bg-neutral-50 transition-colors"
                >
                  <td className="px-4 py-3 text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 text-gray-900">
                    {team.team_name}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {team.total_score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Scoreboard;