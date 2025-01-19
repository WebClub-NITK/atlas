import apiClient from './config';
import axios from 'axios';
import { API_URL } from './config';

export const updateTeamInfo = async (userInfo, token) => {
    // Mocked response
  return {
    ...userInfo,
    id: 1,
    isAdmin: false,
    isVerified: true,
    teamId: 1,
  };
};

export const getTeamHistory = async (token) => {
  // Mocked response
  return {
    teamName: 'Team Alpha',
    teamScore: 1000,
    submissions: [
      { id: 1, challengeName: 'Challenge 1', points: 100, solvedAt: '2024-03-15' },
      { id: 2, challengeName: 'Challenge 2', points: 200, solvedAt: '2024-03-16' },
    ],
  };
};

