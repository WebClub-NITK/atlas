import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { updateUserInfo, getTeamHistory, leaveTeam } from '../../api/user';

function UserProfile() {
  const { user, setUser } = useAuth();
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [teamHistory, setTeamHistory] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchTeamHistory = async () => {
      try {
        const history = await getTeamHistory(user.token);
        setTeamHistory(history);
      } catch (error) {
        console.error('Failed to fetch team history:', error);
      }
    };

    fetchTeamHistory();
  }, [user.token]);

  const handleUpdateInfo = async () => {
    try {
      const updatedUser = await updateUserInfo({ username, email }, user.token);
      setUser(updatedUser);
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleLeaveTeam = async () => {
    try {
      await leaveTeam(user.token);
      setUser({ ...user, teamId: null, team: null });
      setTeamHistory(null);
      alert('You have left the team.');
    } catch (error) {
      console.error('Failed to leave team:', error);
      alert('Failed to leave the team. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">User Profile</h1>
      <div className="bg-white p-6 rounded-lg shadow-lg mb-8 transition-all duration-300 hover:shadow-xl">
        <div className="mb-6">
          <label className="block mb-2 font-semibold text-gray-700">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
            disabled={!isEditing}
          />
        </div>
        <div className="mb-6">
          <label className="block mb-2 font-semibold text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
            disabled={!isEditing}
          />
        </div>
        {isEditing ? (
          <button
            onClick={handleUpdateInfo}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Confirm Changes
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
          >
            Edit Profile
          </button>
        )}
      </div>

      {teamHistory && (
        <div className="bg-white p-6 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Team Information</h2>
          <div className="flex flex-wrap items-center justify-between mb-4">
            <div className="flex items-center space-x-4 mb-2 sm:mb-0">
              <p className="text-lg">
                <span className="font-semibold">Team:</span> {teamHistory.teamName}
              </p>
              <button
                onClick={handleLeaveTeam}
                className="px-4 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
              >
                Leave Team
              </button>
            </div>
          </div>
          <div className="bg-blue-100 p-3 rounded-lg mb-6">
            <p className="text-lg text-blue-800">
              <span className="font-semibold">Score:</span> {teamHistory.teamScore}
            </p>
          </div>
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Submissions:</h3>
          <ul className="space-y-2">
            {teamHistory.submissions.map((submission) => (
              <li key={submission.id} className="bg-gray-100 p-3 rounded-lg transition-all duration-300 hover:bg-gray-200">
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

