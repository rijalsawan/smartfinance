'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Lightbulb,
  RefreshCw,
  CheckCircle,
  XCircle,
  Download,
  Settings,
  DollarSign
} from 'lucide-react';

interface AIInsight {
  id: string;
  type: 'prediction' | 'recommendation' | 'alert' | 'goal' | 'opportunity';
  title: string;
  description: string;
  impact: 'Low' | 'Medium' | 'High';
  confidence: number;
  category: string;
  actionable: boolean;
  priority: number;
  metadata?: any;
}

interface FinancialHealthScore {
  overall: number;
  components: {
    spendingControl: number;
    savingsRate: number;
    budgetAdherence: number;
    financialStability: number;
    cashFlowHealth: number;
  };
  recommendations: string[];
}

interface AIInsightsContentProps {
  accounts: any[];
  refreshKey: number;
  transactions?: any[];
}

// Health Score Section Component
function HealthScoreSection({ healthScore, isDemo = false }: { healthScore: FinancialHealthScore | null, isDemo?: boolean }) {
  if (!healthScore) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
          Financial Health Score
          {isDemo && <span className="text-sm text-blue-600 ml-2">(Demo)</span>}
        </h3>
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-2xl font-bold text-neutral-900 dark:text-white">
            {healthScore.overall}/10
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {Object.entries(healthScore.components).map(([key, value]) => (
          <div key={key} className="text-center">
            <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </div>
            <div className="text-lg font-semibold text-neutral-900 dark:text-white">
              {value}%
            </div>
            <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 mt-1">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      
      {healthScore.recommendations.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-neutral-900 dark:text-white mb-3">
            Recommendations
          </h4>
          <ul className="space-y-2">
            {healthScore.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                <span className="text-sm text-neutral-600 dark:text-neutral-400">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}

// Insights Section Component
function InsightsSection({ insights, isDemo = false }: { insights: AIInsight[], isDemo?: boolean }) {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'prediction': return TrendingUp;
      case 'recommendation': return Lightbulb;
      case 'alert': return AlertTriangle;
      case 'goal': return Target;
      case 'opportunity': return Brain;
      default: return Brain;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High': return 'text-red-600 bg-red-50 border-red-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'prediction': return 'text-blue-600 bg-blue-50';
      case 'recommendation': return 'text-green-600 bg-green-50';
      case 'alert': return 'text-red-600 bg-red-50';
      case 'goal': return 'text-purple-600 bg-purple-50';
      case 'opportunity': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
        AI-Powered Insights
        {isDemo && <span className="text-sm text-blue-600 ml-2">(Demo)</span>}
      </h3>
      
      {insights.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-8 text-center">
          <Brain className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
          <p className="text-neutral-600 dark:text-neutral-400">
            No insights available. Connect your accounts to get personalized recommendations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {insights.map((insight, index) => {
            const IconComponent = getInsightIcon(insight.type);
            
            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${getTypeColor(insight.type)}`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getImpactColor(insight.impact)}`}>
                      {insight.impact}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {insight.confidence}% confidence
                    </span>
                  </div>
                </div>
                
                <h4 className="font-medium text-neutral-900 dark:text-white mb-2">
                  {insight.title}
                </h4>
                
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                  {insight.description}
                </p>
                
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span className="bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
                    {insight.category}
                  </span>
                  {insight.actionable && (
                    <span className="text-blue-600 font-medium">
                      Action Required
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

export function AIInsightsContent({ accounts, refreshKey, transactions = [] }: AIInsightsContentProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [healthScore, setHealthScore] = useState<FinancialHealthScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dependenciesStatus, setDependenciesStatus] = useState<{
    available: boolean;
    missing: string[];
  } | null>(null);

  useEffect(() => {
    loadAIInsights();
    checkDependencies();
  }, [refreshKey, transactions]);

  const checkDependencies = async () => {
    try {
      const response = await fetch('/api/ai-insights');
      const status = await response.json();
      
      setDependenciesStatus({
        available: status.pythonAvailable,
        missing: status.missingDependencies || []
      });
    } catch (error) {
      console.error('Error checking dependencies:', error);
      setDependenciesStatus({
        available: false,
        missing: ['python', 'numpy', 'pandas']
      });
    }
  };

  const installDependencies = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'installDependencies',
          transactions: []
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        await checkDependencies();
        await loadAIInsights();
      } else {
        setError('Failed to install dependencies: ' + result.output);
      }
    } catch (error) {
      setError('Error installing dependencies');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAIInsights = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Prepare and normalize transaction data for the AI engine
      const normalizedTransactions = normalizeTransactionData(transactions);

      const response = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generateInsights',
          transactions: normalizedTransactions
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setInsights(data.insights || []);
      setHealthScore(data.healthScore || null);

    } catch (error) {
      console.error('Error loading AI insights:', error);
      setError(error instanceof Error ? error.message : 'Failed to load insights');
      
      // Load demo insights as fallback
      loadDemoInsights();
    } finally {
      setIsLoading(false);
    }
  };

  // Normalize Plaid transaction data for AI engine compatibility
  const normalizeTransactionData = (rawTransactions: any[]) => {
    if (!rawTransactions || rawTransactions.length === 0) {
      return generateMockTransactions();
    }

    return rawTransactions.map(transaction => {
      // Ensure category is properly set and meaningful
      let category = 'Other';
      if (transaction.category) {
        if (Array.isArray(transaction.category)) {
          category = transaction.category[0] || 'Other';
        } else if (typeof transaction.category === 'string' && transaction.category.trim()) {
          category = transaction.category;
        }
      }

      // Ensure amount is properly formatted
      let amount = 0;
      if (typeof transaction.amount === 'number') {
        amount = transaction.amount;
      } else if (typeof transaction.amount === 'string' && transaction.amount) {
        amount = parseFloat(transaction.amount) || 0;
      }

      return {
        id: transaction.id || `tx_${Date.now()}_${Math.random()}`,
        accountId: transaction.accountId || 'unknown_account',
        description: transaction.description || transaction.name || 'Unknown Transaction',
        category,
        subcategory: transaction.subcategory || undefined,
        amount,
        date: transaction.date || new Date().toISOString(),
        type: transaction.type || (amount < 0 ? 'debit' : 'credit'),
        merchant: transaction.merchant || transaction.merchant_name || undefined,
        location: transaction.location || undefined,
        isRecurring: transaction.isRecurring || false,
        confidence: transaction.confidence || 1.0
      };
    });
  };

  const generateMockTransactions = () => {
    const categories = [
      'Food and Drink', 
      'Transportation', 
      'Shopping', 
      'Entertainment', 
      'Utilities', 
      'Healthcare',
      'Groceries',
      'Restaurants',
      'Gas Stations',
      'Retail',
      'Subscription Services',
      'Insurance'
    ];
    const merchants = [
      'Starbucks', 
      'Uber', 
      'Amazon', 
      'Netflix', 
      'Shell', 
      'Target', 
      'Whole Foods', 
      'CVS',
      'McDonald\'s',
      'Walmart',
      'Apple Store',
      'Home Depot',
      'Costco',
      'Best Buy'
    ];
    
    return Array.from({ length: 50 }, (_, i) => {
      const isIncome = Math.random() > 0.85; // 15% chance of income
      const categoryIndex = Math.floor(Math.random() * categories.length);
      const merchantIndex = Math.floor(Math.random() * merchants.length);
      
      return {
        id: `mock-${i}`,
        accountId: accounts[0]?.id || 'mock-account',
        description: merchants[merchantIndex],
        category: categories[categoryIndex],
        amount: isIncome ? 
          Math.random() * 3000 + 2000 : // Income: $2000-$5000
          -(Math.random() * 200 + 10), // Expenses: $10-$210
        date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        type: isIncome ? 'credit' : 'debit',
        merchant: merchants[merchantIndex]
      };
    });
  };

  const loadDemoInsights = () => {
    setInsights([
      {
        id: 'demo-1',
        type: 'prediction',
        title: 'Monthly Spending Forecast',
        description: 'Based on your transaction patterns, you\'re projected to spend $2,850 this month.',
        impact: 'Medium',
        confidence: 85,
        category: 'Budget Planning',
        actionable: true,
        priority: 8
      },
      {
        id: 'demo-2',
        type: 'recommendation',
        title: 'Subscription Optimization',
        description: 'You could save $67/month by reviewing and canceling unused subscriptions.',
        impact: 'High',
        confidence: 92,
        category: 'Cost Optimization',
        actionable: true,
        priority: 9
      },
      {
        id: 'demo-3',
        type: 'alert',
        title: 'Unusual Spending Detected',
        description: 'Your dining expenses increased by 35% this week compared to your average.',
        impact: 'Medium',
        confidence: 88,
        category: 'Food and Drink',
        actionable: true,
        priority: 7
      }
    ]);

    setHealthScore({
      overall: 7.6,
      components: {
        spendingControl: 78,
        savingsRate: 68,
        budgetAdherence: 82,
        financialStability: 85,
        cashFlowHealth: 71
      },
      recommendations: [
        'Increase your monthly savings rate',
        'Review subscription services',
        'Set up automated savings transfers'
      ]
    });
  };

  if (!dependenciesStatus?.available) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Settings className="h-6 w-6 text-yellow-600" />
            <h3 className="text-lg font-semibold text-yellow-800">Setup Required</h3>
          </div>
          <p className="text-yellow-700 mb-4">
            The AI Insights engine requires Python and some dependencies to be installed.
          </p>
          <div className="space-y-2 mb-4">
            <p className="text-sm text-yellow-600">Missing dependencies:</p>
            <ul className="list-disc list-inside text-sm text-yellow-600">
              {dependenciesStatus?.missing.map((dep, index) => (
                <li key={index}>{dep}</li>
              ))}
            </ul>
          </div>
          <button
            onClick={installDependencies}
            disabled={isLoading}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Installing...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Install Dependencies</span>
              </>
            )}
          </button>
        </div>
        
        {/* Show demo insights while dependencies are being set up */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-700 text-sm">
            Showing demo insights while setting up the AI engine...
          </p>
        </div>
        
        {/* Initialize demo insights if not already loaded */}
        {insights.length === 0 && (() => {
          loadDemoInsights();
          return null;
        })()}
        
        {/* Render demo insights */}
        <div className="space-y-6">
          {healthScore && <HealthScoreSection healthScore={healthScore} isDemo={true} />}
          {insights.length > 0 && <InsightsSection insights={insights} isDemo={true} />}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Analyzing your financial data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <XCircle className="h-6 w-6 text-red-600" />
          <h3 className="text-lg font-semibold text-red-800">Error Loading Insights</h3>
        </div>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={loadAIInsights}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Transaction Data Info */}
      <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Transaction Data Status
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <span className="text-blue-700 dark:text-blue-300">Total Transactions:</span>
            <span className="font-medium ml-1">{transactions.length}</span>
          </div>
          <div>
            <span className="text-blue-700 dark:text-blue-300">Source:</span>
            <span className="font-medium ml-1">{transactions.length > 0 ? 'Plaid API' : 'Demo Data'}</span>
          </div>
          <div>
            <span className="text-blue-700 dark:text-blue-300">Date Range:</span>
            <span className="font-medium ml-1">
              {transactions.length > 0 ? 'Last 90 days' : 'Sample'}
            </span>
          </div>
          <div>
            <span className="text-blue-700 dark:text-blue-300">AI Engine:</span>
            <span className="font-medium ml-1">Independent Python</span>
          </div>
        </div>
      </div>
      
      {healthScore && <HealthScoreSection healthScore={healthScore} />}
      <InsightsSection insights={insights} />
    </div>
  );
}
