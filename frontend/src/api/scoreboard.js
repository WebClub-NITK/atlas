import apiClient from './config';

const mockTeams = [
  { id: 1, name: "Team Alpha", score: 1500 },
  { id: 2, name: "Team Beta", score: 1200 },
  { id: 3, name: "Team Gamma", score: 900 }
];

export const getScoreboard = async () => {
  // try {
  //   const response = await apiClient.get('/scoreboard');
  //   return response.data;
  // } catch (error) {
  //   console.error('Error fetching scoreboard:', error);
  //   throw error;
  // }
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Return mock data
  return mockTeams;
};

export const getTeams = async () => {
  try {
    const response = await apiClient.get('/teams');
    return response.data;
  } catch (error) {
    console.error('Error fetching teams:', error);
    throw error;
  }
};
