import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { updateTeamInfo, getTeamHistory } from '../../api/team';

function TeamProfile() {
  const { user, setUser } = useAuth();
  const [teamName, setTeamName] = useState(user.teamName);
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
      const updatedUser = await updateUserInfo({ teamName, email }, user.token);
      setUser(updatedUser);
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  return (
    <div className="h-full pb-8">
      <div className="max-w-4xl mx-auto">
        <div className="dark-content h-full overflow-y-auto">
          <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-100">Team Profile</h1>
            <div className="dark-card p-6 mb-8 rounded-lg">
              <div className="mb-6">
                <label className="block mb-2 font-semibold text-gray-200">Team Name</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg dark-input"
                  disabled={!isEditing}
                />
              </div>
              <div className="mb-6">
                <label className="block mb-2 font-semibold text-gray-200">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg dark-input"
                  disabled={!isEditing}
                />
              </div>
              {isEditing ? (
                <button
                  onClick={handleUpdateInfo}
                  className="px-6 py-2 rounded-lg dark-button-primary"
                >
                  Confirm Changes
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2 rounded-lg dark-button-secondary"
                >
                  Edit Profile
                </button>
              )}
            </div>

            {teamHistory && (
              <div className="dark-card p-6 rounded-lg">
                <h2 className="text-2xl font-bold mb-4 text-gray-100">Team Information</h2>
                <div className="bg-neutral-700 p-3 rounded-lg mb-6">
                  <p className="text-lg text-gray-100">
                    <span className="font-semibold">Score:</span> {teamHistory.teamScore}
                  </p>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-200">Submissions:</h3>
                <ul className="space-y-2">
                  {teamHistory.submissions.map((submission) => (
                    <li key={submission.id} className="dark-submission-item p-3 rounded-lg">
                      <p className="text-gray-200">{submission.title}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeamProfile;
