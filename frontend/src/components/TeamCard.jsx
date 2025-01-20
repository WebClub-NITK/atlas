import React from 'react';
import PropTypes from 'prop-types';
import { joinTeam } from '../api/teams';

function TeamCard({ team, onJoinSuccess }) {
  const handleJoinTeam = async () => {
    try {
      await joinTeam(team.id);
      onJoinSuccess?.();
    } catch (error) {
      console.error('Failed to join team:', error);
    }
  };

  return (
    <div className="team-card bg-white shadow-md rounded-lg p-4 sm:p-6">
      <h3 className="text-xl font-semibold mb-2">{team.name}</h3>
      <p className="text-gray-600 mb-4">Members: {team.members.join(', ')}</p>
      <p className="text-blue-600 font-bold flex items-center justify-between">
        <span>Score:</span>
        <span className="text-2xl">{team.score}</span>
      </p>
      <button
        onClick={handleJoinTeam}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Join Team
      </button>
    </div>
  );
}

TeamCard.propTypes = {
  team: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    members: PropTypes.arrayOf(PropTypes.string).isRequired,
    score: PropTypes.number.isRequired,
  }).isRequired,
  onJoinSuccess: PropTypes.func,
};

export default TeamCard;
