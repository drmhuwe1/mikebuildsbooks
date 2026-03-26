import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Activity, Play, ChevronDown, ChevronRight, Copy, CheckCircle2,
  XCircle, Clock, Wrench,
} from "lucide-react";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function PlatformStability() {
  const [running, setRunning] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [expandedRun, setExpandedRun] = useState(null);

  const { data: runs = [], refetch } = useQuery({
    queryKey: ["self-test-results"],
    queryFn: async () => {
      const results = await base44.entities.SelfTestResults.list("-created_date", 5);
      return results || [];
    },
  });

  const runTest = async () => {
    setRunning(true);
    try {
      await base44.functions.invoke("runSelfTest", { triggered_by: "manual" });
      setTimeout(() => refetch(), 1000);
    } catch (e) {
      console.error("Self-test error:", e);
    } finally {
      setRunning(false);
    }
  };

  const copyToClipboard = async (text, checkId) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(checkId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const buildMasterPrompt = (run) => {
    const checks = Array.isArray(run.checks) ? run.checks : [];
    const failed = checks.filter((c) => c.status === "fail" && c.fix_prompt);
    if (failed.length === 0) return null;

    const header = `# Master Fix Prompt\n# Self-Test Run: ${fmtTime(run.created_date)}\n# Status: ${run.status} | ${run.failed_checks} failed / ${run.total_checks} total\n# Duration: ${run.duration_ms}ms\n\n---\n`;
    const sections = failed.map((c, i) =>
      `## Fix ${i + 1}: ${c.name} [${c.category}]\n\n**Error:** ${c.message}\n\n**Fix Prompt:**\n${c.fix_prompt}\n\n---`
    );
    return header + sections.join("\n\n");
  };

  const fmtTime = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Platform Stability</h2>
        </div>
        <Button onClick={runTest} disabled={running} className="gap-2" size="sm">
          {running ? (
            <Clock className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {running ? "Running…" : "Run Self-Test Now"}
        </Button>
      </div>

      {runs.length === 0 && (
        <p className="text-center py-8 text-muted-foreground">No test runs yet. Hit the button above!</p>
      )}

      {runs.map((run) => {
        const isExpanded = expandedRun === run.id;
        const checks = Array.isArray(run.checks) ? run.checks : [];

        return (
          <Collapsible key={run.id} open={isExpanded} onOpenChange={() => setExpandedRun(isExpanded ? null : run.id)}>
            <div className="rounded-xl border bg-card overflow-hidden">
              <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                <div className="flex items-center gap-3">
                  {run.status === "healthy" ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive" />
                  )}
                  <div className="text-left">
                    <p className="font-medium text-sm text-foreground">
                      {run.status === "healthy" ? "All Checks Passed" : `${run.failed_checks} Check(s) Failed`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {fmtTime(run.created_date)} · {run.total_checks} checks · {run.duration_ms}ms · via {run.triggered_by}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {run.failed_checks > 0 && buildMasterPrompt(run) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(buildMasterPrompt(run), `master-${run.id}`);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                      title="Copy all fix prompts as one master prompt"
                    >
                      {copiedId === `master-${run.id}` ? (
                        <><CheckCircle2 className="w-3.5 h-3.5" /> Copied!</>
                      ) : (
                        <><Copy className="w-3.5 h-3.5" /> Master Fix Prompt</>
                      )}
                    </button>
                  )}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-green-500 font-bold">{run.passed_checks}✓</span>
                    {run.failed_checks > 0 && (
                      <span className="text-destructive font-bold">{run.failed_checks}✗</span>
                    )}
                  </div>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="border-t divide-y">
                  {checks.map((check, i) => {
                    const checkKey = `${run.id}-${i}`;
                    return (
                      <div key={checkKey} className="px-4 py-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {check.status === "pass" ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-destructive" />
                            )}
                            <span className="text-sm font-medium text-foreground">{check.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">
                              {check.category}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">{check.duration_ms}ms</span>
                        </div>
                        <p className={cn("text-xs ml-5.5", check.status === "pass" ? "text-muted-foreground" : "text-destructive")}>
                          {check.message}
                        </p>

                        {check.fix_prompt && (
                          <Collapsible>
                            <CollapsibleTrigger className="flex items-center gap-1.5 ml-5.5 text-xs font-medium text-primary hover:underline">
                              <Wrench className="w-3 h-3" />
                              🔧 View Fix Prompt
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="mt-2 ml-5.5 relative">
                                <pre className="text-xs p-3 rounded-lg bg-secondary/50 border text-foreground whitespace-pre-wrap overflow-x-auto max-h-64 overflow-y-auto">
                                  {check.fix_prompt}
                                </pre>
                                <button
                                  onClick={() => copyToClipboard(check.fix_prompt, checkKey)}
                                  className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 border hover:bg-secondary transition-colors"
                                  title="Copy to clipboard"
                                >
                                  {copiedId === checkKey ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                                  )}
                                </button>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
}