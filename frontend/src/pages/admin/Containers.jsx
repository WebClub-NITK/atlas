import React, { useState, useEffect } from 'react';
import { getContainers, stopContainer } from '../../api/containers';
import { Link } from 'react-router-dom';

function AdminContainers() {
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchContainers();
  }, []);

  const fetchContainers = async () => {
    try {
      const data = await getContainers();
      // Ensure data is an array
      setContainers(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch containers');
      setContainers([]); // Set empty array on error
      console.error('Error fetching containers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStopContainer = async (containerId) => {
    try {
      await stopContainer(containerId);
      fetchContainers();
    } catch (err) {
      setError('Failed to stop container');
      console.error('Error stopping container:', err);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'running':
        return 'bg-green-100 text-green-800';
      case 'stopped':
        return 'bg-yellow-100 text-yellow-800';
      case 'exited':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-6"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-red-500">Containers</h1>
        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Container ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Challenge
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SSH Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {containers.length > 0 ? (
                containers.map((container) => (
                  <tr key={container.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm">{container.container_id}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/admin/teams/${container.team?.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {container.team?.name || 'N/A'}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/admin/challenges/${container.challenge?.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {container.challenge?.title || 'N/A'}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(
                          container.status
                        )}`}
                      >
                        {container.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                      <p>Host: {container.ssh_host || 'N/A'}</p>
                      <p>Port: {container.ssh_port || 'N/A'}</p>
                      <p>User: {container.ssh_user || 'N/A'}</p>
                      <p>Password: {container.ssh_password || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {container.status === 'running' && (
                        <button
                          onClick={() => handleStopContainer(container.id)}
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          Stop
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No containers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminContainers;