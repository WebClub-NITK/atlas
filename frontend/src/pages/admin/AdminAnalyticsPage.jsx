// AdminAnalyticsPage.jsx
import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Line, Bar, Pie, Doughnut } from "react-chartjs-2";
import { analyticsAPI } from "../../api/analytics";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

const AdminAnalyticsPage = () => {
  const [analyticsData, setAnalyticsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(5);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all analytics data
  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      const data = await analyticsAPI.getAllAnalytics();
      setAnalyticsData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch time-based analytics when time range changes
  const fetchTimeBasedData = async (timeDuration) => {
    try {
      // TODO: Make this take hours as input and filter accordingly
      const timeBasedData = await analyticsAPI.getTimeBasedAnalytics();
      setAnalyticsData((prev) => ({
        ...prev,
        timeBasedAnalytics: timeBasedData,
      }));
    } catch (err) {
      console.error("Error fetching time-based analytics:", err);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchTimeBasedData(timeRange);
    }
  }, [timeRange, loading]);

  // Chart configurations
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
      },
    },
  };

  // Generate chart data
  const getTeamProgressChartData = () => {
    if (!analyticsData.teamProgress) return { labels: [], datasets: [] };

    const topTeams = analyticsData.teamProgress.slice(0, 10);
    return {
      labels: topTeams.map((team) => team.name),
      datasets: [
        {
          label: "Total Points",
          data: topTeams.map((team) => team.total_points || 0),
          backgroundColor: "rgba(59, 130, 246, 0.5)",
          borderColor: "rgba(59, 130, 246, 1)",
          borderWidth: 2,
        },
        {
          label: "Challenges Solved",
          data: topTeams.map((team) => team.solved_challenges),
          backgroundColor: "rgba(16, 185, 129, 0.5)",
          borderColor: "rgba(16, 185, 129, 1)",
          borderWidth: 2,
          yAxisID: "y1",
        },
      ],
    };
  };

  const getCategoryAnalyticsChartData = () => {
    if (!analyticsData.categoryAnalytics) return { labels: [], datasets: [] };

    return {
      labels: analyticsData.categoryAnalytics.map((cat) => cat.category),
      datasets: [
        {
          label: "Challenge Count",
          data: analyticsData.categoryAnalytics.map((cat) => cat.challenge_count),
          backgroundColor: [
            "rgba(239, 68, 68, 0.8)",
            "rgba(245, 158, 11, 0.8)",
            "rgba(34, 197, 94, 0.8)",
            "rgba(59, 130, 246, 0.8)",
            "rgba(147, 51, 234, 0.8)",
            "rgba(236, 72, 153, 0.8)",
          ],
          borderWidth: 2,
        },
      ],
    };
  };

  const getTimeBasedChartData = () => {
    if (!analyticsData.timeBasedAnalytics) return { labels: [], datasets: [] };

    return {
      labels: analyticsData.timeBasedAnalytics.map((day) => new Date(day.date).toLocaleDateString()),
      datasets: [
        {
          label: "Total Submissions",
          data: analyticsData.timeBasedAnalytics.map((day) => day.submissions),
          backgroundColor: "rgba(59, 130, 246, 0.5)",
          borderColor: "rgba(59, 130, 246, 1)",
          borderWidth: 2,
        },
        {
          label: "Correct Submissions",
          data: analyticsData.timeBasedAnalytics.map((day) => day.correct_submissions),
          backgroundColor: "rgba(16, 185, 129, 0.5)",
          borderColor: "rgba(16, 185, 129, 1)",
          borderWidth: 2,
          yAxisID: "y1",
        },
      ],
    };
  };

  const getChallengeDifficultyData = () => {
    if (!analyticsData.challengeSolveRates) return { labels: [], datasets: [] };

    const difficultyLabels = ["Easy", "Medium", "Hard", "Impossible"];
    const difficultyCounts = [0, 0, 0, 0];

    analyticsData.challengeSolveRates.forEach((challenge) => {
      if (challenge.difficulty >= 0 && challenge.difficulty < 4) {
        difficultyCounts[challenge.difficulty]++;
      }
    });

    return {
      labels: difficultyLabels,
      datasets: [
        {
          data: difficultyCounts,
          backgroundColor: [
            "rgba(34, 197, 94, 0.8)",
            "rgba(245, 158, 11, 0.8)",
            "rgba(239, 68, 68, 0.8)",
            "rgba(107, 114, 128, 0.8)",
          ],
          borderWidth: 2,
        },
      ],
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error loading analytics</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={fetchAnalytics} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { dashboardSummary } = analyticsData;

  return (
    <div className="min-h-screen bg-[#FFF7ED] p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Analytics</h1>
            <p className="text-gray-600 mt-2">Platform performance and user insights</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchAnalytics}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {refreshing ? (
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  ></path>
                </svg>
              ) : null}
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {dashboardSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-md">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Teams</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardSummary.totals.teams}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-md">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardSummary.totals.users}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-md">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Challenges</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardSummary.totals.challenges}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-md">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardSummary.totals.success_rate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Team Progress Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Team Performance</h3>
          <div className="h-80">
            <Bar
              data={getTeamProgressChartData()}
              options={{
                ...chartOptions,
                scales: {
                  y: {
                    type: "linear",
                    display: true,
                    position: "left",
                    beginAtZero: true,
                  },
                  y1: {
                    type: "linear",
                    display: true,
                    position: "right",
                    beginAtZero: true,
                    grid: {
                      drawOnChartArea: false,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Time-based Analytics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Submission Trends</h3>
          <div className="h-80">
            <Bar
              data={getTimeBasedChartData()}
              options={{
                ...chartOptions,
                scales: {
                  y: {
                    type: "linear",
                    display: true,
                    position: "left",
                    beginAtZero: true,
                  },
                  y1: {
                    type: "linear",
                    display: true,
                    position: "right",
                    beginAtZero: true,
                    grid: {
                      drawOnChartArea: false,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* TODO: Fetch data of submissions over the whole duration of CTF and display as line chart */}

        {/* Category Analytics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Challenges by Category</h3>
          <div className="h-80">
            <Pie data={getCategoryAnalyticsChartData()} options={pieChartOptions} />
          </div>
        </div>

        {/* Challenge Difficulty Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Challenge Difficulty Distribution</h3>
          <div className="h-80">
            <Doughnut data={getChallengeDifficultyData()} options={pieChartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
