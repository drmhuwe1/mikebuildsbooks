import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all field activity logs with paysheet uploads
    const activities = await base44.asServiceRole.entities.FieldActivityLog.filter({ 
      item_type: "subcontractor_paysheet" 
    });

    let syncedCount = 0;

    for (const activity of activities) {
      // Check if this activity already has a corresponding SubPaysheet
      const existing = await base44.asServiceRole.entities.SubPaysheet.filter({
        subcontractor_id: activity.subcontractor_id,
        photo_url: activity.file_url
      });

      if (existing.length === 0 && activity.subcontractor_id && activity.file_url) {
        // Create SubPaysheet record
        await base44.asServiceRole.entities.SubPaysheet.create({
          subcontractor_id: activity.subcontractor_id,
          subcontractor_name: activity.subcontractor_name || "",
          photo_url: activity.file_url,
          pay_period: activity.notes || "",
          job_title: activity.job_title || "",
          upload_date: activity.timestamp ? activity.timestamp.split("T")[0] : new Date().toISOString().split("T")[0],
        });
        syncedCount++;
      }
    }

    return Response.json({ 
      success: true, 
      message: `Synced ${syncedCount} paysheet upload(s)`
    });
  } catch (error) {
    console.error("Sync error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});