import React ,{useState,useEffect} from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../../api/admin';
import LoadingSpinner from '../../components/LoadingSpinner';

function AdminDashboard() {

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
    }
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
      <h1 className="text-3xl font-bold mb-8 text-red-500">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/admin/teams" className="block">
          <div className="bg-white p-6 rounded-lg shadow-md transition-transform hover:scale-105">
            <h2 className="text-xl font-semibold mb-2">Teams</h2>
            <p className="text-4xl font-bold text-green-600">{stats.teams.total}</p>
            <p className="text-gray-500 mt-2">Manage teams →</p>
          </div>
        </Link>
  
        <Link to="/admin/challenges" className="block">
          <div className="bg-white p-6 rounded-lg shadow-md transition-transform hover:scale-105">
            <h2 className="text-xl font-semibold mb-2">Challenges</h2>
            <p className="text-4xl font-bold text-purple-600">{stats.challenges.total}</p>
            <p className="text-gray-500 mt-2">Manage challenges →</p>
          </div>
        </Link>
  
        <Link to="/admin/containers" className="block">
          <div className="bg-white p-6 rounded-lg shadow-md transition-transform hover:scale-105">
            <h2 className="text-xl font-semibold mb-2">Containers</h2>
            <p className="text-4xl font-bold text-blue-600">{stats.containers.running}</p>
            <p className="text-gray-500 mt-2">Manage containers →</p>
          </div>
        </Link>
  
        {/* <div className="bg-white p-6 rounded-lg shadow-md transition-transform hover:scale-105">
          <h2 className="text-xl font-semibold mb-2">Submissions (24h)</h2>
          <p className="text-4xl font-bold text-orange-600">{stats.submissions.last_24h}</p>
          <p className="text-gray-500 mt-2">Recent submissions</p>
        </div> */}
      </div>
    </div>
  );
}

export default AdminDashboard;