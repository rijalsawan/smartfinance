import { NextRequest, NextResponse } from 'next/server';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

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

const plaidClient = new PlaidApi(configuration);

export async function POST(request: NextRequest) {
  try {
    const { public_token } = await request.json();

    if (!public_token) {
      return NextResponse.json(
        { error: 'Public token is required' },
        { status: 400 }
      );
    }

    // Exchange public token for access token using real Plaid API
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: public_token,
    });
    
    return NextResponse.json({
      access_token: response.data.access_token,
      item_id: response.data.item_id,
    });

  } catch (error: any) {
    console.error('Error exchanging public token:', error);
    
    // Log more details about the Plaid error
    if (error.response?.data) {
      console.error('Plaid API error details:', error.response.data);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to exchange public token',
        details: error.response?.data || error.message 
      },
      { status: 500 }
    );
  }
}
