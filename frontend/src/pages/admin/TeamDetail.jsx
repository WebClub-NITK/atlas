import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getTeamProfile_Admin, updateTeam, deleteTeam, getTeamSubmissions_Admin } from '../../api/teams';

function EditTeamModal({ team, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: team?.name || '',
    email: team?.team_email || '',
    password: '',
    isHidden: team?.is_hidden || false, 
    isBanned: team?.is_banned || false   
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedData = {
        name: formData.name,
        email: formData.email,
        is_hidden: formData.isHidden, 
        is_banned: formData.isBanned,  
        ...(formData.password && { password: formData.password })
      };
    
      await onSave(updatedData);
      onClose();
    } catch (error) {
      console.error("Error updating team:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#FFF7ED] p-8 rounded-lg w-96 shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Edit Team</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block mb-2 font-medium text-gray-900">Team Name</label>
              <input
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
              />
            </div>
            <div>
              <label className="block mb-2 font-medium text-gray-900">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
              />
            </div>
            <div>
              <label className="block mb-2 font-medium text-gray-900">New Password (optional)</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium text-gray-900">Visibility</label>
                <select
                  name="isHidden"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  value={formData.isHidden.toString()}
                  onChange={(e) => setFormData({ ...formData, isHidden: e.target.value === 'true' })}
                >
                  <option value="false">Visible</option>
                  <option value="true">Hidden</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 font-medium text-gray-900">Access</label>
                <select
                  name="isBanned"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  value={formData.isBanned.toString()}
                  onChange={(e) => setFormData({ ...formData, isBanned: e.target.value === 'true' })}
                >
                  <option value="false">Active</option>
                  <option value="true">Banned</option>
                </select>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
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
        is_hidden: updatedData.is_hidden,
        is_banned: updatedData.is_banned,
        ...(updatedData.password && { password: updatedData.password })
      });
      
      const refreshedData = await getTeamProfile_Admin(team.id);
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
      <div className="bg-[#FFF7ED] text-gray-900 rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">{team.name}</h1>
          <div className="mb-2">Score: {team.total_score}</div>
          
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
