import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { useTheme } from '../context/ThemeContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function SubmissionChart({ data }) {
  const { isDarkMode } = useTheme();

  const chartData = {
    labels: data.map(item => {
        const date = new Date(item.hour);
        return isNaN(date) 
          ? 'Invalid Date' 
          : date.toLocaleString('default', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            });
    }),
    datasets: [
      {
        label: 'Submissions',
        data: data.map(item => item.count),
        fill: false,
        borderColor: 'rgb(239, 68, 68)',
        tension: 0.5,
        pointBackgroundColor: 'rgb(239, 68, 68)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(239, 68, 68)',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Submission Activity (Last 24h)',
        color: isDarkMode ? '#f3f4f6' : '#111827',
        font: {
            size: 18,
            weight: '600',
        }
      },
      tooltip: {
        backgroundColor: isDarkMode ? '#1f2937' : '#fff',
        titleColor: isDarkMode ? '#f3f4f6' : '#111827',
        bodyColor: isDarkMode ? '#d1d5db' : '#4b5563',
        borderColor: isDarkMode ? 'rgb(239, 68, 68)' : 'rgb(220, 38, 38)',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
            label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                    label += ': ';
                }
                if (context.parsed.y !== null) {
                    label += context.parsed.y;
                }
                return label;
            }
        }
      }
    },
    scales: {
        x: {
            ticks: {
                color: isDarkMode ? '#9ca3af' : '#6b7280',
                maxRotation: 0,
                minRotation: 0,
                autoSkip: true,
                maxTicksLimit: 10,
            },
            grid: {
                display: false,
            }
        },
        y: {
            beginAtZero: true,
            ticks: {
                color: isDarkMode ? '#9ca3af' : '#6b7280',
                precision: 0
            },
            grid: {
                color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                drawBorder: false,
            }
        }
    }
  };

  return (
    <div className={`${isDarkMode ? 'bg-neutral-800' : 'bg-white'} p-4 md:p-6 rounded-lg shadow-md mt-6`}>
      <div style={{ height: '350px' }}>
        <Line options={options} data={chartData} />
      </div>
    </div>
  );
}

export default SubmissionChart;