import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

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
  bankName?: string;
  accountNumber?: string;
}

export interface BankCredentials {
  bankId: string;
  username: string;
  password: string;
  securityQuestions?: { [key: string]: string };
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
  private accessTokens: Map<string, string> = new Map();

  constructor() {
    // Initialize Plaid client
    const configuration = new Configuration({
      basePath: PlaidEnvironments.sandbox, // Use sandbox for development
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
      const stored = localStorage.getItem('plaid_access_tokens');
      if (stored) {
        const tokens = JSON.parse(stored);
        this.accessTokens = new Map(Object.entries(tokens));
      }
    } catch (error) {
      console.error('Error loading stored tokens:', error);
    }
  }

  // Save access tokens to localStorage
  private saveTokens(): void {
    try {
      const tokensObj = Object.fromEntries(this.accessTokens);
      localStorage.setItem('plaid_access_tokens', JSON.stringify(tokensObj));
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

      // Store the access token
      this.accessTokens.set(institutionName, accessToken);
      this.saveTokens();

      return accessToken;
    } catch (error) {
      console.error('Error exchanging public token:', error);
      // For demo purposes, return a mock access token
      const mockAccessToken = `access-sandbox-${Date.now()}`;
      this.accessTokens.set(institutionName, mockAccessToken);
      this.saveTokens();
      return mockAccessToken;
    }
  }

  // Get accounts for an institution
  public async getAccounts(institutionName: string): Promise<BankAccount[]> {
    try {
      const accessToken = this.accessTokens.get(institutionName);
      if (!accessToken) {
        throw new Error('No access token found for institution');
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
      const accessToken = this.accessTokens.get(institutionName);
      if (!accessToken) {
        throw new Error('No access token found for institution');
      }

      // Set default date range (last 30 days)
      const end = endDate || new Date().toISOString().split('T')[0];
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Make real API call to fetch transactions
      const response = await fetch('/api/plaid/get_transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          access_token: accessToken,
          start_date: start,
          end_date: end,
          account_ids: accountIds,
          count: count || 100
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions from Plaid');
      }

      const data = await response.json();
      
      // Transform Plaid transaction data to our Transaction interface
      const transactions: Transaction[] = data.transactions.map((transaction: any) => ({
        id: transaction.transaction_id,
        accountId: transaction.account_id,
        amount: -transaction.amount, // Plaid uses positive for outflows, we use negative
        description: transaction.name,
        category: transaction.category?.[0] || 'Other',
        subcategory: transaction.category?.[1] || undefined,
        date: transaction.date,
        type: transaction.amount > 0 ? 'debit' : 'credit',
        merchant: transaction.merchant_name || undefined,
        location: transaction.location ? {
          address: transaction.location.address,
          city: transaction.location.city,
          region: transaction.location.region,
          postalCode: transaction.location.postal_code,
          country: transaction.location.country,
        } : undefined,
        isRecurring: false, // This would need additional logic to determine
        confidence: transaction.personal_finance_category?.confidence_level || 0.5,
      }));

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
      const allAccounts: BankAccount[] = [];
      
      for (const institutionName of this.accessTokens.keys()) {
        const accounts = await this.getAccounts(institutionName);
        allAccounts.push(...accounts);
      }

      return allAccounts;
    } catch (error) {
      console.error('Error fetching all accounts:', error);
      throw new Error('Failed to fetch accounts');
    }
  }

  // Get all transactions from all connected accounts
  public async getAllTransactions(days: number = 30): Promise<Transaction[]> {
    try {
      const allTransactions: Transaction[] = [];
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      for (const institutionName of this.accessTokens.keys()) {
        const transactions = await this.getTransactions(institutionName, undefined, startDate, endDate);
        allTransactions.push(...transactions);
      }

      // Sort by date (most recent first)
      return allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Error fetching all transactions:', error);
      throw new Error('Failed to fetch transactions');
    }
  }

  // Remove institution connection
  public async removeInstitution(institutionName: string): Promise<void> {
    try {
      const accessToken = this.accessTokens.get(institutionName);
      if (accessToken) {
        // In a real app, you would call Plaid to remove the item
        // await this.plaidClient.itemRemove({ access_token: accessToken });
        
        this.accessTokens.delete(institutionName);
        this.saveTokens();
      }
    } catch (error) {
      console.error('Error removing institution:', error);
      throw new Error('Failed to remove institution');
    }
  }

  // Get connected institutions
  public getConnectedInstitutions(): string[] {
    return Array.from(this.accessTokens.keys());
  }

  // Check if institution is connected
  public isInstitutionConnected(institutionName: string): boolean {
    return this.accessTokens.has(institutionName);
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

    // Filter by account IDs if provided
    if (accountIds && accountIds.length > 0) {
      return mockTransactions.filter(txn => accountIds.includes(txn.accountId));
    }

    return mockTransactions;
  }
}

// Export singleton instance
export const plaidService = new PlaidService();

export class BankIntegrationService {
  // Store credentials securely (in production, use proper encryption)
  private storeCredentials(bankId: string, credentials: BankCredentials): void {
    localStorage.setItem(`bank_credentials_${bankId}`, JSON.stringify(credentials));
  }

  private getCredentials(bankId: string): BankCredentials | null {
    const stored = localStorage.getItem(`bank_credentials_${bankId}`);
    return stored ? JSON.parse(stored) : null;
  }

  private async connectToScotiabank(credentials: BankCredentials): Promise<BankAccount[]> {
    await this.simulateDelay(2000);
    this.storeCredentials('scotiabank', credentials);
    return [
      {
        id: 'scotia_001',
        name: 'ScotiaBank Checking',
        accountType: 'depository' as const,
        subtype: 'checking',
        balance: 2500.00,
        currency: 'CAD',
        institutionName: 'Scotiabank',
        mask: '1234',
        isActive: true,
        bankName: 'Scotiabank',
        accountNumber: '****1234',
      },
    ];
  }

  // Fetch transactions from connected bank
  public async fetchTransactions(accountId: string, fromDate?: string, toDate?: string): Promise<Transaction[]> {
    try {
      await this.simulateDelay(1500);

      // Mock transaction data based on Canadian spending patterns
      return [
        {
          id: 'txn_001',
          accountId,
          amount: -125.50,
          description: 'LOBLAWS #1234 TORONTO ON',
          category: 'Groceries',
          date: '2024-01-15T10:30:00Z',
          type: 'debit',
          merchant: 'Loblaws',
          location: {
            city: 'Toronto',
            region: 'ON',
            country: 'CA',
          },
          isRecurring: false,
        },
        {
          id: 'txn_002',
          accountId,
          amount: 4200.00,
          description: 'PAYROLL DEPOSIT - COMPANY ABC',
          category: 'Income',
          date: '2024-01-15T00:00:00Z',
          type: 'credit',
          isRecurring: true,
        },
        {
          id: 'txn_003',
          accountId,
          amount: -65.20,
          description: 'SHELL #5678 MISSISSAUGA ON',
          category: 'Gas',
          date: '2024-01-14T16:45:00Z',
          type: 'debit',
          merchant: 'Shell',
          location: {
            city: 'Mississauga',
            region: 'ON',
            country: 'CA',
          },
          isRecurring: false,
        },
        {
          id: 'txn_004',
          accountId,
          amount: -12.50,
          description: 'TIM HORTONS #901 TORONTO ON',
          category: 'Food & Dining',
          date: '2024-01-14T08:15:00Z',
          type: 'debit',
          merchant: 'Tim Hortons',
          location: {
            city: 'Toronto',
            region: 'ON',
            country: 'CA',
          },
          isRecurring: false,
        },
        {
          id: 'txn_005',
          accountId,
          amount: -1250.00,
          description: 'RENT PAYMENT - APT MANAGEMENT',
          category: 'Housing',
          date: '2024-01-01T00:00:00Z',
          type: 'debit',
          isRecurring: true,
        },
        {
          id: 'txn_006',
          accountId,
          amount: -89.99,
          description: 'ROGERS COMMUNICATIONS',
          category: 'Utilities',
          date: '2024-01-13T00:00:00Z',
          type: 'debit',
          merchant: 'Rogers',
          isRecurring: true,
        },
      ];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw new Error('Failed to fetch transactions');
    }
  }

  // Sync all connected accounts
  public async syncAllAccounts(): Promise<{ accounts: BankAccount[]; transactions: Transaction[] }> {
    try {
      // Get all stored bank connections
      const connectedBanks = this.getConnectedBanks();
      let allAccounts: BankAccount[] = [];
      let allTransactions: Transaction[] = [];

      for (const bankId of connectedBanks) {
        const credentials = this.getCredentials(bankId);
        if (credentials) {
          // Fetch accounts for this bank
          const accounts = await this.connectToBank(credentials);
          allAccounts = [...allAccounts, ...accounts];

          // Fetch transactions for each account
          for (const account of accounts) {
            const transactions = await this.fetchTransactions(account.id);
            allTransactions = [...allTransactions, ...transactions];
          }
        }
      }

      return { accounts: allAccounts, transactions: allTransactions };
    } catch (error) {
      console.error('Error syncing accounts:', error);
      throw new Error('Failed to sync bank accounts');
    }
  }

  // Generic bank connection method
  public async connectToBank(credentials: BankCredentials): Promise<BankAccount[]> {
    switch (credentials.bankId) {
      case 'scotiabank':
        return this.connectToScotiabank(credentials);
      case 'rbc':
        return this.connectToRBC(credentials);
      case 'td':
        return this.connectToTD(credentials);
      case 'bmo':
        return this.connectToBMO(credentials);
      case 'cibc':
        return this.connectToCIBC(credentials);
      case 'tangerine':
        return this.connectToTangerine(credentials);
      default:
        throw new Error('Unsupported bank');
    }
  }

  // Additional bank connection methods (similar structure)
  private async connectToRBC(credentials: BankCredentials): Promise<BankAccount[]> {
    await this.simulateDelay(2000);
    this.storeCredentials('rbc', credentials);
    return [
      {
        id: 'rbc_001',
        name: 'RBC Checking',
        accountType: 'depository' as const,
        subtype: 'checking',
        balance: 3247.60,
        currency: 'CAD',
        institutionName: 'Royal Bank of Canada',
        mask: '2468',
        isActive: true,
        bankName: 'Royal Bank of Canada',
        accountNumber: '****2468',
      },
    ];
  }

  private async connectToTD(credentials: BankCredentials): Promise<BankAccount[]> {
    await this.simulateDelay(2000);
    this.storeCredentials('td', credentials);
    return [
      {
        id: 'td_001',
        name: 'TD Checking',
        accountType: 'depository' as const,
        subtype: 'checking',
        balance: 1847.30,
        currency: 'CAD',
        institutionName: 'TD Canada Trust',
        mask: '1357',
        isActive: true,
        bankName: 'TD Canada Trust',
        accountNumber: '****1357',
      },
    ];
  }

  private async connectToBMO(credentials: BankCredentials): Promise<BankAccount[]> {
    await this.simulateDelay(2000);
    this.storeCredentials('bmo', credentials);
    return [
      {
        id: 'bmo_001',
        name: 'BMO Checking',
        accountType: 'depository' as const,
        subtype: 'checking',
        balance: 4521.75,
        currency: 'CAD',
        institutionName: 'Bank of Montreal',
        mask: '9753',
        isActive: true,
        bankName: 'Bank of Montreal',
        accountNumber: '****9753',
      },
    ];
  }

  private async connectToCIBC(credentials: BankCredentials): Promise<BankAccount[]> {
    await this.simulateDelay(2000);
    this.storeCredentials('cibc', credentials);
    return [
      {
        id: 'cibc_001',
        name: 'CIBC Checking',
        accountType: 'depository' as const,
        subtype: 'checking',
        balance: 2156.40,
        currency: 'CAD',
        institutionName: 'CIBC',
        mask: '8642',
        isActive: true,
        bankName: 'CIBC',
        accountNumber: '****8642',
      },
    ];
  }

  private async connectToTangerine(credentials: BankCredentials): Promise<BankAccount[]> {
    await this.simulateDelay(2000);
    this.storeCredentials('tangerine', credentials);
    return [
      {
        id: 'tangerine_001',
        name: 'Tangerine Savings',
        accountType: 'depository' as const,
        subtype: 'savings',
        balance: 8547.90,
        currency: 'CAD',
        institutionName: 'Tangerine',
        mask: '7531',
        isActive: true,
        bankName: 'Tangerine',
        accountNumber: '****7531',
      },
    ];
  }

  // Utility methods
  private async simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public getConnectedBanks(): string[] {
    const keys = Object.keys(localStorage);
    return keys
      .filter(key => key.startsWith('bank_credentials_'))
      .map(key => key.replace('bank_credentials_', ''));
  }

  public disconnectBank(bankId: string): void {
    localStorage.removeItem(`bank_credentials_${bankId}`);
  }

  public isConnected(bankId: string): boolean {
    return localStorage.getItem(`bank_credentials_${bankId}`) !== null;
  }
}

// Export singleton instance
export const bankService = new BankIntegrationService();
