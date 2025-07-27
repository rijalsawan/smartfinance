'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Brain, RefreshCw } from 'lucide-react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardStats } from './components/DashboardStats';
import { ChartCard } from './components/ChartCard';
import { RecentTransactions } from './components/RecentTransactions_new';
import { TransactionModal } from './components/TransactionModal';
import { AIInsightsContent } from './components/AIInsightsContent';
import { ConnectedBanks } from './components/bank/ConnectedBanks';
import { RealTimeTransactions } from './components/bank/RealTimeTransactions';
import { Button } from './components/ui/Button';
import { type BankAccount } from './services/plaidService';
import { analyticsService } from './services/analyticsService';

export default function Home() {
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard');
  const [connectedAccounts, setConnectedAccounts] = useState<BankAccount[]>([]);
  const [chartData, setChartData] = useState<{
    spendingTrend: any;
    expenseCategories: any;
    monthlyComparison: any;
  } | null>(null);
  const [isLoadingCharts, setIsLoadingCharts] = useState(true);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [refreshInsights, setRefreshInsights] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    loadChartData();
  }, []);

  const loadChartData = async () => {
    try {
      setIsLoadingCharts(true);
      const [spendingTrend, expenseCategories, monthlyComparison] = await Promise.all([
        analyticsService.getSpendingTrendData(),
        analyticsService.getExpenseCategoriesData(),
        analyticsService.getMonthlyComparisonData(),
      ]);
      
      setChartData({
        spendingTrend,
        expenseCategories,
        monthlyComparison,
      });
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setIsLoadingCharts(false);
    }
  };

  const handleMenuItemClick = (item: string) => {
    setActiveMenuItem(item);
    setIsSidebarOpen(false); // Close sidebar on mobile after navigation
    console.log(`Navigated to: ${item}`);
  };

  const handleAccountsUpdate = (accounts: BankAccount[]) => {
    setConnectedAccounts(accounts);
  };

  const renderContent = () => {
    switch (activeMenuItem) {
      case 'dashboard':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {/* Welcome Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6 sm:mb-8"
            >
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mb-2">
                Welcome back, John! 👋
              </h1>
              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
                Here's what's happening with your finances today.
              </p>
            </motion.div>

            {/* Connected Banks Section */}
            

            {/* Stats Overview */}
            <DashboardStats />

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="xl:col-span-2">
                <ChartCard
                  title="Income vs Expenses"
                  type="line"
                  data={chartData?.spendingTrend || { labels: [], datasets: [] }}
                  height={300}
                  delay={0.2}
                />
              </div>
              <div>
                <ChartCard
                  title="Spending Categories"
                  type="doughnut"
                  data={chartData?.expenseCategories || { labels: [], datasets: [] }}
                  height={300}
                  delay={0.3}
                />
              </div>
            </div>

            {/* Additional Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <ChartCard
                title="Monthly Comparison"
                type="bar"
                data={chartData?.monthlyComparison || { labels: [], datasets: [] }}
                height={280}
                delay={0.4}
              />
              <div className="space-y-4 sm:space-y-6">
                <RecentTransactions accounts={connectedAccounts} />
              </div>
            </div>

            <div data-section="connected-banks">
              <ConnectedBanks onAccountsUpdate={handleAccountsUpdate} keyPrefix="dashboard" />
            </div>
          </motion.div>
          
        );

      case 'analytics':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-6 sm:space-y-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mb-2">
                  Analytics
                </h1>
                <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
                  Deep dive into your financial patterns and trends
                </p>
              </div>
              <Button 
                onClick={() => setIsTransactionModalOpen(true)}
                className="flex items-center justify-center space-x-2 w-full sm:w-auto"
                size="sm"
              >
                <DollarSign className="w-4 h-4" />
                <span className="hidden sm:inline">View All Transactions</span>
                <span className="sm:hidden">Transactions</span>
              </Button>
            </div>

            {/* Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <ChartCard
                title="Spending Trends"
                type="line"
                data={chartData?.spendingTrend || { labels: [], datasets: [] }}
                height={350}
              />
              <ChartCard
                title="Category Breakdown"
                type="doughnut"
                data={chartData?.expenseCategories || { labels: [], datasets: [] }}
                height={350}
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
              <ChartCard
                title="Year-over-Year Comparison"
                type="bar"
                data={chartData?.monthlyComparison || { labels: [], datasets: [] }}
                height={350}
              />
              <div className="space-y-4 sm:space-y-6">
                {/* You can add more analytics widgets here */}
              </div>
            </div>

            <TransactionModal
              isOpen={isTransactionModalOpen}
              onClose={() => setIsTransactionModalOpen(false)}
              accounts={connectedAccounts}
            />
          </motion.div>
        );

      

      case 'cards':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-6 sm:space-y-8"
          >
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mb-2">
                Connected Cards & Accounts
              </h1>
              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
                Manage your bank accounts and credit cards
              </p>
            </div>

            <ConnectedBanks onAccountsUpdate={handleAccountsUpdate} keyPrefix="cards" />
          </motion.div>
        );

      case 'goals':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-6 sm:space-y-8"
          >
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mb-2">
                Financial Goals
              </h1>
              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
                Set and track your savings goals
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <ChartCard
                title="Goal Progress"
                type="bar"
                data={chartData?.monthlyComparison || { labels: [], datasets: [] }}
                height={350}
              />
              <div className="space-y-4 sm:space-y-6">
                {/* Goal management components can go here */}
              </div>
            </div>
          </motion.div>
        );

      case 'ai-insights':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-6 sm:space-y-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                <div className="p-2 sm:p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl w-fit">
                  <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
                    AI Financial Insights
                  </h1>
                  <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
                    Personalized financial analysis and recommendations powered by AI
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => setRefreshInsights(prev => prev + 1)} 
                className="flex items-center justify-center space-x-2 w-full sm:w-auto"
                size="sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Refresh Insights</span>
                <span className="sm:hidden">Refresh</span>
              </Button>
            </div>

            <AIInsightsContent key={refreshInsights} />
          </motion.div>
        );

      default:
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-6 sm:space-y-8"
          >
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mb-2">
                {activeMenuItem.charAt(0).toUpperCase() + activeMenuItem.slice(1)}
              </h1>
              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
                This section is coming soon...
              </p>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="flex h-screen">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto w-64
          transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          transition-transform duration-300 ease-in-out lg:transition-none
        `}>
          <Sidebar 
            activeItem={activeMenuItem} 
            onItemClick={handleMenuItemClick}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
          {/* Header */}
          <Header onMenuClick={() => setIsSidebarOpen(true)} />

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
            <div className="max-w-7xl mx-auto">
              {renderContent()}

              {/* Footer */}
              <motion.footer
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="mt-8 sm:mt-12 pt-4 sm:pt-6 border-t border-neutral-200 dark:border-neutral-800"
              >
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                  <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 text-center sm:text-left">
                    © 2024 SmartFinance. Powered by AI & Machine Learning. 
                    <span className="block sm:inline sm:ml-2 text-green-600 dark:text-green-400 font-medium">
                      🇨🇦 Canadian Banks Supported
                    </span>
                  </p>
                  <div className="flex items-center space-x-4 sm:space-x-6 text-xs sm:text-sm">
                    <button className="text-neutral-500 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      Privacy
                    </button>
                    <button className="text-neutral-500 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      Terms
                    </button>
                    <button className="text-neutral-500 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      Support
                    </button>
                  </div>
                </div>
              </motion.footer>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
