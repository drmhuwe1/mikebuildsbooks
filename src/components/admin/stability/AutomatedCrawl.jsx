import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Globe, Play, Copy, CheckCircle2, XCircle, AlertTriangle,
  Clock, History
} from "lucide-react";


const CRAWL_ROUTES = [
  "/Dashboard", "/Clients", "/Jobs", "/SmartBidBuilder", "/BidBuilder",
  "/QuickBid", "/Contracts", "/ChangeOrders", "/BillsCalendarUnified",
  "/PersonalBillsCalendar", "/Subcontractors", "/PayoutEngine", "/Banking",
  "/JobTimeline", "/Documents", "/DocGenerator", "/PermitDrawingWizard",
  "/Expenses", "/YearEndFinancials", "/TaxExport", "/Settings",
  "/CustomerAccount", "/HelpGuide", "/OperationsCommandCenter",
  "/DailyAssistant", "/FinancialAlerts", "/FinancialSnapshot",
  "/BusinessFinancials", "/PersonalFinancials", "/FinancialGoals",
  "/FinancialScenarioSimulator", "/JobCalendar", "/Invoicing",
  "/BidPackageWizard", "/ContractGenerator", "/AdminPanel",
  "/Landing", "/about", "/contact", "/FAQ", "/Sitemap",
  "/privacy-policy", "/terms"
];

const STORAGE_KEY = "mike_crawl_latest";
const HISTORY_KEY = "mike_crawl_history";

async function crawlRoute(route, timeoutMs = 10000) {
  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;bottom:0;right:0;width:400px;height:300px;border:0;opacity:0.01;pointer-events:none;z-index:-1;";
    iframe.src = window.location.origin + route;

    const errors = [];
    const consoleErrors = [];
    const failedResources = [];
    let resolved = false;

    const cleanup = () => { if (iframe.parentNode) iframe.parentNode.removeChild(iframe); };
    const finish = (result) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      resolve({ route, timestamp: new Date().toISOString(), ...result, errors, consoleErrors, failedResources });
    };

    iframe.onload = () => {
      try {
        const win = iframe.contentWindow;
        const doc = iframe.contentDocument;

        if (!win || !doc) {
          finish({ status: "error", error: "Cannot access iframe (cross-origin)" });
          return;
        }

        win.addEventListener("error", (e) => {
          errors.push({ message: e.message || String(e.error || e), source: e.filename, line: e.lineno });
        });
        win.addEventListener("unhandledrejection", (e) => {
          errors.push({ message: `Unhandled rejection: ${e.reason}`, type: "unhandledrejection" });
        });

        const origError = win.console.error.bind(win.console);
        win.console.error = (...args) => {
          consoleErrors.push(args.map(a => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" "));
          origError(...args);
        };

        const perfObserver = new win.PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.responseStatus && entry.responseStatus >= 400) {
              failedResources.push({ url: entry.name, status: entry.responseStatus });
            }
          }
        });
        try { perfObserver.observe({ type: "resource", buffered: true }); } catch (_) {}

        setTimeout(() => {
          try {
            const root = doc.querySelector("#root");
            const links = doc.querySelectorAll("a[href]");
            const buttons = doc.querySelectorAll("button");
            const title = doc.title || "";
            const bodyText = (root?.innerText || "").toLowerCase();
            const is404 = bodyText.includes("404") || bodyText.includes("not found") || bodyText.includes("page not found");
            const isEmpty = !root || root.children.length === 0 || bodyText.trim().length < 10;

            finish({
              status: is404 ? "broken" : (isEmpty ? "warning" : "ok"),
              title,
              linkCount: links.length,
              buttonCount: buttons.length,
            });
          } catch (e) {
            finish({ status: "error", error: "Read error: " + e.message });
          }
        }, 3500);
      } catch (e) {
        finish({ status: "error", error: "Access error: " + e.message });
      }
    };

    iframe.onerror = () => finish({ status: "broken", error: "Failed to load" });
    document.body.appendChild(iframe);
    setTimeout(() => finish({ status: "timeout", error: "Load timeout" }), timeoutMs);
  });
}

