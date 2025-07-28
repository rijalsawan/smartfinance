import { Configuration, PlaidApi, PlaidEnvironments, TransactionsGetRequest, AccountsGetRequest } from 'plaid';

export interface BankAccount {
  id: string;
  name: string;
  accountType: 'depository' | 'credit' | 'loan' | 'investment';
  subtype: string;
  balance: number;
  availableBalance?: number;
  currency: string;
  institutionName: string;
  mask: string;
  isActive: boolean;
}

export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  description: string;
  category: string;
  subcategory?: string;
  date: string;
  type: 'debit' | 'credit';
  merchant?: string;
  location?: {
    address?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
  };
  isRecurring?: boolean;
  confidence?: number;
}

export interface PlaidLinkSuccess {
  publicToken: string;
  metadata: {
    institution: {
      name: string;
      institution_id: string;
    };
    accounts: Array<{
      id: string;
      name: string;
      mask: string;
      type: string;
      subtype: string;
    }>;
    link_session_id: string;
  };
}

export interface PlaidInstitution {
  id: string;
  name: string;
  logo?: string;
  primaryColor?: string;
  url?: string;
  products: string[];
  countryCodes: string[];
}

export class PlaidService {
  private plaidClient: PlaidApi;
  private accessTokens: Map<string, string> = new Map(); // item_id -> access_token
  private institutionItems: Map<string, string> = new Map(); // institution_name -> item_id

