import { type BankAccount, type Transaction } from './plaidService';

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: 'transactions' | 'accounts' | 'insights' | 'navigation' | 'settings' | 'actions';
  icon: string;
  action: () => void;
  relevanceScore?: number;
  metadata?: any;
}

export interface SearchableTransaction extends Transaction {
  searchableText: string;
}

export interface SearchableAccount extends BankAccount {
  searchableText: string;
}

class SearchService {
  private navigationItems: SearchResult[] = [
    {
      id: 'nav-dashboard',
      title: 'Dashboard',
      description: 'View your financial overview and key metrics',
      category: 'navigation',
      icon: 'BarChart3',
      action: () => {},
    },
    {
      id: 'nav-analytics',
      title: 'Analytics',
      description: 'Deep dive into your financial patterns and trends',
      category: 'navigation',
      icon: 'TrendingUp',
      action: () => {},
    },
    {
      id: 'nav-ai-insights',
      title: 'AI Insights',
      description: 'Get personalized financial recommendations',
      category: 'navigation',
      icon: 'Brain',
      action: () => {},
    },
    {
      id: 'nav-cards',
      title: 'Connected Cards',
      description: 'Manage your bank accounts and credit cards',
      category: 'navigation',
      icon: 'CreditCard',
      action: () => {},
    },
    {
      id: 'nav-goals',
      title: 'Financial Goals',
      description: 'Set and track your savings goals',
      category: 'navigation',
      icon: 'Target',
      action: () => {},
    },
  ];

  private actionItems: SearchResult[] = [
    {
      id: 'action-connect-bank',
      title: 'Connect Bank Account',
      description: 'Link a new bank account to track transactions',
      category: 'actions',
      icon: 'Building2',
      action: () => {},
    },
    {
      id: 'action-view-transactions',
      title: 'View All Transactions',
      description: 'See detailed transaction history and analytics',
      category: 'actions',
      icon: 'DollarSign',
      action: () => {},
    },
    {
      id: 'action-export-data',
      title: 'Export Financial Data',
      description: 'Download your transactions and account data',
      category: 'actions',
      icon: 'Download',
      action: () => {},
    },
  ];

  private insightItems: SearchResult[] = [
    {
      id: 'insight-spending-trends',
      title: 'Spending Trends',
      description: 'Analyze your spending patterns over time',
      category: 'insights',
      icon: 'TrendingUp',
      action: () => {},
    },
    {
      id: 'insight-category-breakdown',
      title: 'Category Breakdown',
      description: 'See how much you spend in each category',
      category: 'insights',
      icon: 'PieChart',
      action: () => {},
    },
    {
      id: 'insight-budget-analysis',
      title: 'Budget Analysis',
      description: 'Track your budget performance and recommendations',
      category: 'insights',
      icon: 'Target',
      action: () => {},
    },
  ];

