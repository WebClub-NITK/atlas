import apiClient from './config';

export const getTeams = async () => {
  try {
    const response = await apiClient.get('/teams');
    return response.data;
  } catch (error) {
    console.error('Error fetching teams:', error);
    throw error;
  }
};

export const createTeam = async (teamData) => {
  try {
    const response = await apiClient.post('/teams/create', {
      name: teamData.name,
      description: teamData.description,
      max_members: teamData.maxMembers,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating team:', error);
    throw error;
  }
};

export const joinTeam = async (teamId) => {
  try {
    const response = await apiClient.post('/teams/join', {
      team_id: teamId,
    });
    return response.data;
  } catch (error) {
    console.error('Error joining team:', error);
    throw error;
  }
};

export const leaveTeam = async () => {
  try {
    const response = await apiClient.post('/teams/leave');
    return response.data;
  } catch (error) {
    console.error('Error leaving team:', error);
    throw error;
  }
};

export const getTeamProfile = async () => {
  try {
    const response = await apiClient.get('/teams/profile');
    return response.data;
  } catch (error) {
    console.error('Error fetching team profile:', error);
    throw error;
  }
};
