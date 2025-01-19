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

export const fetchChallenge = async (challengeId, token) => {
  // try {
  //   const response = await fetch(`${API_URL}/api/challenges/${challengeId}/`, {
  //     method: 'GET',
  //     headers: {
  //       'Authorization': `Bearer ${token}`,
  //       'Content-Type': 'application/json',
  //     },
  //   });

  //   if (!response.ok) {
  //     throw new Error('Failed to fetch challenge');
  //   }

  //   return await response.json();
  // } catch (error) {
  //   throw new Error(error.message);
  // }
  return {
    id: 1,
    name: 'Challenge 1',
    description: 'Description of Challenge 1',
    category: 'Web',
    points: 100,
    docker: false,
    no_of_tries: 5,
    link: 'www.google.com',
  }
};