  search(
    query: string,
    transactions: Transaction[] = [],
    accounts: BankAccount[] = [],
    options: {
      onNavigate?: (page: string) => void;
      onOpenModal?: (modalType: string) => void;
      maxResults?: number;
    } = {}
  ): SearchResult[] {
    const { onNavigate, onOpenModal, maxResults = 10 } = options;
    const normalizedQuery = query.toLowerCase().trim();
    
    if (!normalizedQuery) return [];

    let allResults: SearchResult[] = [];

    // Search navigation items
    const navResults = this.searchInArray(
      this.navigationItems.map(item => ({
        ...item,
        action: () => onNavigate?.(item.id.replace('nav-', '')),
      })),
      normalizedQuery
    );

    // Search action items
    const actionResults = this.searchInArray(
      this.actionItems.map(item => ({
        ...item,
        action: () => {
          switch (item.id) {
            case 'action-connect-bank':
              onNavigate?.('cards');
              break;
            case 'action-view-transactions':
              onOpenModal?.('transactions');
              break;
            default:
              break;
          }
        },
      })),
      normalizedQuery
    );

    // Search insight items
    const insightResults = this.searchInArray(
      this.insightItems.map(item => ({
        ...item,
        action: () => onNavigate?.('ai-insights'),
      })),
      normalizedQuery
    );

    // Search transactions
    const transactionResults = this.searchTransactions(transactions, normalizedQuery, onOpenModal);

    // Search accounts
    const accountResults = this.searchAccounts(accounts, normalizedQuery, onNavigate);

    // Combine all results
    allResults = [
      ...navResults,
      ...actionResults,
      ...insightResults,
      ...transactionResults,
      ...accountResults,
    ];

    // Sort by relevance score and limit results
    return allResults
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, maxResults);
  }

  private searchInArray(items: SearchResult[], query: string): SearchResult[] {
    return items
      .map(item => {
        let score = 0;
        const titleMatch = item.title.toLowerCase().includes(query);
        const descriptionMatch = item.description.toLowerCase().includes(query);
        
        if (titleMatch) score += 10;
        if (descriptionMatch) score += 5;
        
        // Exact matches get higher priority
        if (item.title.toLowerCase() === query) score += 20;
        
        return { ...item, relevanceScore: score };
      })
      .filter(item => item.relevanceScore! > 0);
  }

  private searchTransactions(
    transactions: Transaction[],
    query: string,
    onOpenModal?: (modalType: string) => void
  ): SearchResult[] {
    const matchingTransactions = transactions
      .filter(transaction => {
        const searchText = `
          ${transaction.description} 
          ${transaction.category} 
          ${transaction.merchant || ''} 
          ${transaction.amount}
        `.toLowerCase();
        return searchText.includes(query);
      })
      .slice(0, 5) // Limit transaction results
      .map(transaction => ({
        id: `transaction-${transaction.id}`,
        title: transaction.description,
        description: `${transaction.category} • $${Math.abs(transaction.amount).toFixed(2)} • ${new Date(transaction.date).toLocaleDateString()}`,
        category: 'transactions' as const,
        icon: 'DollarSign',
        action: () => onOpenModal?.('transactions'),
        relevanceScore: 8,
        metadata: transaction,
      }));

    return matchingTransactions;
  }

  private searchAccounts(
    accounts: BankAccount[],
    query: string,
    onNavigate?: (page: string) => void
  ): SearchResult[] {
    const matchingAccounts = accounts
      .filter(account => {
        const searchText = `
          ${account.name} 
          ${account.institutionName} 
          ${account.accountType} 
          ${account.subtype}
        `.toLowerCase();
        return searchText.includes(query);
      })
      .map(account => ({
        id: `account-${account.id}`,
        title: account.name,
        description: `${account.institutionName} • ${account.accountType} • $${account.balance.toFixed(2)}`,
        category: 'accounts' as const,
        icon: 'Building2',
        action: () => onNavigate?.('cards'),
        relevanceScore: 7,
        metadata: account,
      }));

    return matchingAccounts;
  }

  getQuickActions(onNavigate?: (page: string) => void): SearchResult[] {
    return [
      {
        id: 'quick-dashboard',
        title: 'Dashboard',
        description: 'Financial overview',
        category: 'navigation',
        icon: 'BarChart3',
        action: () => onNavigate?.('dashboard'),
        relevanceScore: 10,
      },
      {
        id: 'quick-analytics',
        title: 'Analytics',
        description: 'Financial insights',
        category: 'navigation',
        icon: 'TrendingUp',
        action: () => onNavigate?.('analytics'),
        relevanceScore: 10,
      },
      {
        id: 'quick-ai-insights',
        title: 'AI Insights',
        description: 'AI recommendations',
        category: 'navigation',
        icon: 'Brain',
        action: () => onNavigate?.('ai-insights'),
        relevanceScore: 10,
      },
      {
        id: 'quick-connect-bank',
        title: 'Connect Bank',
        description: 'Add new account',
        category: 'actions',
        icon: 'Building2',
        action: () => onNavigate?.('cards'),
        relevanceScore: 10,
      },
    ];
  }

  saveRecentSearch(query: string): void {
    const saved = localStorage.getItem('smartfinance-recent-searches');
    const recent = saved ? JSON.parse(saved) : [];
    const updated = [query, ...recent.filter((s: string) => s !== query)].slice(0, 5);
    localStorage.setItem('smartfinance-recent-searches', JSON.stringify(updated));
  }

  getRecentSearches(): string[] {
    const saved = localStorage.getItem('smartfinance-recent-searches');
    return saved ? JSON.parse(saved) : [];
  }
}

export const searchService = new SearchService();
