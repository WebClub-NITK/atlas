import React from 'react';
import { Link } from 'react-router-dom';

function AdminDashboard() {
  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-red-500">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/admin/users" className="block">
          <div className="bg-neutral-800 p-6 rounded-lg shadow-md transition-transform hover:scale-105">
            <h2 className="text-xl font-semibold mb-2 text-gray-100">Users</h2>
            <p className="text-4xl font-bold text-gray-300">150</p>
            <p className="text-gray-400 mt-2">Manage users →</p>
          </div>
        </Link>
        
        <Link to="/admin/teams" className="block">
          <div className="bg-white p-6 rounded-lg shadow-md transition-transform hover:scale-105">
            <h2 className="text-xl font-semibold mb-2">Teams</h2>
            <p className="text-4xl font-bold text-green-600">25</p>
            <p className="text-gray-500 mt-2">Manage teams →</p>
          </div>
        </Link>
        
        <Link to="/admin/challenges" className="block">
          <div className="bg-white p-6 rounded-lg shadow-md transition-transform hover:scale-105">
            <h2 className="text-xl font-semibold mb-2">Challenges</h2>
            <p className="text-4xl font-bold text-purple-600">45</p>
            <p className="text-gray-500 mt-2">Manage challenges →</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default AdminDashboard;