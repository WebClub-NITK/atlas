// components/analytics/TeamProgressCard.jsx
import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import { analyticsAPI } from "../api/analytics";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

const TeamProgressCard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTeamProgress();
  }, []);

  const fetchTeamProgress = async () => {
    setLoading(true);
    try {
      const result = await analyticsAPI.getUserTeamProgress();
      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to fetch team progress data");
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="bg-[#FFF7ED] rounded-lg shadow-lg p-6 mb-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#FFF7ED] rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-neutral-900">Team Progress</h2>
        <div className="bg-red-100 p-4 rounded-md text-red-700">{error}</div>
      </div>
    );
  }

  if (!data) return null;

  // Category performance chart data
  const categoryChartData = {
    labels: data.category_performance.map((cat) => cat.category),
    datasets: [
      {
        label: "Solved Challenges",
        data: data.category_performance.map((cat) => cat.solved),
        backgroundColor: "rgba(68, 239, 79, 0.6)",
        borderColor: "rgba(68, 239, 139, 1)",
        borderWidth: 1,
      },
      {
        label: "Total Challenges",
        data: data.category_performance.map((cat) => cat.total),
        backgroundColor: "rgba(229, 231, 235, 0.6)",
        borderColor: "rgba(156, 163, 175, 1)",
        borderWidth: 1,
      },
    ],
  };

  // Completion rate doughnut chart
  const completionData = {
    labels: ["Completed", "Remaining"],
    datasets: [
      {
        data: [data.solved_challenges, data.total_challenges - data.solved_challenges],
        backgroundColor: ["#44ef83ff", "#E5E7EB"],
        borderColor: ["#42a961ff", "#D1D5DB"],
        borderWidth: 2,
      },
    ],
  };

  // Daily submission timeline
  const timelineData = {
    labels: data.hourly_timeline.map((hour) => {
      const date = new Date(hour.hour);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }),
    datasets: [
      {
        label: "Total Submissions",
        data: data.hourly_timeline.map((hour) => hour.total),
        borderColor: "rgba(239, 68, 68, 1)",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        tension: 0.1,
        fill: true,
      },
      {
        label: "Correct Submissions",
        data: data.hourly_timeline.map((hour) => hour.correct),
        borderColor: "rgba(34, 197, 94, 1)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        tension: 0.1,
        fill: true,
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

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
      title: { display: false },
    },
  };

  return (
    <div className="bg-[#FFF7ED] rounded-lg shadow-lg p-6 mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-neutral-900">Team Progress & Activity</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-500">{data.team_score}</div>
          <div className="text-sm text-gray-600">Total Score</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{data.solved_challenges}</div>
          <div className="text-sm text-gray-600">Solved Challenges</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{data.completion_rate.toFixed(1)}%</div>
          <div className="text-sm text-gray-600">Completion Rate</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{data.accuracy_rate.toFixed(1)}%</div>
          <div className="text-sm text-gray-600">Accuracy Rate</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Category Performance Chart */}
        <div className="bg-white rounded-lg p-4">
          <h3 className="text-lg font-medium mb-2 text-neutral-900">Category Performance</h3>
          <Bar data={categoryChartData} options={chartOptions} />
        </div>

        {/* Completion Doughnut Chart */}
        <div className="bg-white rounded-lg p-4 flex items-center justify-center">
          <div>
            <h3 className="text-lg font-medium mb-2 text-neutral-900 text-center">Overall Progress</h3>
            <div className="w-48 h-48">
              <Doughnut data={completionData} options={doughnutOptions} />
            </div>
          </div>
        </div>

        {/* Timeline Chart */}
        <div className="bg-white rounded-lg p-4">
          <h3 className="text-lg font-medium mb-2 text-neutral-900">Activity Timeline (24 hours)</h3>
          <Line data={timelineData} options={chartOptions} />
        </div>
      </div>

      {/* Recent Submissions Table */}
      <div className="bg-white rounded-lg p-4">
        <h3 className="text-lg font-medium mb-4 text-neutral-900">Recent Submissions</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Challenge</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Category</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">User</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Points</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.recent_submissions.slice(0, 10).map((submission, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 text-sm text-gray-900">{submission.challenge_name}</td>
                  <td className="px-4 py-2 text-sm">
                    <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                      {submission.challenge_category}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">{submission.user_name}</td>
                  <td className="px-4 py-2 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        submission.is_correct ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {submission.is_correct ? "Correct" : "Incorrect"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">{submission.points}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{new Date(submission.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeamProgressCard;
