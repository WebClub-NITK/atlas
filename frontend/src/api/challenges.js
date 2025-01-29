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

const mockSSHDetails = {
  host: "challenge.example.com",
  port: "2222",
  username: "ctf-user",
  password: "challenge-password"
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
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockSSHDetails;
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

export const updateChallenge = async (challengeData, challengeId) => {
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

const mockSubmissions = [
  {
    id: 1,
    userId: 1,
    teamId: 1,
    flag_submitted: "flag{test}",
    is_correct: true,
    timestamp: new Date().toISOString(),
    user: {
      id: 1,
      email: "user@test.com"
    },
    team: {
      id: 1,
      name: "Test Team"
    }
  }
];

export const getChallengeSubmissions = async (challengeId) => {
  try {
    const response = await apiClient.get(`/api/admin/challenges/${challengeId}/submissions`);
    return response.data;
  } catch (error) {
    console.error('Error fetching challenge submissions:', error);
    console.log('Falling back to mock data');
    return mockSubmissions;
  }
};