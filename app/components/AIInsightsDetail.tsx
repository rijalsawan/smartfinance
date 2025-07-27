import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Target,
  Lightbulb,
  Zap,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Calendar,
  Star,
  CheckCircle,
  X,
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { aiInsightsService, type AIInsight, type FinancialHealthScore } from '../services/aiInsightsService';

interface AIInsightsDetailProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIInsightsDetail: React.FC<AIInsightsDetailProps> = ({ isOpen, onClose }) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [healthScore, setHealthScore] = useState<FinancialHealthScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (isOpen) {
      loadDetailedInsights();
    }
  }, [isOpen]);

  const loadDetailedInsights = async () => {
    try {
      setLoading(true);
      const [insightsData, healthData] = await Promise.all([
        aiInsightsService.generateInsights(),
        aiInsightsService.calculateFinancialHealthScore()
      ]);
      setInsights(insightsData);
      setHealthScore(healthData);
    } catch (error) {
      console.error('Error loading detailed insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', 'Budget Planning', 'Cost Optimization', 'Savings Goals', 'Budget Control', 'Account Monitoring'];
  
  const filteredInsights = selectedCategory === 'all' 
    ? insights 
    : insights.filter(insight => insight.category === selectedCategory);

  const getIcon = (type: string) => {
    switch (type) {
      case 'prediction': return <TrendingUp className="w-5 h-5" />;
      case 'recommendation': return <Lightbulb className="w-5 h-5" />;
      case 'alert': return <AlertTriangle className="w-5 h-5" />;
      case 'goal': return <Target className="w-5 h-5" />;
      case 'opportunity': return <Zap className="w-5 h-5" />;
      default: return <Brain className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'prediction': return 'bg-blue-500';
      case 'recommendation': return 'bg-green-500';
      case 'alert': return 'bg-red-500';
      case 'goal': return 'bg-purple-500';
      case 'opportunity': return 'bg-yellow-500';
      default: return 'bg-indigo-500';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'High': return <ArrowUpRight className="w-4 h-4 text-red-500" />;
      case 'Medium': return <ArrowUpRight className="w-4 h-4 text-yellow-500" />;
      case 'Low': return <ArrowDownRight className="w-4 h-4 text-green-500" />;
      default: return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                AI Financial Insights
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400">
                Comprehensive analysis of your financial patterns and recommendations
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 min-h-0">
          {/* Sidebar */}
          <div className="w-full lg:w-64 p-6 border-r border-neutral-200 dark:border-neutral-700 lg:overflow-y-auto">
            <div className="space-y-4">
              {/* Financial Health Score */}
              {healthScore && (
                <Card className="p-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                      {healthScore.overall.toFixed(1)}
                    </div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                      Financial Health Score
                    </div>
                    <div className="space-y-2">
                      {Object.entries(healthScore.components).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <span className="capitalize text-neutral-600 dark:text-neutral-400">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className="font-medium">{value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {/* Category Filter */}
              <div>
                <h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-2">
                  Categories
                </h3>
                <div className="space-y-1">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedCategory === category
                          ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {category === 'all' ? 'All Insights' : category}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-h-0">
            <div className="h-full p-6 overflow-y-auto">
            {loading ? (
              <div className="space-y-4">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="animate-pulse p-6 border border-neutral-200 dark:border-neutral-700 rounded-xl">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-700 rounded-xl"></div>
                      <div className="flex-1 space-y-3">
                        <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full"></div>
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {filteredInsights.map((insight, index) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="p-6 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-xl ${getTypeColor(insight.type)} text-white`}>
                        {getIcon(insight.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                            {insight.title}
                          </h3>
                          <div className="flex items-center space-x-2">
                            {getImpactIcon(insight.impact)}
                            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                              {insight.impact} Impact
                            </span>
                          </div>
                        </div>
                        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                          {insight.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                {insight.confidence}% Confidence
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                {insight.actionable ? 'Actionable' : 'Informational'}
                              </span>
                            </div>
                          </div>
                          {insight.metadata?.amount && (
                            <div className="flex items-center space-x-1 text-lg font-semibold text-neutral-900 dark:text-white">
                              <DollarSign className="w-4 h-4" />
                              {insight.metadata.amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                            </div>
                          )}
                        </div>
                        {insight.metadata && (
                          <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                            <div className="text-xs text-neutral-500 dark:text-neutral-400">
                              Category: {insight.category} • Priority: {insight.priority}/10
                              {insight.metadata.timeframe && ` • Timeframe: ${insight.metadata.timeframe}`}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {filteredInsights.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <Brain className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
                      No insights available
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      {selectedCategory === 'all' 
                        ? 'Connect your bank accounts to start receiving AI-powered insights.'
                        : `No insights found for ${selectedCategory} category.`
                      }
                    </p>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
