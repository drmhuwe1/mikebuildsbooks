import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'field_payments') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { client_id, client_name, job_id, job_title, contract_id, contract_title, amount, payment_type, source } = await req.json();

    if (!client_id || !amount || amount <= 0) {
      return Response.json({ error: 'Invalid payment parameters' }, { status: 400 });
    }

    // Create payment ledger entry
    const paymentLedger = await base44.entities.PaymentLedger.create({
      stripe_payment_id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      client_id,
      client_name,
      job_id,
      job_title,
      contract_id,
      contract_title,
      amount,
      payment_type,
      source,
      collected_by_user_id: user.id,
      collected_by_email: user.email,
      payment_date: new Date().toISOString(),
      status: 'completed'
    });

    // Update contract if exists
    if (contract_id) {
      const contract = await base44.entities.Contract.get(contract_id);
      const newPaidAmount = (contract.client_paid_amount || 0) + amount;
      await base44.entities.Contract.update(contract_id, {
        client_paid_amount: newPaidAmount
      });
    }

    // Update job if exists
    if (job_id) {
      const job = await base44.entities.Job.get(job_id);
      const newPaidAmount = (job.total_paid_by_customer || 0) + amount;
      await base44.entities.Job.update(job_id, {
        total_paid_by_customer: newPaidAmount,
        deposits_received: (job.deposits_received || 0) + (payment_type === 'deposit' ? amount : 0)
      });
    }

    // Create audit log
    await base44.entities.FieldPaymentsAudit.create({
      user_id: user.id,
      user_email: user.email,
      action: 'payment_completed',
      client_id,
      client_name,
      job_id,
      job_title,
      contract_id,
      amount,
      payment_type,
      source,
      stripe_transaction_id: paymentLedger.stripe_payment_id,
      payment_ledger_id: paymentLedger.id,
      status: 'success',
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown',
      device_info: req.headers.get('user-agent') || 'unknown',
      timestamp: new Date().toISOString()
    });

    return Response.json({
      success: true,
      amount,
      client_name,
      stripe_payment_id: paymentLedger.stripe_payment_id,
      payment_date: paymentLedger.payment_date
    });
  } catch (error) {
    console.error('Payment collection error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});