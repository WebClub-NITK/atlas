import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';

function TeamProfile() {
  const { user } = useAuth();
  
  // Get additional data from token if needed
  const getTokenData = () => {
    try {
      const tokenString = localStorage.getItem('token');
      if (tokenString) {
        const { access } = JSON.parse(tokenString);
        return jwtDecode(access);
      }
    } catch (error) {
      console.error('Error decoding token:', error);
    }
    return null;
  };

  const tokenData = getTokenData();
  console.log('Token data in TeamProfile:', tokenData);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Team Profile</h1>
      
      {/* Team Basic Info */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">Team Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-600">Team Name</label>
              <p className="text-lg font-medium">{tokenData?.team_name}</p>
            </div>
            <div>
              <label className="block text-gray-600">Team Email</label>
              <p className="text-lg font-medium">{tokenData?.team_email}</p>
            </div>
          </div>
        </div>

        {/* Team Members */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-3">Team Members</h3>
          <div className="space-y-3">
            {tokenData?.member_emails.map((email, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-600 text-sm">{email}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team Stats */}
        <div>
          <h3 className="text-xl font-semibold mb-3">Team Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-gray-600">Member Count</p>
              <p className="text-2xl font-bold text-blue-600">{tokenData?.member_count}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-gray-600">Team ID</p>
              <p className="text-2xl font-bold text-purple-600">#{tokenData?.team_id}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeamProfile; 