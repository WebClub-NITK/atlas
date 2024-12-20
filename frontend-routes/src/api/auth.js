import axios from 'axios'

const API_URL = 'https://api.ctfplatform.com'

export const register = async (username, email, password) => {
  const response = await axios.post(`${API_URL}/auth/register`, { username, email, password })
  return response.data
}

export const login = async (email, password) => {
  const response = await axios.post(`${API_URL}/auth/login`, { email, password })
  return response.data
}

export const requestPasswordReset = async (email) => {
  const response = await axios.post(`${API_URL}/auth/forgot-password`, { email })
  return response.data
}

export const resetPassword = async (token, newPassword) => {
  const response = await axios.post(`${API_URL}/auth/reset-password`, {
    token,
    newPassword
  })
  return response.data
}

