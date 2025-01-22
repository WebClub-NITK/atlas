import React, { useState, useEffect } from 'react';
import { getChallenges } from '../api/challenges';
import ChallengeCard from '../components/ChallengeCard';
import { getChallengeCategories } from '../data/dummyChallenges';

function Challenges() {
  const [challenges, setChallenges] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        setLoading(true);
        const data = await getChallenges();
        console.log(data);
        setChallenges(data);
      } catch (err) {
        console.error('Error fetching challenges:', err);
        setError('Failed to fetch challenges');
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, []);

  // Group challenges by category
  const challengesByCategory = challenges.reduce((acc, challenge) => {
    if (!acc[challenge.category]) {
      acc[challenge.category] = [];
    }
    acc[challenge.category].push(challenge);
    return acc;
  }, {});

  const categories = ['all', ...Object.keys(challengesByCategory)];

  if (loading) return <div>Loading challenges...</div>;

  return (
    <div className="responsive-padding">
      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                selectedCategory === category
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Challenges Display */}
      {selectedCategory === 'all' ? (
        // Show all categories
        Object.entries(challengesByCategory).map(([category, categoryChallenges]) => (
          <div key={category} className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 capitalize">
              {category} Challenges
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryChallenges.map(challenge => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          </div>
        ))
      ) : (
        // Show selected category
        <div>
          <h2 className="text-2xl font-semibold mb-4 capitalize">
            {selectedCategory} Challenges
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {challengesByCategory[selectedCategory]?.map(challenge => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
}

export default Challenges;