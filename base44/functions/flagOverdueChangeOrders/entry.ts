import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const allCOs = await base44.asServiceRole.entities.ChangeOrder.list('-created_date', 500);

    const overdue = allCOs.filter(co =>
      co.status === 'sent' &&
      co.sent_at &&
      co.sent_at < fiveDaysAgo
    );

    let created = 0;
    for (const co of overdue) {
      const existing = await base44.asServiceRole.entities.FinancialAlert.filter({
        alert_type: 'margin_risk',
        title: `Overdue Approval: ${co.change_order_number}`,
        status: 'new',
      });
      if (existing.length === 0) {
        await base44.asServiceRole.entities.FinancialAlert.create({
          alert_type: 'margin_risk',
          severity: 'warning',
          title: `Overdue Approval: ${co.change_order_number}`,
          message: `Change order ${co.change_order_number} (${co.title}) for job ${co.job_title} was sent to client ${co.client_name} on ${new Date(co.sent_at).toLocaleDateString()} and has not been responded to.`,
          job_id: co.job_id || '',
          job_title: co.job_title || '',
          recommendation: 'Follow up with the client to get approval or discuss concerns.',
          status: 'new',
        });
        created++;
      }
    }

    console.log(`Checked ${allCOs.length} COs, flagged ${created} overdue`);
    return Response.json({ checked: allCOs.length, flagged: created });
  } catch (error) {
    console.error('flagOverdueChangeOrders error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});