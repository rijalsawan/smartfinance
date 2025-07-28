import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Plus, Building2 } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { analyticsService, type DashboardStats as StatsData } from '../services/analyticsService';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  isPositive,
  icon,
  delay = 0,
}) => {
  return (
    <Card delay={delay} className="relative overflow-hidden p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
            {title}
          </p>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-neutral-900 dark:text-white mb-2 truncate">
            {value}
          </p>
          <div className="flex items-center space-x-1">
            {isPositive ? (
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
            ) : (
              <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 flex-shrink-0" />
            )}
            <span
              className={`text-xs sm:text-sm font-medium ${
                isPositive ? 'text-green-600' : 'text-red-600'
              } truncate`}
            >
              {change}
            </span>
          </div>
        </div>
        <div className="flex-shrink-0 ml-2 sm:ml-4">
          <div className="p-2 sm:p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg sm:rounded-xl">
            <div className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-indigo-600 dark:text-indigo-400">
              {icon}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

interface DashboardStatsProps {
  onStatsUpdate?: (accounts: any[]) => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ onStatsUpdate }) => {
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const data = await analyticsService.getDashboardStats();
      setStatsData(data);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        {[...Array(4)].map((_, index) => (
          <Card key={index} delay={index * 0.1} className="relative overflow-hidden">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </Card>
        ))}
      </motion.div>
    );
  }

  if (!statsData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <Card className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
              Connect Your Bank Account
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Connect your bank account to see your financial overview, track spending, and get AI-powered insights.
            </p>
            <Button 
              onClick={() => {
                // Scroll to the connected banks section
                const element = document.querySelector('[data-section="connected-banks"]');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Connect Bank Account
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  const stats = [
    {
      title: 'Total Balance',
      value: formatCurrency(statsData.totalBalance),
      change: formatPercentage(statsData.balanceChange || 0),
      isPositive: (statsData.balanceChange || 0) >= 0,
      icon: <DollarSign className="w-full h-full" />,
    },
    {
      title: 'Monthly Spending',
      value: formatCurrency(statsData.monthlySpending),
      change: formatPercentage(statsData.spendingChange),
      isPositive: statsData.spendingChange <= 0, // Less spending is positive
      icon: <CreditCard className="w-full h-full" />,
    },
    {
      title: 'Monthly Income',
      value: formatCurrency(statsData.monthlyIncome),
      change: formatPercentage(statsData.incomeChange),
      isPositive: statsData.incomeChange >= 0,
      icon: <TrendingUp className="w-full h-full" />,
    },
    {
      title: 'Available Credit',
      value: formatCurrency(statsData.availableCredit),
      change: formatPercentage(statsData.creditChange || 0),
      isPositive: (statsData.creditChange || 0) >= 0,
      icon: <CreditCard className="w-full h-full" />,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8"
    >
      {stats.map((stat, index) => (
        <StatCard
          key={stat.title}
          {...stat}
          delay={index * 0.1}
        />
      ))}
    </motion.div>
  );
};