  constructor() {
    // Initialize Plaid client
    const environment = process.env.PLAID_ENV === 'production' ? PlaidEnvironments.production : PlaidEnvironments.sandbox;
    const configuration = new Configuration({
      basePath: environment,
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': process.env.NEXT_PUBLIC_PLAID_CLIENT_ID || 'your_client_id',
          'PLAID-SECRET': process.env.PLAID_SECRET || 'your_secret_key',
        },
      },
    });
    this.plaidClient = new PlaidApi(configuration);
    this.loadStoredTokens();
  }

  // Load stored access tokens from localStorage
  private loadStoredTokens(): void {
    try {
      // Check if we're in the browser environment
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedTokens = localStorage.getItem('plaid_access_tokens');
        const storedInstitutions = localStorage.getItem('plaid_institution_items');
        
        if (storedTokens) {
          const tokens = JSON.parse(storedTokens);
          this.accessTokens = new Map(Object.entries(tokens));
        }
        
        if (storedInstitutions) {
          const institutions = JSON.parse(storedInstitutions);
          this.institutionItems = new Map(Object.entries(institutions));
        }
      }
    } catch (error) {
      console.error('Error loading stored tokens:', error);
    }
  }

  // Save access tokens to localStorage
  private saveTokens(): void {
    try {
      // Check if we're in the browser environment
      if (typeof window !== 'undefined' && window.localStorage) {
        const tokensObj = Object.fromEntries(this.accessTokens);
        const institutionsObj = Object.fromEntries(this.institutionItems);
        
        localStorage.setItem('plaid_access_tokens', JSON.stringify(tokensObj));
        localStorage.setItem('plaid_institution_items', JSON.stringify(institutionsObj));
      }
    } catch (error) {
      console.error('Error saving tokens:', error);
    }
  }

  // Exchange public token for access token
  public async exchangePublicToken(publicToken: string, institutionName: string): Promise<string> {
    try {
      // In a real app, this would be done on your backend for security
      // This is just for demo purposes
      const response = await fetch('/api/plaid/exchange_public_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ public_token: publicToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to exchange public token');
      }

      const data = await response.json();
      const accessToken = data.access_token;
      const itemId = data.item_id;

      // Store the access token by item_id and map institution
      this.accessTokens.set(itemId, accessToken);
      this.institutionItems.set(institutionName, itemId);
      this.saveTokens();

      return accessToken;
    } catch (error) {
      console.error('Error exchanging public token:', error);
      // For demo purposes, return a mock access token
      const mockItemId = `item-sandbox-${Date.now()}`;
      const mockAccessToken = `access-sandbox-${Date.now()}`;
      this.accessTokens.set(mockItemId, mockAccessToken);
      this.institutionItems.set(institutionName, mockItemId);
      this.saveTokens();
      return mockAccessToken;
    }
  }

  // Get accounts for an institution
  public async getAccounts(institutionName: string): Promise<BankAccount[]> {
    try {
      // Get item_id for the institution
      const itemId = this.institutionItems.get(institutionName);
      if (!itemId) {
        throw new Error('No item found for institution');
      }

      // Get access token using item_id
      const accessToken = this.accessTokens.get(itemId);
      if (!accessToken) {
        throw new Error('No access token found for item');
      }

      // Check if this is a real Plaid token (should be longer and have specific format)
      // Real Plaid tokens are longer and don't contain timestamp patterns
      const isRealPlaidToken = accessToken.length > 40 && accessToken.startsWith('access-sandbox-') && 
                              !accessToken.includes(new Date().getFullYear().toString());
      
      if (!isRealPlaidToken) {
        // This looks like a mock token, return mock data
        return this.getMockAccounts(institutionName);
      }

      // Make real API call to fetch accounts
      const response = await fetch('/api/plaid/get_accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ access_token: accessToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch accounts from Plaid');
      }

      const data = await response.json();
      
      // Transform Plaid account data to our BankAccount interface
      const accounts: BankAccount[] = data.accounts.map((account: any) => ({
        id: account.account_id,
        name: account.name,
        accountType: account.type,
        subtype: account.subtype,
        balance: account.balances.current,
        availableBalance: account.balances.available,
        currency: account.balances.iso_currency_code || 'USD',
        institutionName: institutionName,
        mask: account.mask,
        isActive: true,
      }));

      return accounts;
    } catch (error) {
      console.error('Error fetching accounts:', error);
      // Fallback to mock data if API fails
      return this.getMockAccounts(institutionName);
    }
  }

  // Get transactions for specific accounts
  public async getTransactions(
    institutionName: string,
    accountIds?: string[],
    startDate?: string,
    endDate?: string,
    count?: number
  ): Promise<Transaction[]> {
    try {
      // Get item_id for the institution
      const itemId = this.institutionItems.get(institutionName);
      if (!itemId) {
        throw new Error('No item found for institution');
      }

      // Get access token using item_id
      const accessToken = this.accessTokens.get(itemId);
      if (!accessToken) {
        throw new Error('No access token found for item');
      }

      // Check if this is a real Plaid token (should be longer and have specific format)
      const isRealPlaidToken = accessToken.length > 40 && accessToken.startsWith('access-sandbox-') && 
                              !accessToken.includes(new Date().getFullYear().toString());
      
      if (!isRealPlaidToken) {
        // This looks like a mock token, return mock data
        return this.getMockTransactions(accountIds);
      }

      // Set default date range (last 30 days)
      const end = endDate || new Date().toISOString().split('T')[0];
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Make real API call to fetch transactions (simplified without account filtering)
      const response = await fetch('/api/plaid/get_transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: accessToken,
          start_date: start,
          end_date: end,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions from Plaid');
      }

      const data = await response.json();
      
      // Transform Plaid transaction data to our Transaction interface
      const transactions: Transaction[] = data.transactions.map((transaction: any) => {
        // Normalize category handling from Plaid
        let category = 'Other';
        let subcategory = undefined;
        
        if (transaction.category && Array.isArray(transaction.category) && transaction.category.length > 0) {
          category = transaction.category[0] || 'Other';
          subcategory = transaction.category[1];
        } else if (transaction.personal_finance_category?.primary) {
          // Use the newer personal finance category if available
          category = transaction.personal_finance_category.primary;
          subcategory = transaction.personal_finance_category.detailed;
        }

        return {
          id: transaction.transaction_id,
          accountId: transaction.account_id,
          amount: -transaction.amount, // Plaid uses positive for debits, we use negative
          description: transaction.name || 'Unknown Transaction',
          category,
          subcategory,
          date: transaction.date,
          type: transaction.amount > 0 ? 'debit' : 'credit',
          merchant: transaction.merchant_name || transaction.account_owner || undefined,
          location: transaction.location ? {
            address: transaction.location.address,
            city: transaction.location.city,
            region: transaction.location.region,
            postalCode: transaction.location.postal_code,
            country: transaction.location.country,
          } : undefined,
          isRecurring: false, // Would need additional logic to determine
          confidence: 1.0,
        };
      });

      return transactions;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      // Fallback to mock data if API fails
      return this.getMockTransactions(accountIds);
    }
  }

  // Get all accounts from all connected institutions
  public async getAllAccounts(): Promise<BankAccount[]> {
    try {
      const institutionNames = Array.from(this.institutionItems.keys());
      
      // If no real institutions are connected, return empty array
      if (institutionNames.length === 0) {
        return [];
      }

      const allAccounts: BankAccount[] = [];
      
      // Use institution names (not item IDs) to get accounts
      for (const institutionName of institutionNames) {
        const accounts = await this.getAccounts(institutionName);
        allAccounts.push(...accounts);
      }

      return allAccounts;
    } catch (error) {
      console.error('Error fetching all accounts:', error);
      return [];
    }
  }

  // Get all transactions from all connected accounts
  public async getAllTransactions(days: number = 30): Promise<Transaction[]> {
    try {
      const institutionNames = Array.from(this.institutionItems.keys());
      
      // If no real institutions are connected, return empty array
      if (institutionNames.length === 0) {
        return [];
      }

      const allTransactions: Transaction[] = [];
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Use institution names (not item IDs) to get transactions
      for (const institutionName of institutionNames) {
        const transactions = await this.getTransactions(institutionName, undefined, startDate, endDate);
        allTransactions.push(...transactions);
      }

      // Sort by date (most recent first)
      return allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Error fetching all transactions:', error);
      return [];
    }
  }

  // Remove institution connection
  public async removeInstitution(institutionName: string): Promise<void> {
    try {
      // Get item_id for the institution
      const itemId = this.institutionItems.get(institutionName);
      if (itemId) {
        const accessToken = this.accessTokens.get(itemId);
        if (accessToken) {
          // Call Plaid API to remove the item
          await fetch('/api/plaid/remove_item', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ access_token: accessToken }),
          });
        }
        
        this.accessTokens.delete(itemId);
        this.institutionItems.delete(institutionName);
        this.saveTokens();
      }
    } catch (error) {
      console.error('Error removing institution:', error);
      // Still remove from local storage even if API call fails
      const itemId = this.institutionItems.get(institutionName);
      if (itemId) {
        this.accessTokens.delete(itemId);
      }
      this.institutionItems.delete(institutionName);
      this.saveTokens();
    }
  }

  // Get connected institutions
  public getConnectedInstitutions(): string[] {
    return Array.from(this.institutionItems.keys());
  }

  // Check if institution is connected
  public isInstitutionConnected(institutionName: string): boolean {
    return this.institutionItems.has(institutionName);
  }

  // Mock data for demo purposes
  private getMockAccounts(institutionName: string): BankAccount[] {
    const mockAccounts = {
      'Chase': [
        {
          id: 'chase_checking_001',
          name: 'Chase Total Checking',
          accountType: 'depository' as const,
          subtype: 'checking',
          balance: 3247.80,
          availableBalance: 3247.80,
          currency: 'USD',
          institutionName: 'Chase',
          mask: '1234',
          isActive: true,
        },
        {
          id: 'chase_savings_001',
          name: 'Chase Savings',
          accountType: 'depository' as const,
          subtype: 'savings',
          balance: 15420.50,
          availableBalance: 15420.50,
          currency: 'USD',
          institutionName: 'Chase',
          mask: '5678',
          isActive: true,
        },
      ],
      'Royal Bank of Canada': [
        {
          id: 'rbc_checking_001',
          name: 'RBC Day to Day Banking',
          accountType: 'depository' as const,
          subtype: 'checking',
          balance: 4325.67,
          availableBalance: 4325.67,
          currency: 'CAD',
          institutionName: 'Royal Bank of Canada',
          mask: '8901',
          isActive: true,
        },
        {
          id: 'rbc_savings_001',
          name: 'RBC High Interest eSavings',
          accountType: 'depository' as const,
          subtype: 'savings',
          balance: 18750.25,
          availableBalance: 18750.25,
          currency: 'CAD',
          institutionName: 'Royal Bank of Canada',
          mask: '2345',
          isActive: true,
        },
      ],
      'TD Canada Trust': [
        {
          id: 'td_checking_001',
          name: 'TD Everyday Chequing',
          accountType: 'depository' as const,
          subtype: 'checking',
          balance: 2156.89,
          availableBalance: 2156.89,
          currency: 'CAD',
          institutionName: 'TD Canada Trust',
          mask: '6789',
          isActive: true,
        },
        {
          id: 'td_credit_001',
          name: 'TD Cash Back Visa',
          accountType: 'credit' as const,
          subtype: 'credit card',
          balance: -567.45,
          availableBalance: 4432.55,
          currency: 'CAD',
          institutionName: 'TD Canada Trust',
          mask: '0123',
          isActive: true,
        },
      ],
      'Scotiabank': [
        {
          id: 'scotia_checking_001',
          name: 'Scotia Basic Banking',
          accountType: 'depository' as const,
          subtype: 'checking',
          balance: 3421.78,
          availableBalance: 3421.78,
          currency: 'CAD',
          institutionName: 'Scotiabank',
          mask: '4567',
          isActive: true,
        },
        {
          id: 'scotia_credit_001',
          name: 'Scotia SCENE Visa',
          accountType: 'credit' as const,
          subtype: 'credit card',
          balance: -892.33,
          availableBalance: 3107.67,
          currency: 'CAD',
          institutionName: 'Scotiabank',
          mask: '8901',
          isActive: true,
        },
      ],
      'Bank of Montreal': [
        {
          id: 'bmo_checking_001',
          name: 'BMO Practical Plan',
          accountType: 'depository' as const,
          subtype: 'checking',
          balance: 1876.54,
          availableBalance: 1876.54,
          currency: 'CAD',
          institutionName: 'Bank of Montreal',
          mask: '2468',
          isActive: true,
        },
      ],
      'Bank of America': [
        {
          id: 'boa_checking_001',
          name: 'Core Checking',
          accountType: 'depository' as const,
          subtype: 'checking',
          balance: 1847.30,
          availableBalance: 1847.30,
          currency: 'USD',
          institutionName: 'Bank of America',
          mask: '9012',
          isActive: true,
        },
      ],
      'Wells Fargo': [
        {
          id: 'wells_checking_001',
          name: 'Everyday Checking',
          accountType: 'depository' as const,
          subtype: 'checking',
          balance: 2156.40,
          availableBalance: 2156.40,
          currency: 'USD',
          institutionName: 'Wells Fargo',
          mask: '3456',
          isActive: true,
        },
      ],
      'Capital One': [
        {
          id: 'capital_credit_001',
          name: 'Capital One Quicksilver',
          accountType: 'credit' as const,
          subtype: 'credit card',
          balance: -847.20,
          availableBalance: 4152.80,
          currency: 'USD',
          institutionName: 'Capital One',
          mask: '7890',
          isActive: true,
        },
      ],
    };

    return mockAccounts[institutionName as keyof typeof mockAccounts] || [];
  }

  private getMockTransactions(accountIds?: string[]): Transaction[] {
    const mockTransactions: Transaction[] = [
      {
        id: 'txn_001',
        accountId: 'chase_checking_001',
        amount: -125.50,
        description: 'Whole Foods Market',
        category: 'Food and Drink',
        subcategory: 'Groceries',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'debit',
        merchant: 'Whole Foods Market',
        location: {
          address: '123 Main St',
          city: 'New York',
          region: 'NY',
          postalCode: '10001',
          country: 'US',
        },
        isRecurring: false,
        confidence: 0.95,
      },
      {
        id: 'txn_002',
        accountId: 'chase_checking_001',
        amount: 4200.00,
        description: 'ACME Corp Payroll',
        category: 'Payroll',
        subcategory: 'Salary',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'credit',
        isRecurring: true,
        confidence: 1.0,
      },
      {
        id: 'txn_003',
        accountId: 'chase_checking_001',
        amount: -45.20,
        description: 'Shell Gas Station',
        category: 'Transportation',
        subcategory: 'Gas',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'debit',
        merchant: 'Shell',
        location: {
          city: 'Brooklyn',
          region: 'NY',
          country: 'US',
        },
        isRecurring: false,
        confidence: 0.92,
      },
      {
        id: 'txn_004',
        accountId: 'chase_checking_001',
        amount: -8.75,
        description: 'Starbucks',
        category: 'Food and Drink',
        subcategory: 'Coffee',
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'debit',
        merchant: 'Starbucks',
        location: {
          city: 'New York',
          region: 'NY',
          country: 'US',
        },
        isRecurring: false,
        confidence: 0.98,
      },
      {
        id: 'txn_005',
        accountId: 'chase_checking_001',
        amount: -1250.00,
        description: 'Rent Payment',
        category: 'Payment',
        subcategory: 'Rent',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'debit',
        isRecurring: true,
        confidence: 1.0,
      },
      {
        id: 'txn_006',
        accountId: 'chase_checking_001',
        amount: -89.99,
        description: 'Verizon Wireless',
        category: 'Payment',
        subcategory: 'Utilities',
        date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'debit',
        merchant: 'Verizon',
        isRecurring: true,
        confidence: 1.0,
      },
      {
        id: 'txn_007',
        accountId: 'chase_savings_001',
        amount: 500.00,
        description: 'Transfer from Checking',
        category: 'Transfer',
        subcategory: 'Internal Transfer',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'credit',
        isRecurring: false,
        confidence: 1.0,
      },
      {
        id: 'txn_008',
        accountId: 'capital_credit_001',
        amount: -156.78,
        description: 'Amazon.com',
        category: 'Shops',
        subcategory: 'Online',
        date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'debit',
        merchant: 'Amazon',
        isRecurring: false,
        confidence: 0.97,
      },
    ];

    if (accountIds && accountIds.length > 0) {
      return mockTransactions.filter(txn => accountIds.includes(txn.accountId));
    }

    return mockTransactions;
  }
}

// Export singleton instance
export const plaidService = new PlaidService();
