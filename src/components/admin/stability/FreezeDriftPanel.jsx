import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Snowflake, Unlock, Copy, CheckCircle2, XCircle, AlertTriangle, Shield
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";

const FREEZE_KEY = "mike_frozen_baseline";
const CRAWL_KEY = "mike_crawl_latest";

const FREEZE_RESTORE_LANGUAGE = `Treat the frozen baseline as the known-good application state.
Find what changed after the freeze and caused the new drift.
Revert or repair only the smallest change responsible for the drift.
Do not refactor, redesign, rename, relocate, or remove working features.
Do not change unrelated working features.
After repairing, rerun the affected tests and the complete baseline comparison.
Report exactly what changed, what was repaired, and the final test results.`;

export default function FreezeDriftPanel({ crawlResults }) {
  const [frozen, setFrozen] = useState(null);
  const [current, setCurrent] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showUnfreeze, setShowUnfreeze] = useState(false);
  const [drift, setDrift] = useState(null);

  useEffect(() => {
    try {
      const f = localStorage.getItem(FREEZE_KEY);
      if (f) setFrozen(JSON.parse(f));
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (crawlResults) {
      setCurrent(crawlResults);
    } else {
      try {
        const c = localStorage.getItem(CRAWL_KEY);
        if (c) setCurrent(JSON.parse(c));
      } catch (_) {}
    }
  }, [crawlResults]);

  const computeDrift = useCallback(() => {
    if (!frozen || !current) return null;
    const frozenRoutes = new Map((frozen.routes || []).map(r => [r.route, r]));
    const currentRoutes = new Map((current.routes || []).map(r => [r.route, r]));
    const newIssues = [];

    for (const [route, curr] of currentRoutes) {
      const base = frozenRoutes.get(route);
      if (!base) {
        newIssues.push({ route, type: "new_route", detail: "Route exists in current but not in frozen baseline", severity: "warning" });
        continue;
      }
      if (base.status === "ok" && curr.status !== "ok") {
        newIssues.push({ route, type: "status_regression", detail: `Was ${base.status}, now ${curr.status}`, severity: "critical",
          currentErrors: curr.errors, currentConsoleErrors: curr.consoleErrors, currentFailedResources: curr.failedResources, currentError: curr.error });
      }
      const newConsoleErrors = (curr.consoleErrors || []).filter(ce => !(base.consoleErrors || []).some(be => be === ce));
      if (newConsoleErrors.length > 0) {
        newIssues.push({ route, type: "new_console_error", detail: `${newConsoleErrors.length} new console error(s)`, severity: "warning", errors: newConsoleErrors });
      }
      const newRuntimeErrors = (curr.errors || []).filter(e => !(base.errors || []).some(be => be.message === e.message));
      if (newRuntimeErrors.length > 0) {
        newIssues.push({ route, type: "new_runtime_error", detail: `${newRuntimeErrors.length} new runtime error(s)`, severity: "critical", errors: newRuntimeErrors });
      }
      const newFailedResources = (curr.failedResources || []).filter(fr => !(base.failedResources || []).some(br => br.url === fr.url));
      if (newFailedResources.length > 0) {
        newIssues.push({ route, type: "new_failed_resource", detail: `${newFailedResources.length} new failed resource(s)`, severity: "warning", resources: newFailedResources });
      }
    }

    for (const [route] of frozenRoutes) {
      if (!currentRoutes.has(route)) {
        newIssues.push({ route, type: "missing_route", detail: "Route existed in frozen baseline but missing in current", severity: "critical" });
      }
    }

    return newIssues;
  }, [frozen, current]);

  useEffect(() => {
    setDrift(computeDrift());
  }, [computeDrift]);

  const freeze = () => {
    if (!current) return;
    const baseline = {
      ...current,
      frozen_at: new Date().toISOString(),
      app_version: document.title || "unknown",
    };
    localStorage.setItem(FREEZE_KEY, JSON.stringify(baseline));
    setFrozen(baseline);
    setDrift(computeDrift());
  };

  const unfreeze = () => {
    localStorage.removeItem(FREEZE_KEY);
    setFrozen(null);
    setDrift(null);
    setShowUnfreeze(false);
  };

  const generateFreezeRestorePrompt = () => {
    if (!frozen || !drift || drift.length === 0) return null;

    let prompt = `# Freeze Restore Prompt\n\n`;
    prompt += `**Freeze Date:** ${frozen.frozen_at || frozen.timestamp}\n`;
    prompt += `**Frozen Baseline:** ${frozen.totalRoutes || frozen.routes?.length || 0} routes, ${(frozen.routes || []).filter(r => r.status === "ok").length} OK, ${(frozen.routes || []).filter(r => r.status !== "ok").length} issues\n`;
    prompt += `**Current Run Date:** ${current?.timestamp || "N/A"}\n`;
    prompt += `**Current State:** ${current?.totalRoutes || current?.routes?.length || 0} routes, ${(current?.routes || []).filter(r => r.status === "ok").length} OK, ${(current?.routes || []).filter(r => r.status !== "ok").length} issues\n\n`;
    prompt += `## Newly Detected Drift (${drift.length} items)\n\n`;

    drift.forEach((d, i) => {
      prompt += `### Drift ${i + 1}: ${d.route} [${d.type}]\n`;
      prompt += `**Route:** ${d.route}\n`;
      prompt += `**Issue Type:** ${d.type}\n`;
      prompt += `**Severity:** ${d.severity}\n`;
      prompt += `**Detail:** ${d.detail}\n`;
      if (d.currentError) prompt += `**Current Error:** ${d.currentError}\n`;
      if (d.errors?.length) {
        prompt += `**Errors:**\n`;
        d.errors.forEach(e => { prompt += `  - ${e.message || JSON.stringify(e)}\n`; });
      }
      if (d.resources?.length) {
        prompt += `**Failed Resources:**\n`;
        d.resources.forEach(r => { prompt += `  - ${r.url} (HTTP ${r.status})\n`; });
      }
      prompt += `\n`;
    });

    prompt += `## What Passed in Frozen Baseline But Fails Now\n\n`;
    drift.filter(d => d.type === "status_regression").forEach(d => {
      prompt += `- ${d.route}: ${d.detail}\n`;
    });

    prompt += `\n## Restore Instructions\n\n${FREEZE_RESTORE_LANGUAGE}\n`;
    return prompt;
  };

  const copyRestorePrompt = async () => {
    const prompt = generateFreezeRestorePrompt();
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isIntact = frozen && drift && drift.length === 0;
  const isDrift = frozen && drift && drift.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Snowflake className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold">Freeze / Drift Protection</h3>
        </div>
        <div className="flex gap-2">
          {frozen && (
            <Button variant="outline" size="sm" onClick={() => setShowUnfreeze(true)} className="text-orange-600">
              <Unlock className="w-4 h-4 mr-1.5" /> Unfreeze
            </Button>
          )}
          {!frozen && current && (
            <Button size="sm" onClick={freeze} disabled={!current?.routes?.some(r => r.status === "ok")}>
              <Snowflake className="w-4 h-4 mr-1.5" /> Freeze App State
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Freezes a clean crawl as the known-good baseline. Every later Stability scan, Crawl, or Regression run
        compares against it. Shows DRIFT (red) when new issues appear, INTACT (green) when clean.
      </p>

      {!frozen && !current && (
        <div className="text-center py-8 border rounded-lg bg-muted/20">
          <Shield className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Run an Automated Crawl first, then freeze a clean run as the baseline.</p>
        </div>
      )}

      {!frozen && current && (
        <div className="text-center py-6 border rounded-lg bg-yellow-50 border-yellow-200">
          <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-sm text-yellow-800">A crawl is available but not yet frozen. Freeze it to establish a known-good baseline.</p>
        </div>
      )}

      {frozen && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="secondary" className="text-xs">Frozen: {new Date(frozen.frozen_at || frozen.timestamp).toLocaleString()}</Badge>
            <Badge variant="outline" className="text-xs">{frozen.totalRoutes || frozen.routes?.length || 0} routes</Badge>
          </div>

          {isIntact && (
            <div className="border-2 border-green-500 bg-green-50 rounded-xl p-6 text-center">
              <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
              <p className="text-lg font-bold text-green-700">INTACT</p>
              <p className="text-sm text-green-600">No new issues detected compared to the frozen baseline.</p>
            </div>
          )}

          {isDrift && (
            <div className="border-2 border-red-500 bg-red-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <XCircle className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-lg font-bold text-red-700">DRIFT DETECTED</p>
                  <p className="text-sm text-red-600">{drift.length} new issue(s) compared to frozen baseline.</p>
                </div>
              </div>

              <div className="space-y-2">
                {drift.map((d, i) => (
                  <div key={i} className="bg-white/60 rounded-lg p-3 border border-red-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-medium">{d.route}</span>
                      <Badge variant={d.severity === "critical" ? "destructive" : "secondary"} className="text-xs">
                        {d.type.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{d.detail}</p>
                    {d.errors?.map((e, j) => <p key={j} className="text-xs text-red-600 ml-4 mt-1">• {e.message || JSON.stringify(e)}</p>)}
                    {d.resources?.map((r, j) => <p key={j} className="text-xs text-red-600 ml-4 mt-1">• {r.url} (HTTP {r.status})</p>)}
                  </div>
                ))}
              </div>

              <Button onClick={copyRestorePrompt} variant="destructive" size="sm" className="w-full">
                {copied ? <CheckCircle2 className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
                {copied ? "Copied!" : "Copy Freeze Restore Prompt"}
              </Button>
            </div>
          )}

          {drift === null && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              Run a new crawl to compare against the frozen baseline.
            </div>
          )}
        </div>
      )}

      <AlertDialog open={showUnfreeze} onOpenChange={setShowUnfreeze}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unfreeze Baseline?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the known-good frozen baseline. Historical crawl runs are preserved. You can freeze a new baseline at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={unfreeze} className="bg-orange-600 hover:bg-orange-700 text-white">Unfreeze</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}