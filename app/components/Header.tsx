import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Settings, Search, User, Menu } from 'lucide-react';
import { Button } from './ui/Button';

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title = "Smart Finance", onMenuClick }) => {
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

        {/* Search Bar - Hidden on small screens */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4 lg:mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Search transactions, insights..."
              className="w-full pl-8 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-neutral-300 dark:border-neutral-600 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
            />
          </div>
        </div>

        {/* Actions - Responsive */}
        <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
          <Button variant="ghost" size="sm" className="p-2">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <Button variant="ghost" size="sm" className="hidden sm:flex p-2">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <Button variant="ghost" size="sm" className="p-2">
            <User className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </div>
    </motion.header>
  );
};
