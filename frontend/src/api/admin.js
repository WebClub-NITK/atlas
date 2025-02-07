import apiClient from './config';

export const getDashboardStats = async () => {
  try {
    const response = await apiClient.get('/api/admin/dashboard/stats');
    return response.data;
  } catch (error) {
    // Return mock data when API fails
    return {
      totalTeams: 0,
      totalChallenges: 0, 
      activeContainers: 0
    };
  }
};  