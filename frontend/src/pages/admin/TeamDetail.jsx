import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getTeamById } from '../../data/dummyTeams';
import AddMemberModal from './AddMemberModal';

function TeamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(getTeamById(id));
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  if (!team) {
    return <div>Team not found</div>;
  }

  const totalTeamPoints = team.users.reduce((sum, user) => sum + user.points, 0);

  const handleAddMembers = (newMembers) => {
    setTeam({
      ...team,
      users: [...team.users, ...newMembers],
      memberCount: team.memberCount + newMembers.length
    });
  };

  const handleRemoveMember = (userId) => {
    if (window.confirm('Are you sure you want to remove this member? Their challenge solves will remain with the team.')) {
      // TODO: Backend integration - Remove user from team
      //  DELETE /api/teams/{teamId}/members/{userId}
      
      setTeam({
        ...team,
        users: team.users.filter(user => user.id !== userId),
        memberCount: team.memberCount - 1
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">{team.name}</h1>
          <div className="text-gray-600 mb-2">
            Members: {team.memberCount} | Points: {totalTeamPoints} | Place: #{team.place}
          </div>
          
          <div className="flex justify-center space-x-2 mb-4">
            {team.isHidden && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Hidden</span>
            )}
            {team.isBanned && (
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded">Banned</span>
            )}
          </div>

          <div className="flex justify-center space-x-4">
            <button 
              onClick={() => setShowEditModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Edit Team
            </button>
            <button 
              onClick={() => setShowAddMemberModal(true)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Add Member
            </button>
            <button 
              onClick={() => {
                // TODO: Add delete confirmation
                navigate('/admin/teams');
              }}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Delete Team
            </button>
          </div>
        </div>

        {/* Team Members Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Team Members</h2>
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">User</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Points</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {team.users.map(user => (
                <tr key={user.id} className="border-t">
                  <td className="px-4 py-2">
                    <Link 
                      to={`/admin/users/${user.id}`}
                      className="text-blue-500 hover:underline"
                    >
                      {user.username}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{user.email}</td>
                  <td className="px-4 py-2">{user.points}</td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => handleRemoveMember(user.id)}
                      className="text-red-500 hover:text-red-700"
                      title="Remove member"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-5 w-5" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Solves Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Solves</h2>
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">Challenge</th>
                <th className="px-4 py-2 text-left">Category</th>
                <th className="px-4 py-2 text-left">Points</th>
                <th className="px-4 py-2 text-left">Solved By</th>
                <th className="px-4 py-2 text-left">Solved At</th>
              </tr>
            </thead>
            <tbody>
              {team.solvedChallenges.map(challenge => (
                <tr key={challenge.id} className="border-t">
                  <td className="px-4 py-2">{challenge.name}</td>
                  <td className="px-4 py-2">{challenge.category}</td>
                  <td className="px-4 py-2">{challenge.points}</td>
                  <td className="px-4 py-2">
                    <Link 
                      to={`/admin/users/${challenge.solvedBy.id}`}
                      className="text-blue-500 hover:underline"
                    >
                      {challenge.solvedBy.username}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{new Date(challenge.solvedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddMemberModal && (
        <AddMemberModal
          onClose={() => setShowAddMemberModal(false)}
          onAdd={handleAddMembers}
          currentTeamId={team.id}
        />
      )}
    </div>
  );
}

export default TeamDetail; 