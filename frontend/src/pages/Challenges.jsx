import React, { useState, useEffect } from 'react';
import { getChallenges } from '../api/challenges';
import { useAuth } from '../hooks/useAuth';
import ChallengeCard from '../components/ChallengeCard';

function Challenges() {
  const [challenges, setChallenges] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const fetchedChallenges = await getChallenges(user.token);
      setChallenges(fetchedChallenges);
    } catch (err) {
      setError('Failed to fetch challenges');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="responsive-padding">
      <h2 className="text-2xl font-semibold mb-4 sm:mb-6">Challenges</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="responsive-grid">
        {challenges.map((challenge) => (
          <ChallengeCard key={challenge.id} challenge={challenge} />
        ))}
      </div>
    </div>
  );
}

export default Challenges;
