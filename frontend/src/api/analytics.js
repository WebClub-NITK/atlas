import apiClient from "./config";

// Analytics API functions
export const analyticsAPI = {
  // Get team progress analytics
  getTeamProgress: async () => {
    try {
      const response = await apiClient.get("api/analytics/team_progress/");
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch team progress: ${error.message}`);
    }
  },

  // Get challenge solve rates
  getChallengeSolveRates: async () => {
    try {
      const response = await apiClient.get("api/analytics/challenge_solve_rates/");
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch challenge solve rates: ${error.message}`);
    }
  },

  // Get submission timeline
  getSubmissionTimeline: async () => {
    try {
      const response = await apiClient.get("api/analytics/submission_timeline/");
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch submission timeline: ${error.message}`);
    }
  },

  // Get user contributions
  getUserContributions: async () => {
    try {
      const response = await apiClient.get("api/analytics/user_contributions/");
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch user contributions: ${error.message}`);
    }
  },

  // Get category analytics
  getCategoryAnalytics: async () => {
    try {
      const response = await apiClient.get("api/analytics/category_analytics/");
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch category analytics: ${error.message}`);
    }
  },

  // Get time-based analytics
  getTimeBasedAnalytics: async () => {
    try {
      const response = await apiClient.get("api/analytics/time_based_analytics/");
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch time-based analytics: ${error.message}`);
    }
  },

  // Get dashboard summary
  getDashboardSummary: async () => {
    try {
      const response = await apiClient.get("api/analytics/dashboard_summary/");
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch dashboard summary: ${error.message}`);
    }
  },

  // Batch fetch multiple analytics (for initial page load)
  getAllAnalytics: async () => {
    try {
      const [dashboardSummary, teamProgress, challengeSolveRates, categoryAnalytics, timeBasedAnalytics, leaderboard] =
        await Promise.all([
          analyticsAPI.getDashboardSummary(),
          analyticsAPI.getTeamProgress(),
          analyticsAPI.getChallengeSolveRates(),
          analyticsAPI.getCategoryAnalytics(),
          analyticsAPI.getTimeBasedAnalytics(),
        ]);

      return {
        dashboardSummary,
        teamProgress,
        challengeSolveRates,
        categoryAnalytics,
        timeBasedAnalytics,
      };
    } catch (error) {
      throw new Error(`Failed to fetch analytics data: ${error.message}`);
    }
  },

  getUserTeamProgress: async () => {
    try {
      const response = await apiClient.get("api/analytics/user-team-progress/");
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  getTeamMemberContributions: async () => {
    try {
      const response = await apiClient.get("api/analytics/team-member-contributions/");
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },
};

export default analyticsAPI;
