'use client';

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
  RefreshCw,
  Filter,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { aiInsightsService, type AIInsight, type FinancialHealthScore } from '../services/aiInsightsService';

export default function AIInsightsPage() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [healthScore, setHealthScore] = useState<FinancialHealthScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    'all',
    'spending',
    'savings',
    'income',
    'debt',
    'investment',
    'budgeting',
    'planning',
  ];

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const [insightsData, healthData] = await Promise.all([
        aiInsightsService.generateInsights(),
        aiInsightsService.calculateFinancialHealthScore()
      ]);
      setInsights(insightsData);
      setHealthScore(healthData);
    } catch (error) {
      console.error('Error loading AI insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInsights = insights.filter(insight => 
    selectedCategory === 'all' || insight.category === selectedCategory
  );

  const getIcon = (type: string) => {
    switch (type) {
      case 'spending_pattern': return <TrendingUp className="w-5 h-5" />;
      case 'savings_opportunity': return <Target className="w-5 h-5" />;
      case 'anomaly_detection': return <AlertTriangle className="w-5 h-5" />;
      case 'prediction': return <Zap className="w-5 h-5" />;
      case 'recommendation': return <Lightbulb className="w-5 h-5" />;
      case 'budget_alert': return <PieChart className="w-5 h-5" />;
      default: return <Brain className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'spending_pattern': return 'bg-blue-500';
      case 'savings_opportunity': return 'bg-green-500';
      case 'anomaly_detection': return 'bg-red-500';
      case 'prediction': return 'bg-purple-500';
      case 'recommendation': return 'bg-yellow-500';
      case 'budget_alert': return 'bg-orange-500';
      default: return 'bg-indigo-500';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high': return <ArrowUpRight className="w-4 h-4 text-red-500" />;
      case 'medium': return <ArrowUpRight className="w-4 h-4 text-yellow-500" />;
      case 'low': return <ArrowDownRight className="w-4 h-4 text-green-500" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
                  AI Financial Insights
                </h1>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Personalized financial analysis and recommendations powered by AI
                </p>
              </div>
            </div>
            <Button onClick={loadInsights} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Insights
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Financial Health Score */}
              {healthScore && (
                <Card className="p-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                      {healthScore.overall.toFixed(1)}
                    </div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                      Financial Health Score
                    </div>
                    <div className="space-y-3">
                      {Object.entries(healthScore.components).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
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
              <Card className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Filter className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    Categories
                  </h3>
                </div>
                <div className="space-y-2">
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
                      {category === 'all' ? 'All Insights' : category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="space-y-6">
                {[...Array(6)].map((_, index) => (
                  <Card key={index} className="p-6 animate-pulse">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-700 rounded-xl"></div>
                      <div className="flex-1 space-y-3">
                        <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full"></div>
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3"></div>
                      </div>
                    </div>
                  </Card>
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
                  >
                    <Card className="p-6 hover:shadow-lg transition-all duration-300">
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
                    </Card>
                  </motion.div>
                ))}

                {filteredInsights.length === 0 && !loading && (
                  <Card className="p-12 text-center">
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
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
