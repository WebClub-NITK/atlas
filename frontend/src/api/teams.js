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

const mockTeamProfile = {
  name: 'Team Alpha',
  email: 'alpha@ctf.com',
  members: [
    { name: 'Member One', email: 'member1@ctf.com' },
    { name: 'Member Two', email: 'member2@ctf.com' },
    { name: 'Member Three', email: 'member3@ctf.com' }
  ],
  submissions: [
    { challengeName: 'Challenge 1', points: 100, solvedAt: '2024-03-15' },
    { challengeName: 'Challenge 2', points: 200, solvedAt: '2024-03-16' },
    { challengeName: 'Challenge 3', points: 150, solvedAt: '2024-03-17' }
  ],
  totalPoints: 450
};

export const getTeamProfile = async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockTeamProfile;
};

export const addTeamMember = async (name, email) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  mockTeamProfile.members.push({ name, email });
  return mockTeamProfile;
};

// export const getTeamProfile = async () => {
//   try {
//     const response = await apiClient.get('/teams/profile');
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching team profile:', error);
//     throw error;
//   }
// };


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