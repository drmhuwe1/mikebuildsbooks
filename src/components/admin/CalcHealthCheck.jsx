import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Calculator, Play, Clock, CheckCircle2, AlertTriangle, Copy, ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const fmt = (n) => Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2 });
const fmtPct = (n) => (Number(n || 0) * 100).toFixed(1) + "%";

function StatusBadge({ status }) {
  if (status === "pass") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
      <CheckCircle2 className="w-3 h-3" /> PASS
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
      <AlertTriangle className="w-3 h-3" /> WARN
    </span>
  );
}

function buildWarningPrompt(check, w, runDate) {
  return `MikeBuildsBooks — Fix Request (${runDate})

Check: ${check.name}
Job: "${w.job}"
Issue: ${w.message}${w.details ? `\nData: ${w.details}` : ""}

Formulas that must be correct:
- adjusted_contract = contract_amount + change_orders_total
- direct_costs = material_costs + labor_costs + subcontractor_costs + permit_costs + equipment_costs + other_costs
- gross_profit = adjusted_contract - direct_costs - overhead_costs
  NOTE: overhead_costs is a flat dollar amount on the job, NOT a percentage
- outstanding_balance = (contract_amount + change_orders_total) - deposits_received - total_paid_by_customer

Please:
1. Find the component or function responsible for this calculation or data entry
2. Verify it uses the exact field names from the Job entity
3. Fix only this specific issue — do not change any other logic`;
}

function CopyWarningButton({ check, warning, runDate }) {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildWarningPrompt(check, warning, runDate));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-50 border border-yellow-200 text-yellow-800 hover:bg-yellow-100 transition-colors ml-5 mt-1"
    >
      {copied ? <><CheckCircle2 className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy Fix Prompt</>}
    </button>
  );
}

