import React from 'react';
import { useNavigate } from 'react-router-dom';

const ChallengeCard = ({ challenge }) => {
  const navigate = useNavigate();

  // Default tries to 0 if not provided
  const tries = challenge.tries ?? 0;

  // Determine border color and width based on challenge.is_correct
  const borderColor = challenge.is_correct ? 'border-green-500' : 'border-neutral-200';
  const borderWidth = challenge.is_correct ? 'border-4' : 'border';

  return (
    <div className={`bg-[#FFF7ED] rounded-lg p-4 sm:p-6 shadow-sm ${borderWidth} ${borderColor}`}>
      <h3 className="text-xl font-semibold mb-2 text-neutral-900 flex items-center">
        {challenge.title}
        {challenge.is_correct && (
          <span className="ml-2 text-green-500">✔</span>
        )}
      </h3>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm bg-[#F1EFEF] px-2 py-1 rounded text-neutral-700">
          {challenge.category}
        </span>
        <span className="text-sm text-neutral-600">
          Tries: {tries}
        </span>
      </div>
      <p className="text-neutral-700 mb-4">{challenge.description}</p>
      <p className="text-neutral-800 font-bold flex items-center justify-between mb-4">
        <span>Points:</span>
        <span className="text-2xl">{challenge.max_points}</span>
      </p>

      <button
        onClick={() => {
          if (challenge.is_correct) {
            alert("Challenge already solved!");
          } else {
            navigate(`/challenges/${challenge.id}`);
          }
        }}
        className="block w-full text-center px-4 py-2 bg-red-400 text-neutral-800 rounded hover:bg-neutral-200"
      >
        Open Challenge
      </button>
    </div>
  );
};

export default ChallengeCard;