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
      const updatedUser = await updateTeamInfo({ teamName, email }, user.token);
      setUser(updatedUser);
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-red-500 ">Team Profile</h1>
        <div className="space-y-8">
          {/* Profile Card */}
          <div className="bg-[#FFF7ED] rounded-lg p-6 shadow-sm border border-neutral-200">
            <div className="mb-6">
              <label className="block mb-2 font-semibold text-neutral-800">Team Name</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-[#F1EFEF] text-neutral-800"
                disabled={!isEditing}
              />
            </div>
            <div className="mb-6">
              <label className="block mb-2 font-semibold text-neutral-800">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-[#F1EFEF] text-neutral-800"
                disabled={!isEditing}
              />
            </div>
            {isEditing ? (
              <button
                onClick={handleUpdateInfo}
                className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Save Changes
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-2 rounded-lg bg-[#F1EFEF] text-neutral-800 hover:bg-neutral-200"
              >
                Edit Profile
              </button>
            )}
          </div>

          {/* Team History */}
          {teamHistory && (
            <div className="bg-[#FFF7ED] rounded-lg p-6 shadow-sm border border-neutral-200">
              <h2 className="text-2xl font-bold mb-4 text-neutral-900">Team Information</h2>
              <div className="bg-[#F1EFEF] p-3 rounded-lg mb-6">
                <p className="text-lg text-neutral-800">
                  <span className="font-semibold">Score:</span> {teamHistory.teamScore}
                </p>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-neutral-800">Submissions:</h3>
              <ul className="space-y-2">
                {teamHistory.submissions.map((submission) => (
                  <li key={submission.id} className="bg-[#F1EFEF] p-3 rounded-lg text-neutral-700">
                    {submission.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TeamProfile;