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

export const getChallengeById_Team = async (challengeId) => {
  try {
    const response = await apiClient.get(`/challenges/${challengeId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching challenge:', error);
    throw error;
  }
}


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
  try{
    const response=await apiClient.post(`/challenges/${challengeId}/start`,{
      challengeId
    });
    return response.data;
  }catch(error){
    console.error("Failed to start container");
    throw error;
  }
};

// Admin challenge APIs
export const getAdminChallenges = async () => {
  try {
    const response = await apiClient.get('api/admin/challenges');
    return response.data;
  } catch (error) {
    console.error('Error fetching admin challenges:', error);
    throw error;
  }
};

export const createChallenge = async (challengeData) => {
  try {
    const response = await apiClient.post('api/admin/challenges/create', challengeData);
    return response.data;
  } catch (error) {
    console.error('Error creating challenge:', error);
    throw error;
  }
};


export const updateChallenge = async (challengeId, challengeData) => {
  try {
    const response = await apiClient.patch(
      `api/admin/challenges/${challengeId}/update`,
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
    const response = await apiClient.delete(`api/admin/challenges/${challengeId}/delete`);
    return response.data;
  } catch (error) {
    console.error('Error deleting challenge:', error);
    throw error;
  }
};

export const getChallengeById = async (challengeId) => {
  try {
    const response = await apiClient.get(`api/admin/challenges/${challengeId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching challenge:', error);
    throw error;
  }
};



export const getChallengeSubmissions = async (challengeId) => {
  try {
    const response = await apiClient.get(`/api/admin/challenges/${challengeId}/submissions`);
    return response.data;
  } catch (error) {
    console.error('Error fetching challenge submissions:', error);
    throw error;
  }
};

export const purchaseHint = async (challengeId, hintIndex) => {
  try {
    const response = await apiClient.post(`/challenges/${challengeId}/hints/${hintIndex}/purchase`);
    return response.data;
  } catch (error) {
    console.error('Error purchasing hint:', error);
    throw error;
  }
};