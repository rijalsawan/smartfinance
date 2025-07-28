import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Search,
  Filter,
  Calendar,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Download,
  RefreshCw,
  DollarSign,
  Building2,
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { plaidService, type Transaction } from '../services/plaidService';
import { analyticsService, type SpendingCategory } from '../services/analyticsService';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: any[];
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ 
  isOpen, 
  onClose, 
  accounts 
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'description'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [spendingCategories, setSpendingCategories] = useState<SpendingCategory[]>([]);

  // Dynamic categories from analytics service (same as dashboard)
  const categories = [
    'all',
    ...availableCategories
  ];

  useEffect(() => {
    if (isOpen) {
      loadTransactions();
    }
  }, [isOpen]);

  useEffect(() => {
    filterAndSortTransactions();
  }, [transactions, searchTerm, selectedCategory, selectedAccount, sortBy, sortOrder]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      if (accounts.length === 0) {
        setTransactions([]);
        setAvailableCategories([]);
        return;
      }

      const allTransactions = await plaidService.getAllTransactions(90); // Get last 3 months
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
      setTransactions([]);
      setAvailableCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortTransactions = () => {
    let filtered = [...transactions];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(txn => 
        txn.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.merchant?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(txn => 
        txn.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by account
    if (selectedAccount !== 'all') {
      filtered = filtered.filter(txn => txn.accountId === selectedAccount);
    }

    // Sort transactions
    filtered.sort((a, b) => {
      let compareValue = 0;
      
      switch (sortBy) {
        case 'date':
          compareValue = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          compareValue = Math.abs(a.amount) - Math.abs(b.amount);
          break;
        case 'description':
          compareValue = a.description.localeCompare(b.description);
          break;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    setFilteredTransactions(filtered);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(amount));
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getCategoryIcon = (category: string | undefined) => {
    // Simple icon mapping - you can expand this
    switch (category?.toLowerCase()) {
      case 'food': return '🍽️';
      case 'transportation': return '🚗';
      case 'shopping': return '🛍️';
      case 'entertainment': return '🎬';
      case 'bills': return '📄';
      case 'healthcare': return '🏥';
      case 'education': return '📚';
      case 'travel': return '✈️';
      default: return '💳';
    }
  };

  const handleSort = (field: 'date' | 'amount' | 'description') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
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
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
              <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                All Transactions
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400">
                {filteredTransactions.length} transactions found
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={loadTransactions} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>

            {/* Account Filter */}
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
            >
              <option value="all">All Accounts</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} (•••{account.mask})
                </option>
              ))}
            </select>

            {/* Sort Options */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Sort</span>
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>

          {/* Sort Options */}
          {showFilters && (
            <div className="mt-4 flex items-center space-x-4">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Sort by:</span>
              {(['date', 'amount', 'description'] as const).map(field => (
                <Button
                  key={field}
                  variant={sortBy === field ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => handleSort(field)}
                  className="flex items-center space-x-1"
                >
                  <span className="capitalize">{field}</span>
                  {sortBy === field && (
                    <ArrowUpDown className={`w-3 h-3 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                  )}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Transaction List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, index) => (
                <div key={index} className="animate-pulse flex items-center space-x-4 p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                  <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-700 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
                    <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
                  </div>
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-20"></div>
                </div>
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
                No transactions found
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                Try adjusting your filters or connect your bank accounts to see transactions.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((transaction, index) => (
                <motion.div
                  key={`${transaction.id}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">
                      {getCategoryIcon(transaction.category)}
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-white">
                        {transaction.description}
                      </p>
                      <div className="flex items-center space-x-2 text-sm text-neutral-500 dark:text-neutral-400">
                        <span>{transaction.category || 'Other'}</span>
                        <span>•</span>
                        <span>{formatDate(transaction.date)}</span>
                        {transaction.merchant && (
                          <>
                            <span>•</span>
                            <span>{transaction.merchant}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-neutral-900 dark:text-white'
                    }`}>
                      {transaction.amount > 0 ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
