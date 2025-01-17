import axios from 'axios';
import { API_URL } from './config';
import apiClient from './config';


export const submitFlag = async (challengeId, flag, token) => {
  const response = await axios.post(
    `${API_URL}/challenges/${challengeId}/submit`,
    { flag },
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return response.data;
};


export const startChallenge = async (challengeId, token) => {
  const response = await axios.post(
    `${API_URL}/challenges/${challengeId}/start`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return response.data;
}

//Get all the challenges 
export const getChallenges = async () => {
  const response = await apiClient.get('/challenges')
  console.log('The response is', response)
  return response.data
}

//Get a challenge by id
export const getChallengeById = async (id)=>{
  const response = await apiClient.get(`/challenges/${id}`)
  console.log('The response is', response)
  return response.data
}

//Create a challenge
export const createChallenge = async (challengeData) => {
  console.log('The challenge data is', challengeData);
  
  // No need to manually set headers here as the interceptor will handle it
  const response = await apiClient.post('/challenges/create', challengeData);
  
  console.log('The response is', response);
  return response.data;
};

//Update a challenge
export const updateChallenge = async(request, challengeId) => {
  console.log('The request for updating is ', request)
  const response = await apiClient.patch(`/challenges/${challengeId}/update`, request)
  console.log('The response is', response)
  return response.data

}

//Delete a challenge
export const deleteChallenge = async(challengeId) => {
  const response = await apiClient.delete(`/challenges/${challengeId}/delete`)
  console.log('The response is', response)
  return response.data
}

