import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event, data } = await req.json();

    // Only process client updates
    if (event.type !== 'update' || event.entity_name !== 'Client') {
      return Response.json({ status: 'skipped' });
    }

    const clientId = event.entity_id;
    const clientData = data;

    // Get all related jobs, bids, and contracts
    const [jobs, bids, contracts] = await Promise.all([
      base44.asServiceRole.entities.Job.filter({ client_id: clientId }),
      base44.asServiceRole.entities.Bid.filter({ client_id: clientId }),
      base44.asServiceRole.entities.Contract.filter({ client_id: clientId }),
    ]);

    const updates = [];

    // Sync to all related jobs
    for (const job of jobs) {
      updates.push(
        base44.asServiceRole.entities.Job.update(job.id, {
          client_name: clientData.name || job.client_name,
          address: clientData.address || job.address,
          zip_code: clientData.zip_code || job.zip_code,
          city: clientData.city || job.city,
          state: clientData.state || job.state,
        })
      );

      // If address changed and has zip code, lookup municipality
      if (clientData.address && clientData.address !== job.address) {
        const zipMatch = clientData.address.match(/(\d{5})/);
        const stateMatch = clientData.address.match(/([A-Z]{2})\s*\d{5}/);
        if (zipMatch && stateMatch) {
          try {
            const municipalityResult = await base44.functions.invoke('identifyMunicipality', {
              zipCode: zipMatch[1],
              state: stateMatch[1],
              address: clientData.address
            });
            const existingMunicipal = await base44.asServiceRole.entities.Municipality.filter({ job_id: job.id });
            if (existingMunicipal.length > 0) {
              updates.push(
                base44.asServiceRole.entities.Municipality.update(existingMunicipal[0].id, {
                  municipality: municipalityResult.municipality,
                  county: municipalityResult.county,
                  state: municipalityResult.state,
                  zip_code: zipMatch[1],
                  project_address: clientData.address,
                })
              );
            }
          } catch (err) {
            console.log('Municipality lookup skipped:', err.message);
          }
        }
      }
    }

    // Sync to all related bids
    for (const bid of bids) {
      updates.push(
        base44.asServiceRole.entities.Bid.update(bid.id, {
          client_name: clientData.name || bid.client_name,
          client_last_name: clientData.last_name || bid.client_last_name,
          project_address: clientData.address || bid.project_address,
          project_zip_code: clientData.zip_code || bid.project_zip_code,
          project_city: clientData.city || bid.project_city,
          project_state: clientData.state || bid.project_state,
        })
      );
    }

    // Sync to all related contracts
    for (const contract of contracts) {
      updates.push(
        base44.asServiceRole.entities.Contract.update(contract.id, {
          client_name: clientData.name || contract.client_name,
          client_last_name: clientData.last_name || contract.client_last_name,
          client_address: clientData.address || contract.client_address,
          client_zip_code: clientData.zip_code || contract.client_zip_code,
        })
      );
    }

    // Execute all updates in parallel
    if (updates.length > 0) {
      await Promise.all(updates);
    }

    console.log(`Synced client ${clientId} updates to ${jobs.length} jobs, ${bids.length} bids, ${contracts.length} contracts`);

    return Response.json({
      status: 'synced',
      jobsUpdated: jobs.length,
      bidsUpdated: bids.length,
      contractsUpdated: contracts.length
    });
  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});