import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getTeamHistory } from '../../api/user';

function UserProfile() {
  const { user } = useAuth();
  const [teamHistory, setTeamHistory] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamHistory();
  }, []);

  const fetchTeamHistory = async () => {
    try {
      const history = await getTeamHistory();
      setTeamHistory(history);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch team history:', error);
      setError('Failed to load team history');
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Team Profile</h1>
      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <div className="mb-6">
          <label className="block mb-2 font-semibold text-gray-700">Team Name</label>
          <div className="text-xl">{user.teamName}</div>
        </div>
        <div className="mb-6">
          <label className="block mb-2 font-semibold text-gray-700">Team Email</label>
          <div className="text-xl">{user.teamEmail}</div>
        </div>
        <div className="mb-6">
          <label className="block mb-2 font-semibold text-gray-700">Team Members</label>
          <div className="text-xl">{user.memberEmails.join(', ')}</div>
        </div>
      </div>

      {teamHistory && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Team History</h2>
          <div className="bg-blue-100 p-3 rounded-lg mb-6">
            <p className="text-lg text-blue-800">
              <span className="font-semibold">Score:</span> {teamHistory.teamScore}
            </p>
          </div>
          
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Submissions:</h3>
          <ul className="space-y-2">
            {teamHistory.submissions.map((submission) => (
              <li key={submission.id} className="bg-gray-100 p-3 rounded-lg">
                <span className="font-semibold">{submission.challengeName}</span> - {submission.points} points
                <span className="block text-sm text-gray-600 mt-1">{submission.solvedAt}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default UserProfile;

