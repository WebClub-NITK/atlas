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
    <div className="bg-white min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6 text-red-500">Challenges</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        
        {/* Category Filter */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-[#F1EFEF] text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            All
          </button>
          {getChallengeCategories().map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-500 text-white'
                  : 'bg-[#F1EFEF] text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChallenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Challenges;