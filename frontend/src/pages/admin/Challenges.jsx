import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAdminChallenges, deleteChallenge } from '../../api/challenges';

function Challenges() {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const data = await getAdminChallenges();
        setChallenges(data);
      } catch (err) {
        setError('Failed to fetch challenges');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this challenge?')) {
      try {
        await deleteChallenge(id);
        // Remove from local state after successful deletion
        setChallenges(challenges.filter(challenge => challenge.id !== id));
      } catch (error) {
        console.error('Error deleting challenge:', error);
        alert('Failed to delete challenge');
      }
    }
  };

  const filteredChallenges = challenges.filter(challenge =>
    challenge.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-red-500">Challenges</h1>
          <Link
            to="/admin/challenges/create"
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Create Challenge
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search challenges by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 pr-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg 
              className="h-5 w-5 text-gray-400"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full bg-[#FFF7ED] rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-[#FFF7ED]">
              <th className="px-4 py-2 text-left text-gray-900">ID</th>
              <th className="px-4 py-2 text-left text-gray-900">Title</th>
              <th className="px-4 py-2 text-left text-gray-900">Category</th>
              <th className="px-4 py-2 text-center text-gray-900">Points</th>
              <th className="w-24 px-4 py-2 text-center text-gray-900">Hidden</th>
              <th className="w-24 px-4 py-2 text-center text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredChallenges.map((challenge) => (
              <tr key={challenge.id} className="border-t border-gray-200">
                <td className="px-4 py-2 text-gray-900">{challenge.id}</td>
                <td className="px-4 py-2 text-gray-900">
                  <Link 
                    to={`/admin/challenges/${challenge.id}`}
                    className="text-blue-500 hover:underline"
                  >
                    {challenge.title}
                  </Link>
                </td>
                <td className="px-4 py-2 text-gray-900">{challenge.category}</td>
                <td className="px-4 py-2 text-center text-gray-900">{challenge.max_points}</td>
                <td className="px-4 py-2 text-center text-gray-900">
                  {challenge.is_hidden && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Hidden
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-center">
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={() => navigate(`/admin/challenges/${challenge.id}`)}
                      className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(challenge.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Challenges; 