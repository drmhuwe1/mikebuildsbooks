import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all unsync subcontractor payments
    const payments = await base44.entities.SubcontractorPayment.filter({ synced_to_finances: false });

    if (payments.length === 0) {
      return Response.json({ synced: 0, message: 'No payments to sync' });
    }

    let synced = 0;

    for (const payment of payments) {
      // NOTE: Records written here are marked source="sub_payment_sync"
      // They must be excluded from expense calculations that already
      // count SubcontractorLedgerPayment records directly.
      // See BusinessFinancials actualExpenses calculation.
      await base44.entities.BankTransaction.create({
        description: `Subcontractor Payment - ${payment.subcontractor_name} (${payment.job_title || 'Job'})`,
        amount: payment.amount,
        type: 'outflow',
        date: payment.payment_date,
        category: 'subcontractor',
        job_id: payment.job_id,
        job_title: payment.job_title,
        vendor: payment.subcontractor_name,
        account_category: 'business',
        is_categorized: true,
        source: 'sub_payment_sync',
        notes: `Payment method: ${payment.payment_method}${payment.payment_reference ? ' - Ref: ' + payment.payment_reference : ''}${payment.notes ? ' - ' + payment.notes : ''}`
      });

      // Mark payment as synced
      await base44.entities.SubcontractorPayment.update(payment.id, {
        synced_to_finances: true
      });

      synced++;
      console.log(`Synced payment ${payment.id} to financials`);
    }

    return Response.json({
      synced,
      message: `Successfully synced ${synced} payment(s) to Business Financials`
    });
  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});