import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Settings, Search, User, Menu, Command } from 'lucide-react';
import { Button } from './ui/Button';
import { GlobalSearch } from './GlobalSearch';
import { type BankAccount, type Transaction } from '../services/plaidService';

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
  onNavigate?: (page: string) => void;
  onOpenModal?: (modalType: string) => void;
  accounts?: BankAccount[];
  transactions?: Transaction[];
}

export const Header: React.FC<HeaderProps> = ({ 
  title = "Smart Finance", 
  onMenuClick, 
  onNavigate, 
  onOpenModal,
  accounts = [],
  transactions = [],
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Handle keyboard shortcut for search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-3 sm:px-4 lg:px-6 py-3 sm:py-4"
    >
      <div className="flex items-center justify-between">
        {/* Mobile Menu Button & Logo */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <Menu className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </button>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-2 sm:space-x-3"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-base sm:text-lg">$</span>
            </div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-neutral-900 dark:text-white">
              {title}
            </h1>
          </motion.div>
        </div>

        {/* Search Bar - Hidden on small screens, clickable to open global search */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4 lg:mx-8">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="relative w-full group"
          >
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4 sm:w-5 sm:h-5 group-hover:text-neutral-500 transition-colors" />
            <div className="w-full pl-8 sm:pl-10 pr-12 py-2 sm:py-2.5 text-sm sm:text-base border border-neutral-300 dark:border-neutral-600 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all duration-300 text-left">
              Search transactions, insights...
            </div>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              <kbd className="hidden lg:inline-block px-2 py-1 text-xs bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded shadow-sm text-neutral-500 dark:text-neutral-400">
                ⌘K
              </kbd>
            </div>
          </button>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Mobile Search Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSearchOpen(true)}
            className="md:hidden p-2"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="p-2">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          
          {/* Settings - Hidden on mobile */}
          <Button variant="ghost" size="sm" className="hidden sm:flex p-2">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          
          {/* User Profile */}
          <Button variant="ghost" size="sm" className="p-2">
            <User className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </div>

      {/* Global Search Modal */}
      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigate}
        onOpenModal={onOpenModal}
        accounts={accounts}
        transactions={transactions}
      />
    </motion.header>
  );
};
