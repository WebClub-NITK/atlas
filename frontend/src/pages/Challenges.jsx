import React, { useState, useEffect } from 'react';
import { getChallenges } from '../api/challenges';
import { useAuth } from '../hooks/useAuth';
import ChallengeCard from '../components/ChallengeCard';
import { getChallengeCategories } from '../data/dummyChallenges';

function Challenges() {
  const [challenges, setChallenges] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
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

  const filteredChallenges = challenges.filter(challenge => 
    selectedCategory === 'all' || challenge.category.toLowerCase() === selectedCategory.toLowerCase()
  );

  if (loading) return <div>Loading...</div>;

  return (
    <div className="responsive-padding">
      <h2 className="text-2xl font-semibold mb-4 sm:mb-6">Challenges</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      
      {/* Category Filter */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg ${
            selectedCategory === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-neutral-700 text-gray-200 hover:bg-neutral-600'
          }`}
        >
          All
        </button>
        {getChallengeCategories().map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg ${
              selectedCategory === category
                ? 'bg-blue-500 text-white'
                : 'bg-neutral-700 text-gray-200 hover:bg-neutral-600'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="responsive-grid">
        {filteredChallenges.map((challenge) => (
          <ChallengeCard key={challenge.id} challenge={challenge} />
        ))}
      </div>
    </div>
  );
}

export default Challenges;