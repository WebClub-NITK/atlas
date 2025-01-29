import apiClient from './config';

export const getDashboardStats = async () => {
  try {
    const response = await apiClient.get('/api/admin/dashboard/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    console.log('Falling back to mock data');
    // Mock stats
    return {
      totalTeams: 1,
      totalChallenges: 1, 
      activeContainers: 1
    };
  }
};