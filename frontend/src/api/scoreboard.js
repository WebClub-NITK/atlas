import apiClient from './config';

export const getScoreboard = async () => {
  try {
    const response = await apiClient.get('/scoreboard');
    return response.data;
  } catch (error) {
    console.error('Error fetching scoreboard:', error);
    throw error;
  }
};


