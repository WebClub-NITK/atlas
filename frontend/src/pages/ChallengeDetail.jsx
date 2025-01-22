import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getChallengeById, startChallenge, submitFlag } from '../api/challenges';


function ChallengeDetail() {
  const { challengeId } = useParams();
  const { user } = useAuth();
  const [challenge, setChallenge] = useState(null);
  const [sshDetails, setSshDetails] = useState(null);
  const [flag, setFlag] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [challengeStarted, setChallengeStarted] = useState(false);

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const data = await getChallengeById(challengeId);
        console.log("Challenge data:", data);
        setChallenge(data);
      } catch (err) {
        setError('Failed to fetch challenge');
      } finally {
        setLoading(false);
      }
    };
    fetchChallenge();
  }, [challengeId]);

  const handleStartChallenge = async () => {
    try {
      const details = await startChallenge(challengeId);
      setSshDetails(details);
      setChallengeStarted(true);
    } catch (error) {
      setError('Failed to start challenge');
    }
  };

  const handleSubmitFlag = async () => {
    try {
      const response = await submitFlag(challengeId, flag);
      alert(response.message || 'Flag submitted successfully!');
      setFlag('');
    } catch (error) {
      setError('Failed to submit flag');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!challenge) return <div>Challenge not found</div>;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-red-500"> {challenge.name}</h1>
        
        <div className="mb-6 flex justify-between items-center">
          <span className="text-sm bg-[#F1EFEF] px-3 py-1.5 rounded text-neutral-700">
            {challenge.category}
          </span>
          <span className="text-2xl font-bold text-neutral-900">
            {challenge.points} points
          </span>
        </div>

        <p className="text-neutral-700 mb-6">{challenge.description}</p>

        {challenge.docker ? (
          <div className="space-y-4">
            {!challengeStarted ? (
              <button
                onClick={handleStartChallenge}
                className="w-full px-4 py-2 bg-[#F1EFEF] text-neutral-800 rounded hover:bg-neutral-200 transition-colors"
              >
                Start Docker Container
              </button>
            ) : (
              <div className="bg-[#F1EFEF] rounded-lg p-4">
                <h4 className="text-lg font-semibold text-neutral-800 mb-2">SSH Details:</h4>
                <div className="space-y-1 text-neutral-700">
                  <p>Host: {sshDetails?.host}</p>
                  <p>Port: {sshDetails?.port}</p>
                  <p>Username: {sshDetails?.username}</p>
                  <p>Password: {sshDetails?.password}</p>
                </div>
              </div>
            )}
          </div>
        ) : challenge.link && (
          <a 
            href={challenge.link.startsWith('http') ? challenge.link : `https://${challenge.link}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center px-4 py-2 bg-[#F1EFEF] text-neutral-800 rounded hover:bg-neutral-200 mb-4"
          >
            Challenge Link
          </a>
        )}

        <div className="mt-6 space-y-2">
          <input
            type="text"
            value={flag}
            onChange={(e) => setFlag(e.target.value)}
            placeholder="Enter flag"
            className="w-full bg-[#F1EFEF] text-neutral-800 px-4 py-2 rounded-lg"
          />
          <button
            onClick={handleSubmitFlag}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Submit Flag
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChallengeDetail;