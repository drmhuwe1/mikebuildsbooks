import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const today = new Date().toISOString().split("T")[0];
    const year = String(new Date().getFullYear());

    // Get all unpaid work entries
    const unpaidEntries = await base44.asServiceRole.entities.SubcontractorWorkEntry.filter({ payment_status: "Unpaid" });

    // Get all subcontractors
    const subs = await base44.asServiceRole.entities.Subcontractor.list();

    // Get all ledger payments for this year
    const ledgerPayments = await base44.asServiceRole.entities.SubcontractorLedgerPayment.list();
    const yearPayments = ledgerPayments.filter(p => p.is_paid && (p.payment_date || "").startsWith(year));

    // Get existing alerts to avoid duplicates (check last 7 days)
    const existingAlerts = await base44.asServiceRole.entities.FinancialAlert.list("-created_date", 100);
    const recentAlertKeys = new Set(existingAlerts
      .filter(a => {
        const created = new Date(a.created_date || 0);
        return (Date.now() - created.getTime()) < 7 * 24 * 60 * 60 * 1000;
      })
      .map(a => a.title + "|" + (a.job_title || ""))
    );

    const alertsCreated = [];
    const alertsResolved = [];
    const cutoff14Days = new Date();
    cutoff14Days.setDate(cutoff14Days.getDate() - 14);
    const cutoff14Str = cutoff14Days.toISOString().split("T")[0];

    // Auto-resolve "Unpaid Balance Over 14 Days" alerts for subs that are now fully paid
    const unpaidSubIds = new Set(unpaidEntries.map(e => e.subcontractor_id));
    const openUnpaidAlerts = existingAlerts.filter(a =>
      a.title === "Subcontractor Unpaid Balance Over 14 Days" &&
      (a.status === "new" || a.status === "reviewed")
    );
    for (const alert of openUnpaidAlerts) {
      // Find the sub by matching the name in the message
      const sub = subs.find(s => alert.message?.includes(s.name));
      if (sub && !unpaidSubIds.has(sub.id)) {
        // Sub no longer has unpaid entries — resolve the alert
        await base44.asServiceRole.entities.FinancialAlert.update(alert.id, { status: "resolved" });
        alertsResolved.push(alert.id);
      }
    }

    // Group unpaid entries by sub
    const unpaidBySub = {};
    unpaidEntries.forEach(e => {
      if (!unpaidBySub[e.subcontractor_id]) {
        unpaidBySub[e.subcontractor_id] = { name: e.subcontractor_name, total: 0, oldest: e.work_date };
      }
      unpaidBySub[e.subcontractor_id].total += (e.calculated_pay || 0);
      if (e.work_date < unpaidBySub[e.subcontractor_id].oldest) {
        unpaidBySub[e.subcontractor_id].oldest = e.work_date;
      }
    });

    for (const [subId, info] of Object.entries(unpaidBySub)) {
      // Alert: unpaid balance over 14 days
      if (info.oldest && info.oldest < cutoff14Str && info.total > 0) {
        const alertKey = `Subcontractor Unpaid Balance Over 14 Days|${info.name}`;
        if (!recentAlertKeys.has(alertKey)) {
          await base44.asServiceRole.entities.FinancialAlert.create({
            alert_type: "suspicious_pattern",
            severity: "warning",
            title: "Subcontractor Unpaid Balance Over 14 Days",
            message: `${info.name} has an unpaid balance of $${info.total.toFixed(2)} with the oldest entry from ${info.oldest}.`,
            recommendation: "Record a payment or verify entries in the Subcontractors module.",
            job_title: info.name,
            status: "new",
          });
          alertsCreated.push(`overdue:${info.name}`);
        }
      }
    }

    // YTD threshold alerts
    const ytdBySub = {};
    yearPayments.forEach(p => {
      if (!ytdBySub[p.subcontractor_id]) ytdBySub[p.subcontractor_id] = { name: p.subcontractor_name, total: 0 };
      ytdBySub[p.subcontractor_id].total += (p.amount_paid || 0);
    });

    for (const [subId, info] of Object.entries(ytdBySub)) {
      if (info.total >= 600) {
        const alertKey = `Subcontractor Exceeds $600 YTD — 1099 Required|${info.name}`;
        if (!recentAlertKeys.has(alertKey)) {
          await base44.asServiceRole.entities.FinancialAlert.create({
            alert_type: "margin_risk",
            severity: "error",
            title: "Subcontractor Exceeds $600 YTD — 1099 Required",
            message: `${info.name} has been paid $${info.total.toFixed(2)} YTD, exceeding the $600 IRS 1099-NEC threshold.`,
            recommendation: "Ensure a W-9 is on file. File a 1099-NEC for this contractor by January 31.",
            job_title: info.name,
            status: "new",
          });
          alertsCreated.push(`1099:${info.name}`);
        }
      } else if (info.total >= 500) {
        const alertKey = `Subcontractor Approaching $600 YTD Threshold|${info.name}`;
        if (!recentAlertKeys.has(alertKey)) {
          await base44.asServiceRole.entities.FinancialAlert.create({
            alert_type: "margin_risk",
            severity: "warning",
            title: "Subcontractor Approaching $600 YTD Threshold",
            message: `${info.name} has been paid $${info.total.toFixed(2)} YTD. They are $${(600 - info.total).toFixed(2)} away from the 1099-NEC threshold.`,
            recommendation: "Ensure a W-9 is on file before they reach $600.",
            job_title: info.name,
            status: "new",
          });
          alertsCreated.push(`approaching:${info.name}`);
        }
      }
    }

    return Response.json({ success: true, alertsCreated, alertsResolved });
  } catch (error) {
    console.error("checkSubLaborAlerts error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});