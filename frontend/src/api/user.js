import apiClient from './config';

// Get user profile
export const getUserProfile = async () => {
  try {
    const response = await apiClient.get('/user/profile');
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

// Update user information
export const updateUserInfo = async (data) => {
  try {
    const response = await apiClient.put('/user/profile', data);
    return response.data;
  } catch (error) {
    console.error('Error in updateUserInfo:', error);
    throw error;
  }
};

// Get team history for the user
export const getTeamHistory = async () => {
  try {
    const response = await apiClient.get('/user/team/history');
    return response.data;
  } catch (error) {
    console.error('Error in getTeamHistory:', error);
    throw error;
  }
};

export const leaveTeam = async () => {
  const response = await apiClient.post('/teams/leave');
  return response.data;
};
