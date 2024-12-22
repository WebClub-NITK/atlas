import React from 'react';
import PropTypes from 'prop-types';

function TeamCard({ team }) {
  return (
    <div className="team-card bg-white shadow-md rounded-lg p-4 sm:p-6">
      <h3 className="text-xl font-semibold mb-2">{team.name}</h3>
      <p className="text-gray-600 mb-4">Members: {team.members.join(', ')}</p>
      <p className="text-blue-600 font-bold flex items-center justify-between">
        <span>Score:</span>
        <span className="text-2xl">{team.score}</span>
      </p>
    </div>
  );
}

TeamCard.propTypes = {
  team: PropTypes.shape({
    name: PropTypes.string.isRequired,
    members: PropTypes.arrayOf(PropTypes.string).isRequired,
    score: PropTypes.number.isRequired,
    id: PropTypes.string.isRequired,
  }).isRequired,
};

export default TeamCard;
