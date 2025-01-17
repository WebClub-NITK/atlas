import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { startChallenge, submitFlag } from '../api/challenges';

function ChallengeCard({ challenge }) {
  const [containerDetails, setContainerDetails] = useState(null);
  const [flag, setFlag] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStartChallenge = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await startChallenge(challenge.id);
      setContainerDetails(data);
    } catch (error) {
      setError('Failed to start challenge. Please try again.');
      console.error('Failed to start challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFlag = async () => {
    if (!flag.trim()) {
      setError('Please enter a flag');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await submitFlag(challenge.id, flag);
      if (data.correct) {
        alert('Congratulations! Flag is correct!');
        setFlag('');
      } else {
        setError('Incorrect flag. Try again.');
      }
    } catch (error) {
      setError('Failed to submit flag. Please try again.');
      console.error('Failed to submit flag:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="challenge-card bg-white shadow-md rounded-lg p-4 sm:p-6">
      <h3 className="text-xl font-semibold mb-2">{challenge.title}</h3>
      <p className="text-gray-600 mb-4">{challenge.description}</p>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-medium">
          Category: {challenge.category}
        </span>
        <span className="text-blue-600 font-bold">
          {challenge.max_points} pts
        </span>
      </div>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      {!containerDetails ? (
        <button
          onClick={handleStartChallenge}
          disabled={loading}
          className={`w-full px-4 py-2 rounded ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white`}
        >
          {loading ? 'Starting...' : 'Start Challenge'}
        </button>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="bg-gray-50 p-4 rounded">
            <h4 className="text-lg font-semibold mb-2">Connection Details:</h4>
            <div className="space-y-1 text-sm">
              <p>Container ID: {containerDetails.container}</p>
              <p>Port: {containerDetails.port}</p>
              <p>Status: {containerDetails.status}</p>
            </div>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={flag}
              onChange={(e) => setFlag(e.target.value)}
              placeholder="Enter flag"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              onClick={handleSubmitFlag}
              disabled={loading}
              className={`w-full px-4 py-2 rounded ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600'
              } text-white`}
            >
              {loading ? 'Submitting...' : 'Submit Flag'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

ChallengeCard.propTypes = {
  challenge: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    max_points: PropTypes.number.isRequired,
  }).isRequired,
};

export default ChallengeCard;
