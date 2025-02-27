import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getTeamProfile, getTeamSubmissions } from '../../api/teams';
import LoadingSpinner from '../../components/LoadingSpinner';

function TeamProfile() {
  const { user } = useAuth();
  const [teamProfile, setTeamProfile] = useState({
    name: '',
    team_email: '', 
    total_score: 0,
    members: []
  });
  const [submissions, setSubmissions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch team profile and submissions in parallel
        const [profile, submissionData] = await Promise.all([
          getTeamProfile(),
          getTeamSubmissions()
        ]);

        setTeamProfile(profile);
        
        // Transform submission data to match expected format
        const formattedSubmissions = Object.values(submissionData).map(sub => ({
          challenge_name: sub.challenge_name,
          points: sub.points_awarded,
          is_correct: sub.is_solved,
          submitted_at: sub.attempts[0]?.timestamp || null,
          attempts: sub.attempts
        }));

        setSubmissions(formattedSubmissions);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch team data');
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-4xl font-bold mb-8 text-red-500">Team Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Team Information */}
        <div className="bg-[#FFF7ED] rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-neutral-900">Team Information</h2>
          <div className="space-y-4">
            <p className="text-lg">
              <strong>Team Name:</strong> {teamProfile.name}
            </p>
            <p className="text-lg">
              <strong>Team Email:</strong> {teamProfile.team_email}
            </p>
            <p className="text-lg">
              <strong>Total Score:</strong> {teamProfile.total_score}
            </p>
          </div>

          <h3 className="text-xl font-semibold mt-6 mb-4">Team Members</h3>
          <div className="bg-white rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Name</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {teamProfile.members?.map((member, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm text-gray-900">{member.username}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{member.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Submissions History */}
        <div className="bg-[#FFF7ED] rounded-lg shadow-lg p-6 overflow-x-auto"> {/* Added overflow-x-auto */}
          <h2 className="text-2xl font-semibold mb-4 text-neutral-900">Submission History</h2>
          <div className="bg-white rounded-lg overflow-x-auto"> {/* Added overflow-x-auto */}
            <table className="w-full whitespace-nowrap"> {/* Added whitespace-nowrap */}
              <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Challenge</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Points</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Submitted At</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Attempts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {submissions.map((submission, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 text-sm text-gray-900">{submission.challenge_name}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{submission.points}</td>
                  <td className="px-4 py-2 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      submission.is_correct 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {submission.is_correct ? 'Correct' : 'Incorrect'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {submission.attempts?.length || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      </div>
    </div>
  );
}

export default TeamProfile;