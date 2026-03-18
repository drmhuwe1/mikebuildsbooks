import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // List of entity types to clear
    const entities = [
      'Job', 'Client', 'Bid', 'Contract', 'MaterialCost', 'Bill', 'PersonalBill',
      'BankAccount', 'BankTransaction', 'Subcontractor', 'SubcontractorPayment',
      'JobTask', 'Document', 'JobStage', 'FinancialGoal', 'FinancialScenario',
      'DocumentDelivery', 'FinancialAlert'
    ];

    const results = {};

    for (const entity of entities) {
      const records = await base44.asServiceRole.entities[entity].list('', 1000);
      let deletedCount = 0;

      for (const record of records) {
        await base44.asServiceRole.entities[entity].delete(record.id);
        deletedCount++;
      }

      results[entity] = { deleted: deletedCount };
    }

    return Response.json({
      message: 'All mock data cleared successfully',
      results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});