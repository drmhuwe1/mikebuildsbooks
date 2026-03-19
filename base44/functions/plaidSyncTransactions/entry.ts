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

    const { accessToken, accountId, bankAccountId, accountCategory } = await req.json();

    // Get transactions
    const now = new Date();
    const endDate = now.toISOString().split('T')[0];
    const startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const transResponse = await fetch('https://production.plaid.com/transactions/get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
        options: { account_ids: [accountId] }
      })
    });

    const transData = await transResponse.json();

    if (!transResponse.ok) {
      return Response.json({ error: 'Failed to fetch transactions' }, { status: 400 });
    }

    // Map Plaid categories to our categories
    const mapCategory = (plaidCategories) => {
      if (!plaidCategories || plaidCategories.length === 0) return 'other';
      const cat = plaidCategories[0].toLowerCase();
      
      const categoryMap = {
        'transfer': 'transfer',
        'payment': 'payment',
        'deposit': 'deposit',
        'payroll': 'payroll',
        'fuel': 'fuel',
        'groceries': 'groceries',
        'food': 'groceries',
        'utilities': 'utilities',
        'insurance': 'insurance',
        'transportation': 'transportation',
        'healthcare': 'healthcare',
        'entertainment': 'entertainment',
        'rent': 'housing',
        'mortgage': 'housing'
      };

      for (const [key, val] of Object.entries(categoryMap)) {
        if (cat.includes(key)) return val;
      }
      return 'other';
    };

    // Create transaction records
    const txns = transData.transactions.map(t => ({
      description: t.name || t.merchant_name || 'Transaction',
      amount: Math.abs(t.amount),
      type: t.amount > 0 ? 'inflow' : 'outflow',
      date: t.date,
      category: mapCategory(t.personal_finance_category?.primary ? [t.personal_finance_category.primary] : t.categories),
      bank_account_id: bankAccountId,
      bank_account_name: t.account_owner || '',
      account_category: accountCategory,
      vendor: t.merchant_name || '',
      is_categorized: false,
      plaid_transaction_id: t.transaction_id,
      notes: t.pending ? '[Pending]' : ''
    }));

    // Save transactions
    if (txns.length > 0) {
      await base44.asServiceRole.entities.BankTransaction.bulkCreate(txns);
    }

    return Response.json({
      success: true,
      imported: txns.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});