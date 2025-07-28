import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, unlinkSync } from 'fs';
import path from 'path';

const execAsync = promisify(exec);

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
    [key: string]: any;
  };
}

export interface FinancialHealthScore {
  overall: number;
  components: {
    spendingControl: number;
    savingsRate: number;
    budgetAdherence: number;
    financialStability: number;
    cashFlowHealth: number;
  };
  recommendations: string[];
}

export interface AIInsightsResponse {
  insights: AIInsight[];
  healthScore: FinancialHealthScore;
  success: boolean;
  error?: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  type: 'debit' | 'credit';
  merchant: string;
}

export class IndependentAIInsightsService {
  private pythonScriptPath: string;

  constructor() {
    this.pythonScriptPath = path.join(process.cwd(), 'ai_insights_engine.py');
  }

  /**
   * Generate AI insights from transaction data using our independent Python engine
   */
  public async generateInsights(transactions: Transaction[]): Promise<AIInsightsResponse> {
    try {
      // Validate transactions data
      if (!transactions || transactions.length === 0) {
        return this.getDemoInsights();
      }

      // Create a temporary file for transaction data to avoid command line length limits
      const tempFileName = `transactions_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.json`;
      const tempFilePath = path.join(process.cwd(), tempFileName);
      
      try {
        // Write transaction data to temporary file (UTF-8 without BOM)
        writeFileSync(tempFilePath, JSON.stringify(transactions, null, 2), 'utf8');
        
        // Execute Python script with file path instead of inline data
        const command = `python "${this.pythonScriptPath}" "${tempFilePath}"`;
        const { stdout, stderr } = await execAsync(command, {
          maxBuffer: 1024 * 1024 * 10, // 10MB buffer
          timeout: 30000 // 30 second timeout
        });

        if (stderr) {
          console.warn('Python script warning:', stderr);
        }

        // Parse the result
        const result = JSON.parse(stdout) as AIInsightsResponse;
        
        return {
          ...result,
          success: true
        };

      } finally {
        // Clean up temporary file
        try {
          unlinkSync(tempFilePath);
        } catch (cleanupError) {
          console.warn('Failed to cleanup temporary file:', tempFilePath);
        }
      }

    } catch (error) {
      console.error('Error running AI insights engine:', error);
      
      // Fallback to demo insights if Python execution fails
      return {
        ...this.getDemoInsights(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Calculate financial health score using our Python engine
   */
  public async calculateFinancialHealthScore(transactions: Transaction[]): Promise<FinancialHealthScore> {
    try {
      const result = await this.generateInsights(transactions);
      return result.healthScore;
    } catch (error) {
      console.error('Error calculating health score:', error);
      return this.getDemoInsights().healthScore;
    }
  }

  /**
   * Analyze spending patterns for specific categories
   */
  public async analyzeSpendingPatterns(transactions: Transaction[], categories?: string[]): Promise<AIInsight[]> {
    try {
      let filteredTransactions = transactions;
      
      if (categories && categories.length > 0) {
        filteredTransactions = transactions.filter(t => categories.includes(t.category));
      }

      const result = await this.generateInsights(filteredTransactions);
      return result.insights.filter(insight => 
        insight.type === 'prediction' || insight.category === 'Spending Analysis'
      );
    } catch (error) {
      console.error('Error analyzing spending patterns:', error);
      return [];
    }
  }

  /**
   * Detect anomalies in transaction data
   */
  public async detectAnomalies(transactions: Transaction[]): Promise<AIInsight[]> {
    try {
      const result = await this.generateInsights(transactions);
      return result.insights.filter(insight => insight.type === 'alert');
    } catch (error) {
      console.error('Error detecting anomalies:', error);
      return [];
    }
  }

  /**
   * Get savings opportunities
   */
  public async getSavingsOpportunities(transactions: Transaction[]): Promise<AIInsight[]> {
    try {
      const result = await this.generateInsights(transactions);
      return result.insights.filter(insight => 
        insight.type === 'recommendation' || insight.type === 'opportunity'
      );
    } catch (error) {
      console.error('Error getting savings opportunities:', error);
      return [];
    }
  }

  /**
   * Check if Python and required dependencies are available
   */
  public async checkDependencies(): Promise<{available: boolean, missing: string[]}> {
    try {
      // Check if Python is available
      const { stdout } = await execAsync('python --version');
      
      // Check if required packages are installed
      const requiredPackages = ['numpy', 'pandas'];
      const missing: string[] = [];
      
      for (const pkg of requiredPackages) {
        try {
          await execAsync(`python -c "import ${pkg}"`);
        } catch {
          missing.push(pkg);
        }
      }

      return {
        available: missing.length === 0,
        missing
      };
    } catch (error) {
      return {
        available: false,
        missing: ['python', 'numpy', 'pandas']
      };
    }
  }

  /**
   * Install required Python dependencies
   */
  public async installDependencies(): Promise<{success: boolean, output: string}> {
    try {
      const { stdout, stderr } = await execAsync('pip install numpy pandas');
      return {
        success: true,
        output: stdout + stderr
      };
    } catch (error) {
      return {
        success: false,
        output: error instanceof Error ? error.message : 'Installation failed'
      };
    }
  }

  /**
   * Validate transaction data format
   */
  private validateTransactions(transactions: Transaction[]): boolean {
    if (!Array.isArray(transactions)) return false;
    
    return transactions.every(t => 
      t.id && 
      t.accountId && 
      t.description && 
      t.category && 
      typeof t.amount === 'number' && 
      t.date && 
      t.type && 
      t.merchant
    );
  }

  /**
   * Demo insights for when the service is not available
   */
  private getDemoInsights(): AIInsightsResponse {
    return {
      insights: [
        {
          id: 'demo-spending-trend',
          type: 'prediction',
          title: 'Monthly Spending Forecast',
          description: 'Based on your recent patterns, you\'re projected to spend $2,950 this month.',
          impact: 'Medium',
          confidence: 85,
          category: 'Budget Planning',
          actionable: true,
          priority: 8,
          metadata: {
            amount: 2950,
            trend: 'increasing'
          }
        },
        {
          id: 'demo-subscription-alert',
          type: 'recommendation',
          title: 'Optimize Subscription Services',
          description: 'You have 6 active subscriptions totaling $89/month. Review and cancel unused ones to save money.',
          impact: 'High',
          confidence: 92,
          category: 'Cost Optimization',
          actionable: true,
          priority: 9,
          metadata: {
            amount: 89,
            count: 6
          }
        },
        {
          id: 'demo-savings-goal',
          type: 'goal',
          title: 'Improve Savings Rate',
          description: 'Your current savings rate is 12%. Increase it to 20% by saving an additional $240/month.',
          impact: 'High',
          confidence: 88,
          category: 'Savings Goals',
          actionable: true,
          priority: 8,
          metadata: {
            currentRate: 12,
            targetRate: 20,
            additionalSavings: 240
          }
        },
        {
          id: 'demo-spending-alert',
          type: 'alert',
          title: 'Dining Spending Increased',
          description: 'Your dining expenses have increased by 28% this month compared to last month.',
          impact: 'Medium',
          confidence: 90,
          category: 'Food and Drink',
          actionable: true,
          priority: 7,
          metadata: {
            percentage: 28,
            category: 'Food and Drink'
          }
        }
      ],
      healthScore: {
        overall: 7.6,
        components: {
          spendingControl: 78,
          savingsRate: 68,
          budgetAdherence: 82,
          financialStability: 85,
          cashFlowHealth: 71
        },
        recommendations: [
          'Increase your monthly savings rate to build a stronger emergency fund',
          'Review and optimize recurring subscription services',
          'Set up automated transfers to savings accounts for consistency'
        ]
      },
      success: true
    };
  }
}

// Export singleton instance
export const independentAIInsightsService = new IndependentAIInsightsService();
