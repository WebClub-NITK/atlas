import React from 'react';
import PropTypes from 'prop-types';

function TeamCard({ team }) {
  return (
    <div className="team-card bg-white shadow-md rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-2">{team.name}</h3>
      <p className="text-gray-600 mb-4">Members: {team.members.join(', ')}</p>
      <p className="text-blue-600 font-bold">Score: {team.score}</p>
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
