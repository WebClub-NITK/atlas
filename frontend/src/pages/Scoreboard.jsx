import React, { useState, useEffect } from 'react';
import { getScoreboard } from '../api/scoreboard';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import LoadingSpinner from '../components/LoadingSpinner';

function Scoreboard() {
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const fetchScoreboard = async () => {
      try {
        setLoading(true);
        const data = await getScoreboard();
        setTeams(data);
      } catch (err) {
        console.error('Error fetching scoreboard:', err);
        setError('Failed to fetch scoreboard');
      } finally {
        setLoading(false);
      }
    };

    fetchScoreboard();
  }, []);

  if (loading) return <LoadingSpinner/>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto py-8">
      <h1 className={`text-3xl font-bold mb-8 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`}>Scoreboard</h1>
      <div className={`bg-[#FFF7ED] rounded-lg shadow-sm`}>
        <table className="w-full">
          <thead>
            <tr className={`border-b ${isDarkMode ? 'border-neutral-700' : 'border-neutral-200'}`}>
              <th className={`px-6 py-3 text-left ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Rank</th>
              <th className={`px-6 py-3 text-left ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Team</th>
              <th className={`px-6 py-3 text-right ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Score</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, index) => (
              <tr key={team.id} className={`border-b ${isDarkMode ? 'border-neutral-700' : 'border-neutral-200'}`}>
                <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{index + 1}</td>
                <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{team.team_name}</td>
                <td className={`px-6 py-4 text-right ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{team.total_score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Scoreboard;