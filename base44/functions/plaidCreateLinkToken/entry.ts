import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const PLAID_CLIENT_ID = Deno.env.get("PLAID_CLIENT_ID");
const PLAID_SECRET = Deno.env.get("PLAID_SECRET");
const PLAID_ENV = "production";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accountCategory } = await req.json();

    const response = await fetch('https://production.plaid.com/link/token/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        user: { client_user_id: user.id },
        client_name: 'Construction Business Manager',
        language: 'en',
        country_codes: ['US'],
        products: ['auth', 'transactions'],
        account_subtypes: {
          depository: ['checking', 'savings'],
          credit: ['credit card']
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json({ error: data.error_message || 'Failed to create link token' }, { status: 400 });
    }

    return Response.json({ link_token: data.link_token });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});