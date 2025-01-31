import apiClient from './config';

// For Team Routes

export const getTeamProfile = async () => {
  try{
    const response = await apiClient.get('/teams/profile');
    return response.data;
  }catch (error){
    console.error('Error fetching team profile:', error);
    throw error;
  }
};

export const addTeamMember = async (name, email) => {
  try {
    const response = await apiClient.post('/teams/members/add', {
      name,
      email,
    });
    return response.data;
  } catch (error) {
    console.error('Error adding team member:', error);
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
export const createTeam = async (teamData) => {
  try {
    const response = await apiClient.post('/teams/create', teamData);
    return response.data;
  } catch (error) {
    console.error('Error creating team:', error);
    throw error;
  }
};

// Update team
export const updateTeam = async (teamId, teamData) => {
  try {
    const response = await apiClient.patch(`/teams/${teamId}`, teamData);
    return response.data;
  } catch (error) {
    console.error('Error updating team:', error);
    throw error;
  }
};

// Delete team
export const deleteTeam = async (teamId) => {
  try {
    await apiClient.delete(`/teams/${teamId}`);
    return true;
  } catch (error) {
    console.error('Error deleting team:', error);
    throw error;
  }
};

// Bulk update teams
export const bulkUpdateTeams = async (teamIds, updateData) => {
  try {
    const response = await apiClient.patch('/teams/bulk-update', {
      teamIds,
      ...updateData
    });
    return response.data;
  } catch (error) {
    console.error('Error bulk updating teams:', error);
    throw error;
  }
};