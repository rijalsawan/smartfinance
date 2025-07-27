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
    const { access_token } = await request.json();

    if (!access_token) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      );
    }

    // Get accounts from Plaid API
    const response = await plaidClient.accountsGet({
      access_token: access_token,
    });

    return NextResponse.json({
      accounts: response.data.accounts,
      item: response.data.item,
    });

  } catch (error: any) {
    console.error('Error fetching accounts:', error);
    
    // Log more details about the Plaid error
    if (error.response?.data) {
      console.error('Plaid API error details:', error.response.data);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch accounts',
        details: error.response?.data || error.message 
      },
      { status: 500 }
    );
  }
}