export default function AutomatedCrawl({ onCrawlComplete }) {
  const [crawling, setCrawling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentRoute, setCurrentRoute] = useState("");
  const [results, setResults] = useState(null);
  const [history, setHistory] = useState([]);
  const [copied, setCopied] = useState(false);
  const [expandedRoute, setExpandedRoute] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  React.useEffect(() => {
    try {
      const latest = localStorage.getItem(STORAGE_KEY);
      if (latest) setResults(JSON.parse(latest));
      const hist = localStorage.getItem(HISTORY_KEY);
      if (hist) setHistory(JSON.parse(hist));
    } catch (_) {}
  }, []);

  const saveResults = useCallback((crawlResults) => {
    const summary = {
      timestamp: new Date().toISOString(),
      totalRoutes: crawlResults.length,
      ok: crawlResults.filter(r => r.status === "ok").length,
      broken: crawlResults.filter(r => r.status === "broken").length,
      warnings: crawlResults.filter(r => r.status === "warning").length,
      errors: crawlResults.filter(r => r.status === "error").length,
      timeouts: crawlResults.filter(r => r.status === "timeout").length,
      totalConsoleErrors: crawlResults.reduce((s, r) => s + (r.consoleErrors?.length || 0), 0),
      totalFailedResources: crawlResults.reduce((s, r) => s + (r.failedResources?.length || 0), 0),
      routes: crawlResults,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(summary));
    setResults(summary);

    const newHistory = [summary, ...history].slice(0, 5);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    setHistory(newHistory);

    if (onCrawlComplete) onCrawlComplete(summary);
  }, [history, onCrawlComplete]);

  const runCrawl = async () => {
    setCrawling(true);
    setProgress(0);
    const allResults = [];

    for (let i = 0; i < CRAWL_ROUTES.length; i++) {
      setCurrentRoute(CRAWL_ROUTES[i]);
      const result = await crawlRoute(CRAWL_ROUTES[i]);
      allResults.push(result);
      setProgress(Math.round(((i + 1) / CRAWL_ROUTES.length) * 100));

      // Save incrementally so refresh doesn't erase findings
      const partial = { timestamp: new Date().toISOString(), totalRoutes: allResults.length, routes: allResults, partial: true };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(partial));
      setResults(partial);
    }

    saveResults(allResults);
    setCrawling(false);
    setCurrentRoute("");
  };

  const generateCrawlPrompt = () => {
    if (!results?.routes) return null;
    const issues = results.routes.filter(r => r.status !== "ok");
    if (issues.length === 0) return null;

    let prompt = `# Master Automated Crawl Corrective Prompt\n# Crawl Date: ${results.timestamp}\n# Routes Crawled: ${results.totalRoutes}\n# Broken: ${results.broken || 0} | Warnings: ${results.warnings || 0} | Errors: ${results.errors || 0} | Timeouts: ${results.timeouts || 0}\n# Console Errors: ${results.totalConsoleErrors || 0} | Failed Resources: ${results.totalFailedResources || 0}\n\n---\n\n`;

    issues.forEach((r, i) => {
      prompt += `## Issue ${i + 1}: ${r.route} [${r.status.toUpperCase()}]\n\n`;
      prompt += `**Route:** ${r.route}\n`;
      prompt += `**Status:** ${r.status}\n`;
      if (r.error) prompt += `**Error:** ${r.error}\n`;
      if (r.title) prompt += `**Page Title:** ${r.title}\n`;
      if (r.linkCount !== undefined) prompt += `**Links:** ${r.linkCount} | **Buttons:** ${r.buttonCount}\n`;
      if (r.errors?.length) {
        prompt += `**Runtime Errors:**\n`;
        r.errors.forEach(e => { prompt += `  - ${e.message}${e.source ? ` (at ${e.source}:${e.line || "?"})` : ""}\n`; });
      }
      if (r.consoleErrors?.length) {
        prompt += `**Console Errors:**\n`;
        r.consoleErrors.forEach(e => { prompt += `  - ${e}\n`; });
      }
      if (r.failedResources?.length) {
        prompt += `**Failed Resources:**\n`;
        r.failedResources.forEach(f => { prompt += `  - ${f.url} (HTTP ${f.status})\n`; });
      }
      prompt += `\n**Likely Cause (hypothesis):** Inspect the route component, its imports, and any API calls it makes on mount.\n`;
      prompt += `**Fix Request:** Fix only the smallest scope required for this route. Inspect the component file, check for failed imports, broken API calls, or rendering errors.\n`;
      prompt += `**Testing:** After fixing, navigate to ${r.route} and verify it renders without console errors.\n\n---\n\n`;
    });

    prompt += `\n## Protection Language\n\nDo not change unrelated working features.\nDo not redesign the application.\nDo not remove existing functionality.\nDo not rename, relocate, or refactor working features unless the smallest required fix makes it unavoidable.\nFix only the smallest scope required.\nPreserve the current design system, routes, data structures, permissions, and integrations unless directly responsible for the verified failure.\nAfter fixing, retest the affected feature and nearby related features.\nRerun the Automated Crawl and report the real results.\nDo not claim the issue is fixed until the required tests pass with real data.\n`;

    return prompt;
  };

  const copyPrompt = async () => {
    const prompt = generateCrawlPrompt();
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusIcon = (status) => {
    switch (status) {
      case "ok": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "broken": return <XCircle className="w-4 h-4 text-red-500" />;
      case "warning": return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "timeout": return <Clock className="w-4 h-4 text-orange-500" />;
      default: return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold">Automated Crawl</h3>
        </div>
        <div className="flex gap-2">
          {results && !crawling && (
            <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
              <History className="w-4 h-4 mr-1.5" /> History ({history.length})
            </Button>
          )}
          <Button onClick={runCrawl} disabled={crawling} size="sm">
            {crawling ? <Clock className="w-4 h-4 animate-spin mr-1.5" /> : <Play className="w-4 h-4 mr-1.5" />}
            {crawling ? "Crawling…" : "Run Crawl"}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Walks every app route in a hidden same-origin browser frame, capturing real per-route results: broken routes,
        runtime errors, console errors, failed network calls, and link/button counts. Read-only — never clicks destructive buttons.
      </p>

      {crawling && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Crawling: {currentRoute}</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {results && !crawling && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { label: "Routes", value: results.totalRoutes, color: "text-blue-600" },
              { label: "OK", value: results.routes?.filter(r => r.status === "ok").length || 0, color: "text-green-600" },
              { label: "Broken", value: results.routes?.filter(r => r.status === "broken").length || 0, color: "text-red-600" },
              { label: "Warnings", value: results.routes?.filter(r => r.status === "warning").length || 0, color: "text-yellow-600" },
              { label: "Console Errors", value: results.totalConsoleErrors || 0, color: "text-orange-600" },
              { label: "Failed Resources", value: results.totalFailedResources || 0, color: "text-red-600" },
            ].map(s => (
              <div key={s.label} className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {showHistory && history.length > 0 && (
            <div className="border rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground mb-2">Last 5 Crawl Runs</p>
              {history.map((h, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b last:border-0">
                  <span className="text-muted-foreground">{new Date(h.timestamp).toLocaleString()}</span>
                  <span className="flex gap-3">
                    <span className="text-green-600">{h.ok || 0}✓</span>
                    <span className="text-red-600">{(h.broken || 0) + (h.errors || 0)}✗</span>
                    {h.partial && <Badge variant="outline" className="text-xs">Partial</Badge>}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase text-muted-foreground border-b bg-muted/30">
                  <th className="text-left py-2 px-3 font-medium">Route</th>
                  <th className="text-left py-2 px-3 font-medium">Status</th>
                  <th className="text-left py-2 px-3 font-medium">Title</th>
                  <th className="text-center py-2 px-3 font-medium">Links</th>
                  <th className="text-center py-2 px-3 font-medium">Buttons</th>
                  <th className="text-center py-2 px-3 font-medium">Errors</th>
                </tr>
              </thead>
              <tbody>
                {results.routes?.map((r, i) => (
                  <React.Fragment key={i}>
                    <tr className="border-b last:border-0 hover:bg-muted/20 cursor-pointer" onClick={() => setExpandedRoute(expandedRoute === i ? null : i)}>
                      <td className="py-2 px-3 font-mono text-xs">{r.route}</td>
                      <td className="py-2 px-3">{statusIcon(r.status)}</td>
                      <td className="py-2 px-3 text-xs text-muted-foreground truncate max-w-[200px]">{r.title || "—"}</td>
                      <td className="py-2 px-3 text-center text-xs">{r.linkCount ?? "—"}</td>
                      <td className="py-2 px-3 text-center text-xs">{r.buttonCount ?? "—"}</td>
                      <td className="py-2 px-3 text-center text-xs">
                        {(r.errors?.length || 0) + (r.consoleErrors?.length || 0) > 0 ? (
                          <span className="text-red-600 font-medium">{(r.errors?.length || 0) + (r.consoleErrors?.length || 0)}</span>
                        ) : "—"}
                      </td>
                    </tr>
                    {expandedRoute === i && (
                      <tr className="bg-muted/10">
                        <td colSpan={6} className="px-6 py-3">
                          {r.error && <p className="text-xs text-red-600 mb-2">⚠ {r.error}</p>}
                          {r.errors?.length > 0 && (
                            <div className="mb-2">
                              <p className="text-xs font-medium text-red-600 mb-1">Runtime Errors:</p>
                              {r.errors.map((e, j) => <p key={j} className="text-xs text-muted-foreground ml-4">• {e.message}</p>)}
                            </div>
                          )}
                          {r.consoleErrors?.length > 0 && (
                            <div className="mb-2">
                              <p className="text-xs font-medium text-orange-600 mb-1">Console Errors:</p>
                              {r.consoleErrors.map((e, j) => <p key={j} className="text-xs text-muted-foreground ml-4 break-all">• {e}</p>)}
                            </div>
                          )}
                          {r.failedResources?.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-red-600 mb-1">Failed Resources:</p>
                              {r.failedResources.map((f, j) => <p key={j} className="text-xs text-muted-foreground ml-4">• {f.url} (HTTP {f.status})</p>)}
                            </div>
                          )}
                          {!r.error && (!r.errors?.length && !r.consoleErrors?.length && !r.failedResources?.length) && (
                            <p className="text-xs text-green-600">No issues detected.</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {results.routes?.some(r => r.status !== "ok") && (
            <Button onClick={copyPrompt} variant="outline" size="sm">
              {copied ? <CheckCircle2 className="w-4 h-4 mr-1.5 text-green-500" /> : <Copy className="w-4 h-4 mr-1.5" />}
              {copied ? "Copied!" : "Copy Master Crawl Corrective Prompt"}
            </Button>
          )}
        </>
      )}
    </div>
  );
}