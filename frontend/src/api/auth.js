import apiClient from './config';

export const register = async (username, email, password) => {
  console.log('Registering user:', username, email, password);
  const response = await apiClient.post('/auth/register', {
    username,
    email,
    password,
  });
  console.log('Response:', response);
  return response.data;
};

export const login = async (email, password) => {
  const response = await apiClient.post('/auth/login', {
    email,
    password,
  });
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
