import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const PLAID_CLIENT_ID = Deno.env.get("PLAID_CLIENT_ID");
const PLAID_SECRET = Deno.env.get("PLAID_SECRET");

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { publicToken, accountCategory, accountName } = await req.json();

    // Exchange public token for access token
    const exchangeResponse = await fetch('https://production.plaid.com/item/public_token/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        public_token: publicToken
      })
    });

    const exchangeData = await exchangeResponse.json();

    if (!exchangeResponse.ok) {
      return Response.json({ error: exchangeData.error_message || 'Token exchange failed' }, { status: 400 });
    }

    const accessToken = exchangeData.access_token;
    const itemId = exchangeData.item_id;

    // Get accounts for this item
    const accountsResponse = await fetch('https://production.plaid.com/accounts/get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        access_token: accessToken
      })
    });

    const accountsData = await accountsResponse.json();

    if (!accountsResponse.ok) {
      return Response.json({ error: 'Failed to retrieve accounts' }, { status: 400 });
    }

    // Get institution info
    const institutionResponse = await fetch('https://production.plaid.com/institutions/get_by_item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        access_token: accessToken
      })
    });

    const institutionData = await institutionResponse.json();
    const institutionName = institutionData?.institution?.name || 'Unknown Bank';

    // Return account info for user to select which to save
    return Response.json({
      access_token: accessToken,
      item_id: itemId,
      institution_name: institutionName,
      accounts: accountsData.accounts.map(acc => ({
        plaid_account_id: acc.account_id,
        name: acc.name,
        type: acc.subtype || acc.type,
        balance: acc.balances.current,
        available_balance: acc.balances.available
      }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});