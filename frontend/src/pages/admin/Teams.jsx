import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTeams, createTeam, updateTeam, deleteTeam } from '../../api/teams';

function TeamFormModal({ team, onClose, onSave, mode = 'create' }) {
  const [formData, setFormData] = useState({
    name: team?.name || '',
    email: team?.email || '',
    password: '',
    is_hidden: team?.is_hidden || false,
    is_banned: team?.is_banned || false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const changedData = {};
      Object.keys(formData).forEach(key => {
        if (formData[key] !== (team?.[key] || '')) {
          changedData[key] = formData[key];
        }
      });

      if (formData.password) {
        changedData.password = formData.password;
      }

      await onSave(team?.id, changedData);
      onClose();
    } catch (error) {
      console.error("Error updating team:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#FFF7ED] p-8 rounded-lg w-96 shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-gray-900">
          {mode === 'create' ? 'Create Team' : 'Edit Team'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block mb-2 font-medium text-gray-900">Team Name</label>
              <input
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required={mode === 'create'}
              />
            </div>
            <div>
              <label className="block mb-2 font-medium text-gray-900">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required={mode === 'create'}
              />
            </div>
            <div>
              <label className="block mb-2 font-medium text-gray-900">
                {mode === 'create' ? 'Password' : 'New Password (optional)'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required={mode === 'create'}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium text-gray-900">Visibility</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  value={formData.is_hidden}
                  onChange={(e) => setFormData({...formData, is_hidden: e.target.value === 'true'})}
                >
                  <option value="false">Visible</option>
                  <option value="true">Hidden</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 font-medium text-gray-900">Access</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  value={formData.is_banned}
                  onChange={(e) => setFormData({...formData, is_banned: e.target.value === 'true'})}
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
              {mode === 'create' ? 'Create' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Teams() {
  const [teams, setTeams] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const data = await getTeams();
      setTeams(data);
    } catch (err) {
      setError('Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTeam = (team) => {
    setSelectedTeam(team);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleDeleteTeam = async (teamId) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      try {
        await deleteTeam(teamId);
        setTeams(teams.filter(team => team.id !== teamId));
      } catch (err) {
        console.error('Error deleting team:', err);
      }
    }
  };

  const handleSaveTeam = async (teamId, teamData) => {
    try {
      if (modalMode === 'create') {
        const newTeam = await createTeam(teamData);
        setTeams([...teams, newTeam]);
      } else {
        const updatedTeam = await updateTeam(teamId, teamData);
        setTeams(teams.map(team => 
          team.id === updatedTeam.id ? updatedTeam : team
        ));
      }
      setShowModal(false);
      setSelectedTeam(null);
    } catch (err) {
      console.error('Error saving team:', err);
    }
  };

  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-red-500">Teams</h1>
          <button
            onClick={() => {
              setModalMode('create');
              setSelectedTeam(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            New Team
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search teams by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full bg-[#FFF7ED] rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-[#FFF7ED]">
              <th className="px-4 py-2 text-left text-gray-900">ID</th>
              <th className="px-4 py-2 text-left text-gray-900">Team</th>
              <th className="px-4 py-2 text-left text-gray-900">Email</th>
              <th className="w-24 px-4 py-2 text-center text-gray-900">Hidden</th>
              <th className="w-24 px-4 py-2 text-center text-gray-900">Banned</th>
              <th className="w-24 px-4 py-2 text-center text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeams.map(team => (
              <tr key={team.id} className="border-t border-gray-200">
                <td className="px-4 py-2 text-gray-900">{team.id}</td>
                <td className="px-4 py-2">
                  <Link to={`/admin/teams/${team.id}`} className="text-blue-500 hover:underline">
                    {team.name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-gray-900">{team.email}</td>
                <td className="px-4 py-2 text-center">
                  {team.is_hidden && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Hidden
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-center">
                  {team.is_banned && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Banned
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-center">
                  <div className="flex justify-center space-x-2">
                    <button 
                      onClick={() => handleEditTeam(team)}
                      className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTeam(team.id)}
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

      {showModal && (
        <TeamFormModal
          team={modalMode === 'edit' ? selectedTeam : null}
          mode={modalMode}
          onClose={() => {
            setShowModal(false);
            setSelectedTeam(null);
          }}
          onSave={handleSaveTeam}
        />
      )}
    </div>
  );
}

export default Teams;