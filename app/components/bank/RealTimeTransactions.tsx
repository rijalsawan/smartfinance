'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  Filter,
  Download,
  Search,
  Calendar,
  MapPin,
  TrendingUp,
  TrendingDown,
  Clock,
  CreditCard,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { plaidService, type Transaction, type BankAccount } from '../../services/plaidService';
import { analyticsService, type SpendingCategory } from '../../services/analyticsService';
import { format, parseISO, isToday, isYesterday, subDays } from 'date-fns';

interface RealTimeTransactionsProps {
  accounts: BankAccount[];
}

type FilterType = 'all' | 'income' | 'expenses' | 'today' | 'week' | 'month';
type CategoryFilter = 'all' | string;

export const RealTimeTransactions: React.FC<RealTimeTransactionsProps> = ({ accounts }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [spendingCategories, setSpendingCategories] = useState<SpendingCategory[]>([]);

  // Load transactions when accounts change
  useEffect(() => {
    if (accounts.length > 0) {
      loadTransactions();
    }
  }, [accounts]);

  // Apply filters when transactions or filters change
  useEffect(() => {
    applyFilters();
  }, [transactions, searchTerm, activeFilter, categoryFilter]);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const allTransactions: Transaction[] = [];
      
      for (const account of accounts) {
        const accountTransactions = await plaidService.getTransactions(account.institutionName, [account.id]);
        allTransactions.push(...accountTransactions);
      }

      // Sort by date (most recent first)
      allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(allTransactions);
      
      // Load spending categories from analytics service (same as dashboard)
      const categories = await analyticsService.getSpendingCategories();
      if (categories && categories.length > 0) {
        setSpendingCategories(categories);
        setAvailableCategories(categories.map(cat => cat.category));
      } else {
        // Fallback to extracting unique categories from transactions
        const fallbackCategories = Array.from(new Set(
          allTransactions
            .map(txn => txn.category)
            .filter(category => category && category !== 'Other')
        )).sort();
        
        setAvailableCategories(fallbackCategories);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(txn =>
        txn.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.merchant?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Time-based filters
    const now = new Date();
    switch (activeFilter) {
      case 'income':
        filtered = filtered.filter(txn => txn.type === 'credit');
        break;
      case 'expenses':
        filtered = filtered.filter(txn => txn.type === 'debit');
        break;
      case 'today':
        filtered = filtered.filter(txn => isToday(parseISO(txn.date)));
        break;
      case 'week':
        const weekAgo = subDays(now, 7);
        filtered = filtered.filter(txn => new Date(txn.date) >= weekAgo);
        break;
      case 'month':
        const monthAgo = subDays(now, 30);
        filtered = filtered.filter(txn => new Date(txn.date) >= monthAgo);
        break;
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(txn =>
        txn.category.toLowerCase().includes(categoryFilter.toLowerCase())
      );
    }    setFilteredTransactions(filtered);
  };

  const getTransactionIcon = (transaction: Transaction) => {
    if (transaction.type === 'credit') {
      return <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />;
    }

    // Category-based icons for expenses
    const category = transaction.category.toLowerCase();
    if (category.includes('food') || category.includes('dining') || category.includes('grocery')) {
      return '🍽️';
    }
    if (category.includes('gas') || category.includes('fuel')) {
      return '⛽';
    }
    if (category.includes('housing') || category.includes('rent')) {
      return '🏠';
    }
    if (category.includes('utilities') || category.includes('phone')) {
      return '💡';
    }
    if (category.includes('shopping')) {
      return '🛍️';
    }
    if (category.includes('transport')) {
      return '🚗';
    }
    
    return <CreditCard className="w-5 h-5 text-neutral-400" />;
  };

  const formatTransactionDate = (dateString: string) => {
    const date = parseISO(dateString);
    
    if (isToday(date)) {
      return `Today, ${format(date, 'h:mm a')}`;
    }
    if (isYesterday(date)) {
      return `Yesterday, ${format(date, 'h:mm a')}`;
    }
    
    return format(date, 'MMM d, h:mm a');
  };

  const getAccountName = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? `${account.institutionName} ${account.name}` : 'Unknown Account';
  };

  const exportTransactions = () => {
    const csvContent = [
      ['Date', 'Description', 'Category', 'Amount', 'Type', 'Account', 'Merchant', 'Location'],
      ...filteredTransactions.map(txn => [
        format(parseISO(txn.date), 'yyyy-MM-dd HH:mm:ss'),
        txn.description,
        txn.category,
        txn.amount.toString(),
        txn.type,
        getAccountName(txn.accountId),
        txn.merchant || '',
        txn.location || '',
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'income', label: 'Income' },
    { key: 'expenses', label: 'Expenses' },
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
  ];

  // Generate dynamic categories list from analytics service (same as dashboard)
  const categories: { key: CategoryFilter; label: string }[] = [
    { key: 'all', label: 'All Categories' },
    ...availableCategories.map(category => ({
      key: category,
      label: category
    }))
  ];

  // Add spending amounts to category labels if available
  const categoriesWithAmounts: { key: CategoryFilter; label: string }[] = [
    { key: 'all', label: 'All Categories' },
    ...availableCategories.map(category => {
      const spendingData = spendingCategories.find(cat => cat.category === category);
      const amountLabel = spendingData ? ` ($${spendingData.amount.toFixed(0)})` : '';
      return {
        key: category,
        label: `${category}${amountLabel}`
      };
    })
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Real-time Transactions
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {filteredTransactions.length} of {transactions.length} transactions
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={exportTransactions}
            disabled={filteredTransactions.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadTransactions}
            loading={isLoading}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search transactions, merchants, or categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
            />
          </div>

          {/* Filter Pills */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Time Period
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {filters.map((filter) => (
                      <button
                        key={filter.key}
                        onClick={() => setActiveFilter(filter.key)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                          activeFilter === filter.key
                            ? 'bg-indigo-600 text-white'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categoriesWithAmounts.map((category) => (
                      <button
                        key={category.key}
                        onClick={() => setCategoryFilter(category.key)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                          categoryFilter === category.key
                            ? 'bg-purple-600 text-white'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {category.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      {/* Transactions List */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
              <span className="text-neutral-600 dark:text-neutral-400">Loading transactions...</span>
            </div>
          </div>
        ) : filteredTransactions.length > 0 ? (
          <div className="space-y-1">
            {filteredTransactions.map((transaction, index) => (
              <motion.div
                key={`${transaction.accountId}-${transaction.id}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-xl transition-all duration-200 group"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {typeof getTransactionIcon(transaction) === 'string' ? (
                      <div className="w-10 h-10 flex items-center justify-center text-xl bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                        {getTransactionIcon(transaction)}
                      </div>
                    ) : (
                      <div className="w-10 h-10 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                        {getTransactionIcon(transaction)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-medium text-neutral-900 dark:text-white truncate">
                        {transaction.description}
                      </p>
                      {transaction.isRecurring && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                          <Clock className="w-3 h-3 mr-1" />
                          Recurring
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-neutral-500 dark:text-neutral-400">
                      <span>{transaction.category}</span>
                      <span>{formatTransactionDate(transaction.date)}</span>
                      {transaction.location && (
                        <span className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {typeof transaction.location === 'string' 
                            ? transaction.location 
                            : `${transaction.location.city || ''}${transaction.location.city && transaction.location.region ? ', ' : ''}${transaction.location.region || ''}`
                          }
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                      {getAccountName(transaction.accountId)}
                    </p>
                  </div>
                </div>

                <div className="flex-shrink-0 text-right">
                  <p className={`font-semibold text-lg ${
                    transaction.type === 'credit'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-neutral-900 dark:text-white'
                  }`}>
                    {transaction.type === 'credit' ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    CAD
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
              No transactions found
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              Try adjusting your search criteria or filters
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};
