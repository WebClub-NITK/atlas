import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getUserById } from '../../data/dummyUsers';

function UserFormModal({ user, onClose, onSave, mode = 'edit' }) {
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

function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(getUserById(id));
  const [showEditModal, setShowEditModal] = useState(false);

  if (!user) {
    return <div>User not found</div>;
  }

  const handleEditUser = (updatedData) => {
    setUser({ ...user, ...updatedData });
  };

  const handleDeleteUser = () => {
    // TODO: For backend integration
    // Make DELETE request to remove user from database
    // After successful deletion, redirect to users list
    navigate('/admin/users');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">{user.username}</h1>
          <p className="text-gray-600 mb-2">{user.email}</p>
          <p className="text-gray-500 mb-4">
            {
              user.teamId ? (
                <Link 
                  to={`/admin/teams/${user.teamId}`}
                  className="text-2xl text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {user.team}
                </Link>
              ) : (
                user.team
              )
            }
          </p>
          
          <div className="flex justify-center space-x-2 mb-4">
            {user.isAdmin && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">Admin</span>
            )}
            {user.isVerified && (
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded">Verified</span>
            )}
            {user.isHidden && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Hidden</span>
            )}
            {user.isBanned && (
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded">Banned</span>
            )}
          </div>

          <div className="mb-4">
            <p className="text-xl font-semibold">{user.points} points</p>
            <p className="text-gray-600">{user.place} place</p>
          </div>

          <div className="flex justify-center space-x-4">
            <button 
              onClick={() => setShowEditModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Edit User
            </button>
            <button 
              onClick={handleDeleteUser}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Delete User
            </button>
          </div>
        </div>

        {/* Solves Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Solves</h2>
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">Challenge</th>
                <th className="px-4 py-2 text-left">Category</th>
                <th className="px-4 py-2 text-left">Points</th>
                <th className="px-4 py-2 text-left">Solved At</th>
              </tr>
            </thead>
            <tbody>
              {user.solvedChallenges.map(challenge => (
                <tr key={challenge.id} className="border-t">
                  <td className="px-4 py-2">{challenge.name}</td>
                  <td className="px-4 py-2">{challenge.category || 'N/A'}</td>
                  <td className="px-4 py-2">{challenge.points}</td>
                  <td className="px-4 py-2">{challenge.solvedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showEditModal && (
        <UserFormModal
          user={user}
          onClose={() => setShowEditModal(false)}
          onSave={(updatedData) => {
            handleEditUser(updatedData);
            setShowEditModal(false);
          }}
        />
      )}
    </div>
  );
}

export default UserDetail; 