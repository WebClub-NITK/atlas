import { API_URL } from './config';
import axios from 'axios';

export const getScoreboard = async (token) => {
  const response = await axios.get(`${API_URL}/scoreboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getTeams = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/teams`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching teams:', error);
    throw error;
  }
};
