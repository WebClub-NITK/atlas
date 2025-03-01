import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getChallengeById_Team, startChallenge, submitFlag, purchaseHint } from '../api/challenges';
import LoadingSpinner from '../components/LoadingSpinner';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

function ChallengeDetail() {
  const { challengeId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const {isDarkMode}=useTheme();
  const [challenge, setChallenge] = useState(null);
  const [sshDetails, setSshDetails] = useState(null);
  const [flag, setFlag] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [challengeStarted, setChallengeStarted] = useState(false);
  const [purchaseInProgress, setPurchaseInProgress] = useState(false);
  const [remainingPoints, setRemainingPoints] = useState(null);

  useEffect(() => {
    const fetchChallenge = async () => {
      if (!challengeId) {
        setError('No challenge ID provided');
        setLoading(false);
        return;
      }

      try {
        const response = await getChallengeById_Team(challengeId);
        // console.log('Challenge data received:', response);
        
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
        // console.log(challengeData.hints)
        // Set remaining points if available, otherwise use max points
        setRemainingPoints(challengeData.remaining_points || challengeData.max_points);
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

  const handleSubmitFlag = async (e) => {
    e.preventDefault();
    try {
      // Send flag directly in the request body
      const response = await submitFlag(challengeId, flag.trim());
      // console.log('Flag submission response:', response);
      alert(response.is_correct ? "Flag is correct!" : `Flag is incorrect! ${response.attempts_remaining == 0 ? "You have used all your attempts!" : `Only ${response.attempts_remaining} attempts left!`}`);
      if(response.is_correct){
        navigate(`/challenges`);
      }
      if(response.attempts_remaining === 0){
        navigate(`/challenges`);
      }
      setFlag('');
      setError(null);
    } catch (error) {
      console.error('Error submitting flag:', error);
      setError(error.response?.data?.error || 'Failed to submit flag');
    }
  };

  const handlePurchaseHint = async (hintIndex) => {
    if (purchaseInProgress) return;
    
    try {
      setPurchaseInProgress(true);
      const response = await purchaseHint(challengeId, hintIndex);
      // console.log('Hint purchase response:', response);
      
      // Update the challenge with the new hint information
      setChallenge(prev => {
        const updatedHints = [...prev.hints];
        updatedHints[hintIndex] = {
          ...updatedHints[hintIndex],
          purchased: true,
          content: response.hint.content
        };
        
        return {
          ...prev,
          hints: updatedHints
        };
      });
      
      // Update remaining points after hint purchase
      if (response.remainingPoints !== undefined) {
        setRemainingPoints(response.remainingPoints);
      }
      
      setError(null);
    } catch (error) {
      console.error('Error purchasing hint:', error);
      setError(error.response?.data?.error || 'Failed to purchase hint');
    } finally {
      setPurchaseInProgress(false);
    }
  };

  // Calculate actual point deduction for a hint
  const calculateHintDeduction = (hintCost) => {
    // Direct deduction - hint cost is the number of points to deduct
    return hintCost;
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;
  if (!challenge) return <div className="text-gray-500 text-center p-4">Challenge not found</div>;

  return (
    <div className="mt-10 rounded-lg p-6 bg-[#FFF7ED]">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-red-500">{challenge.title}</h1>
        
        <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center space-x-3">
            <span className="text-sm bg-[#F1EFEF] px-3 py-1.5 rounded text-neutral-700">
              {challenge.category}
            </span>
              <span className="text-sm bg-[#F1EFEF] px-3 py-1.5 rounded text-neutral-700">
                Maximum Attempts: {challenge.max_attempts}
              </span>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-neutral-900">
              {remainingPoints} points
            </span>
            {remainingPoints !== null && remainingPoints !== challenge.max_points && (
              <div className="text-sm text-red-500">
                ({challenge.max_points - remainingPoints} points deducted)
              </div>
            )}
          </div>
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
          {challenge.file_links && Array.isArray(challenge.file_links) && challenge.file_links.length > 0 && (
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
                  File {index + 1}
                </a>
              ))}
            </div>
          )}

          {/* Hints Section */}
          {challenge.hints && Array.isArray(challenge.hints) && challenge.hints.length > 0 && (
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold">Hints Available: {challenge.hints.length}</h3>
              <div className="space-y-2">
                {challenge.hints.map((hint, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    {hint.purchased ? (
                      <div>
                        <h4 className="text-red-500 font-medium mb-1">
                          Hint {index + 1} 
                          <span className="text-red-500 ml-2">
                            (-{calculateHintDeduction(hint.cost)} points)
                          </span>
                        </h4>
                        <p className="text-neutral-700">{hint.content}</p>
                      </div>
                    ) : (
                      <div>
                        <button
                          onClick={() => handlePurchaseHint(index)}
                          disabled={purchaseInProgress}
                          className={`w-full px-4 py-2 ${purchaseInProgress ? 'bg-gray-400' : 'bg-yellow-500 hover:bg-yellow-600'} text-white rounded`}
                        >
                          {purchaseInProgress ? 'Processing...' : `Unlock Hint ${index + 1}`}
                        </button>
                        <div className="text-sm text-red-500 mt-1 text-center">
                          Will deduct {hint.cost} points
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flag Submission */}
          <form onSubmit={handleSubmitFlag} className="space-y-2">
            <input
              type="text"
              value={flag}
              onChange={(e) => setFlag(e.target.value)}
              placeholder="Enter flag"
              className="w-full bg-[#F1EFEF] text-neutral-800 px-4 py-2 rounded-lg"
              required
            />
            <button
              type="submit"
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Submit Flag
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChallengeDetail;