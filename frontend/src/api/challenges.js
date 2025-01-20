import apiClient from './config';
import { jwtDecode } from 'jwt-decode';

export const getChallenges = async () => {
  console.log('Token before request:', localStorage.getItem('token'));
  console.log('Sending the request with token:', jwtDecode(localStorage.getItem('token')));
  try {
    const response = await apiClient.get('/challenges');
    return response.data;
  } catch (error) {
    console.error('Challenge request error:', {
      status: error.response?.status,
      data: error.response?.data,
      headers: error.config?.headers
    });
    throw error;
  }
};

export const submitFlag = async (challengeId, flag) => {
  try {
    const response = await apiClient.post(`/challenges/${challengeId}/submit`, {
      flag_submitted: flag,
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting flag:', error);
    throw error;
  }
};

export const startChallenge = async (challengeId) => {
  try {
    const response = await apiClient.post(`/challenges/${challengeId}/start`);
    return response.data;
  } catch (error) {
    console.error('Error starting challenge:', error);
    throw error;
  }
};

// Admin challenge APIs
export const getAdminChallenges = async () => {
  try {
    const response = await apiClient.get('/challenges/admin');
    return response.data;
  } catch (error) {
    console.error('Error fetching admin challenges:', error);
    throw error;
  }
};

export const createChallenge = async (challengeData) => {
  try {
    const response = await apiClient.post('/challenges/create', challengeData);
    return response.data;
  } catch (error) {
    console.error('Error creating challenge:', error);
    throw error;
  }
};

export const updateChallenge = async (challengeData, challengeId) => {
  try {
    const response = await apiClient.patch(
      `/challenges/${challengeId}/update`, 
      challengeData
    );
    return response.data;
  } catch (error) {
    console.error('Error updating challenge:', error);
    throw error;
  }
};

export const deleteChallenge = async (challengeId) => {
  try {
    const response = await apiClient.delete(`/challenges/${challengeId}/delete`);
    return response.data;
  } catch (error) {
    console.error('Error deleting challenge:', error);
    throw error;
  }
};

export const getChallengeById = async (challengeId) => {
  try {
    const response = await apiClient.get(`/challenges/${challengeId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching challenge:', error);
    throw error;
  }
};
