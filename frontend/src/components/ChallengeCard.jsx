import React from 'react';

function ChallengeCard({ challenge }) {
  const categoryColors = {
    web: 'bg-blue-100 text-blue-800',
    crypto: 'bg-green-100 text-green-800',
    pwn: 'bg-red-100 text-red-800',
    reverse: 'bg-purple-100 text-purple-800',
    forensics: 'bg-yellow-100 text-yellow-800',
    misc: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold">{challenge.title}</h3>
        <span className="text-lg font-bold text-blue-600">{challenge.max_points}pts</span>
      </div>
      <p className="text-gray-600 mb-3">{challenge.description}</p>
      <div className="flex justify-between items-center">
        <span className={`px-2 py-1 rounded text-sm ${categoryColors[challenge.category]}`}>
          {challenge.category}
        </span>
        {challenge.hints?.length > 0 && (
          <span className="text-sm text-gray-500">
            {challenge.hints.length} hint{challenge.hints.length !== 1 ? 's' : ''} available
          </span>
        )}
      </div>
      {challenge.is_solved && (
        <div className="mt-2 text-green-600 text-sm">✓ Solved</div>
      )}
    </div>
  );
}

export default ChallengeCard;
