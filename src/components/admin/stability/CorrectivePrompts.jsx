import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCircle2, Wrench, Bug, Globe, Repeat } from "lucide-react";

const PROTECTION_LANGUAGE = `Do not change unrelated working features.
Do not redesign the application.
Do not remove existing functionality.
Do not rename, relocate, or refactor working features unless the smallest required fix makes it unavoidable.
Fix only the smallest scope required.
Preserve the current design system, routes, data structures, permissions, and integrations unless directly responsible for the verified failure.
After fixing, retest the affected feature and nearby related features.
Rerun the originating Stability Scan, Automated Crawl, or Playwright/Regression Suite and report the real results.
Do not claim the issue is fixed until the required tests pass with real data.`;

export default function CorrectivePrompts() {
  const [copiedType, setCopiedType] = useState(null);
  const [stabilityRun, setStabilityRun] = useState(null);
  const [crawlResults, setCrawlResults] = useState(null);
  const [regressionData, setRegressionData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const runs = await base44.entities.SelfTestResults.list("-created_date", 1);
        if (runs.length > 0) setStabilityRun(runs[0]);
      } catch (_) {}

      try {
        const c = localStorage.getItem("mike_crawl_latest");
        if (c) setCrawlResults(JSON.parse(c));
      } catch (_) {}

      try {
        const f = localStorage.getItem("mike_frozen_baseline");
        const frozen = f ? JSON.parse(f) : null;
        const drift = frozen ? computeRegressionDrift(frozen, crawlResults) : null;
        if (drift) setRegressionData({ frozen, drift });
      } catch (_) {}
    })();
  }, []);

  const copy = async (text, type) => {
    await navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  // Master Stability Corrective Prompt
  const buildStabilityPrompt = () => {
    if (!stabilityRun || !stabilityRun.checks?.length) return null;
    const failed = stabilityRun.checks.filter(c => c.status === "fail");
    if (failed.length === 0) return null;

    let prompt = `# Master Stability Corrective Prompt\n`;
    prompt += `# Application: MikeBuildsBooks\n`;
    prompt += `# Generator Type: Stability\n`;
    prompt += `# Scan Date: ${stabilityRun.created_date}\n`;
    prompt += `# Run ID: ${stabilityRun.id}\n`;
    prompt += `# Status: ${stabilityRun.status} | ${stabilityRun.failed_checks} failed / ${stabilityRun.total_checks} total\n\n---\n\n`;

    const categories = {};
    failed.forEach(c => {
      const cat = c.category || "other";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(c);
    });

    Object.entries(categories).forEach(([cat, checks]) => {
      prompt += `## ${cat.toUpperCase()}\n\n`;
      checks.forEach((c, i) => {
        prompt += `### ${i + 1}. ${c.name}\n`;
        prompt += `**What Failed:** ${c.message}\n`;
        prompt += `**Where:** ${c.category}\n`;
        prompt += `**Severity:** ${c.status === "fail" ? "critical" : "warning"}\n`;
        if (c.fix_prompt) prompt += `**Fix:** ${c.fix_prompt}\n`;
        prompt += `**Testing:** After fixing, rerun the Stability Scan and verify this check passes.\n\n`;
      });
    });

    prompt += `\n## Protection Language\n\n${PROTECTION_LANGUAGE}\n`;
    return prompt;
  };

  // Master Crawl Corrective Prompt
  const buildCrawlPrompt = () => {
    if (!crawlResults?.routes) return null;
    const issues = crawlResults.routes.filter(r => r.status !== "ok");
    if (issues.length === 0) return null;

    let prompt = `# Master Automated Crawl Corrective Prompt\n`;
    prompt += `# Application: MikeBuildsBooks\n`;
    prompt += `# Generator Type: Crawl\n`;
    prompt += `# Crawl Date: ${crawlResults.timestamp}\n`;
    prompt += `# Routes: ${crawlResults.totalRoutes} | Issues: ${issues.length}\n\n---\n\n`;

    issues.forEach((r, i) => {
      prompt += `## ${i + 1}. ${r.route} [${r.status.toUpperCase()}]\n`;
      prompt += `**Route:** ${r.route}\n`;
      if (r.error) prompt += `**Error:** ${r.error}\n`;
      if (r.errors?.length) {
        prompt += `**Runtime Errors:**\n`;
        r.errors.forEach(e => { prompt += `  - ${e.message}\n`; });
      }
      if (r.consoleErrors?.length) {
        prompt += `**Console Errors:**\n`;
        r.consoleErrors.forEach(e => { prompt += `  - ${e}\n`; });
      }
      if (r.failedResources?.length) {
        prompt += `**Failed Resources:**\n`;
        r.failedResources.forEach(f => { prompt += `  - ${f.url} (HTTP ${f.status})\n`; });
      }
      prompt += `**Likely Cause (hypothesis):** Inspect the route component and its dependencies.\n`;
      prompt += `**Fix:** Fix only the smallest scope required for this route.\n\n`;
    });

    prompt += `\n## Protection Language\n\n${PROTECTION_LANGUAGE}\n`;
    return prompt;
  };

  // Master Regression Corrective Prompt
  const buildRegressionPrompt = () => {
    if (!regressionData?.frozen || !regressionData?.drift?.length) return null;
    const { frozen, drift } = regressionData;

    let prompt = `# Master Playwright/Regression Corrective Prompt\n`;
    prompt += `# Application: MikeBuildsBooks\n`;
    prompt += `# Generator Type: Regression\n`;
    prompt += `# Baseline Date: ${frozen.frozen_at || frozen.timestamp}\n`;
    prompt += `# Current Run Date: ${new Date().toISOString()}\n`;
    prompt += `# Latest Status: FAIL\n`;
    prompt += `# New Regressions: ${drift.length}\n\n---\n\n`;

    prompt += `## Saved Baseline\n`;
    prompt += `- Frozen: ${frozen.frozen_at || frozen.timestamp}\n`;
    prompt += `- Routes: ${frozen.totalRoutes || frozen.routes?.length || 0}\n\n`;

    prompt += `## New Regressions (not in baseline)\n\n`;
    drift.forEach((d, i) => {
      prompt += `### ${i + 1}. ${d.route} [${d.type}]\n`;
      prompt += `**Severity:** ${d.severity}\n`;
      prompt += `**Detail:** ${d.detail}\n`;
      if (d.errors?.length) {
        prompt += `**Errors:**\n`;
        d.errors.forEach(e => { prompt += `  - ${e.message || JSON.stringify(e)}\n`; });
      }
      prompt += `\n`;
    });

    prompt += `\n## Instructions\n`;
    prompt += `Restore the previously working behavior without overwriting intentional unrelated improvements.\n`;
    prompt += `Rerun the Playwright suite and baseline comparison after fixing.\n\n`;
    prompt += `## Protection Language\n\n${PROTECTION_LANGUAGE}\n`;
    return prompt;
  };

  const stabilityPrompt = buildStabilityPrompt();
  const crawlPrompt = buildCrawlPrompt();
  const regressionPrompt = buildRegressionPrompt();

  const generators = [
    {
      type: "stability",
      label: "Master Stability Corrective Prompt",
      icon: Wrench,
      prompt: stabilityPrompt,
      available: !!stabilityPrompt,
      disabledReason: "No completed Stability Scan with failures. Run a self-test first.",
      color: "text-blue-600",
      bg: "bg-blue-50 border-blue-200",
    },
    {
      type: "crawl",
      label: "Master Crawl Corrective Prompt",
      icon: Globe,
      prompt: crawlPrompt,
      available: !!crawlPrompt,
      disabledReason: "No completed Automated Crawl with issues. Run a crawl first.",
      color: "text-green-600",
      bg: "bg-green-50 border-green-200",
    },
    {
      type: "regression",
      label: "Master Regression Corrective Prompt",
      icon: Repeat,
      prompt: regressionPrompt,
      available: !!regressionPrompt,
      disabledReason: "No regression detected. Freeze a baseline and run a new crawl to compare.",
      color: "text-purple-600",
      bg: "bg-purple-50 border-purple-200",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Bug className="w-5 h-5 text-red-500" />
        <h3 className="font-semibold">Master Corrective Prompt Generators</h3>
      </div>

      <p className="text-xs text-muted-foreground">
        Three separately wired generators, each pulling from its own real scan/run data source.
        Each produces a complete ready-to-paste builder prompt with all detected issues and required protection language.
      </p>

      <div className="space-y-3">
        {generators.map(gen => (
          <div key={gen.type} className={`border rounded-xl p-4 ${gen.bg}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <gen.icon className={`w-5 h-5 ${gen.color}`} />
                <div>
                  <p className="font-medium text-sm">{gen.label}</p>
                  {gen.available ? (
                    <Badge variant="secondary" className="text-xs mt-0.5">Ready — {gen.prompt.length} chars</Badge>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-0.5">{gen.disabledReason}</p>
                  )}
                </div>
              </div>
              <Button
                onClick={() => copy(gen.prompt, gen.type)}
                disabled={!gen.available}
                variant={gen.available ? "default" : "outline"}
                size="sm"
              >
                {copiedType === gen.type ? (
                  <><CheckCircle2 className="w-4 h-4 mr-1.5 text-green-500" /> Copied!</>
                ) : (
                  <><Copy className="w-4 h-4 mr-1.5" /> Copy</>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function computeRegressionDrift(frozen, current) {
  if (!frozen || !current) return null;
  const frozenRoutes = new Map((frozen.routes || []).map(r => [r.route, r]));
  const currentRoutes = new Map((current.routes || []).map(r => [r.route, r]));
  const newIssues = [];

  for (const [route, curr] of currentRoutes) {
    const base = frozenRoutes.get(route);
    if (!base) continue;
    if (base.status === "ok" && curr.status !== "ok") {
      newIssues.push({ route, type: "status_regression", detail: `Was ${base.status}, now ${curr.status}`, severity: "critical", errors: curr.errors, currentError: curr.error });
    }
    const newConsoleErrors = (curr.consoleErrors || []).filter(ce => !(base.consoleErrors || []).some(be => be === ce));
    if (newConsoleErrors.length > 0) {
      newIssues.push({ route, type: "new_console_error", detail: `${newConsoleErrors.length} new console error(s)`, severity: "warning", errors: newConsoleErrors.map(e => ({ message: e })) });
    }
  }

  return newIssues;
}