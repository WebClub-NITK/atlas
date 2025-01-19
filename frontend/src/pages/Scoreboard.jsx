import React, { useState, useEffect } from 'react';
import { getScoreboard } from '../api/scoreboard';
import { useAuth } from '../hooks/useAuth';

function Scoreboard() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchScoreboard = async () => {
      try {
        const data = await getScoreboard(user.token);
        setTeams(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch scoreboard:', error);
        setLoading(false);
      }
    };

    fetchScoreboard();
  }, [user.token]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-red-500 mb-8">Scoreboard</h1>
      <div className="bg-[#FFF7ED] rounded-lg shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="px-6 py-3 text-left">Rank</th>
              <th className="px-6 py-3 text-left">Team</th>
              <th className="px-6 py-3 text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, index) => (
              <tr key={team.id} className="border-b border-neutral-200">
                <td className="px-6 py-4">{index + 1}</td>
                <td className="px-6 py-4">{team.name}</td>
                <td className="px-6 py-4 text-right">{team.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Scoreboard;