import React from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../hooks/useAuth';
import { joinTeam } from '../api/teams';

function TeamCard({ team }) {
  const { user } = useAuth();

  const handleJoinTeam = async () => {
    try {
      await joinTeam(team.id, user.token);
      alert('Successfully joined the team!');
      // Optionally, you can refresh the team list or update the UI accordingly
    } catch (error) {
      console.error('Failed to join team:', error);
      alert('Failed to join the team. Please try again.');
    }
  };

  return (
    <div className="team-card dark-card rounded-lg p-4 sm:p-6">
      <h3 className="text-xl font-semibold mb-2 text-gray-100">{team.name}</h3>
      <p className="text-gray-400 mb-4">Members: {team.members.join(', ')}</p>
      <p className="text-gray-300 font-bold flex items-center justify-between">
        <span>Score:</span>
        <span className="text-2xl">{team.score}</span>
      </p>
      <button
        onClick={handleJoinTeam}
        className="mt-4 px-4 py-2 bg-neutral-700 text-white rounded hover:bg-neutral-600"
      >
        Join Team
      </button>
    </div>
  );
}

TeamCard.propTypes = {
  team: PropTypes.shape({
    name: PropTypes.string.isRequired,
    members: PropTypes.arrayOf(PropTypes.string).isRequired,
    score: PropTypes.number.isRequired,
    id: PropTypes.number.isRequired,
  }).isRequired,
};

export default TeamCard;