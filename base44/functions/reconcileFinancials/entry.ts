import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * Reconciles all financial data: syncs contract/bid payments to jobs,
 * validates calculations, and returns comprehensive financial report
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all relevant data
    const [jobs, contracts, bids] = await Promise.all([
      base44.entities.Job.list('-created_date', 500),
      base44.entities.Contract.list('-created_date', 500),
      base44.entities.Bid.list('-created_date', 500),
    ]);

    const updates = [];
    const report = {
      timestamp: new Date().toISOString(),
      totalJobsProcessed: 0,
      totalPaymentsSynced: 0,
      totalRevenueReconciled: 0,
      issues: [],
      syncs: [],
    };

    // For each job, sync payment data from contracts and bids
    for (const job of jobs) {
      try {
        report.totalJobsProcessed++;

        // Find linked contract
        const contract = contracts.find(c => c.job_id === job.id);
        // Find linked bid
        const bid = bids.find(b => b.job_id === job.id);

        let jobUpdateData = {};
        let paymentSynced = 0;

        // Sync contract payment data to job
        if (contract && contract.client_paid_amount && contract.client_paid_amount > 0) {
          if (!job.total_paid_by_customer || job.total_paid_by_customer !== contract.client_paid_amount) {
            jobUpdateData.total_paid_by_customer = contract.client_paid_amount;
            paymentSynced = contract.client_paid_amount;
            
            report.syncs.push({
              type: 'contract_to_job',
              jobId: job.id,
              jobTitle: job.title,
              contractId: contract.id,
              amount: contract.client_paid_amount,
              previousAmount: job.total_paid_by_customer || 0,
            });
          }
        }

        // Sync bid payment data if no contract
        if (!contract && bid && bid.client_paid_amount && bid.client_paid_amount > 0) {
          if (!job.total_paid_by_customer || job.total_paid_by_customer !== bid.client_paid_amount) {
            jobUpdateData.total_paid_by_customer = bid.client_paid_amount;
            paymentSynced = bid.client_paid_amount;
            
            report.syncs.push({
              type: 'bid_to_job',
              jobId: job.id,
              jobTitle: job.title,
              bidId: bid.id,
              amount: bid.client_paid_amount,
              previousAmount: job.total_paid_by_customer || 0,
            });
          }
        }

        // Validate financial calculations
        const totalCosts = (job.material_costs || 0) + (job.labor_costs || 0) +
                          (job.subcontractor_costs || 0) + (job.permit_costs || 0) +
                          (job.equipment_costs || 0) + (job.overhead_costs || 0) +
                          (job.other_costs || 0);

        const revenue = (job.contract_amount || 0) + (job.change_orders_total || 0);
        const projectedProfit = revenue - totalCosts;
        const projectedMargin = revenue > 0 ? ((projectedProfit / revenue) * 100).toFixed(1) : 0;

        // Check for concerning margins
        if (projectedMargin < 0) {
          report.issues.push({
            severity: 'error',
            jobId: job.id,
            jobTitle: job.title,
            message: `Negative margin: ${projectedMargin}%. Review costs immediately.`,
            currentMargin: projectedMargin,
          });
        } else if (projectedMargin < 10) {
          report.issues.push({
            severity: 'warning',
            jobId: job.id,
            jobTitle: job.title,
            message: `Low margin: ${projectedMargin}%. Below 15% target.`,
            currentMargin: projectedMargin,
          });
        }

        // Check for unrealistic costs (e.g., labor costs > contract amount)
        if (job.labor_costs > revenue && revenue > 0) {
          report.issues.push({
            severity: 'warning',
            jobId: job.id,
            jobTitle: job.title,
            message: `Labor costs (${job.labor_costs}) exceed contract amount (${revenue}). Verify labor estimate.`,
          });
        }

        // Apply updates
        if (Object.keys(jobUpdateData).length > 0) {
          await base44.entities.Job.update(job.id, jobUpdateData);
          report.totalPaymentsSynced += paymentSynced;
          report.totalRevenueReconciled += paymentSynced;
          updates.push({ jobId: job.id, updated: jobUpdateData });
        }
      } catch (jobError) {
        report.issues.push({
          severity: 'error',
          jobId: job.id,
          jobTitle: job.title,
          message: `Error processing job: ${jobError.message}`,
        });
      }
    }

    // Calculate total business revenue using deposits_received (single source of truth, R2-1 fix)
    const allJobs = await base44.entities.Job.list('-created_date', 500);
    const totalRevenue = allJobs.reduce((sum, j) => sum + (j.deposits_received || 0), 0);

    report.finalTotalRevenue = totalRevenue;
    report.status = report.issues.filter(i => i.severity === 'error').length === 0 ? 'success' : 'completed_with_issues';

    return Response.json(report);
  } catch (error) {
    console.error('Reconciliation error:', error);
    return Response.json({ error: error.message, status: 'failed' }, { status: 500 });
  }
});