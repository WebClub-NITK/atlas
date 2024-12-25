import React, { useState } from 'react';
import { dummyUsers } from '../../data/dummyUsers';

function AddMemberModal({ onClose, onAdd, currentTeamId }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [usersToConfirm, setUsersToConfirm] = useState([]);

  const filteredUsers = dummyUsers.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserSelect = (user) => {
    if (user.teamId && user.teamId !== currentTeamId) {
      setUsersToConfirm([...usersToConfirm, user]);
      setShowConfirmation(true);
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleConfirmAdd = () => {
    setSelectedUsers([...selectedUsers, ...usersToConfirm]);
    setShowConfirmation(false);
    setUsersToConfirm([]);
  };

  const handleAdd = () => {
    onAdd(selectedUsers);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-[500px]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add Team Members</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="max-h-60 overflow-y-auto mb-4">
          {filteredUsers.map(user => (
            <div 
              key={user.id}
              className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
              onClick={() => handleUserSelect(user)}
            >
              <div>
                <div className="font-medium">{user.username}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
              </div>
              {user.teamId && (
                <span className="text-sm text-red-500">
                  Already in team
                </span>
              )}
            </div>
          ))}
        </div>

        {selectedUsers.length > 0 && (
          <div className="mb-4">
            <h3 className="font-medium mb-2">Selected Users:</h3>
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map(user => (
                <span 
                  key={user.id}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center"
                >
                  {user.username}
                  <button
                    onClick={() => setSelectedUsers(selectedUsers.filter(u => u.id !== user.id))}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={selectedUsers.length === 0}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            Add Selected Users
          </button>
        </div>
      </div>

      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-xl font-bold mb-4">Confirm Team Change</h3>
            <p className="mb-4">
              The following users are currently in other teams:
              <ul className="mt-2 list-disc list-inside">
                {usersToConfirm.map(user => (
                  <li key={user.id}>{user.username}</li>
                ))}
              </ul>
            </p>
            <p className="mb-4 text-red-600">
              Adding them to this team will remove them from their current teams and reset their challenge solves, attempts, awards, and unlocked hints!
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAdd}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddMemberModal; 