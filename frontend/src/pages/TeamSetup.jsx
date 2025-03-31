import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createTeam, joinTeam, getTeamStatus } from "../api/teams";
import { useAuth } from "../hooks/useAuth";
import LoadingSpinner from "../components/LoadingSpinner";

function TeamSetup() {
  const [activeTab, setActiveTab] = useState("create");
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Create team form with all required fields
  const [teamName, setTeamName] = useState("");
  const [teamEmail, setTeamEmail] = useState("");
  const [teamPassword, setTeamPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Join team form
  const [accessCode, setAccessCode] = useState("");
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    // Validate passwords match
    if (teamPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setIsSubmitting(true);
    console.log("TeamSetup: Attempting to create team with data:", { name: teamName, email: teamEmail });
    
    try {
      const response = await createTeam({
        name: teamName,
        email: teamEmail,
        password: teamPassword
      });
      
      console.log("TeamSetup: Team created successfully. API Response:", response);
      setSuccess(`Team "${response.team.name}" created successfully! Your team access code is: ${response.team.access_code}`);
      
      // *** Update AuthContext with the new token ***
      if (response.access && response.refresh) {
        console.log("TeamSetup: New token received, updating AuthContext...");
        login({ access: response.access, refresh: response.refresh });
        console.log("TeamSetup: AuthContext updated.");
      } else {
         console.warn("TeamSetup: No new token received in create team response.");
      }
      
      // Redirect to team profile after a brief delay
      setTimeout(() => {
        console.log("TeamSetup: Navigating to /team/profile after team creation.");
        navigate("/team/profile");
      }, 2000);
    } catch (err) {
      console.error("TeamSetup: Error creating team:", err.response?.data || err.message);
      const errorMessage = err.response?.data?.error || "Failed to create team. Please try again.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    console.log("TeamSetup: Attempting to join team with access code:", accessCode);
    
    try {
      const response = await joinTeam(accessCode);
      console.log("TeamSetup: Team joined successfully. API Response:", response);
      setSuccess(`Successfully joined team "${response.team.name}"!`);
      
      // *** Update AuthContext with the new token ***
      if (response.access && response.refresh) {
        console.log("TeamSetup: New token received, updating AuthContext...");
        login({ access: response.access, refresh: response.refresh });
         console.log("TeamSetup: AuthContext updated.");
      } else {
         console.warn("TeamSetup: No new token received in join team response.");
      }
      
      // Redirect to team profile after showing success message
      setTimeout(() => {
         console.log("TeamSetup: Navigating to /team/profile after joining team.");
        navigate("/team/profile");
      }, 2000);
    } catch (err) {
      console.error("TeamSetup: Error joining team:", err.response?.data || err.message);
      const errorMessage =
        err.response?.status === 400
          ? "Invalid access code or team is full."
          : err.response?.data?.error || "Failed to join team";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#FFF7ED] rounded-lg shadow-xl p-8">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-900">
          Team Setup
        </h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm">
            {success}
          </div>
        )}
        
        <div className="mb-6">
          <div className="flex w-full border-b">
            <button
              className={`w-1/2 py-3 font-medium ${
                activeTab === 'create'
                  ? 'text-white bg-blue-500 rounded-t-md border-b-2 border-blue-500'
                  : 'text-white bg-gray-700 hover:bg-gray-600 rounded-t-md'
              }`}
              onClick={() => setActiveTab('create')}
            >
              Create Team
            </button>
            <button
              className={`w-1/2 py-3 font-medium ${
                activeTab === 'join'
                  ? 'text-white bg-blue-500 rounded-t-md border-b-2 border-blue-500'
                  : 'text-white bg-gray-700 hover:bg-gray-600 rounded-t-md'
              }`}
              onClick={() => setActiveTab('join')}
            >
              Join Team
            </button>
          </div>
        </div>
        
        {activeTab === 'create' ? (
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block mb-1 font-medium text-gray-900">
                Team Name *
              </label>
              <input
                type="text"
                id="name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                placeholder="Enter a unique team name"
                required
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block mb-1 font-medium text-gray-900">
                Team Email *
              </label>
              <input
                type="email"
                id="email"
                value={teamEmail}
                onChange={(e) => setTeamEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                placeholder="team@example.com"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block mb-1 font-medium text-gray-900">
                Team Password *
              </label>
              <input
                type="password"
                id="password"
                value={teamPassword}
                onChange={(e) => setTeamPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                placeholder="Create a secure password"
                required
                minLength="8"
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block mb-1 font-medium text-gray-900">
                Confirm Password *
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                placeholder="Confirm your password"
                required
                minLength="8"
              />
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? "Creating..." : "Create Team"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoinSubmit} className="space-y-4">
            <div>
              <label htmlFor="access_code" className="block mb-1 font-medium text-gray-900">
                Team Access Code *
              </label>
              <input
                type="text"
                id="access_code"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                placeholder="Enter the access code provided by the team owner"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? "Joining..." : "Join Team"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default TeamSetup; 