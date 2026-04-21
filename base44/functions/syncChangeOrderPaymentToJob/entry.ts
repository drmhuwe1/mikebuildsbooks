import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Syncs change order payment amount to the linked job's total_paid_by_customer
 * Triggered when a change order's amount_paid_to_date is updated
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Validate payload
    if (!payload.changeOrderId) {
      return Response.json({ error: 'Missing changeOrderId' }, { status: 400 });
    }

    // Fetch the change order
    const co = await base44.entities.ChangeOrder.get(payload.changeOrderId);
    if (!co) {
      return Response.json({ error: 'Change order not found' }, { status: 404 });
    }

    // If no job linked, nothing to sync
    if (!co.job_id) {
      return Response.json({ 
        status: 'skipped', 
        reason: 'No job linked to this change order' 
      });
    }

    // Fetch the linked job
    const job = await base44.entities.Job.get(co.job_id);
    if (!job) {
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }

    // Calculate total payments: what was already paid + this CO's payment
    const coPaid = co.amount_paid_to_date || 0;
    const previousJobTotal = job.total_paid_by_customer || 0;
    
    // Get all other change orders for this job to sum their payments
    const allCOs = await base44.entities.ChangeOrder.filter({ job_id: co.job_id });
    const otherCOsPaid = allCOs
      .filter(c => c.id !== co.id)
      .reduce((sum, c) => sum + (c.amount_paid_to_date || 0), 0);
    
    // Total should be: deposit/initial payment + all CO payments
    const initialPayment = job.deposits_received || 0;
    const newTotal = initialPayment + coPaid + otherCOsPaid;

    // Only update if different
    if (previousJobTotal !== newTotal) {
      await base44.entities.Job.update(co.job_id, {
        total_paid_by_customer: newTotal,
      });

      return Response.json({
        status: 'synced',
        jobId: co.job_id,
        jobTitle: job.title,
        coId: co.id,
        coNumber: co.change_order_number,
        previousAmount: previousJobTotal,
        newAmount: newTotal,
        difference: newTotal - previousJobTotal,
        breakdown: {
          initialDeposit: initialPayment,
          thisCOPaid: coPaid,
          otherCOsPaid: otherCOsPaid,
        },
      });
    }

    return Response.json({
      status: 'no_change',
      jobId: co.job_id,
      amount: newTotal,
    });
  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ error: error.message, status: 'failed' }, { status: 500 });
  }
});