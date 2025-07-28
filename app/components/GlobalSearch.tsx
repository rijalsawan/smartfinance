'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Clock,
  TrendingUp,
  CreditCard,
  Building2,
  Brain,
  BarChart3,
  Target,
  DollarSign,
  ArrowRight,
  Zap,
  FileText,
  Settings,
  PieChart,
  Download,
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { searchService, type SearchResult } from '../services/searchService';
import { type BankAccount, type Transaction } from '../services/plaidService';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
  onOpenModal?: (modalType: string) => void;
  accounts?: BankAccount[];
  transactions?: Transaction[];
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenModal,
  accounts = [],
  transactions = [],
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Load recent searches from localStorage
  useEffect(() => {
    if (isOpen) {
      setRecentSearches(searchService.getRecentSearches());
    }
  }, [isOpen]);

  // Search function with debouncing
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    setIsLoading(true);
    const timeoutId = setTimeout(() => {
      const searchResults = searchService.search(query, transactions, accounts, {
        onNavigate,
        onOpenModal,
        maxResults: 8,
      });
      setResults(searchResults);
      setSelectedIndex(0);
      setIsLoading(false);
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [query, transactions, accounts, onNavigate, onOpenModal]);

  const handleSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    searchService.saveRecentSearch(searchTerm);
    setRecentSearches(searchService.getRecentSearches());
  };

  const handleResultSelect = (result: SearchResult) => {
    handleSearch(query);
    result.action();
    onClose();
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    if (e.key === 'Enter') {
      if (results[selectedIndex]) {
        handleResultSelect(results[selectedIndex]);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
      return;
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconProps = "w-4 h-4";
    switch (iconName) {
      case 'BarChart3': return <BarChart3 className={iconProps} />;
      case 'TrendingUp': return <TrendingUp className={iconProps} />;
      case 'Brain': return <Brain className={iconProps} />;
      case 'CreditCard': return <CreditCard className={iconProps} />;
      case 'Target': return <Target className={iconProps} />;
      case 'Building2': return <Building2 className={iconProps} />;
      case 'DollarSign': return <DollarSign className={iconProps} />;
      case 'PieChart': return <PieChart className={iconProps} />;
      case 'Download': return <Download className={iconProps} />;
      case 'FileText': return <FileText className={iconProps} />;
      case 'Settings': return <Settings className={iconProps} />;
      default: return <Search className={iconProps} />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'navigation': return <BarChart3 className="w-3 h-3" />;
      case 'transactions': return <DollarSign className="w-3 h-3" />;
      case 'accounts': return <Building2 className="w-3 h-3" />;
      case 'insights': return <Brain className="w-3 h-3" />;
      case 'settings': return <Settings className="w-3 h-3" />;
      default: return <Search className="w-3 h-3" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'navigation': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400';
      case 'transactions': return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400';
      case 'accounts': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400';
      case 'insights': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400';
      case 'settings': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-400';
      default: return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-400';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-20"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="overflow-hidden shadow-2xl bg-white/95 backdrop-blur-xl dark:bg-neutral-900/95">
            {/* Search Input */}
            <div className="flex items-center p-4 border-b border-neutral-200 dark:border-neutral-700">
              <Search className="w-5 h-5 text-neutral-400 mr-3 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search transactions, insights, or navigate to any page..."
                className="flex-1 bg-transparent border-none outline-none text-neutral-900 dark:text-white placeholder-neutral-500 text-lg"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Search Results */}
            <div ref={resultsRef} className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-4">
                  <div className="flex items-center space-x-3 animate-pulse">
                    <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded mb-2"></div>
                      <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              ) : results.length > 0 ? (
                <div className="py-2">
                  {results.map((result, index) => (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center px-4 py-3 cursor-pointer transition-colors ${
                        index === selectedIndex
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-r-2 border-indigo-500'
                          : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                      }`}
                      onClick={() => handleResultSelect(result)}
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="flex items-center space-x-2">
                          <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                            {getIconComponent(result.icon)}
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(result.category)}`}>
                            <div className="flex items-center space-x-1">
                              {getCategoryIcon(result.category)}
                              <span className="capitalize">{result.category}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-neutral-900 dark:text-white truncate">
                            {result.title}
                          </p>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                            {result.description}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-neutral-400" />
                    </motion.div>
                  ))}
                </div>
              ) : query.trim() ? (
                <div className="p-8 text-center">
                  <Search className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
                    No results found
                  </h3>
                  <p className="text-neutral-500 dark:text-neutral-400">
                    Try searching for transactions, insights, or page names
                  </p>
                </div>
              ) : (
                <div className="p-4">
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3 flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        Recent Searches
                      </h3>
                      <div className="space-y-1">
                        {recentSearches.map((search, index) => (
                          <button
                            key={index}
                            onClick={() => setQuery(search)}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-sm"
                          >
                            {search}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div>
                    <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3 flex items-center">
                      <Zap className="w-4 h-4 mr-2" />
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {searchService.getQuickActions(onNavigate).map((item, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            item.action();
                            onClose();
                          }}
                          className="flex items-center space-x-2 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                        >
                          {getIconComponent(item.icon)}
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            {item.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                <div className="flex items-center space-x-4">
                  <kbd className="px-2 py-1 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded shadow-sm">↑↓</kbd>
                  <span>Navigate</span>
                  <kbd className="px-2 py-1 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded shadow-sm">Enter</kbd>
                  <span>Select</span>
                </div>
                <div className="flex items-center space-x-2">
                  <kbd className="px-2 py-1 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded shadow-sm">Esc</kbd>
                  <span>Close</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
