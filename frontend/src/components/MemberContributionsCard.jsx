// components/analytics/MemberContributionsCard.jsx
import React, { useState, useEffect } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { analyticsAPI } from "../api/analytics";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const MemberContributionsCard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMemberContributions();
  }, []);

  const fetchMemberContributions = async () => {
    setLoading(true);
    try {
      const result = await analyticsAPI.getTeamMemberContributions();
      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to fetch member contributions data");
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="bg-[#FFF7ED] rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#FFF7ED] rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 text-neutral-900">Member Contributions</h2>
        <div className="bg-red-100 p-4 rounded-md text-red-700">{error}</div>
      </div>
    );
  }

  if (!data) return null;

  // Member points comparison chart
  const memberPointsData = {
    labels: data.members.map((member) => member.username),
    datasets: [
      {
        label: "Points Earned",
        data: data.members.map((member) => member.total_points),
        backgroundColor: data.members.map((member) => (member.is_current_user ? "#44d8efff" : "#9ca3af99")),
        borderColor: data.members.map((member) => (member.is_current_user ? "#449aefcc" : "#9ca3afff")),
        borderWidth: 1,
      },
    ],
  };

  // User's category performance
  const userCategoryData = {
    labels: data.user_category_performance.map((cat) => cat.category),
    datasets: [
      {
        label: "Your Solved Challenges",
        data: data.user_category_performance.map((cat) => cat.solved),
        borderColor: "#449aefcc",
        backgroundColor: "#44d8efff",
        borderWidth: 1,
      },
    ],
  };

  // Contribution percentage pie chart
  const contributionData = {
    labels: data.members.map((member) => member.username),
    datasets: [
      {
        data: data.members.map((member) => member.contribution_percentage),
        backgroundColor: [
          "#44d8efff",
          "#EF4444",
          "#22C55E",
          "#F59E0B",
          "#8B5CF6",
          "#06B6D4",
          "#84CC16",
          "#F97316",
        ].slice(0, data.members.length),
        borderColor: ["#449aefcc", "#DC2626", "#16A34A", "#D97706", "#7C3AED", "#0891B2", "#65A30D", "#EA580C"].slice(
          0,
          data.members.length
        ),
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: false },
    },
    scales: { y: { beginAtZero: true } },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
      title: { display: false },
    },
  };

  const getActivityBadge = (activity) => {
    if (activity === 0) return { text: "Inactive", class: "bg-red-100 text-red-800" };
    if (activity <= 5) return { text: "Low", class: "bg-yellow-100 text-yellow-800" };
    if (activity <= 15) return { text: "Moderate", class: "bg-blue-100 text-blue-800" };
    return { text: "High", class: "bg-green-100 text-green-800" };
  };

  return (
    <div className="bg-[#FFF7ED] rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold mb-4 text-neutral-900">Member Contributions & Performance</h2>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Member Points Comparison */}
        <div className="bg-white rounded-lg p-4">
          <h3 className="text-lg font-medium mb-2 text-neutral-900">Points Comparison</h3>
          <Bar data={memberPointsData} options={chartOptions} />
        </div>

        {/* Your Category Performance */}
        <div className="bg-white rounded-lg p-4">
          <h3 className="text-lg font-medium mb-2 text-neutral-900">Your Category Performance</h3>
          <Bar data={userCategoryData} options={chartOptions} />
        </div>

        {/* Contribution Percentage */}
        <div className="bg-white rounded-lg p-4 flex items-center justify-center">
          <div>
            <h3 className="text-lg font-medium mb-2 text-neutral-900 text-center">Team Contributions</h3>
            <div className="w-48 h-48">
              <Doughnut data={contributionData} options={pieOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Member Details Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Members Statistics */}
        <div className="bg-white rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4 text-neutral-900">Team Member Statistics</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Member</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Points</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Solved</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.members.map((member, index) => {
                  const activity = getActivityBadge(member.recent_activity);
                  return (
                    <tr key={member.username} className={member.is_current_user ? "bg-red-25" : ""}>
                      <td className="px-4 py-2">
                        <div className="flex items-center">
                          <div
                            className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white mr-2 ${
                              index === 0
                                ? "bg-yellow-500"
                                : index === 1
                                ? "bg-gray-400"
                                : index === 2
                                ? "bg-orange-600"
                                : "bg-gray-300"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 flex items-center">
                              {member.username}
                              {member.is_current_user && (
                                <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">You</span>
                              )}
                              {member.is_team_owner && (
                                <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                  Owner
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="text-sm font-medium text-gray-900">{member.total_points}</div>
                        <div className="text-xs text-gray-500">{member.contribution_percentage.toFixed(1)}%</div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="text-sm text-gray-900">{member.solved_challenges}</div>
                        <div className="text-xs text-gray-500">{member.success_rate.toFixed(1)}% success</div>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${activity.class}`}>
                          {activity.text}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">{member.recent_activity} (7d)</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Your Personal Stats */}
        <div className="bg-white rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4 text-neutral-900">Your Performance Summary</h3>
          {data.current_user && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-600">{data.current_user.total_points}</div>
                  <div className="text-sm text-red-800">Points Earned</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{data.current_user.solved_challenges}</div>
                  <div className="text-sm text-green-800">Challenges Solved</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">{data.current_user.success_rate.toFixed(1)}%</div>
                  <div className="text-sm text-blue-800">Success Rate</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {data.current_user.contribution_percentage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-purple-800">Team Contribution</div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm font-medium text-gray-700 mb-2">Category Breakdown:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {data.user_category_performance.map((cat) => (
                    <div key={cat.category} className="flex justify-between">
                      <span className="text-gray-600">{cat.category}:</span>
                      <span className="font-medium">{cat.solved}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberContributionsCard;
