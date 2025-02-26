import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getTeamProfile_Admin, updateTeam, deleteTeam, getTeamSubmissions_Admin } from '../../api/teams';

function EditTeamModal({ team, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: team.name,
    email: team.team_email,
    isHidden: team.is_hidden,
    isBanned: team.is_banned,
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(formData);
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-[#FFF7ED] bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#FFF7ED] text-black p-6 rounded-lg w-96 shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-black">Edit Team</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 text-black">Team Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full border rounded px-3 py-2 text-black"
            />
          </div>
          <div>
            <label className="block mb-2 text-black">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full border rounded px-3 py-2 text-black"
            />
          </div>
          <div>
            <label className="block mb-2 text-black">New Password (optional)</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full border rounded px-3 py-2 text-black"
            />
          </div>
          <div className="flex space-x-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isHidden}
                onChange={(e) => setFormData({...formData, isHidden: e.target.checked})}
                className="mr-2"
              />
              <label className="text-black">Hidden</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isBanned}
                onChange={(e) => setFormData({...formData, isBanned: e.target.checked})}
                className="mr-2"
              />
              <label className="text-black">Banned</label>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded bg-red-500 text-white hover:bg-red-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TeamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [teamData, submissionsData] = await Promise.all([
          getTeamProfile_Admin(id),
          getTeamSubmissions_Admin(id)
        ]);
        setTeam(teamData);
        setSubmissions(submissionsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching team data:', err);
        setError('Failed to load team data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleUpdateTeam = async (updatedData) => {
    try {
      await updateTeam(team.id, {
        name: updatedData.name,
        email: updatedData.email,
        is_hidden: teamData.isHidden,
        is_banned: teamData.isBanned,
        ...(updatedData.password && { password: updatedData.password })
      });
      
      const refreshedData = await getTeamProfile();
      setTeam(refreshedData);
      setShowEditModal(false);
      setError(null);
    } catch (err) {
      console.error('Error updating team:', err);
      setError('Failed to update team');
    }
  };

  const handleDeleteTeam = async () => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      try {
        await deleteTeam(team.id);
        navigate('/admin/teams');
      } catch (err) {
        console.error('Error deleting team:', err);
        setError('Failed to delete team');
      }
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;
  if (!team) return <div className="text-gray-500 text-center p-4">Team not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-[#FFF7ED] text-grey-900 rounded-lg shadow-lg p-6">
        <div className="text-center mb-6 text-gray-900">
          <h1 className="text-3xl font-bold mb-2">{team.name}</h1>
          <div className="text-gray-900 mb-2">
            Score: {team.total_score}
          </div>
          
          <div className="flex justify-center space-x-2 mb-4">
            {team.is_hidden && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Hidden</span>
            )}
            {team.is_banned && (
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded">Banned</span>
            )}
          </div>

          <div className="flex justify-center space-x-4">
            <button 
              onClick={() => setShowEditModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Edit Team
            </button>
            <button 
              onClick={handleDeleteTeam}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Delete Team
            </button>
          </div>
        </div>

        {/* Submissions History */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Submission History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-gray-900">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Challenge</th> 
                  <th className="px-4 py-2 text-left">Points</th>
                  <th className="px-4 py-2 text-center">Status</th>
                  <th className="px-4 py-2 text-left">Submitted At</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-2">{submission.challenge_name}</td>
                    <td className="px-4 py-2">{submission.points}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        submission.is_correct 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {submission.is_correct ? 'Correct' : 'Incorrect'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {new Date(submission.submitted_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditTeamModal
          team={team}
          onClose={() => setShowEditModal(false)}
          onSave={handleUpdateTeam}
        />
      )}
    </div>
  );
}

export default TeamDetail;