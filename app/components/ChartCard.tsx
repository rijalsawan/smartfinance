import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { Card } from './ui/Card';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

interface ChartCardProps {
  title: string;
  type: 'line' | 'doughnut' | 'bar';
  data: any;
  height?: number;
  delay?: number;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  type,
  data,
  height = 300,
  delay = 0,
}) => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: isMobile ? 12 : 20,
          usePointStyle: true,
          font: {
            size: isMobile ? 10 : 12,
          },
          boxWidth: isMobile ? 10 : 15,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        cornerRadius: 8,
        displayColors: false,
        titleFont: {
          size: isMobile ? 12 : 14,
        },
        bodyFont: {
          size: isMobile ? 11 : 13,
        },
      },
    },
    scales: type !== 'doughnut' ? {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: isMobile ? 10 : 12,
          },
        },
      },
      y: {
        grid: {
          color: '#f3f4f6',
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: isMobile ? 10 : 12,
          },
        },
      },
    } : undefined,
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return <Line data={data} options={chartOptions} />;
      case 'doughnut':
        return <Doughnut data={data} options={chartOptions} />;
      case 'bar':
        return <Bar data={data} options={chartOptions} />;
      default:
        return null;
    }
  };

  return (
    <Card delay={delay} className="p-4 sm:p-6">
      <div className="mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white">
          {title}
        </h3>
      </div>
      <div style={{ height: `${isMobile ? Math.max(height - 50, 200) : height}px` }}>
        {renderChart()}
      </div>
    </Card>
  );
};

// Sample data for different chart types
export const spendingTrendData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'Income',
      data: [4200, 4500, 4100, 4800, 5200, 4900],
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
    },
    {
      label: 'Expenses',
      data: [3200, 3100, 3400, 3300, 3600, 3200],
      borderColor: '#8b5cf6',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
    },
  ],
};

export const expenseCategoriesData = {
  labels: ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills', 'Other'],
  datasets: [
    {
      data: [850, 420, 380, 220, 750, 180],
      backgroundColor: [
        '#6366f1',
        '#8b5cf6',
        '#06b6d4',
        '#10b981',
        '#f59e0b',
        '#ef4444',
      ],
      borderWidth: 0,
    },
  ],
};

export const monthlyComparisonData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'This Year',
      data: [3200, 3100, 3400, 3300, 3600, 3200],
      backgroundColor: '#6366f1',
      borderRadius: 8,
    },
    {
      label: 'Last Year',
      data: [2800, 2900, 3100, 2950, 3200, 2800],
      backgroundColor: '#e5e7eb',
      borderRadius: 8,
    },
  ],
};
