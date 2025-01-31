import apiClient from './config';

// Get all containers
export const getContainers = async () => {
  try {
    
    const response = await apiClient.get('/admin/containers');
    return response.data;
  } catch (error) {
    console.error('Error fetching containers:', error);
    return []; // Return empty array on error
  }
};

// Stop a container
export const stopContainer = async (containerId) => {
  try {
    const response = await apiClient.post(`/admin/containers/${containerId}/stop`);
    return response.data;
  } catch (error) {
    console.error('Error stopping container:', error);
    throw error;
  }
};

// Start a container
export const startContainer = async (containerId) => {
  try {
    const response = await apiClient.post(`/admin/containers/${containerId}/start`);
    return response.data;
  } catch (error) {
    console.error('Error starting container:', error);
    throw error;
  }
};

// Delete a container
export const deleteContainer = async (containerId) => {
  try {
    const response = await apiClient.delete(`/admin/containers/${containerId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting container:', error);
    throw error;
  }
};