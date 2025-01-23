import apiClient from './config';

export const getChallengeSubmissions = async (challengeId) => {
  try {
    const response = await apiClient.get(`/challenges/${challengeId}/submissions`);
    return response.data;
  } catch (error) {
    console.error('Error fetching submissions:', error);
    throw error;
  }
};