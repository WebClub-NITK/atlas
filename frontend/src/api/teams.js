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
    const response = await apiClient.patch(
      `api/admin/teams/${teamId}/update`,
      teamData,
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

