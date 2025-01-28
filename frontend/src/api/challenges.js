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

// const mockChallenges = [
//   {
//     id: 1,
//     name: "Basic Buffer Overflow",
//     category: "PWN",
//     description: "Can you overflow this basic buffer?",
//     points: 500,
//     no_of_tries: 0,
//     docker: true,
//     link: null,
//     challengeStarted: false

//   },
//   {
//     id: 2,
//     name: "Web Authentication Bypass",
//     category: "Web", 
//     description: "Find a way to bypass the authentication mechanism.",
//     points: 300,
//     no_of_tries: 0,
//     docker: false,
//     link: "http://challenge.example.com/web-auth"
//   },
//   {
//     id: 3,
//     name: "Simple Cryptography",
//     category: "Crypto",
//     description: "Basic cryptography challenge to test your skills.",
//     points: 200,
//     no_of_tries: 0,
//     docker: false,
//     link: "http://challenge.example.com/crypto"
//   }
// ];


// Mock SSH details for docker challenges
const mockSSHDetails = {
  host: "challenge.example.com",
  port: "2222",
  username: "ctf-user",
  password: "challenge-password"
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

// export const startChallenge = async (challengeId) => {
//   try {
//     const response = await apiClient.post(`/challenges/${challengeId}/start`);
//     return response.data;
//   } catch (error) {
//     console.error('Error starting challenge:', error);
//     throw error;
//   }
// };

export const startChallenge = async (challengeId) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockSSHDetails;
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
