import { plaidService, type Transaction, type BankAccount } from './plaidService';

export interface AIInsight {
  id: string;
  type: 'prediction' | 'recommendation' | 'alert' | 'goal' | 'opportunity';
  title: string;
  description: string;
  impact: 'Low' | 'Medium' | 'High';
  confidence: number;
  category: string;
  actionable: boolean;
  priority: number;
  metadata?: {
    amount?: number;
    percentage?: number;
    trend?: 'increasing' | 'decreasing' | 'stable';
    timeframe?: string;
    accounts?: string[];
  };
}

export interface SpendingPattern {
  category: string;
  averageMonthly: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  volatility: number;
  seasonality?: {
    month: number;
    factor: number;
  }[];
}

export interface FinancialHealthScore {
  overall: number;
  components: {
    spendingControl: number;
    savingsRate: number;
    debtManagement: number;
    budgetAdherence: number;
    financialStability: number;
  };
  recommendations: string[];
}

export class AIInsightsService {
  // Main method to generate AI insights from transaction data
  public async generateInsights(): Promise<AIInsight[]> {
    try {
      const connectedInstitutions = plaidService.getConnectedInstitutions();
      
      // If no real institutions connected, return demo insights
      if (connectedInstitutions.length === 0) {
        return this.getDemoInsights();
      }

      const accounts = await plaidService.getAllAccounts();
      const transactions = await plaidService.getAllTransactions(90); // Get 90 days of data
      
      if (transactions.length === 0) {
        return this.getDemoInsights();
      }

      const insights: AIInsight[] = [];
      
      // Generate different types of insights
      insights.push(...await this.analyzeSpendingPatterns(transactions));
      insights.push(...await this.detectAnomalies(transactions));
      insights.push(...await this.predictFutureSpending(transactions));
      insights.push(...await this.identifyOptimizations(transactions, accounts));
      insights.push(...await this.generateGoalRecommendations(transactions, accounts));
      insights.push(...await this.detectRecurringCharges(transactions));
      
      // Sort by priority and confidence
      return insights
        .sort((a, b) => b.priority - a.priority || b.confidence - a.confidence)
        .slice(0, 8); // Return top 8 insights
        
    } catch (error) {
      console.error('Error generating AI insights:', error);
      return this.getDemoInsights();
    }
  }

  // Analyze spending patterns and trends
  private async analyzeSpendingPatterns(transactions: Transaction[]): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    
    // Group transactions by category and analyze trends
    const categorySpending = this.groupByCategory(transactions);
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    
    for (const [category, txns] of Object.entries(categorySpending)) {
      const recent = txns.filter(t => new Date(t.date) >= thirtyDaysAgo);
      const previous = txns.filter(t => new Date(t.date) >= sixtyDaysAgo && new Date(t.date) < thirtyDaysAgo);
      
      const recentTotal = recent.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const previousTotal = previous.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      if (previousTotal > 0) {
        const change = ((recentTotal - previousTotal) / previousTotal) * 100;
        
        if (Math.abs(change) > 20) {
          insights.push({
            id: `pattern-${category}`,
            type: change > 0 ? 'alert' : 'prediction',
            title: `${category} Spending ${change > 0 ? 'Increased' : 'Decreased'}`,
            description: `Your ${category.toLowerCase()} spending has ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(1)}% this month.`,
            impact: Math.abs(change) > 50 ? 'High' : 'Medium',
            confidence: Math.min(95, 60 + Math.abs(change)),
            category,
            actionable: change > 0,
            priority: Math.abs(change) > 50 ? 9 : 7,
            metadata: {
              amount: recentTotal,
              percentage: change,
              trend: change > 0 ? 'increasing' : 'decreasing',
              timeframe: '30 days'
            }
          });
        }
      }
    }
    
