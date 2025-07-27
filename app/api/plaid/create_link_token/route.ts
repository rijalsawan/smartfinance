import { NextRequest, NextResponse } from 'next/server';
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';

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
    const { user_id } = await request.json();

    // Create a link token for the user
    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: user_id || 'default_user',
      },
      client_name: 'SmartFinance',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us, CountryCode.Ca], // Added Canada support
      language: 'en',
      redirect_uri: process.env.PLAID_REDIRECT_URI,
    });

    return NextResponse.json({
      link_token: response.data.link_token,
    });

  } catch (error: any) {
    console.error('Error creating link token:', error);
    
    // Log more details about the Plaid error
    if (error.response?.data) {
      console.error('Plaid API error details:', error.response.data);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create link token',
        details: error.response?.data || error.message 
      },
      { status: 500 }
    );
  }
}
