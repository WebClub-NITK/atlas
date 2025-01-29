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

// Used For Admin Routes

export const deleteTeams = async (teamIds) => {
  try {
    const response = await apiClient.delete('/teams/bulk-delete', {
      data: { teamIds }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting teams:', error);
    // Mock successful deletion for now
    return true; 
  }
};

export const getTeams = async () => {
  try {
    const response = await apiClient.get('/teams');
    return response.data;
  } catch (error) {
    
    console.log('Falling back to mock data');
    return dummyTeams;
  }
};

// Create new team 
export const createTeam = async (teamData) => {
  try {
    const response = await apiClient.post('/teams/create', teamData);
    return response.data;
  } catch (error) {
    console.error('Error creating team:', error);
    // Mock successful creation
    return {
      id: Date.now(),
      ...teamData
    };
  }
};

// Update team
export const updateTeam = async (teamId, teamData) => {
  try {
    const response = await apiClient.patch(`/teams/${teamId}`, teamData);
    return response.data;
  } catch (error) {
    console.error('Error updating team:', error);
    return {
      id: teamId,
      ...teamData 
    };
  }
};

// Delete team
export const deleteTeam = async (teamId) => {
  try {
    await apiClient.delete(`/teams/${teamId}`);
    return true;
  } catch (error) {
    console.error('Error deleting team:', error);
    return true; // Mock successful deletion
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
    return teamIds.map(id => ({
      id,
      ...updateData
    }));
  }
};