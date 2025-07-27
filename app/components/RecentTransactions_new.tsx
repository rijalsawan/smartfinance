import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  Car,
  Coffee,
  Home,
  Smartphone,
  MoreHorizontal,
  DollarSign,
  CreditCard,
  TrendingUp,
  Plus,
  Building2,
  ArrowRight,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { plaidService, type Transaction } from '../services/plaidService';

interface RecentTransactionsProps {
  accounts?: any[];
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({ accounts }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, [accounts]);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      const connectedInstitutions = plaidService.getConnectedInstitutions();
      
      // If no real institutions are connected, set empty array for default UI
      if (connectedInstitutions.length === 0) {
        console.log('No institutions connected, showing default UI');
        setTransactions([]);
        return;
      }

      const allTransactions = await plaidService.getAllTransactions(30);
      setTransactions(allTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const normalizedCategory = category.toLowerCase();
    
    if (normalizedCategory.includes('food') || normalizedCategory.includes('restaurant') || normalizedCategory.includes('grocery')) {
      return <Coffee className="w-full h-full" />;
    }
    if (normalizedCategory.includes('transport') || normalizedCategory.includes('gas') || normalizedCategory.includes('uber')) {
      return <Car className="w-full h-full" />;
    }
    if (normalizedCategory.includes('shop') || normalizedCategory.includes('retail')) {
      return <ShoppingBag className="w-full h-full" />;
    }
    if (normalizedCategory.includes('payment') || normalizedCategory.includes('rent') || normalizedCategory.includes('utilities')) {
      return <Home className="w-full h-full" />;
    }
    if (normalizedCategory.includes('income') || normalizedCategory.includes('payroll')) {
      return <TrendingUp className="w-full h-full" />;
    }
    
    return <CreditCard className="w-full h-full" />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getMockTransactions = (): Transaction[] => {
    return [
      {
        id: '1',
        accountId: 'mock_001',
        description: 'Grocery Shopping',
        category: 'Food and Drink',
        amount: -125.50,
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'debit' as const,
        merchant: 'Whole Foods',
      },
      {
        id: '2',
        accountId: 'mock_001',
        description: 'Salary Deposit',
        category: 'Payroll',
        amount: 4200.00,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'credit' as const,
      },
      {
        id: '3',
        accountId: 'mock_001',
        description: 'Gas Station',
        category: 'Transportation',
        amount: -45.20,
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'debit' as const,
        merchant: 'Shell',
      },
      {
        id: '4',
        accountId: 'mock_001',
        description: 'Coffee Shop',
        category: 'Food and Drink',
        amount: -8.75,
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'debit' as const,
        merchant: 'Starbucks',
      },
      {
        id: '5',
        accountId: 'mock_001',
        description: 'Online Shopping',
        category: 'Shopping',
        amount: -156.78,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'debit' as const,
        merchant: 'Amazon',
      },
    ];
  };

  if (isLoading) {
    return (
      <Card className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white mb-3 sm:mb-4">
          Recent Transactions
        </h3>
        <div className="space-y-3 sm:space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="animate-pulse flex items-center space-x-3 sm:space-x-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-2 sm:h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
              <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 sm:w-20 flex-shrink-0"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  // Show connect bank UI if no transactions
  if (!transactions || transactions.length === 0) {
    return (
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
          <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white">
            Recent Transactions
          </h3>
        </div>
        
        <div className="text-center py-8 sm:py-12">
          <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-neutral-400 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white mb-2">
            No Transactions Yet
          </h3>
          <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 mb-4 sm:mb-6 px-4">
            Connect your bank account to see your recent transactions and get insights.
          </p>
          <Button 
            onClick={() => {
              const section = document.querySelector('[data-section="connected-banks"]');
              section?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
            size="sm"
          >
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Connect Bank Account</span>
            <span className="sm:hidden">Connect Bank</span>
          </Button>
        </div>
      </Card>
    );
  }

  const displayedTransactions = showAll ? transactions : transactions.slice(0, 5);

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
        <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white">
          Recent Transactions
        </h3>
        <button className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors self-end sm:self-auto">
          <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-500" />
        </button>
      </div>

      <div className="max-h-80 sm:max-h-96 overflow-y-auto space-y-3 sm:space-y-4 pr-1 sm:pr-2">
        {displayedTransactions.map((transaction, index) => (
          <motion.div
            key={`recent-${transaction.accountId || 'unknown'}-${transaction.id}-${index}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex items-center justify-between p-2 sm:p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${
                transaction.amount > 0 ? 'bg-green-100 dark:bg-green-900/50' : 'bg-neutral-100 dark:bg-neutral-700'
              }`}>
                <div className="w-4 h-4 sm:w-5 sm:h-5">
                  {getCategoryIcon(transaction.category)}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm sm:text-base text-neutral-900 dark:text-white truncate">
                  {transaction.description}
                </p>
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 truncate">
                  {transaction.category} • {formatDate(transaction.date)}
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
              <p className={`font-semibold text-sm sm:text-base ${
                transaction.amount > 0 ? 'text-green-600' : 'text-neutral-900 dark:text-white'
              }`}>
                {transaction.amount > 0 ? '+' : '-'}{formatCurrency(transaction.amount)}
              </p>
            </div>
          </motion.div>
        ))}
        </div>

        {transactions.length > 5 && (
          <div className="mt-3 sm:mt-4 text-center">
            <Button
              variant="outline"
              onClick={() => setShowAll(!showAll)}
              className="text-xs sm:text-sm px-3 py-2"
              size="sm"
            >
              {showAll ? (
                <>
                  <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Show Less</span>
                  <span className="sm:hidden">Less</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Show All ({transactions.length} transactions)</span>
                  <span className="sm:hidden">All ({transactions.length})</span>
                </>
              )}
            </Button>
          </div>
        )}
      </Card>
  );
};
