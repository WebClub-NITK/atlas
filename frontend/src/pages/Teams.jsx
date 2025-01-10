import React, { useState, useEffect } from 'react';
import { getTeams, createTeam } from '../api/teams';
import TeamCard from '../components/TeamCard';
import { useAuth } from '../hooks/useAuth';

function Teams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const fetchedTeams = await getTeams(user.token);
      setTeams(fetchedTeams);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch teams');
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    try {
      await createTeam({ name: teamName }, user.token);
      alert('Team created successfully!');
      setShowCreateTeamModal(false);
      fetchTeams(); // Refresh the team list
    } catch (error) {
      console.error('Failed to create team:', error);
      alert('Failed to create team. Please try again.');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Teams</h2>
      <button
        onClick={() => setShowCreateTeamModal(true)}
        className="mb-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Create Team
      </button>
      {teams.length === 0 ? (
        <p>No teams found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      )}

      {showCreateTeamModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Create Team</h3>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter team name"
              className="w-full border rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleCreateTeam}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Create
            </button>
            <button
              onClick={() => setShowCreateTeamModal(false)}
              className="ml-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Teams;