    return insights;
  }

  // Detect unusual spending patterns or anomalies
  private async detectAnomalies(transactions: Transaction[]): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    
    // Analyze daily spending patterns
    const dailySpending = this.getDailySpending(transactions);
    const avgDailySpending = dailySpending.reduce((sum, day) => sum + day.amount, 0) / dailySpending.length;
    const stdDev = this.calculateStandardDeviation(dailySpending.map(d => d.amount));
    
    // Find outlier days
    const outliers = dailySpending.filter(day => 
      Math.abs(day.amount - avgDailySpending) > 2 * stdDev && day.amount > avgDailySpending
    );
    
    if (outliers.length > 0) {
      const latestOutlier = outliers[outliers.length - 1];
      insights.push({
        id: 'anomaly-spending',
        type: 'alert',
        title: 'Unusual Spending Detected',
        description: `You spent $${latestOutlier.amount.toFixed(2)} on ${latestOutlier.date}, which is ${((latestOutlier.amount / avgDailySpending - 1) * 100).toFixed(0)}% above your daily average.`,
        impact: 'Medium',
        confidence: 85,
        category: 'Budget Control',
        actionable: true,
        priority: 8,
        metadata: {
          amount: latestOutlier.amount,
          percentage: (latestOutlier.amount / avgDailySpending - 1) * 100
        }
      });
    }
    
    return insights;
  }

  // Predict future spending based on historical patterns
  private async predictFutureSpending(transactions: Transaction[]): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    
    // Calculate monthly spending trend
    const monthlySpending = this.getMonthlySpending(transactions, 3);
    if (monthlySpending.length >= 2) {
      const trend = this.calculateTrend(monthlySpending.map(m => m.amount));
      const lastMonth = monthlySpending[monthlySpending.length - 1].amount;
      const predictedNext = lastMonth + trend;
      
      if (Math.abs(trend) > 50) {
        insights.push({
          id: 'prediction-monthly',
          type: 'prediction',
          title: 'Monthly Spending Forecast',
          description: `Based on your recent patterns, you're likely to spend $${predictedNext.toFixed(0)} next month${trend > 0 ? ', an increase' : ', a decrease'} of $${Math.abs(trend).toFixed(0)}.`,
          impact: Math.abs(trend) > 200 ? 'High' : 'Medium',
          confidence: 78,
          category: 'Budget Planning',
          actionable: trend > 0,
          priority: 7,
          metadata: {
            amount: predictedNext,
            trend: trend > 0 ? 'increasing' : 'decreasing',
            timeframe: 'next month'
          }
        });
      }
    }
    
    return insights;
  }

  // Identify optimization opportunities
  private async identifyOptimizations(transactions: Transaction[], accounts: BankAccount[]): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    
    // Detect potential subscription optimization
    const subscriptions = this.detectSubscriptions(transactions);
    if (subscriptions.length > 0) {
      const totalSubscriptions = subscriptions.reduce((sum, sub) => sum + sub.amount, 0);
      
      insights.push({
        id: 'optimization-subscriptions',
        type: 'recommendation',
        title: 'Optimize Subscriptions',
        description: `You have ${subscriptions.length} recurring subscriptions totaling $${totalSubscriptions.toFixed(2)}/month. Review and cancel unused ones to save money.`,
        impact: totalSubscriptions > 100 ? 'High' : 'Medium',
        confidence: 92,
        category: 'Cost Optimization',
        actionable: true,
        priority: 8,
        metadata: {
          amount: totalSubscriptions,
          accounts: subscriptions.map(s => s.account)
        }
      });
    }
    
    // Analyze cash vs credit usage
    const cashAccounts = accounts.filter(a => a.accountType === 'depository');
    const creditAccounts = accounts.filter(a => a.accountType === 'credit');
    
    if (creditAccounts.length > 0 && cashAccounts.length > 0) {
      const creditUtilization = this.calculateCreditUtilization(creditAccounts);
      
      if (creditUtilization > 30) {
        insights.push({
          id: 'optimization-credit',
          type: 'recommendation',
          title: 'Reduce Credit Utilization',
          description: `Your credit utilization is ${creditUtilization.toFixed(1)}%. Keeping it below 30% can improve your credit score.`,
          impact: 'High',
          confidence: 88,
          category: 'Credit Management',
          actionable: true,
          priority: 9,
          metadata: {
            percentage: creditUtilization
          }
        });
      }
    }
    
    return insights;
  }

  // Generate savings and financial goal recommendations
  private async generateGoalRecommendations(transactions: Transaction[], accounts: BankAccount[]): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    
    // Calculate potential savings
    const monthlyIncome = this.calculateMonthlyIncome(transactions);
    const monthlyExpenses = this.calculateMonthlyExpenses(transactions);
    const currentSavingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;
    
    if (currentSavingsRate < 20 && monthlyIncome > 0) {
      const recommendedSavings = monthlyIncome * 0.2;
      const additionalSavings = recommendedSavings - (monthlyIncome - monthlyExpenses);
      
      insights.push({
        id: 'goal-savings-rate',
        type: 'goal',
        title: 'Improve Savings Rate',
        description: `Your current savings rate is ${currentSavingsRate.toFixed(1)}%. Try to save an additional $${additionalSavings.toFixed(0)}/month to reach the recommended 20%.`,
        impact: 'High',
        confidence: 85,
        category: 'Savings Goals',
        actionable: true,
        priority: 8,
        metadata: {
          amount: additionalSavings,
          percentage: 20 - currentSavingsRate
        }
      });
    }
    
    return insights;
  }

  // Detect recurring charges and subscriptions
  private async detectRecurringCharges(transactions: Transaction[]): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    
    // Group similar transactions that might be recurring
    const potentialRecurring = this.findRecurringTransactions(transactions);
    
    // Look for new recurring charges
    const recentRecurring = potentialRecurring.filter(group => {
      const latestTransaction = new Date(Math.max(...group.map(t => new Date(t.date).getTime())));
      const daysSinceLatest = (Date.now() - latestTransaction.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceLatest < 7; // New in last week
    });
    
    if (recentRecurring.length > 0) {
      const newCharge = recentRecurring[0][0];
      insights.push({
        id: 'alert-new-recurring',
        type: 'alert',
        title: 'New Recurring Charge Detected',
        description: `A new recurring charge of $${Math.abs(newCharge.amount).toFixed(2)} from ${newCharge.description} was detected. Make sure this is authorized.`,
        impact: 'Medium',
        confidence: 82,
        category: 'Account Monitoring',
        actionable: true,
        priority: 7,
        metadata: {
          amount: Math.abs(newCharge.amount)
        }
      });
    }
    
    return insights;
  }

  // Calculate financial health score
  public async calculateFinancialHealthScore(): Promise<FinancialHealthScore> {
    try {
      const connectedInstitutions = plaidService.getConnectedInstitutions();
      
      if (connectedInstitutions.length === 0) {
        return this.getDemoHealthScore();
      }

      const accounts = await plaidService.getAllAccounts();
      const transactions = await plaidService.getAllTransactions(90);
      
      const monthlyIncome = this.calculateMonthlyIncome(transactions);
      const monthlyExpenses = this.calculateMonthlyExpenses(transactions);
      const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;
      
      // Calculate component scores
      const spendingControl = Math.min(100, Math.max(0, 100 - (this.calculateSpendingVolatility(transactions) * 10)));
      const savingsRateScore = Math.min(100, savingsRate * 5); // 20% savings = 100 points
      const debtManagement = this.calculateDebtScore(accounts);
      const budgetAdherence = this.calculateBudgetAdherence(transactions);
      const financialStability = this.calculateStabilityScore(transactions);
      
      const overall = (spendingControl + savingsRateScore + debtManagement + budgetAdherence + financialStability) / 5;
      
      return {
        overall: Math.round(overall * 10) / 100, // Round to 1 decimal
        components: {
          spendingControl: Math.round(spendingControl),
          savingsRate: Math.round(savingsRateScore),
          debtManagement: Math.round(debtManagement),
          budgetAdherence: Math.round(budgetAdherence),
          financialStability: Math.round(financialStability)
        },
        recommendations: this.generateHealthRecommendations(overall, {
          spendingControl,
          savingsRate: savingsRateScore,
          debtManagement,
          budgetAdherence,
          financialStability
        })
      };
    } catch (error) {
      console.error('Error calculating financial health score:', error);
      return this.getDemoHealthScore();
    }
  }

  // Helper methods for analysis

  private groupByCategory(transactions: Transaction[]): Record<string, Transaction[]> {
    return transactions.reduce((groups, transaction) => {
      const category = transaction.category || 'Other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(transaction);
      return groups;
    }, {} as Record<string, Transaction[]>);
  }

  private getDailySpending(transactions: Transaction[]): { date: string; amount: number }[] {
    const dailyTotals: Record<string, number> = {};
    
    transactions.filter(t => t.amount < 0).forEach(transaction => {
      const date = transaction.date.split('T')[0];
      dailyTotals[date] = (dailyTotals[date] || 0) + Math.abs(transaction.amount);
    });
    
    return Object.entries(dailyTotals).map(([date, amount]) => ({ date, amount }));
  }

  private getMonthlySpending(transactions: Transaction[], months: number): { month: string; amount: number }[] {
    const monthlyTotals: Record<string, number> = {};
    
    transactions.filter(t => t.amount < 0).forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + Math.abs(transaction.amount);
    });
    
    return Object.entries(monthlyTotals)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-months)
      .map(([month, amount]) => ({ month, amount }));
  }

  private calculateStandardDeviation(values: number[]): number {
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    const differences = values.slice(1).map((val, i) => val - values[i]);
    return differences.reduce((sum, diff) => sum + diff, 0) / differences.length;
  }

  private detectSubscriptions(transactions: Transaction[]): Array<{ amount: number; description: string; account: string }> {
    const recurring = this.findRecurringTransactions(transactions);
    return recurring
      .filter(group => group.length >= 2) // At least 2 occurrences
      .map(group => ({
        amount: Math.abs(group[0].amount),
        description: group[0].description,
        account: group[0].accountId
      }));
  }

  private findRecurringTransactions(transactions: Transaction[]): Transaction[][] {
    const groups: Record<string, Transaction[]> = {};
    
    transactions.filter(t => t.amount < 0).forEach(transaction => {
      const key = `${transaction.description.substring(0, 20)}-${Math.abs(transaction.amount)}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(transaction);
    });
    
    return Object.values(groups).filter(group => group.length >= 2);
  }

  private calculateCreditUtilization(creditAccounts: BankAccount[]): number {
    const totalUsed = creditAccounts.reduce((sum, account) => 
      sum + Math.max(0, -account.balance), 0);
    const totalAvailable = creditAccounts.reduce((sum, account) => 
      sum + (account.availableBalance || 0), 0);
    
    return totalAvailable > 0 ? (totalUsed / (totalUsed + totalAvailable)) * 100 : 0;
  }

  private calculateMonthlyIncome(transactions: Transaction[]): number {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return transactions
      .filter(t => t.amount > 0 && new Date(t.date) >= monthStart)
      .reduce((sum, t) => sum + t.amount, 0);
  }

  private calculateMonthlyExpenses(transactions: Transaction[]): number {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return transactions
      .filter(t => t.amount < 0 && new Date(t.date) >= monthStart)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }

  private calculateSpendingVolatility(transactions: Transaction[]): number {
    const dailySpending = this.getDailySpending(transactions);
    if (dailySpending.length < 2) return 0;
    
    const amounts = dailySpending.map(d => d.amount);
    const avg = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const stdDev = this.calculateStandardDeviation(amounts);
    
    return avg > 0 ? stdDev / avg : 0; // Coefficient of variation
  }

  private calculateDebtScore(accounts: BankAccount[]): number {
    const creditAccounts = accounts.filter(a => a.accountType === 'credit');
    if (creditAccounts.length === 0) return 100;
    
    const utilization = this.calculateCreditUtilization(creditAccounts);
    return Math.max(0, 100 - utilization * 2); // Lower utilization = higher score
  }

  private calculateBudgetAdherence(transactions: Transaction[]): number {
    // Simplified budget adherence based on spending consistency
    const volatility = this.calculateSpendingVolatility(transactions);
    return Math.max(0, 100 - volatility * 50);
  }

  private calculateStabilityScore(transactions: Transaction[]): number {
    const monthlyData = this.getMonthlySpending(transactions, 3);
    if (monthlyData.length < 2) return 50;
    
    const trend = Math.abs(this.calculateTrend(monthlyData.map(m => m.amount)));
    const avgSpending = monthlyData.reduce((sum, m) => sum + m.amount, 0) / monthlyData.length;
    
    const stabilityFactor = avgSpending > 0 ? Math.min(1, trend / avgSpending) : 0;
    return Math.max(0, 100 - stabilityFactor * 100);
  }

  private generateHealthRecommendations(overall: number, components: any): string[] {
    const recommendations: string[] = [];
    
    if (components.savingsRate < 50) {
      recommendations.push('Increase your savings rate to at least 10-20% of income');
    }
    if (components.spendingControl < 70) {
      recommendations.push('Work on reducing spending volatility and sticking to budgets');
    }
    if (components.debtManagement < 70) {
      recommendations.push('Focus on reducing credit card utilization below 30%');
    }
    
    return recommendations;
  }

  // Demo/fallback data
  private getDemoInsights(): AIInsight[] {
    return [
      {
        id: 'demo-prediction',
        type: 'prediction',
        title: 'Spending Forecast',
        description: 'Based on your patterns, you\'ll likely spend $3,200 this month.',
        impact: 'Medium',
        confidence: 87,
        category: 'Budget Planning',
        actionable: true,
        priority: 8
      },
      {
        id: 'demo-optimization',
        type: 'recommendation',
        title: 'Optimize Subscriptions',
        description: 'Cancel unused subscriptions to save $85/month.',
        impact: 'High',
        confidence: 94,
        category: 'Cost Optimization',
        actionable: true,
        priority: 9
      },
      {
        id: 'demo-alert',
        type: 'alert',
        title: 'Budget Alert',
        description: 'You\'ve exceeded your dining budget by 15% this week.',
        impact: 'Medium',
        confidence: 100,
        category: 'Budget Control',
        actionable: true,
        priority: 7
      },
      {
        id: 'demo-goal',
        type: 'goal',
        title: 'Savings Goal',
        description: 'Increase monthly savings by $200 to reach your goal by December.',
        impact: 'High',
        confidence: 78,
        category: 'Savings Goals',
        actionable: true,
        priority: 8
      }
    ];
  }

  private getDemoHealthScore(): FinancialHealthScore {
    return {
      overall: 8.4,
      components: {
        spendingControl: 85,
        savingsRate: 78,
        debtManagement: 92,
        budgetAdherence: 81,
        financialStability: 86
      },
      recommendations: [
        'Increase your emergency fund to 6 months of expenses',
        'Consider investing surplus funds for long-term growth',
        'Review and optimize your subscription services'
      ]
    };
  }
}

// Export singleton instance
export const aiInsightsService = new AIInsightsService();
