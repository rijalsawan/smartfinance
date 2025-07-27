import { NextRequest, NextResponse } from 'next/server';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

// Initialize Plaid client
const environment = process.env.PLAID_ENV === 'production' ? PlaidEnvironments.production : PlaidEnvironments.sandbox;
const configuration = new Configuration({
  basePath: environment,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.NEXT_PUBLIC_PLAID_CLIENT_ID || '',
      'PLAID-SECRET': process.env.PLAID_SECRET || '',
    },
  },
});

const plaidClient = new PlaidApi(configuration);

export async function POST(request: NextRequest) {
  try {
    const { access_token, start_date, end_date } = await request.json();

    console.log('Fetching transactions with params:', {
      access_token: access_token ? `${access_token.substring(0, 20)}...` : 'null',
      start_date,
      end_date
    });

    if (!access_token) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      );
    }

    // Validate date format (should be YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(start_date) || !dateRegex.test(end_date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Get transactions from Plaid API - simplified request without account filtering
    const response = await plaidClient.transactionsGet({
      access_token: access_token,
      start_date: start_date,
      end_date: end_date,
    });

    return NextResponse.json({
      transactions: response.data.transactions,
      accounts: response.data.accounts,
      total_transactions: response.data.total_transactions,
    });

  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    
    // Log more detailed error information
    if (error.response) {
      console.error('Plaid API Error Response:', error.response.data);
      console.error('Plaid API Error Status:', error.response.status);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch transactions',
        details: error.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}
