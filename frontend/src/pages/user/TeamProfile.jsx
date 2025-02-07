import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getTeamProfile, addTeamMember } from '../../api/teams';
import LoadingSpinner from '../../components/LoadingSpinner';

function TeamProfile() {
  const { user } = useAuth();
  const [teamProfile, setTeamProfile] = useState({
    name: '',
    team_email: '',
    total_score: 0,
    members: [], 
    submissions: [] 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamProfile = async () => {
      try {
        const profile = await getTeamProfile();
        setTeamProfile(profile);
      } catch (error) {
        setError('Failed to fetch team profile');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamProfile();
  }, []);

  if (loading) return <LoadingSpinner/>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-4xl font-bold mb-8 text-red-500">Team Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[#FFF7ED] rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-neutral-900">Team Information</h2>
          <p className="text-lg mb-2">
            <strong>Team Name:</strong> {teamProfile.name}
          </p>
          <p className="text-lg mb-2">  
            <strong>Team Email:</strong> {teamProfile.team_email}
          </p>
          <p className="text-lg mb-2">
            <strong>Total Score:</strong> {teamProfile.total_score}
          </p>
          <p className="text-lg mb-4">
            <strong>Members:</strong>
          </p>
          <table className="w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Email</th>
              </tr>
            </thead>
            <tbody>
              {teamProfile.members?.map((member, index) => (
                <tr key={index} className="border-t">
                  <td className="px-4 py-2">{member.username}</td>
                  <td className="px-4 py-2">{member.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-[#FFF7ED] rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-neutral-900">Submission History</h2>
          <table className="w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Challenge</th>
                <th className="px-4 py-2 text-left">Points</th>
                <th className="px-4 py-2 text-left">Solved At</th>
              </tr>
            </thead>
            <tbody>
              {teamProfile.submissions?.map((submission, index) => (
                <tr key={index} className="border-t">
                  <td className="px-4 py-2">{submission.challenge_name}</td>
                  <td className="px-4 py-2">{submission.points}</td>
                  <td className="px-4 py-2">
                    {new Date(submission.submitted_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default TeamProfile;