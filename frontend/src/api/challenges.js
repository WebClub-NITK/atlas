import apiClient from './config';

export const getChallenges = async () => {
  const response = await apiClient.get('/challenges');
  return response.data;
};

export const submitFlag = async (challengeId, flag) => {
  const response = await apiClient.post(`/challenges/${challengeId}/submit`, {
    flag_submitted: flag,
  });
  return response.data;
};

export const startChallenge = async (challengeId) => {
  const response = await apiClient.post(`/challenges/${challengeId}/start`);
  return {
    container: response.data.container,
    port: response.data.port,
    status: response.data.status,
  };
};
