import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../hooks/useAuth';
import { startChallenge, submitFlag } from '../api/challenges';
import { useNavigate } from 'react-router-dom';

function ChallengeCard({ challenge }) {
  const { user } = useAuth();
  const navigate = useNavigate();
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
    <div className="challenge-card dark-card rounded-lg p-4 sm:p-6">
      <h3 className="text-xl font-semibold mb-2 text-gray-100">{challenge.name}</h3>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm bg-neutral-700 px-2 py-1 rounded text-gray-300">
          {challenge.category}
        </span>
        <span className="text-sm text-gray-400">
          Tries: {challenge.no_of_tries}
        </span>
      </div>
      <p className="text-gray-400 mb-4">{challenge.description}</p>
      <p className="text-gray-300 font-bold flex items-center justify-between mb-4">
        <span>Points:</span>
        <span className="text-2xl">{challenge.points}</span>
      </p>
      
      {challenge.docker ? (
        !challengeStarted ? (
          <button
            onClick={handleStartChallenge}
            className="w-full mt-4 px-4 py-2 bg-neutral-700 text-white rounded hover:bg-neutral-600"
          >
            Start Docker Container
          </button>
        ) : (
          <div className="mt-4">
            <h4 className="text-lg font-semibold text-gray-200">SSH Details:</h4>
            <div className="bg-neutral-700 p-3 rounded-lg mt-2 mb-4">
              <p className="text-gray-300">Host: {sshDetails.host}</p>
              <p className="text-gray-300">Port: {sshDetails.port}</p>
              <p className="text-gray-300">Username: {sshDetails.username}</p>
              <p className="text-gray-300">Password: {sshDetails.password}</p>
            </div>
            <input
              type="text"
              value={flag}
              onChange={(e) => setFlag(e.target.value)}
              placeholder="Enter flag"
              className="w-full bg-neutral-700 text-gray-100 px-4 py-2 rounded-lg mb-2"
            />
            <button
              onClick={handleSubmitFlag}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Submit Flag
            </button>
          </div>
        )
      ) : (
        <div className="mt-4">
          <button 
            onClick={() => navigate(`/challenges/${challenge.id}`)}
            className="block w-full text-center px-4 py-2 bg-neutral-700 text-white rounded hover:bg-neutral-600"
          >
            Open Challenge
          </button>
          <div className="mt-4">
            <input
              type="text"
              value={flag}
              onChange={(e) => setFlag(e.target.value)}
              placeholder="Enter flag"
              className="w-full bg-neutral-700 text-gray-100 px-4 py-2 rounded-lg mb-2"
            />
            <button
              onClick={handleSubmitFlag}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
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
    category: PropTypes.string.isRequired,
    docker: PropTypes.bool.isRequired,
    no_of_tries: PropTypes.number.isRequired,
    link: PropTypes.string,
  }).isRequired,
};

export default ChallengeCard;