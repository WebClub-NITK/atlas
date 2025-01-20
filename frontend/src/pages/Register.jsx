import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../api/auth';
import { useAuth } from '../hooks/useAuth';
import { validateEmail } from '../utils/validators';

function Register() {
  const [formData, setFormData] = useState({
    teamName: '',
    teamEmail: '',
    password: '',
    member1Name: '',
    member1Email: '',
    member2Name: '',
    member2Email: '',
    member3Name: '',
    member3Email: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Calculate team size based on provided member emails
    const memberCount = [
      formData.member1Email,
      formData.member2Email,
      formData.member3Email
    ].filter(Boolean).length;

    try {
      console.log(formData);
      const data = await register({
        ...formData,
        teamSize: memberCount // Add team size to registration data
      });
      login(data);
      navigate('/');
    } catch (err) {
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Team Registration</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit}>
        {/* Team Information */}
        <div className="mb-4">
          <h3 className="text-xl font-semibold mb-2">Team Information</h3>
          <div className="mb-2">
            <label htmlFor="teamName" className="block mb-1">Team Name *</label>
            <input
              type="text"
              name="teamName"
              value={formData.teamName}
              onChange={handleChange}
              className="input"
              required
            />
          </div>
          <div className="mb-2">
            <label htmlFor="teamEmail" className="block mb-1">Team Email *</label>
            <input
              type="email"
              name="teamEmail"
              value={formData.teamEmail}
              onChange={handleChange}
              className="input"
              required
            />
          </div>
          <div className="mb-2">
            <label htmlFor="password" className="block mb-1">Team Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input"
              required
              minLength={8}
            />
          </div>
        </div>

        {/* Member 1 (Required) */}
        <div className="mb-4">
          <h3 className="text-xl font-semibold mb-2">Member 1 (Required)</h3>
          <div className="mb-2">
            <label htmlFor="member1Name" className="block mb-1">Name *</label>
            <input
              type="text"
              name="member1Name"
              value={formData.member1Name}
              onChange={handleChange}
              className="input"
              required
            />
          </div>
          <div className="mb-2">
            <label htmlFor="member1Email" className="block mb-1">Email *</label>
            <input
              type="email"
              name="member1Email"
              value={formData.member1Email}
              onChange={handleChange}
              className="input"
              required
            />
          </div>
        </div>

        {/* Member 2 (Optional) */}
        <div className="mb-4">
          <h3 className="text-xl font-semibold mb-2">Member 2 (Optional)</h3>
          <div className="mb-2">
            <label htmlFor="member2Name" className="block mb-1">Name</label>
            <input
              type="text"
              name="member2Name"
              value={formData.member2Name}
              onChange={handleChange}
              className="input"
            />
          </div>
          <div className="mb-2">
            <label htmlFor="member2Email" className="block mb-1">Email</label>
            <input
              type="email"
              name="member2Email"
              value={formData.member2Email}
              onChange={handleChange}
              className="input"
            />
          </div>
        </div>

        {/* Member 3 (Optional) */}
        <div className="mb-4">
          <h3 className="text-xl font-semibold mb-2">Member 3 (Optional)</h3>
          <div className="mb-2">
            <label htmlFor="member3Name" className="block mb-1">Name</label>
            <input
              type="text"
              name="member3Name"
              value={formData.member3Name}
              onChange={handleChange}
              className="input"
            />
          </div>
          <div className="mb-2">
            <label htmlFor="member3Email" className="block mb-1">Email</label>
            <input
              type="email"
              name="member3Email"
              value={formData.member3Email}
              onChange={handleChange}
              className="input"
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary w-full">
          Register Team
        </button>
      </form>
    </div>
  );
}

export default Register;
