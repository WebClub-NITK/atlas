import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getTeamProfile, getTeamSubmissions, leaveTeam } from '../../api/teams';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate, Link } from "react-router-dom";

function TeamProfile() {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [teamProfile, setTeamProfile] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAccessCode, setShowAccessCode] = useState(false);
  const navigate = useNavigate();
  const [needsTeam, setNeedsTeam] = useState(false);

  useEffect(() => {
    console.log("TeamProfile: Component mounted or user updated. User object from context:", user);
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      console.log("TeamProfile: fetchData effect triggered. Current user:", user);
      setLoading(true);
      setNeedsTeam(false);
      setError('');

      if (!user || (!user.teamId && !user.team_id)) {
        console.warn('TeamProfile: User object missing or no team ID found. Setting needsTeam state.');
        setNeedsTeam(true);
        setLoading(false);
        return;
      }

      console.log("TeamProfile: User has team info, proceeding to fetch profile and submissions.");
      try {
        const [profile, submissionData] = await Promise.all([
          getTeamProfile(),
          getTeamSubmissions()
        ]);
        console.log("TeamProfile: Fetched profile:", profile);
        console.log("TeamProfile: Fetched submissions:", submissionData);

        setTeamProfile(profile);

        const formattedSubmissions = Object.values(submissionData || {}).map(sub => ({
          challenge_name: sub.challenge_name,
          points: sub.points_awarded,
          is_correct: sub.is_solved,
          submitted_at: sub.attempts?.[0]?.timestamp || null,
          attempts: sub.attempts
        }));
        console.log("TeamProfile: Formatted submissions:", formattedSubmissions);
        setSubmissions(formattedSubmissions);

      } catch (err) {
        console.error("TeamProfile: Error fetching team data (profile/submissions):", err.response?.data || err.message);
        if (err.response?.status === 403 || err.response?.status === 401) {
           console.warn("TeamProfile: Received 403/401 error, potentially invalid token or permissions issue.");
           setError("Could not fetch team data. Please try logging in again.");
        } else {
           console.error("TeamProfile: Non-auth related error fetching data.");
           setError(`Failed to load team data: ${err.response?.data?.error || err.message}`);
        }
        setTeamProfile(null);
      } finally {
        setLoading(false);
        console.log("TeamProfile: fetchData finished.");
      }
    };

    fetchData();
  }, [user]);

  const handleLeaveTeam = async () => {
    if (!window.confirm("Are you sure you want to leave this team?")) {
      return;
    }
    try {
      await leaveTeam();
      navigate("/team-setup");
    } catch (error) {
      console.error("Failed to leave team:", error);
      setError("Failed to leave team. Please try again.");
    }
  };

  const copyAccessCode = () => {
    if (teamProfile?.access_code) {
      navigator.clipboard.writeText(teamProfile.access_code);
      alert("Access code copied to clipboard!");
    }
  };

  if (loading) {
    console.log("TeamProfile: Rendering LoadingSpinner.");
    return <LoadingSpinner />;
  }

  if (needsTeam) {
    console.log("TeamProfile: Rendering 'needs team' prompt.");
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="bg-yellow-100 p-6 rounded-lg shadow-md text-yellow-800">
          <h2 className="text-xl font-semibold mb-4">No Team Found</h2>
          <p className="mb-4">You need to be part of a team to view the team profile.</p>
          <Link
            to="/team-setup"
            className="inline-block px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Create or Join a Team
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    console.log("TeamProfile: Rendering error state:", error);
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 p-4 rounded-md text-red-700 mb-4">{error}</div>
      </div>
    );
  }

  if (!teamProfile) {
    console.log("TeamProfile: Rendering 'failed to load' state (profile empty after fetch attempt).");
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-orange-100 p-4 rounded-md text-orange-700 mb-4">
          Could not load team profile data. Please try refreshing the page.
        </div>
      </div>
    );
  }

  console.log("TeamProfile: Rendering main profile content. Team Profile data:", teamProfile);
  const isTeamOwner = user?.id === teamProfile?.team_owner?.id;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-4xl font-bold mb-8 text-red-500">Team Profile</h1>

      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      <div className="bg-[#FFF7ED] rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-neutral-900">Team Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-neutral-900">
          <div className="text-lg">
            <strong>Team Name:</strong> {teamProfile.name}
          </div>
          <div className="text-lg">
            <strong>Team Email:</strong> {teamProfile.team_email}
          </div>
          <div className="text-lg">
            <strong>Total Score:</strong> {teamProfile.total_score}
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h3 className="text-lg font-medium mb-2 text-gray-800">Team Access Code</h3>
          <div className="flex items-center">
            <div className="relative flex-1">
              <input 
                type={showAccessCode ? "text" : "password"} 
                value={teamProfile.access_code || ""}
                readOnly
                className="w-full p-2 border border-gray-300 rounded pr-20"
              />
              <button
                onClick={() => setShowAccessCode(!showAccessCode)}
                className="absolute right-20 top-2 text-blue-500 hover:text-blue-700"
              >
                {showAccessCode ? "Hide" : "Show"}
              </button>
              <button
                onClick={copyAccessCode}
                className="absolute right-2 top-2 text-blue-500 hover:text-blue-700"
              >
                Copy
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {isTeamOwner 
              ? "Share this code with others to invite them to your team." 
              : "This is your team's access code."}
          </p>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold mt-6 mb-4 text-neutral-900">Team Members</h3>
        </div>

        <div className="bg-white rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Name</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Email</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {teamProfile.members?.map((member, index) => (
                <tr key={member.id || index}>
                  <td className="px-4 py-2 text-sm text-gray-900">{member.username}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{member.email}</td>
                  <td className="px-4 py-2 text-sm">
                    {member.is_owner ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        Owner
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                        Member
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-[#FFF7ED] rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 text-neutral-900">Submission History</h2>
        <div className="bg-white rounded-lg overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Challenge</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Points</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Submitted At</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">All Attempts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {submissions.length > 0 ? (
                submissions.map((submission, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm text-gray-900">{submission.challenge_name}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{submission.points}</td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        submission.is_correct 
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {submission.is_correct ? "Correct" : "Incorrect"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : "N/A"}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {submission.attempts && submission.attempts.length > 0 ? (
                        <div className="max-h-24 overflow-y-auto text-xs">
                          {submission.attempts.map((attempt, idx) => (
                            <div key={idx} className="mb-1 px-1 py-0.5 hover:bg-gray-50 rounded">
                              {new Date(attempt.timestamp).toLocaleString()}
                            </div>
                          ))}
                        </div>
                      ) : (
                        "No attempts recorded"
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-4 py-6 text-sm text-gray-500 text-center">
                    No submissions yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-gray-200">
        <button
          onClick={handleLeaveTeam}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Leave Team
        </button>
      </div>
    </div>
  );
}

export default TeamProfile;