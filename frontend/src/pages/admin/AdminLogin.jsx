import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
// import { adminLogin } from '../../api/auth';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { adminLogin } = useAuth(); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await adminLogin(email, password); 
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      console.error('Admin login error:', err);
      setError(err.response?.data?.error || 'Invalid admin credentials');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6">
      <div className="bg-[#FFF7ED] p-8 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold mb-6 text-red-500">Admin Login</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2 font-medium text-gray-900">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block mb-2 font-medium text-gray-900">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              required
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Login as Admin
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;