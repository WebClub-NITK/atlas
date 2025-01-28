import apiClient from './config';

export const login = async (teamName, password) => {
  const response = await apiClient.post('/auth/login', {
    teamName,
    password
  });
  return response.data;
};

export const register = async (formData) => {
  const response = await apiClient.post('/auth/signup', formData);
  return response.data;
};

export const requestPasswordReset = async (email) => {
  const response = await apiClient.post('/auth/forgot-password', {
    email,
  });
  return response.data;
};

export const resetPassword = async (token, newPassword) => {
  const response = await apiClient.post('/auth/reset-password', {
    token,
    newPassword,
  });
  return response.data;
};

export const adminLogin = async (email, password) => {
  try {
    const response = await apiClient.post('/auth/admin/login', {
      email,
      password
    });
    return response.data;
  } catch (error) {
    console.error('Admin login error:', error);
    throw error;
  }
};
