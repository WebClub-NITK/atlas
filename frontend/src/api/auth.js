import apiClient from './config';

export const login = async (username, password) => {
  try {
    const response = await apiClient.post('/auth/login', {
      username,
      password
    });
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
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
  // console.log('Admin login');
  // console.log(email)
  // console.log(password)
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
