import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * Triggered when a contract is updated
 * Syncs client_paid_amount to the linked job's total_paid_by_customer
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Validate payload
    if (!payload.contractId || payload.clientPaidAmount === undefined) {
      return Response.json({ error: 'Missing contractId or clientPaidAmount' }, { status: 400 });
    }

    // Fetch the contract
    const contract = await base44.entities.Contract.get('Contract', payload.contractId);
    if (!contract) {
      return Response.json({ error: 'Contract not found' }, { status: 404 });
    }

    // If no job linked, nothing to sync
    if (!contract.job_id) {
      return Response.json({ 
        status: 'skipped', 
        reason: 'No job linked to this contract' 
      });
    }

    // Fetch the linked job
    const job = await base44.entities.Job.get('Job', contract.job_id);
    if (!job) {
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }

    // Sync the payment
    const clientPaid = contract.client_paid_amount || 0;
    const previousAmount = job.total_paid_by_customer || 0;

    // Only update if different
    if (previousAmount !== clientPaid) {
      await base44.entities.Job.update(contract.job_id, {
        total_paid_by_customer: clientPaid,
      });

      return Response.json({
        status: 'synced',
        jobId: contract.job_id,
        jobTitle: job.title,
        previousAmount,
        newAmount: clientPaid,
        difference: clientPaid - previousAmount,
      });
    }

    return Response.json({
      status: 'no_change',
      jobId: contract.job_id,
      amount: clientPaid,
    });
  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ error: error.message, status: 'failed' }, { status: 500 });
  }
});