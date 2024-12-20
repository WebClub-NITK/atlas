import axios from 'axios'

const API_URL = 'https://api.ctfplatform.com'

export const getTeams = async (token) => {
  const response = await axios.get(`${API_URL}/teams`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

export const createTeam = async (teamData, token) => {
  const response = await axios.post(`${API_URL}/teams`, teamData, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

export const joinTeam = async (code, token) => {
  const response = await axios.post(`${API_URL}/teams/join`, { code }, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

