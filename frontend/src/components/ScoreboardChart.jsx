import React from 'react';
import { Line } from 'react-chartjs-2';
import { useTheme } from '../context/ThemeContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  plugins
} from 'chart.js';
import 'chartjs-adapter-date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

const lineColors = ['#E53E3E', '#DD6B20', '#D69E2E', '#38A169', '#3182CE',];

function ScoreboardChart({ data }) {
  const { isDarkMode } = useTheme();

  const chartData = {
    datasets: data.map((team, index) => ({
      label: team.team_name,
      data: team.performance.map(p => ({ x: new Date(p.timestamp), y: p.score })),
      borderColor: lineColors[index % lineColors.length],
      backgroundColor: lineColors[index % lineColors.length] + '33',
      tension: 0.2,
      fill: false,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'hour',
          tooltipFormat: 'MMM d, h:mm a',
          displayFormats: {
            hour: 'h:mm a'
          }
        },
        ticks: { color: isDarkMode ? '#CBD5E0' : '#4A5568' },
        grid: { color: isDarkMode ? '#2D3748' : '#E2E8F0' },
      },
      y: {
        beginAtZero: true,
        ticks: { color: isDarkMode ? '#CBD5E0' : '#4A5568' },
        grid: { color: isDarkMode ? '#2D3748' : '#E2E8F0' },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Top 5 Teams Score Progression',
        color: isDarkMode ? '#F7FAFC' : '#1A202C',
        font: { size: 18 },
      },
    },
  };

  return (
    <div className={`${isDarkMode ? 'bg-neutral-800' : 'bg-white'} p-4 md:p-6 rounded-lg shadow-md mt-8`}>
      <div style={{ height: '350px' }}>
        <Line options={options} data={chartData} />
      </div>
    </div>
  );
}

export default ScoreboardChart;