import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { EXPORT_ENTITIES } from '../../shared/dataTransfer.ts';

/**
 * Exports ALL user-entered data from every entity in the app as a single JSON
 * object, suitable for downloading as a backup file and re-importing into a
 * blank copy of the app via importAllData.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const PAGE = 500;
    const entities: Record<string, any[]> = {};

    for (const name of EXPORT_ENTITIES) {
      const all: any[] = [];
      let skip = 0;
      try {
        while (true) {
          const batch = await base44.asServiceRole.entities[name].list('-created_date', PAGE, skip);
          if (!Array.isArray(batch)) break;
          all.push(...batch);
          if (batch.length < PAGE) break;
          skip += PAGE;
        }
      } catch (_e) {
        // entity may not exist in this app or be inaccessible — leave empty
      }
      entities[name] = all;
    }

    // Users are exported read-only (reference). They cannot be imported —
    // they must be re-invited in the new app via the All Users tab.
    let users: any[] = [];
    try {
      users = await base44.asServiceRole.entities.User.list('-created_date', 1000, 0);
    } catch (_e) {
      users = [];
    }

    const entityCounts: Record<string, number> = {};
    for (const name of EXPORT_ENTITIES) entityCounts[name] = entities[name].length;

    return Response.json({
      exportedAt: new Date().toISOString(),
      exportedBy: user.email,
      format: 'mikebuildsbooks-backup-v1',
      entityCounts,
      users: Array.isArray(users)
        ? users.map((u) => ({
            id: u.id,
            email: u.email,
            full_name: u.full_name,
            role: u.role,
            created_date: u.created_date,
          }))
        : [],
      entities,
    });
  } catch (error) {
    console.error('Export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}