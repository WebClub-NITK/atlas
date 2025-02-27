import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAdminChallenges, deleteChallenge } from '../../api/challenges';
import { useTheme } from '../../context/ThemeContext';

function AdminChallenges() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const data = await getAdminChallenges();
      setChallenges(data);
    } catch (err) {
      console.error('Error fetching challenges:', err);
      setError('Failed to fetch challenges');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this challenge?')) {
      try {
        await deleteChallenge(id);
        fetchChallenges(); // Refresh the list
      } catch (err) {
        console.error('Error deleting challenge:', err);
        setError('Failed to delete challenge');
      }
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className={`max-w-7xl mx-auto ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Challenges</h1>
        <Link
          to="/admin/challenges/create"
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Create Challenge
        </Link>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {challenges.map((challenge) => (
          <div
            key={challenge.id}
            className="bg-[#FFF7ED] rounded-lg shadow-sm p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {challenge.title}
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => navigate(`/admin/challenges/${challenge.id}`)}
                  className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
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
            </div>
            <p className="text-sm text-gray-900 mb-4">
              {/* Removed description as it was not present in the original data */}
            </p>
            <div className="text-sm text-gray-900">
              <p>Category: {challenge.category}</p>
              <p>Points: {challenge.max_points}</p>
              <p>Status: {challenge.is_hidden ? 'Hidden' : 'Visible'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminChallenges;