import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { dummyTeams } from '../../data/dummyTeams';

function BulkEditModal({ teams, onClose, onSave }) {
  const [formData, setFormData] = useState({
    isHidden: '',
    isBanned: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">
          Bulk Edit Teams ({teams.length} selected)
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block mb-2 font-medium">Visibility</label>
              <select
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.isHidden}
                onChange={(e) => setFormData({...formData, isHidden: e.target.value})}
              >
                <option value="">No Change</option>
                <option value="false">Visible</option>
                <option value="true">Hidden</option>
              </select>
            </div>
            <div>
              <label className="block mb-2 font-medium">Access</label>
              <select
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.isBanned}
                onChange={(e) => setFormData({...formData, isBanned: e.target.value})}
              >
                <option value="">No Change</option>
                <option value="false">Active</option>
                <option value="true">Banned</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
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

function TeamFormModal({ team, onClose, onSave, mode = 'create' }) {
  const [formData, setFormData] = useState({
    name: team?.name || '',
    email: team?.email || '',
    password: '', // Required for new teams, optional for edit
    isHidden: team?.isHidden || false,
    isBanned: team?.isBanned || false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...team,
      ...formData,
      id: team?.id || Date.now()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">
          {mode === 'create' ? 'Create Team' : 'Edit Team'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block mb-2 font-medium">Team Name</label>
              <input
                type="text"
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block mb-2 font-medium">Email</label>
              <input
                type="email"
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block mb-2 font-medium">
                {mode === 'create' ? 'Password' : 'New Password (leave blank to keep current)'}
              </label>
              <input
                type="password"
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required={mode === 'create'}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium">Visibility</label>
                <select
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.isHidden}
                  onChange={(e) => setFormData({...formData, isHidden: e.target.value === 'true'})}
                >
                  <option value="false">Visible</option>
                  <option value="true">Hidden</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 font-medium">Access</label>
                <select
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.isBanned}
                  onChange={(e) => setFormData({...formData, isBanned: e.target.value === 'true'})}
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
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
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
  const [teams, setTeams] = useState(dummyTeams);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedTeamForEdit, setSelectedTeamForEdit] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectTeam = (teamId) => {
    if (selectedTeams.includes(teamId)) {
      setSelectedTeams(selectedTeams.filter(id => id !== teamId));
    } else {
      setSelectedTeams([...selectedTeams, teamId]);
    }
  };

  const handleEditClick = () => {
    if (selectedTeams.length === 0) {
      alert('Please select at least one team');
      return;
    }
    setModalMode(selectedTeams.length === 1 ? 'edit' : 'bulk');
    if (selectedTeams.length === 1) {
      setSelectedTeamForEdit(teams.find(team => team.id === selectedTeams[0]));
    }
    setShowModal(true);
  };

  const handleDeleteTeams = () => {
    if (selectedTeams.length === 0) {
      alert('Please select at least one team');
      return;
    }
    // TODO: For backend integration
    // Make DELETE request to remove teams from database
    setTeams(teams.filter(team => !selectedTeams.includes(team.id)));
    setSelectedTeams([]);
  };

  const handleSaveTeam = (teamData) => {
    if (modalMode === 'create') {
      setTeams([...teams, teamData]);
    } else if (modalMode === 'edit') {
      setTeams(teams.map(team => 
        team.id === teamData.id ? teamData : team
      ));
    } else if (modalMode === 'bulk') {
      setTeams(teams.map(team => {
        if (!selectedTeams.includes(team.id)) return team;
        return {
          ...team,
          ...(teamData.isHidden !== '' && { isHidden: teamData.isHidden === 'true' }),
          ...(teamData.isBanned !== '' && { isBanned: teamData.isBanned === 'true' })
        };
      }));
    }
    setShowModal(false);
    setSelectedTeams([]);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-red-500">Teams</h1>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setModalMode('create');
                setSelectedTeamForEdit(null);
                setShowModal(true);
              }}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              New Team
            </button>
            <button
              onClick={handleEditClick}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Team
            </button>
            <button
              onClick={handleDeleteTeams}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Selected
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search teams by name or email..."
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

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-100">
              <th className="w-12 px-4 py-2 text-center">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTeams(filteredTeams.map(team => team.id));
                    } else {
                      setSelectedTeams([]);
                    }
                  }}
                  checked={selectedTeams.length === filteredTeams.length}
                />
              </th>
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Team</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="w-24 px-4 py-2 text-center">Hidden</th>
              <th className="w-24 px-4 py-2 text-center">Banned</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeams.map(team => (
              <tr key={team.id} className="border-t">
                <td className="px-4 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={selectedTeams.includes(team.id)}
                    onChange={() => handleSelectTeam(team.id)}
                  />
                </td>
                <td className="px-4 py-2">{team.id}</td>
                <td className="px-4 py-2">
                  <Link 
                    to={`/admin/teams/${team.id}`}
                    className="text-blue-500 hover:underline"
                  >
                    {team.name}
                  </Link>
                </td>
                <td className="px-4 py-2">{team.email}</td>
                <td className="px-4 py-2 text-center">
                  {team.isHidden && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Hidden
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-center">
                  {team.isBanned && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Banned
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        modalMode === 'bulk' ? (
          <BulkEditModal
            teams={teams.filter(team => selectedTeams.includes(team.id))}
            onClose={() => {
              setShowModal(false);
              setSelectedTeamForEdit(null);
            }}
            onSave={handleSaveTeam}
          />
        ) : (
          <TeamFormModal
            team={modalMode === 'edit' ? selectedTeamForEdit : null}
            mode={modalMode}
            onClose={() => {
              setShowModal(false);
              setSelectedTeamForEdit(null);
            }}
            onSave={handleSaveTeam}
          />
        )
      )}
    </div>
  );
}

export default Teams;