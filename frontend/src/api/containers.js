import apiClient from './config';

// Mock container data
const mockContainers = [
  {
    id: 1,
    container_id: "abc123xyz456",
    team: {
      id: 1,
      name: "Team Alpha"
    },
    challenge: {
      id: 1,
      title: "Basic Buffer Overflow"
    },
    status: "running",
    created_at: "2024-03-20T10:00:00Z",
    ssh_host: "localhost",
    ssh_port: 2222
  },
  {
    id: 2,
    container_id: "def456uvw789",
    team: {
      id: 2,
      name: "Team Beta"
    },
    challenge: {
      id: 2,
      title: "Web Authentication Bypass"
    },
    status: "stopped",
    created_at: "2024-03-20T09:30:00Z",
    ssh_host: "localhost",
    ssh_port: 2223
  },
  {
    id: 3,
    container_id: "ghi789rst012",
    team: {
      id: 3,
      name: "Team Gamma"
    },
    challenge: {
      id: 3,
      title: "Advanced Shell Code"
    },
    status: "exited",
    created_at: "2024-03-20T09:00:00Z",
    ssh_host: "localhost",
    ssh_port: 2224
  }
];

// Get all containers
export const getContainers = async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockContainers;
};

// Stop a container
export const stopContainer = async (containerId) => {
  try {
    // When backend is ready, uncomment:
    // const response = await apiClient.post(`/admin/containers/${containerId}/stop`);
    // return response.data;
    
    // For now, return mock success
    await new Promise(resolve => setTimeout(resolve, 500));
    return { message: 'Container stopped successfully' };
  } catch (error) {
    console.error('Error stopping container:', error);
    throw error;
  }
};

// Start a container
export const startContainer = async (containerId) => {
  try {
    // When backend is ready, uncomment:
    // const response = await apiClient.post(`/admin/containers/${containerId}/start`);
    // return response.data;
    
    // For now, return mock success
    await new Promise(resolve => setTimeout(resolve, 500));
    return { message: 'Container started successfully' };
  } catch (error) {
    console.error('Error starting container:', error);
    throw error;
  }
};

// Delete a container
export const deleteContainer = async (containerId) => {
  try {
    // When backend is ready, uncomment:
    // const response = await apiClient.delete(`/admin/containers/${containerId}`);
    // return response.data;
    
    // For now, return mock success
    await new Promise(resolve => setTimeout(resolve, 500));
    return { message: 'Container deleted successfully' };
  } catch (error) {
    console.error('Error deleting container:', error);
    throw error;
  }
};