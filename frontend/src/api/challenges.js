import axios from 'axios';
import { API_URL } from './config';
import apiClient from './config';

export const getChallenges = async (token) => {
  const response = await axios.get(`${API_URL}/challenges`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

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