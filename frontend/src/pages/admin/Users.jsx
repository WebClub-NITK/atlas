import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { dummyUsers } from '../../data/dummyUsers';

function UserFormModal({ user, onClose, onSave, mode = 'create' }) {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    password: '', // Available for both create and edit
    isAdmin: user?.isAdmin || false,
    isVerified: user?.isVerified || false,
    isBanned: user?.isBanned || false,
    isHidden: user?.isHidden || false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: For backend integration
    // If mode === 'create': Make POST request to create user
    // If mode === 'edit': Make PUT request to update user
    onSave({
      ...user,
      ...formData,
      id: user?.id || Date.now() // Temporary ID generation for frontend
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">
          {mode === 'create' ? 'Create User' : 'Edit User'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block mb-2 font-medium">Username</label>
              <input
                type="text"
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
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
                <label className="block mb-2 font-medium">Status</label>
                <select
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.isVerified}
                  onChange={(e) => setFormData({...formData, isVerified: e.target.value === 'true'})}
                >
                  <option value="true">Verified</option>
                  <option value="false">Unverified</option>
                </select>
              </div>
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
              <div>
                <label className="block mb-2 font-medium">Role</label>
                <select
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.isAdmin}
                  onChange={(e) => setFormData({...formData, isAdmin: e.target.value === 'true'})}
                >
                  <option value="false">User</option>
                  <option value="true">Admin</option>
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
              {mode === 'create' ? 'Create' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BulkEditModal({ users, onClose, onSave }) {
  const [formData, setFormData] = useState({
    isVerified: '',
    isBanned: '',
    isHidden: ''
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
          Bulk Edit Users ({users.length} selected)
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block mb-2 font-medium">Status</label>
              <select
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.isVerified}
                onChange={(e) => setFormData({...formData, isVerified: e.target.value})}
              >
                <option value="">No Change</option>
                <option value="true">Verified</option>
                <option value="false">Unverified</option>
              </select>
            </div>
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

function StatusBadge({ active }) {
  if (!active) return null;
  
  return (
    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full">
      ✓
    </span>
  );
}

function Users() {
  const [users, setUsers] = useState(dummyUsers);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleEditClick = () => {
    if (selectedUsers.length === 0) {
      alert('Please select at least one user');
      return;
    }
    setModalMode(selectedUsers.length === 1 ? 'edit' : 'bulk');
    if (selectedUsers.length === 1) {
      setSelectedUserForEdit(users.find(user => user.id === selectedUsers[0]));
    }
    setShowModal(true);
  };

  const handleDeleteUsers = () => {
    if (selectedUsers.length === 0) {
      alert('Please select at least one user');
      return;
    }
    // TODO: For backend integration
    // Make DELETE request to remove users from database
    setUsers(users.filter(user => !selectedUsers.includes(user.id)));
    setSelectedUsers([]);
  };

  const handleSaveUser = (userData) => {
    if (modalMode === 'create') {
      setUsers([...users, userData]);
    } else if (modalMode === 'edit') {
      setUsers(users.map(user => 
        user.id === userData.id ? userData : user
      ));
    } else if (modalMode === 'bulk') {
      setUsers(users.map(user => {
        if (!selectedUsers.includes(user.id)) return user;
        return {
          ...user,
          ...(userData.isVerified !== '' && { isVerified: userData.isVerified === 'true' }),
          ...(userData.isBanned !== '' && { isBanned: userData.isBanned === 'true' }),
          ...(userData.isHidden !== '' && { isHidden: userData.isHidden === 'true' })
        };
      }));
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Users</h1>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setModalMode('create');
                setSelectedUserForEdit(null);
                setShowModal(true);
              }}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              New User
            </button>
            <button
              onClick={handleEditClick}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit User
            </button>
            <button
              onClick={handleDeleteUsers}
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
            placeholder="Search users by username or email..."
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
                      setSelectedUsers(filteredUsers.map(user => user.id));
                    } else {
                      setSelectedUsers([]);
                    }
                  }}
                  checked={selectedUsers.length === filteredUsers.length}
                />
              </th>
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">User</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="w-24 px-4 py-2 text-center">Admin</th>
              <th className="w-24 px-4 py-2 text-center">Verified</th>
              <th className="w-24 px-4 py-2 text-center">Hidden</th>
              <th className="w-24 px-4 py-2 text-center">Banned</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id} className="border-t">
                <td className="px-4 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleSelectUser(user.id)}
                  />
                </td>
                <td className="px-4 py-2">{user.id}</td>
                <td className="px-4 py-2">
                  <Link 
                    to={`/admin/users/${user.id}`}
                    className="text-blue-500 hover:underline"
                  >
                    {user.username}
                  </Link>
                </td>
                <td className="px-4 py-2">{user.email}</td>
                <td className="px-4 py-2 text-center">
                  {user.isAdmin && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Admin
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-center">
                  {user.isVerified && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Verified
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-center">
                  {user.isHidden && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Hidden
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-center">
                  {user.isBanned && (
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
            users={users.filter(user => selectedUsers.includes(user.id))}
            onClose={() => {
              setShowModal(false);
              setSelectedUserForEdit(null);
            }}
            onSave={handleSaveUser}
          />
        ) : (
          <UserFormModal
            user={modalMode === 'edit' ? selectedUserForEdit : null}
            mode={modalMode}
            onClose={() => {
              setShowModal(false);
              setSelectedUserForEdit(null);
            }}
            onSave={handleSaveUser}
          />
        )
      )}
    </div>
  );
}

export default Users; 