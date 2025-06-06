import apiClient from './config';

// For Team Routes

export const getTeamProfile = async () => {
  try{
    const response = await apiClient.get('/teams/status');
    console.log(response.data);
    return response.data['team'];
  }catch (error){
    console.error('Error fetching team profile:', error);
    throw error;
  }
};

export const getTeamSubmissions = async () => {
  try {
    const response = await apiClient.get('/teams/submissions');
    return response.data;
  } catch (error) {
    console.error('Error fetching team submissions:', error);
    throw error;
  }
};

export const createTeam = async (teamData) => {
  console.log('Creating team:', teamData);
  try {
    const response = await apiClient.post('/teams/create', teamData);
    return response.data;
  } catch (error) {
    console.error('Error creating team:', error);
    throw error;
  }
};

export const joinTeam = async (accessCode) => {
  console.log('Joining team with access code:', accessCode);
  try {
    const response = await apiClient.post('/teams/join', { access_code: accessCode });
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

export const getTeamStatus = async () => {
  try {
    const response = await apiClient.get('/teams/status');
    return response.data;
  } catch (error) {
    console.error('Error getting team status:', error);
    throw error;
  }
};

export const updateTeamInfo = async (teamData) => {
  try {
    const response = await apiClient.post('/teams/update', teamData);
    return response.data;
  } catch (error) {
    console.error('Error updating team:', error);
    throw error;
  }
};

// Used For Admin Routes

export const deleteTeams = async (teamIds) => {
  try {
    const response = await apiClient.delete('/teams/bulk-delete', {
      data: { teamIds }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting teams:', error);
    throw error;
  }
};

export const getTeams = async () => {
  try {
    const response = await apiClient.get('/teams');
    return response.data;
  } catch (error) {
    console.error("Failed to fetch teams")
    throw error;
  }
};

// Create new team 
export const updateTeam = async (teamId, teamData) => {
  try {
    const formattedData = {
      name: teamData.name,
      email: teamData.email,
      is_hidden: teamData.is_hidden, 
      is_banned: teamData.is_banned, 
      ...(teamData.password && { password: teamData.password })
    };

    const response = await apiClient.patch(
      `/api/admin/teams/${teamId}/update`,
      formattedData
    );
    return response.data;
  } catch (error) {
    console.error('Error updating team:', error);
    throw error;
  }
};

// Delete team
export const deleteTeam = async (teamId) => {
  try {
    await apiClient.delete(`api/admin/teams/${teamId}/delete`);
    return true;
  } catch (error) {
    console.error('Error deleting team:', error);
    throw error;
  }
};

export const getTeamProfile_Admin = async (teamId) => {
  try {
    const response = await apiClient.get(`/api/admin/teams/${teamId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching team profile:', error);
    throw error;
  }
};

export const getTeamSubmissions_Admin = async (teamId) => {
  try {
    const response = await apiClient.get(`/api/admin/teams/${teamId}/submissions`);
    return response.data;
  } catch (error) {
    console.error('Error fetching team submissions:', error);
    throw error;
  }
};