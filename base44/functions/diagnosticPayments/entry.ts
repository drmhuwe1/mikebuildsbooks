import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Check all payment-related entities for Saylor
    const subPayments = await base44.asServiceRole.entities.SubcontractorPayment.list();
    const ledgerPayments = await base44.asServiceRole.entities.SubcontractorLedgerPayment.list();
    const workEntries = await base44.asServiceRole.entities.SubcontractorWorkEntry.list();
    
    const saylor = subPayments.find(p => p.subcontractor_id && p.subcontractor_id.includes('Saylor')) ||
                   ledgerPayments.find(p => p.subcontractor_id && p.subcontractor_id.includes('Saylor'));
    
    return Response.json({
      subPaymentCount: subPayments.length,
      ledgerPaymentCount: ledgerPayments.length,
      workEntriesCount: workEntries.length,
      saylorsInSubPayment: subPayments.filter(p => p.subcontractor_name?.includes('Saylor')),
      saylorsInLedger: ledgerPayments.filter(p => p.subcontractor_name?.includes('Saylor')),
      saylorsWorkEntries: workEntries.filter(p => p.subcontractor_name?.includes('Saylor')),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});