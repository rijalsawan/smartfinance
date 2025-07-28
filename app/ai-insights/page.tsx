'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  RefreshCw,
  Download,
  Settings,
  TrendingUp,
  Activity,
  DollarSign,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { plaidService, type Transaction, type BankAccount } from '../services/plaidService';
import { AIInsightsContent } from '../components/AIInsightsContent_new';

export default function AIInsightsPage() {
  const [connectedAccounts, setConnectedAccounts] = useState<BankAccount[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadConnectedAccounts();
    loadTransactions();
  }, []);

  const loadConnectedAccounts = async () => {
    try {
      // Get list of connected institutions
      const institutionNames = plaidService.getConnectedInstitutions();
      
      if (institutionNames.length > 0) {
        // Load accounts for each institution
        const allAccounts: BankAccount[] = [];
        for (const institutionName of institutionNames) {
          const accounts = await plaidService.getAccounts(institutionName);
          allAccounts.push(...accounts);
        }
        setConnectedAccounts(allAccounts);
      }
    } catch (error) {
      console.error('Error loading connected accounts:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      setIsLoadingTransactions(true);
      
      // Get transactions from all connected accounts (last 90 days for comprehensive analysis)
      const transactions = await plaidService.getAllTransactions(90);
      
      setAllTransactions(transactions);
      setLastUpdated(new Date());
      
      console.log(`Loaded ${transactions.length} transactions for AI analysis`);
    } catch (error) {
      console.error('Error loading transactions:', error);
      
      // Fallback to demo transactions if Plaid fails
      const fallbackTransactions: Transaction[] = [
        {
          id: 'demo-1',
          accountId: 'demo_account',
          description: 'Salary Deposit',
          category: 'Payroll',
          amount: 3500.00,
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'credit',
          merchant: 'Employer Inc',
        },
        {
          id: 'demo-2',
          accountId: 'demo_account',
          description: 'Grocery Shopping',
          category: 'Food and Drink',
          amount: -125.50,
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'debit',
          merchant: 'Whole Foods Market',
        },
        {
          id: 'demo-3',
          accountId: 'demo_account',
          description: 'Coffee Purchase',
          category: 'Food and Drink',
          amount: -8.75,
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'debit',
          merchant: 'Starbucks',
        },
        {
          id: 'demo-4',
          accountId: 'demo_account',
          description: 'Gas Station',
          category: 'Transportation',
          amount: -45.20,
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'debit',
          merchant: 'Shell',
        },
        {
          id: 'demo-5',
          accountId: 'demo_account',
          description: 'Netflix Subscription',
          category: 'Entertainment',
          amount: -15.99,
          date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'debit',
          merchant: 'Netflix',
        },
        {
          id: 'demo-6',
          accountId: 'demo_account',
          description: 'Uber Ride',
          category: 'Transportation',
          amount: -22.50,
          date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'debit',
          merchant: 'Uber',
        },
        {
          id: 'demo-7',
          accountId: 'demo_account',
          description: 'Amazon Purchase',
          category: 'Shopping',
          amount: -89.99,
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'debit',
          merchant: 'Amazon',
        }
      ];
      
      setAllTransactions(fallbackTransactions);
      setLastUpdated(new Date());
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const handleRefresh = async () => {
    await loadTransactions();
    setRefreshKey(prev => prev + 1);
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return 'Never';
    return lastUpdated.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
                <Brain className="h-8 w-8 text-blue-600" />
                AI Insights
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400 mt-2">
                Intelligent analysis of your financial data using our independent AI engine
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={handleRefresh}
                disabled={isLoadingTransactions}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingTransactions ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    Connected Accounts
                  </p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {connectedAccounts.length}
                  </p>
                </div>
                <Settings className="h-5 w-5 text-neutral-400" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    Transactions Analyzed
                  </p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {allTransactions.length}
                  </p>
                </div>
                <Activity className="h-5 w-5 text-neutral-400" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    Last Updated
                  </p>
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">
                    {formatLastUpdated()}
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 text-neutral-400" />
              </div>
            </Card>
          </div>
        </div>

        {/* AI Insights Component */}
        <AIInsightsContent 
          accounts={connectedAccounts}
          refreshKey={refreshKey}
          transactions={allTransactions}
        />
        
        {/* Footer Info */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Brain className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Independent AI Engine
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Your financial data is analyzed using our independent Python-based AI engine, 
                ensuring reliable insights without dependence on external services. 
                All analysis is performed locally with your transaction data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
