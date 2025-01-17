import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../hooks/useAuth';
import { startChallenge, submitFlag } from '../api/challenges';

function ChallengeCard({ challenge }) {
  const { user } = useAuth();
  const [sshDetails, setSshDetails] = useState(null);
  const [flag, setFlag] = useState('');
  const [challengeStarted, setChallengeStarted] = useState(false);

  const handleStartChallenge = async () => {
    try {
      const details = await startChallenge(challenge.id, user.token);
      setSshDetails(details);
      setChallengeStarted(true);
      alert('Challenge started! Check SSH details below.');
    } catch (error) {
      console.error('Failed to start challenge:', error);
      alert('Failed to start the challenge. Please try again.');
    }
  };

  const handleSubmitFlag = async () => {
    try {
      const response = await submitFlag(challenge.id, flag, user.token);
      alert(response.message);
    } catch (error) {
      console.error('Failed to submit flag:', error);
      alert('Failed to submit the flag. Please try again.');
    }
  };

  return (
    <div className="challenge-card bg-white shadow-md rounded-lg p-4 sm:p-6">
      <h3 className="text-xl font-semibold mb-2">{challenge.name}</h3>
      <p className="text-gray-600 mb-4">{challenge.description}</p>
      <p className="text-blue-600 font-bold flex items-center justify-between">
        <span>Points:</span>
        <span className="text-2xl">{challenge.points}</span>
      </p>
      {!challengeStarted ? (
        <button
          onClick={handleStartChallenge}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Start Challenge
        </button>
      ) : (
        <div className="mt-4">
          <h4 className="text-lg font-semibold">SSH Details:</h4>
          <p>Host: {sshDetails.host}</p>
          <p>Port: {sshDetails.port}</p>
          <p>Username: {sshDetails.username}</p>
          <p>Password: {sshDetails.password}</p>
          <div className="mt-4">
            <input
              type="text"
              value={flag}
              onChange={(e) => setFlag(e.target.value)}
              placeholder="Enter flag"
              className="input"
            />
            <button
              onClick={handleSubmitFlag}
              className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Submit Flag
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
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    points: PropTypes.number.isRequired,
  }).isRequired,
};

export default ChallengeCard;