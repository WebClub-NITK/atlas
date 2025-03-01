import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getTeamProfile, getTeamSubmissions, addTeamMember } from '../../api/teams';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useTheme } from '../../context/ThemeContext';

function TeamProfile() {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [teamProfile, setTeamProfile] = useState({
    name: '',
    team_email: '', 
    total_score: 0,
    members: []
  });
  const [submissions, setSubmissions] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', email: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [profile, submissionData] = await Promise.all([
          getTeamProfile(),
          getTeamSubmissions()
        ]);

        setTeamProfile(profile);
        
        const formattedSubmissions = Object.values(submissionData).map(sub => ({
          challenge_name: sub.challenge_name,
          points: sub.points_awarded,
          is_correct: sub.is_solved,
          submitted_at: sub.attempts[0]?.timestamp || null,
          attempts: sub.attempts
        }));

        setSubmissions(formattedSubmissions);
      } catch (err) {
        setError('Failed to fetch team data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await addTeamMember(newMember);
      setSuccess('Member added successfully');
      setNewMember({ name: '', email: '' });
      setShowAddMember(false);
      
      // Refresh team data
      const profile = await getTeamProfile();
      setTeamProfile(profile);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add member');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-4xl font-bold mb-8 text-red-500">Team Profile</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      {/* Team Information */}
      <div className="bg-[#FFF7ED] rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-neutral-900">Team Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-neutral-900">
          <div className="text-lg">
            <strong>Team Name:</strong> {teamProfile.name}
          </div>
          <div className="text-lg">
            <strong>Team Email:</strong> {teamProfile.team_email}
          </div>
          <div className="text-lg">
            <strong>Total Score:</strong> {teamProfile.total_score}
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Team Members</h3>
          {teamProfile.members?.length < 3 && !showAddMember && (
            <button
              onClick={() => setShowAddMember(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Add Member
            </button>
          )}
        </div>

        {showAddMember && (
          <form onSubmit={handleAddMember} className="mb-6 bg-white p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newMember.name}
                  onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
              >
                Add Member
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddMember(false);
                  setNewMember({ name: '', email: '' });
                  setError('');
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Name</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {teamProfile.members?.map((member, index) => (
                <tr key={member.id || index}>
                  <td className="px-4 py-2 text-sm text-gray-900">{member.username}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{member.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submissions History */}
      <div className="bg-[#FFF7ED] rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 text-neutral-900">Submission History</h2>
        <div className="bg-white rounded-lg overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Challenge</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Points</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Submitted At</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">All Attempts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {submissions.map((submission, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 text-sm text-gray-900">{submission.challenge_name}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{submission.points}</td>
                  <td className="px-4 py-2 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      submission.is_correct 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {submission.is_correct ? 'Correct' : 'Incorrect'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    <div className="max-h-24 overflow-y-auto">
                      {submission.attempts?.map((attempt, idx) => (
                        <div key={idx} className="mb-1 px-2 py-1 hover:bg-gray-50 rounded">
                          {new Date(attempt.timestamp).toLocaleString()}
                        </div>
                      )) || 'No attempts'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default TeamProfile;