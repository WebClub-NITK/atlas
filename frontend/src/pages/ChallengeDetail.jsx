import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getChallengeById_Team, startChallenge, submitFlag, purchaseHint } from '../api/challenges';
import LoadingSpinner from '../components/LoadingSpinner';

function ChallengeDetail() {
  const { challengeId } = useParams();
  const { user } = useAuth();
  const [challenge, setChallenge] = useState(null);
  const [sshDetails, setSshDetails] = useState(null);
  const [flag, setFlag] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [challengeStarted, setChallengeStarted] = useState(false);
  const [revealedHints, setRevealedHints] = useState([]);

  useEffect(() => {
    const fetchChallenge = async () => {
      if (!challengeId) {
        setError('No challenge ID provided');
        setLoading(false);
        return;
      }

      try {
        const response = await getChallengeById_Team(challengeId);
        if (!response?.challenge) {
          throw new Error('Challenge not found');
        }

        // Parse hints if they're a string
        const challengeData = response.challenge;
        if (typeof challengeData.hints === 'string') {
          challengeData.hints = JSON.parse(challengeData.hints);
        }
        
        // Parse file_links if they're a string
        if (typeof challengeData.file_links === 'string') {
          challengeData.file_links = JSON.parse(challengeData.file_links);
        }

        setChallenge(challengeData);
        setError(null);
      } catch (err) {
        console.error('Error fetching challenge:', err);
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
      setError(null);
    } catch (error) {
      console.error('Error starting challenge:', error);
      setError('Failed to start challenge');
    }
  };

  const handleSubmitFlag = async () => {
    try {
      const response = await submitFlag(challengeId, flag);
      alert(response.message || 'Flag submitted successfully!');
      setFlag('');
      setError(null);
    } catch (error) {
      console.error('Error submitting flag:', error);
      setError('Failed to submit flag');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;
  if (!challenge) return <div className="text-gray-500 text-center p-4">Challenge not found</div>;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-red-500">{challenge.title}</h1>
        
        <div className="mb-6 flex justify-between items-center">
          <span className="text-sm bg-[#F1EFEF] px-3 py-1.5 rounded text-neutral-700">
            {challenge.category}
          </span>
          <span className="text-2xl font-bold text-neutral-900">
            {challenge.max_points} points
          </span>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <p className="text-neutral-700 mb-6">{challenge.description}</p>

          {/* Docker Challenge Section */}
          {challenge.docker_image && (
            <div className="space-y-4 mb-6">
              {!challengeStarted ? (
                <button
                  onClick={handleStartChallenge}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Start Docker Challenge
                </button>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-neutral-800 mb-2">SSH Connection Details:</h4>
                  <div className="space-y-1 text-neutral-700">
                    <p>Host: {sshDetails?.host}</p>
                    <p>Port: {sshDetails?.port}</p>
                    <p>Username: {sshDetails?.ssh_user}</p>
                    <p>Password: {sshDetails?.ssh_password}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* File Links Section */}
          {challenge.file_links && challenge.file_links.length > 0 && (
            <div className="space-y-2 mb-6">
              <h3 className="text-lg font-semibold mb-2">Challenge Files:</h3>
              {challenge.file_links.map((link, index) => (
                <a
                  key={index}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Download File {index + 1}
                </a>
              ))}
            </div>
          )}

          {/* Hints Section */}
          {challenge.hints && challenge.hints.length > 0 && (
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold">Hints Available: {challenge.hints.length}</h3>
              <div className="space-y-2">
                {challenge.hints.map((hint, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    {revealedHints.includes(index) ? (
                      <p className="text-neutral-700">{hint.content}</p>
                    ) : (
                      <button
                        onClick={() => handlePurchaseHint(index)}
                        className="w-full px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                      >
                        Unlock Hint ({hint.cost} points)
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flag Submission */}
          <div className="space-y-2">
            <input
              type="text"
              value={flag}
              onChange={(e) => setFlag(e.target.value)}
              placeholder="Enter flag"
              className="w-full bg-[#F1EFEF] text-neutral-800 px-4 py-2 rounded-lg"
            />
            <button
              onClick={handleSubmitFlag}
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Submit Flag
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChallengeDetail;