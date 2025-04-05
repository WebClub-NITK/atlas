import apiClient from './config';

export const getDashboardStats = async () => {
  try {
    const response = await apiClient.get('/api/admin/dashboard/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

export const adminLogin = async (email, password) => {
  try {
    const response = await apiClient.post('/auth/admin/login', {
      email,
      password
    });
    return response.data;
  } catch (error) {
    console.error('Admin login error:', error);
    throw error;
  }
};  