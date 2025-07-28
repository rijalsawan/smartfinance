import { plaidService, type BankAccount, type Transaction } from './plaidService';

export interface DashboardStats {
  totalBalance: number;
  monthlySpending: number;
  monthlyIncome: number;
  availableCredit: number;
  spendingChange: number;
  incomeChange: number;
  balanceChange: number;
  creditChange: number;
}

export interface SpendingCategory {
  category: string;
  amount: number;
  percentage: number;
  transactions: number;
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export class AnalyticsService {
  // Calculate dashboard statistics from real account data
  public async getDashboardStats(): Promise<DashboardStats | null> {
    try {
      const connectedInstitutions = plaidService.getConnectedInstitutions();
      
      // If no real institutions are connected, return null to show default UI
      if (connectedInstitutions.length === 0) {
        console.log('No institutions connected, returning null for default UI');
        return null;
      }

      const accounts = await plaidService.getAllAccounts();
      const transactions = await plaidService.getAllTransactions(60); // Get last 60 days for comparison
      
      // Calculate total balance across all accounts
      const totalBalance = accounts.reduce((sum, account) => {
        // For credit accounts, use available balance instead of current balance
        if (account.accountType === 'credit') {
          return sum + (account.availableBalance || 0);
        }
        return sum + account.balance;
      }, 0);

      // Calculate available credit from credit accounts
      const availableCredit = accounts
        .filter(account => account.accountType === 'credit')
        .reduce((sum, account) => sum + (account.availableBalance || 0), 0);

      // Calculate monthly spending and income
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      const currentMonthTransactions = transactions.filter(txn => {
        const txnDate = new Date(txn.date);
        return txnDate.getMonth() === currentMonth && txnDate.getFullYear() === currentYear;
      });

      const lastMonthTransactions = transactions.filter(txn => {
        const txnDate = new Date(txn.date);
        return txnDate.getMonth() === lastMonth && txnDate.getFullYear() === lastMonthYear;
      });

      const monthlySpending = Math.abs(currentMonthTransactions
        .filter(txn => txn.amount < 0)
        .reduce((sum, txn) => sum + txn.amount, 0));

      const monthlyIncome = currentMonthTransactions
        .filter(txn => txn.amount > 0)
        .reduce((sum, txn) => sum + txn.amount, 0);

      const lastMonthSpending = Math.abs(lastMonthTransactions
        .filter(txn => txn.amount < 0)
        .reduce((sum, txn) => sum + txn.amount, 0));

      const lastMonthIncome = lastMonthTransactions
        .filter(txn => txn.amount > 0)
        .reduce((sum, txn) => sum + txn.amount, 0);

      // Calculate percentage changes
      const spendingChange = lastMonthSpending > 0 
        ? ((monthlySpending - lastMonthSpending) / lastMonthSpending) * 100 
        : 0;

      const incomeChange = lastMonthIncome > 0 
        ? ((monthlyIncome - lastMonthIncome) / lastMonthIncome) * 100 
        : 0;

      // Calculate balance change (simplified - would need historical data for accuracy)
      const balanceChange = incomeChange - Math.abs(spendingChange);

      // Calculate credit change (simplified - positive if more credit available)
      const creditChange = availableCredit > 10000 ? 2.5 : -1.2; // Example calculation

      return {
        totalBalance,
        monthlySpending,
        monthlyIncome,
        availableCredit,
        spendingChange,
        incomeChange,
        balanceChange,
        creditChange,
      };
    } catch (error) {
      console.error('Error calculating dashboard stats:', error);
      // Return null to show default UI on error
      return null;
    }
  }

  // Calculate spending by category from real transaction data
  public async getSpendingCategories(): Promise<SpendingCategory[] | null> {
    try {
      const connectedInstitutions = plaidService.getConnectedInstitutions();
      
      // If no real institutions are connected, return null for default UI
      if (connectedInstitutions.length === 0) {
        console.log('No institutions connected, returning null for default UI');
        return null;
      }

      const transactions = await plaidService.getAllTransactions(30);
      const expenseTransactions = transactions.filter(txn => txn.amount < 0);
      
      if (expenseTransactions.length === 0) {
        return [];
      }

      // Group transactions by category
      const categoryMap = new Map<string, { amount: number; count: number }>();
      
      expenseTransactions.forEach(txn => {
        const category = txn.category || 'Other';
        const existing = categoryMap.get(category) || { amount: 0, count: 0 };
        categoryMap.set(category, {
          amount: existing.amount + Math.abs(txn.amount),
          count: existing.count + 1,
        });
      });

      const totalSpending = Array.from(categoryMap.values())
        .reduce((sum, cat) => sum + cat.amount, 0);

      // Convert to array and calculate percentages
      const categories: SpendingCategory[] = Array.from(categoryMap.entries())
        .map(([category, data]) => ({
          category,
          amount: data.amount,
          percentage: (data.amount / totalSpending) * 100,
          transactions: data.count,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 8); // Top 8 categories

      return categories;
    } catch (error) {
      console.error('Error calculating spending categories:', error);
      return null;
    }
  }

  // Generate monthly comparison data
  public async getMonthlyComparison(months: number = 6): Promise<MonthlyData[] | null> {
    try {
      const connectedInstitutions = plaidService.getConnectedInstitutions();
      
      // If no real institutions are connected, return null for default UI
      if (connectedInstitutions.length === 0) {
        console.log('No institutions connected, returning null for default UI');
        return null;
      }

      const transactions = await plaidService.getAllTransactions(months * 31);
      
      if (transactions.length === 0) {
        return [];
      }

      const monthlyData: MonthlyData[] = [];
      const now = new Date();

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        
        const monthTransactions = transactions.filter(txn => {
          const txnDate = new Date(txn.date);
          return txnDate.getMonth() === date.getMonth() && 
                 txnDate.getFullYear() === date.getFullYear();
        });

        const income = monthTransactions
          .filter(txn => txn.amount > 0)
          .reduce((sum, txn) => sum + txn.amount, 0);

        const expenses = Math.abs(monthTransactions
          .filter(txn => txn.amount < 0)
          .reduce((sum, txn) => sum + txn.amount, 0));

        monthlyData.push({
          month: monthName,
          income,
          expenses,
          net: income - expenses,
        });
      }

      return monthlyData;
    } catch (error) {
      console.error('Error calculating monthly comparison:', error);
      return null;
    }
  }

  // Generate chart data for spending trends
  public async getSpendingTrendData() {
    const monthlyData = await this.getMonthlyComparison(6);
    
    if (!monthlyData || monthlyData.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }
    
    return {
      labels: monthlyData.map(d => d.month),
      datasets: [
        {
          label: 'Income',
          data: monthlyData.map(d => d.income),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderWidth: 2,
          fill: true,
        },
        {
          label: 'Expenses',
          data: monthlyData.map(d => d.expenses),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 2,
          fill: true,
        },
      ],
    };
  }

  // Generate chart data for expense categories
  public async getExpenseCategoriesData() {
    const categories = await this.getSpendingCategories();
    
    if (!categories || categories.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }
    
    return {
      labels: categories.map(c => c.category),
      datasets: [
        {
          data: categories.map(c => c.amount),
          backgroundColor: [
            '#8b5cf6',
            '#06b6d4',
            '#10b981',
            '#f59e0b',
            '#ef4444',
            '#ec4899',
            '#6366f1',
            '#84cc16',
          ],
          borderWidth: 0,
        },
      ],
    };
  }

  // Generate chart data for monthly comparison
  public async getMonthlyComparisonData() {
    const monthlyData = await this.getMonthlyComparison(6);
    
    if (!monthlyData || monthlyData.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }
    
    return {
      labels: monthlyData.map(d => d.month),
      datasets: [
        {
          label: 'Income',
          data: monthlyData.map(d => d.income),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
        },
        {
          label: 'Expenses',
          data: monthlyData.map(d => d.expenses),
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
        },
      ],
    };
  }

  // Fallback mock data
  private getMockSpendingCategories(): SpendingCategory[] {
    return [
      { category: 'Food and Drink', amount: 850.20, percentage: 26.2, transactions: 24 },
      { category: 'Transportation', amount: 650.50, percentage: 20.0, transactions: 12 },
      { category: 'Shopping', amount: 480.75, percentage: 14.8, transactions: 8 },
      { category: 'Entertainment', amount: 320.00, percentage: 9.9, transactions: 6 },
      { category: 'Bills & Utilities', amount: 290.99, percentage: 9.0, transactions: 4 },
      { category: 'Healthcare', amount: 180.25, percentage: 5.6, transactions: 3 },
      { category: 'Travel', amount: 150.00, percentage: 4.6, transactions: 2 },
      { category: 'Other', amount: 320.51, percentage: 9.9, transactions: 11 },
    ];
  }

  private getMockMonthlyData(): MonthlyData[] {
    return [
      { month: 'Aug 24', income: 5200, expenses: 3100, net: 2100 },
      { month: 'Sep 24', income: 5400, expenses: 3400, net: 2000 },
      { month: 'Oct 24', income: 5200, expenses: 3600, net: 1600 },
      { month: 'Nov 24', income: 5600, expenses: 3200, net: 2400 },
      { month: 'Dec 24', income: 5800, expenses: 4100, net: 1700 },
      { month: 'Jan 25', income: 5400, expenses: 3247, net: 2153 },
    ];
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
