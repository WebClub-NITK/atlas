import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

const ChallengeCard = ({ challenge }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#FFF7ED] rounded-lg p-4 sm:p-6 shadow-sm border border-neutral-200">
      <h3 className="text-xl font-semibold mb-2 text-neutral-900">{challenge.name}</h3>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm bg-[#F1EFEF] px-2 py-1 rounded text-neutral-700">
          {challenge.category}
        </span>
        <span className="text-sm text-neutral-600">
          Tries: {challenge.no_of_tries}
        </span>
      </div>
      <p className="text-neutral-700 mb-4">{challenge.description}</p>
      <p className="text-neutral-800 font-bold flex items-center justify-between mb-4">
        <span>Points:</span>
        <span className="text-2xl">{challenge.points}</span>
      </p>
      
      <button 
        onClick={() => navigate(`/challenges/${challenge.id}`)}
        className="block w-full text-center px-4 py-2 bg-[#F1EFEF] text-neutral-800 rounded hover:bg-neutral-200"
      >
        Open Challenge
      </button>
    </div>
  );
};

ChallengeCard.propTypes = {
  challenge: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    points: PropTypes.number.isRequired,
    category: PropTypes.string.isRequired,
    no_of_tries: PropTypes.number.isRequired,
  }).isRequired,
};

export default ChallengeCard;