import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  EXPORT_ENTITIES,
  BUILTIN_FIELDS,
  ARRAY_ID_FIELDS,
  fkTarget,
} from '../../shared/dataTransfer.ts';

/**
 * Imports a previously exported backup JSON into the app, re-establishing all
 * records with foreign-key relationships remapped to the new record IDs.
 *
 * Two-phase approach (handles circular FKs like Job <-> Bid):
 *   Phase 1 — create every record (built-in fields stripped), build old->new
 *              ID maps per entity.
 *   Phase 2 — patch every foreign-key field (scalar "_id" fields + the
 *              change_orders array on Job) with the remapped IDs.
 *
 * Body: { entities: { EntityName: [...] }, mode: "merge" | "replace" }
 *   - "merge" (default): add records alongside any existing data.
 *   - "replace": delete all existing records first, then import.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const data = body?.entities || {};
    const mode = body?.mode === 'replace' ? 'replace' : 'merge';

    const report: any = {
      mode,
      created: {},
      fkPatched: 0,
      errors: [],
      note: 'User accounts are not imported. Re-invite users from the All Users tab using the exported user list.',
    };

    // Replace mode: wipe existing data first.
    if (mode === 'replace') {
      for (const name of EXPORT_ENTITIES) {
        try {
          let skip = 0;
          while (true) {
            const existing = await base44.asServiceRole.entities[name].list('-created_date', 500, skip);
            if (!Array.isArray(existing) || existing.length === 0) break;
            for (const rec of existing) {
              try { await base44.asServiceRole.entities[name].delete(rec.id); }
              catch (_e) { /* ignore individual delete failures */ }
            }
            if (existing.length < 500) break;
          }
        } catch (_e) { /* entity may not exist */ }
      }
    }

    // Phase 1 — create all records, build id maps.
    const idMaps: Record<string, Record<string, string>> = {};
    for (const name of EXPORT_ENTITIES) {
      idMaps[name] = {};
      const records = data[name] || [];
      if (!Array.isArray(records) || records.length === 0) {
        report.created[name] = 0;
        continue;
      }

      const cleaned = records.map((r: any) => {
        const c: any = {};
        for (const [k, v] of Object.entries(r)) {
          if (!BUILTIN_FIELDS.includes(k)) c[k] = v;
        }
        return c;
      });

      let createdCount = 0;
      const BATCH = 100;
      for (let i = 0; i < cleaned.length; i += BATCH) {
        const slice = cleaned.slice(i, i + BATCH);
        const oldSlice = records.slice(i, i + BATCH);
        try {
          const created = await base44.asServiceRole.entities[name].bulkCreate(slice);
          if (Array.isArray(created)) {
            for (let j = 0; j < created.length; j++) {
              if (oldSlice[j] && created[j]) {
                idMaps[name][oldSlice[j].id] = created[j].id;
              }
            }
            createdCount += created.length;
          }
        } catch (_e) {
          // Fallback: create one by one, skip failures.
          for (let j = 0; j < slice.length; j++) {
            try {
              const c = await base44.asServiceRole.entities[name].create(slice[j]);
              if (oldSlice[j] && c) idMaps[name][oldSlice[j].id] = c.id;
              createdCount++;
            } catch (e2) {
              report.errors.push({ entity: name, stage: 'create', id: oldSlice[j]?.id, error: e2.message });
            }
          }
        }
      }
      report.created[name] = createdCount;
    }

    // Phase 2 — patch foreign keys with remapped IDs.
    for (const name of EXPORT_ENTITIES) {
      const records = data[name] || [];
      if (!Array.isArray(records)) continue;
      const updates: any[] = [];

      for (const rec of records) {
        const newId = idMaps[name]?.[rec.id];
        if (!newId) continue;
        const patch: any = {};

        for (const [k, v] of Object.entries(rec)) {
          if (BUILTIN_FIELDS.includes(k)) continue;
          const target = fkTarget(k);
          if (target && v) {
            const mapped = idMaps[target]?.[v];
            if (mapped) patch[k] = mapped;
          }
        }

        const arrFields = ARRAY_ID_FIELDS[name] || {};
        for (const [field, target] of Object.entries(arrFields)) {
          const arr = rec[field];
          if (Array.isArray(arr) && arr.length > 0) {
            patch[field] = arr.map((id: string) => idMaps[target]?.[id] || id);
          }
        }

        if (Object.keys(patch).length > 0) {
          updates.push({ id: newId, ...patch });
        }
      }

      const BATCH = 100;
      for (let i = 0; i < updates.length; i += BATCH) {
        const slice = updates.slice(i, i + BATCH);
        try {
          await base44.asServiceRole.entities[name].bulkUpdate(slice);
          report.fkPatched += slice.length;
        } catch (_e) {
          for (const u of slice) {
            try {
              const { id, ...rest } = u;
              await base44.asServiceRole.entities[name].update(id, rest);
              report.fkPatched++;
            } catch (e2) {
              report.errors.push({ entity: name, stage: 'fk_patch', id: u.id, error: e2.message });
            }
          }
        }
      }
    }

    report.status = report.errors.length === 0 ? 'success' : 'completed_with_errors';
    return Response.json(report);
  } catch (error) {
    console.error('Import error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}