function CheckSection({ check, expanded, onToggle, copiedId, onCopy, runDate }) {
  const warnCount = check.warnings.length;
  const passCount = check.pass;
  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <div className="rounded-lg border bg-card overflow-hidden">
        <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/20 transition-colors text-left">
          <div className="flex items-center gap-3">
            {warnCount === 0
              ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              : <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
            }
            <div>
              <p className="text-sm font-semibold">{check.name}</p>
              <p className="text-xs text-muted-foreground">{check.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-green-600 font-bold">{passCount} pass</span>
            {warnCount > 0 && <span className="text-xs text-yellow-700 font-bold">{warnCount} warn</span>}
            {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t divide-y">
            {warnCount === 0 && (
              <p className="px-4 py-3 text-xs text-muted-foreground">All jobs passed this check.</p>
            )}
            {check.warnings.map((w, i) => (
              <div key={i} className="px-4 py-3 space-y-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                  <span className="text-sm font-medium">{w.job}</span>
                </div>
                <p className="text-xs text-yellow-800 ml-5">{w.message}</p>
                {w.details && (
                  <div className="ml-5 mt-1 text-xs text-muted-foreground font-mono bg-muted/50 rounded px-2 py-1">
                    {w.details}
                  </div>
                )}
                <CopyWarningButton check={check} warning={w} runDate={runDate} />
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function runAllChecks(jobs, changeOrders, subPayments) {
  const activeStatuses = ["in_progress", "completed", "contracted"];
  const workStatuses = ["in_progress", "completed"];

  const results = [];

  // ── CHECK 1: Adjusted contract integrity ─────────────────────────────────
  {
    const relevant = jobs.filter(j => activeStatuses.includes(j.status));
    const warnings = [];
    let pass = 0;
    relevant.forEach(j => {
      const hasCOTotal = (j.change_orders_total || 0) > 0;
      const hasLinkedCOs = (j.change_orders || []).length > 0;
      if (hasCOTotal && !hasLinkedCOs) {
        warnings.push({
          job: j.title,
          message: "change_orders_total > 0 but no ChangeOrder records are linked",
          details: `contract_amount=$${fmt(j.contract_amount)} | change_orders_total=$${fmt(j.change_orders_total)} | linked COs: 0`,
        });
      } else {
        pass++;
      }
    });
    results.push({
      name: "Check 1 — Adjusted Contract Integrity",
      description: "Verifies change_orders_total is backed by linked ChangeOrder records",
      warnings,
      pass,
    });
  }

  // ── CHECK 2: Gross profit computation ────────────────────────────────────
  {
    const relevant = jobs.filter(j => workStatuses.includes(j.status));
    const warnings = [];
    let pass = 0;
    relevant.forEach(j => {
      const adjusted = (j.contract_amount || 0) + (j.change_orders_total || 0);
      const direct = (j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0)
        + (j.permit_costs || 0) + (j.equipment_costs || 0) + (j.other_costs || 0);
      const gross = adjusted - direct - (j.overhead_costs || 0);
      const margin = adjusted > 0 ? gross / adjusted : null;

      if (adjusted <= 0) {
        warnings.push({ job: j.title, message: "No contract amount — cannot calculate gross profit", details: `contract_amount=$${fmt(j.contract_amount)}` });
      } else if (gross < 0) {
        warnings.push({ job: j.title, message: `Running at a LOSS — costs exceed contract`, details: `adjusted=$${fmt(adjusted)} | total_costs=$${fmt(direct + (j.overhead_costs || 0))} | gross=$${fmt(gross)} | margin=${margin !== null ? fmtPct(margin) : "N/A"}` });
      } else if (margin !== null && margin < 0.10) {
        warnings.push({ job: j.title, message: `Margin under 10% — flag for review`, details: `adjusted=$${fmt(adjusted)} | costs=$${fmt(direct + (j.overhead_costs || 0))} | gross=$${fmt(gross)} | margin=${fmtPct(margin)}` });
      } else {
        pass++;
      }
    });
    results.push({
      name: "Check 2 — Gross Profit Computation",
      description: "adjusted_contract - direct_costs - overhead_costs must be > 0 and ≥ 10% margin",
      warnings,
      pass,
    });
  }

  // ── CHECK 3: Cost component sanity ───────────────────────────────────────
  {
    const relevant = jobs.filter(j => workStatuses.includes(j.status));
    const warnings = [];
    let pass = 0;
    relevant.forEach(j => {
      const adjusted = (j.contract_amount || 0) + (j.change_orders_total || 0);
      const total = (j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0)
        + (j.permit_costs || 0) + (j.equipment_costs || 0) + (j.other_costs || 0) + (j.overhead_costs || 0);
      const noMain = !j.material_costs && !j.labor_costs && !j.subcontractor_costs;
      let warned = false;

      if (total === 0 && j.status === "completed") {
        warnings.push({ job: j.title, message: "Completed job with $0 in all costs — data likely not entered", details: `status=completed | total_costs=$0` });
        warned = true;
      } else if (noMain) {
        warnings.push({ job: j.title, message: "Material, labor, and subcontractor costs are all $0 — likely missing data", details: `material=$${fmt(j.material_costs)} | labor=$${fmt(j.labor_costs)} | subs=$${fmt(j.subcontractor_costs)}` });
        warned = true;
      }
      if (total > adjusted && adjusted > 0) {
        warnings.push({ job: j.title, message: "Costs exceed contract amount — guaranteed loss", details: `total_costs=$${fmt(total)} | adjusted_contract=$${fmt(adjusted)} | overage=$${fmt(total - adjusted)}` });
        warned = true;
      }
      if (!warned) pass++;
    });
    results.push({
      name: "Check 3 — Cost Component Sanity",
      description: "All cost categories must be non-zero and not exceed contract amount",
      warnings,
      pass,
    });
  }

  // ── CHECK 4: Customer payment balance ────────────────────────────────────
  {
    const relevant = jobs.filter(j => activeStatuses.includes(j.status));
    const warnings = [];
    let pass = 0;
    relevant.forEach(j => {
      const adjusted = (j.contract_amount || 0) + (j.change_orders_total || 0);
      const collected = (j.deposits_received || 0) + (j.total_paid_by_customer || 0);
      const outstanding = adjusted - collected;

      if (outstanding < 0) {
        warnings.push({ job: j.title, message: "Customer paid MORE than contract — possible double entry", details: `contract=$${fmt(adjusted)} | collected=$${fmt(collected)} | overpayment=$${fmt(Math.abs(outstanding))}` });
      } else if (j.status === "completed" && outstanding > 0) {
        warnings.push({ job: j.title, message: "Job is COMPLETED but customer still has outstanding balance", details: `contract=$${fmt(adjusted)} | collected=$${fmt(collected)} | balance_due=$${fmt(outstanding)}` });
      } else {
        pass++;
      }
    });
    results.push({
      name: "Check 4 — Customer Payment Balance",
      description: "Outstanding balance must not be negative; completed jobs must be fully paid",
      warnings,
      pass,
    });
  }

  // ── CHECK 5: Change order linkage integrity ───────────────────────────────
  {
    const relevant = jobs.filter(j => (j.change_orders_total || 0) > 0);
    const warnings = [];
    let pass = 0;
    relevant.forEach(j => {
      const linked = changeOrders.filter(co => co.job_id === j.id).length;
      const arrLen = (j.change_orders || []).length;
      if (linked === 0) {
        warnings.push({ job: j.title, message: "change_orders_total set but NO ChangeOrder records found for this job", details: `change_orders_total=$${fmt(j.change_orders_total)} | linked records: 0` });
      } else if (arrLen !== linked) {
        warnings.push({ job: j.title, message: `Array reference count (${arrLen}) doesn't match actual ChangeOrder records (${linked})`, details: `job.change_orders.length=${arrLen} | DB count=${linked}` });
      } else {
        pass++;
      }
    });
    results.push({
      name: "Check 5 — Change Order Linkage Integrity",
      description: "change_orders_total must match actual linked ChangeOrder records",
      warnings,
      pass,
    });
  }

  // ── CHECK 6: Job status routing integrity ────────────────────────────────
  {
    const warnings = [];
    let pass = 0;
    jobs.forEach(j => {
      const issues = [];
      if (j.status === "completed" && !j.actual_completion) issues.push("Marked complete but no actual_completion date");
      if (["contracted", "in_progress", "completed"].includes(j.status) && !j.contract_id) issues.push("Past bidding stage but no contract_id linked");
      if (["in_progress", "completed"].includes(j.status) && !j.start_date) issues.push("Work started/completed but no start_date");
      if (j.status === "completed" && j.is_started === false) issues.push("Completed but is_started = false");
      if (j.status === "in_progress" && j.signed_and_accepted === false) issues.push("In progress but signed_and_accepted = false");
      if (issues.length > 0) {
        issues.forEach(msg => warnings.push({ job: j.title, message: msg, details: `status=${j.status}` }));
      } else {
        pass++;
      }
    });
    results.push({
      name: "Check 6 — Job Status Routing Integrity",
      description: "Dates, contract links, and signed flags must match job status",
      warnings,
      pass,
    });
  }

  // ── CHECK 7: Deposit vs contract sanity ──────────────────────────────────
  {
    const relevant = jobs.filter(j => (j.deposits_received || 0) > 0);
    const warnings = [];
    let pass = 0;
    relevant.forEach(j => {
      const adjusted = (j.contract_amount || 0) + (j.change_orders_total || 0);
      const dep = j.deposits_received || 0;
      if (dep > adjusted) {
        warnings.push({ job: j.title, message: "Deposit received EXCEEDS entire contract amount — data entry error", details: `deposit=$${fmt(dep)} | contract=$${fmt(adjusted)}` });
      } else if (adjusted > 0 && dep > adjusted * 0.75) {
        warnings.push({ job: j.title, message: "Deposit is more than 75% of contract — unusual, flag for review", details: `deposit=$${fmt(dep)} | contract=$${fmt(adjusted)} | pct=${fmtPct(dep / adjusted)}` });
      } else {
        pass++;
      }
    });
    results.push({
      name: "Check 7 — Deposit vs Contract Sanity",
      description: "Deposits received must not exceed contract amount and should not be unusually high",
      warnings,
      pass,
    });
  }

  // ── CHECK 8: Subcontractor cost cross-reference ───────────────────────────
  {
    const relevant = jobs.filter(j => workStatuses.includes(j.status));
    const warnings = [];
    let pass = 0;
    relevant.forEach(j => {
      const jobSubPayTotal = subPayments
        .filter(p => p.job_id === j.id)
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      const jobSubCost = j.subcontractor_costs || 0;
      if (jobSubPayTotal > 0 || jobSubCost > 0) {
        const diff = Math.abs(jobSubPayTotal - jobSubCost);
        if (diff > 1.00) {
          warnings.push({ job: j.title, message: `Sub payments don't match sub costs on job (diff=$${fmt(diff)})`, details: `job.subcontractor_costs=$${fmt(jobSubCost)} | sum of payments=$${fmt(jobSubPayTotal)}` });
        } else {
          pass++;
        }
      } else {
        pass++;
      }
    });
    results.push({
      name: "Check 8 — Subcontractor Cost Cross-Reference",
      description: "SubcontractorPayment records must match job.subcontractor_costs within $1",
      warnings,
      pass,
    });
  }

  return results;
}

function buildMasterPrompt(checks, runDate) {
  const allWarnings = checks.flatMap(c => c.warnings.map(w => ({ check: c.name, ...w })));
  if (allWarnings.length === 0) return null;
  const lines = allWarnings.map(w => `- [${w.check}] Job: "${w.job}" — ${w.message}${w.details ? ` (${w.details})` : ""}`).join("\n");
  return `MikeBuildsBooks Calculation Check Results — ${runDate}

${allWarnings.length} warning(s) found across jobs.

Issues detected:
${lines}

Formulas that must be correct in all calculation code:
- adjusted_contract = contract_amount + change_orders_total
- direct_costs = material_costs + labor_costs + subcontractor_costs + permit_costs + equipment_costs + other_costs
- gross_profit = adjusted_contract - direct_costs - overhead_costs
  NOTE: overhead_costs is a flat dollar amount on the job, NOT a percentage
- outstanding_balance = (contract_amount + change_orders_total) - deposits_received - total_paid_by_customer

For each issue listed above:
1. Find the component or function that handles this calculation or data entry
2. Verify it is using the exact field names from the Job entity
3. Fix the specific issue described
4. Do not change any other logic`;
}

export default function CalcHealthCheck() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [runDate, setRunDate] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [copied, setCopied] = useState(false);
  const [overheadMode, setOverheadMode] = useState(null);
  const [overheadPct, setOverheadPct] = useState(10);

  const runChecks = async () => {
    setRunning(true);
    try {
      const [jobs, changeOrders, subPayments, settingsArr] = await Promise.all([
        base44.entities.Job.list("-created_date", 500),
        base44.entities.ChangeOrder.list("-created_date", 1000),
        base44.entities.SubcontractorPayment.list("-created_date", 1000),
        base44.entities.AppSettings.filter({ settings_key: "global" }),
      ]);
      const s = settingsArr[0] || {};
      setOverheadMode(s.overhead_mode || "direct");
      setOverheadPct(s.default_overhead_percent ?? 10);
      const checks = runAllChecks(jobs, changeOrders, subPayments);
      const date = new Date().toLocaleString();
      setResults(checks);
      setRunDate(date);
      // Auto-expand checks with warnings
      const exp = {};
      checks.forEach((c, i) => { if (c.warnings.length > 0) exp[i] = true; });
      setExpanded(exp);
    } catch (e) {
      console.error("Calc health check error:", e);
    } finally {
      setRunning(false);
    }
  };

  const copyPrompt = async () => {
    const prompt = buildMasterPrompt(results, runDate);
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalWarns = results ? results.reduce((s, c) => s + c.warnings.length, 0) : 0;
  const totalPass = results ? results.reduce((s, c) => s + c.pass, 0) : 0;
  const masterPrompt = results ? buildMasterPrompt(results, runDate) : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Financial Calculation Integrity</h2>
        </div>
        <Button onClick={runChecks} disabled={running} className="gap-2" size="sm">
          {running ? <Clock className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {running ? "Running…" : "Run Calc Checks"}
        </Button>
      </div>

      {!results && !running && (
        <p className="text-center py-8 text-muted-foreground text-sm">
          Click "Run Calc Checks" to audit all job financial calculations against the database.
        </p>
      )}

      {results && overheadMode && (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border ${overheadMode === "percentage" ? "bg-blue-50 border-blue-200 text-blue-900" : "bg-muted border-border text-foreground"}`}>
          <Calculator className="w-4 h-4 shrink-0" />
          Overhead mode: <strong>{overheadMode === "percentage" ? `Percentage of Contract (${overheadPct}%)` : "Direct Amount"}</strong>
          {overheadMode === "percentage" && <span className="text-blue-700 text-xs ml-1">— Check 2 overhead values are auto-calculated from contract amount</span>}
        </div>
      )}

      {results && (
        <>
          {/* Summary bar */}
          <div className="flex items-center justify-between p-4 rounded-xl border bg-card">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">{runDate}</span>
              <span className="text-green-600 font-semibold">{totalPass} passed</span>
              <span className={cn("font-semibold", totalWarns > 0 ? "text-yellow-700" : "text-green-600")}>
                {totalWarns} warning{totalWarns !== 1 ? "s" : ""}
              </span>
            </div>
            {masterPrompt && (
              <button
                onClick={copyPrompt}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors"
              >
                {copied ? <><CheckCircle2 className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Master Fix Prompt</>}
              </button>
            )}
          </div>

          {/* Check results */}
          <div className="space-y-3">
            {results.map((check, i) => (
              <CheckSection
                key={i}
                check={check}
                expanded={!!expanded[i]}
                onToggle={() => setExpanded(e => ({ ...e, [i]: !e[i] }))}
                runDate={runDate}
              />
            ))}
          </div>
        </>
      )}

    </div>
  );
}