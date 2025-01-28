import apiClient from './config';

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