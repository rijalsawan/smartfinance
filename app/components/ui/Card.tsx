import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
  gradient?: 'primary' | 'accent' | 'success' | 'none';
  delay?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = true,
  glass = false,
  gradient = 'none',
  delay = 0,
}) => {
  const baseClasses = 'rounded-2xl p-6 transition-all duration-300';
  const hoverClasses = hover ? 'card-hover cursor-pointer' : '';
  const glassClasses = glass ? 'glass' : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700';
  const gradientClasses = {
    primary: 'gradient-primary text-white',
    accent: 'gradient-accent text-white',
    success: 'gradient-success text-white',
    none: '',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`${baseClasses} ${hoverClasses} ${glassClasses} ${gradientClasses[gradient]} ${className}`}
    >
      {children}
    </motion.div>
  );
};
