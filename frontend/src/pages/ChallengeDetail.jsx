import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchChallenge } from '../api/challenges';
import { ColourfulText } from '../components/ColourfulText';
import { useAuth } from '../hooks/useAuth';

function ChallengeDetail() {
  const { challengeId } = useParams();
  const { user } = useAuth();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getChallenge = async () => {
      try {
        setLoading(true);
        const data = await fetchChallenge(challengeId, user.token);
        setChallenge(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    getChallenge();
  }, [challengeId, user.token]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!challenge) return <div>Challenge not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="dark-card rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-4">
          <ColourfulText text={challenge.name} />
        </h1>
        <div className="mb-6 flex justify-between items-center">
          <span className="bg-neutral-700 px-3 py-1 rounded-full text-sm text-gray-300">
            {challenge.category}
          </span>
          <span className="text-2xl font-bold text-gray-300">
            {challenge.value} points
          </span>
        </div>
        <div className="prose prose-invert max-w-none mb-6">
          <p>{challenge.description}</p>
        </div>
        {challenge.link && (
        <a 
            href={challenge.link.startsWith('http') ? challenge.link : `https://${challenge.link}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 break-all"
        >
            Challenge Link
        </a>
        )}
      </div>
    </div>
  );
}

export default ChallengeDetail;