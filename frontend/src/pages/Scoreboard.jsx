import React, { useState, useEffect } from 'react';
import { getScoreboard } from '../api/scoreboard';

function Scoreboard() {
  const [scores, setScores] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScoreboard();
    const interval = setInterval(fetchScoreboard, 10000);
    
    const handleScoreboardUpdate = () => {
      fetchScoreboard();
    };

    window.addEventListener('scoreboardUpdate', handleScoreboardUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('scoreboardUpdate', handleScoreboardUpdate);
    };
  }, []);

  const fetchScoreboard = async () => {
    try {
      const scoreboard = await getScoreboard();
      console.log('Fetched scoreboard data:', scoreboard);
      setScores(scoreboard);
      setError('');
    } catch (err) {
      console.error('Error fetching scoreboard:', err);
      setError('Failed to fetch scoreboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold mb-6">Scoreboard</h2>
      {error && <p className="text-red-500 mb-4 p-2 bg-red-50 rounded">{error}</p>}
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solved</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Members</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {scores.map((team, index) => (
              <tr key={team.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.total_score}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.solved_count}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.member_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Scoreboard;

