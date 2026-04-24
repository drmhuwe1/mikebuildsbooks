import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Triggered by entity automation on PaymentLedger create/update.
 * When a PaymentLedger record reaches status === "completed" and
 * synced_to_job !== true, adds the payment amount to Job.deposits_received.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { event, data } = body;
    const payment = data;

    // Only process completed payments that haven't been synced yet
    if (payment?.status !== "completed" || payment?.synced_to_job === true) {
      return Response.json({ skipped: true, reason: "Not completed or already synced" });
    }

    if (!payment.job_id || !payment.amount) {
      return Response.json({ skipped: true, reason: "Missing job_id or amount" });
    }

    // Fetch the job
    const job = await base44.asServiceRole.entities.Job.get(payment.job_id);
    if (!job) {
      console.error("Job not found:", payment.job_id);
      return Response.json({ error: "Job not found" }, { status: 404 });
    }

    const currentDeposits = job.deposits_received || 0;
    const newDeposits = currentDeposits + payment.amount;

    console.log(`Syncing PaymentLedger ${payment.id}: +$${payment.amount} to Job ${job.id} (${job.title}). deposits_received: ${currentDeposits} → ${newDeposits}`);

    // Update job deposits_received
    await base44.asServiceRole.entities.Job.update(payment.job_id, {
      deposits_received: newDeposits
    });

    // Mark payment as synced to prevent double-counting
    await base44.asServiceRole.entities.PaymentLedger.update(payment.id, {
      synced_to_job: true
    });

    console.log("Sync complete.");
    return Response.json({ success: true, job_id: payment.job_id, amount_synced: payment.amount, new_deposits_received: newDeposits });

  } catch (error) {
    console.error("syncPaymentLedgerToJob error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});