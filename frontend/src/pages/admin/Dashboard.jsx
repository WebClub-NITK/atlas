import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../../api/admin';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useTheme } from '../../context/ThemeContext';
import SubmissionChart from '../../components/SubmissionChart';

function AdminDashboard() {
  const { isDarkMode } = useTheme();

  const [stats, setStats] = useState({
    teams: {
      total: 0,
      active: 0
    },
    challenges: {
      total: 0,
      active: 0,
      solved: 0
    },
    containers: {
      total: 0,
      running: 0
    },
    submissions: {
      total: 0,
      correct: 0,
      last_24h: 0
    },
    submission_timeline: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        setError('Failed to fetch dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">{error}</div>;
  
  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--color-accent)' }}>Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/admin/teams" className="block">
          <div className="p-6 rounded-lg shadow-md transition-transform hover:scale-105" style={{ backgroundColor: 'var(--color-secondary)' }}>
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-primary)' }}>Teams</h2>
            <p className="text-4xl font-bold" style={{ color: 'var(--color-accent)' }}>{stats.teams.total}</p>
            <p className="mt-2 text-gray-400">Manage teams →</p>
          </div>
        </Link>

        <Link to="/admin/challenges" className="block">
          <div className="p-6 rounded-lg shadow-md transition-transform hover:scale-105" style={{ backgroundColor: 'var(--color-secondary)' }}>
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-primary)' }}>Challenges</h2>
            <p className="text-4xl font-bold" style={{ color: 'var(--color-accent)' }}>{stats.challenges.total}</p>
            <p className="mt-2 text-gray-400">Manage challenges →</p>
          </div>
        </Link>

        <Link to="/admin/containers" className="block">
          <div className="p-6 rounded-lg shadow-md transition-transform hover:scale-105" style={{ backgroundColor: 'var(--color-secondary)' }}>
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-primary)' }}>Containers</h2>
            <p className="text-4xl font-bold" style={{ color: 'var(--color-accent)' }}>{stats.containers.running}</p>
            <p className="mt-2 text-gray-400">Manage containers →</p>
          </div>
        </Link>
        <Link to="/admin/theme" className="block">
          <div className="p-6 rounded-lg shadow-md transition-transform hover:scale-105" style={{ backgroundColor: 'var(--color-secondary)' }}>
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-primary)' }}>Theme Settings</h2>
            <p className="text-4xl font-bold" style={{ color: 'var(--color-accent)' }}>⚙️</p>
            <p className="mt-2 text-gray-400">Customize branding →</p>
          </div>
        </Link>
      </div>
      {stats.submission_timeline && stats.submission_timeline.length > 0 && (
        <SubmissionChart data={stats.submission_timeline} />
      )}
    </div>
  );
}

export default AdminDashboard;