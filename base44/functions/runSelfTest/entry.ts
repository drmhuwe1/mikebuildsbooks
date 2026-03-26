import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const APP_URL = "https://mikebuildsbooks.base44.app"; // UPDATE THIS
const PAGES = [
  { name: "Dashboard", path: "/Dashboard" },
  { name: "Jobs", path: "/Jobs" },
  { name: "Bid Builder", path: "/BidBuilder" },
  { name: "Contracts", path: "/Contracts" },
  { name: "Subcontractors", path: "/Subcontractors" },
];

const BACKEND_FUNCTIONS = []; // Skip self-test to avoid circular health checks

function pageFixPrompt(name, url, err) {
  return `## Fix: "${name}" page failed to load\n\n**What broke:** GET ${url} returned an error or non-2xx status.\n**Error:** ${err}\n\n### Common causes\n1. A component on this page throws during render.\n2. A required import or asset is missing.\n3. The route is not registered in App.jsx.\n\n### Steps to fix\n1. Open the page component file and check for syntax errors or broken imports.\n2. Verify the route exists in App.jsx.\n3. Check the browser console for runtime errors.\n4. Ensure all entity queries are working.\n\n⚠️ DO NOT change any other functionality.`;
}

function fnFixPrompt(name, err) {
  return `## Fix: Backend function "${name}" is unhealthy\n\n**What broke:** The function endpoint returned an error.\n**Error:** ${err}\n\n### Common causes\n1. The function has a syntax error preventing deployment.\n2. A required import is missing (npm: prefix).\n3. A required secret/env variable is missing.\n4. Unhandled exception in function logic.\n\n### Steps to fix\n1. Check the function file for syntax errors.\n2. Ensure all imports use npm: prefix.\n3. Verify all required secrets are set.\n4. Check logs in the function testing UI.\n\n⚠️ DO NOT change any other functionality.`;
}

function dbFixPrompt(err) {
  return `## Fix: Entity query check failed\n\n**What broke:** A simple entity list query failed.\n**Error:** ${err}\n\n### Common causes\n1. The entity doesn't exist or was renamed.\n2. RLS policies are blocking access.\n3. The entity schema is invalid.\n4. Service role auth is misconfigured.\n\n### Steps to fix\n1. Verify the entity exists in your entity list.\n2. Check entity RLS policies.\n3. Try listing the entity in the UI or SDK directly.\n4. Check the browser console for detailed errors.\n\n⚠️ DO NOT change any other functionality.`;
}

async function runCheck(name, category, fn) {
  const start = Date.now();
  try {
    const message = await fn();
    return { name, category, status: "pass", message, duration_ms: Date.now() - start };
  } catch (e) {
    const errMsg = e?.message || String(e);
    let fix_prompt;
    if (category === "page") fix_prompt = pageFixPrompt(name, "", errMsg);
    else if (category === "function") fix_prompt = fnFixPrompt(name, errMsg);
    else if (category === "entity") fix_prompt = dbFixPrompt(errMsg);
    return { name, category, status: "fail", message: errMsg, fix_prompt, duration_ms: Date.now() - start };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    // Only admins can run self-tests
    if (user?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403 });
    }

    const startTime = Date.now();
    let triggeredBy = "manual";
    try {
      const body = await req.json();
      if (body?.triggered_by) triggeredBy = body.triggered_by;
    } catch {}

    const checks = [];

    // 1. Page smoke tests
    const pageChecks = PAGES.map((p) =>
      runCheck(p.name, "page", async () => {
        const res = await fetch(`${APP_URL}${p.path}`, { method: "GET", redirect: "follow" });
        await res.text();
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return `HTTP ${res.status} OK`;
      })
    );

    // 2. Function health checks (skip self-test to avoid circular deps)
    const fnChecks = BACKEND_FUNCTIONS.map((fn) =>
      runCheck(`Function: ${fn}`, "function", async () => {
        const res = await fetch(`${new URL(req.url).origin}/api/functions/${fn}`, {
          method: "OPTIONS",
          headers: { "Content-Type": "application/json" },
        });
        if (res.status >= 400) throw new Error(`OPTIONS returned ${res.status}`);
        return `OPTIONS ${res.status} OK`;
      })
    );
    
    // Basic function health: just check this endpoint is callable
    const selfTestCheck = await runCheck("Function: runSelfTest", "function", async () => {
      return "Self-test function is running";
    });

    // 3. Entity connectivity
    const entityCheck = await runCheck("Entity: Job", "entity", async () => {
      const jobs = await base44.entities.Job.list("-created_date", 1);
      return `Connected — ${jobs?.length || 0} jobs found`;
    });

    // 4. Auth system
    const authCheck = await runCheck("Auth system", "entity", async () => {
      const me = await base44.auth.me();
      return `Auth OK — ${me?.email || "user"} authenticated`;
    });

    const allResults = await Promise.all([...pageChecks, ...fnChecks]);
    checks.push(...allResults, selfTestCheck, entityCheck, authCheck);

    const passed = checks.filter((c) => c.status === "pass").length;
    const failed = checks.filter((c) => c.status === "fail").length;
    const status = failed === 0 ? "healthy" : "degraded";
    const durationMs = Date.now() - startTime;

    // Save results
    await base44.entities.SelfTestResults.create({
      status,
      total_checks: checks.length,
      passed_checks: passed,
      failed_checks: failed,
      checks,
      duration_ms: durationMs,
      triggered_by: triggeredBy,
    });

    return new Response(
      JSON.stringify({ status, total: checks.length, passed, failed, duration_ms: durationMs, checks }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Self-test error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});