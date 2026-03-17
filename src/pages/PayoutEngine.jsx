import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/shared/PageHeader";
import GuidedPrompt from "@/components/shared/GuidedPrompt";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { Link } from "react-router-dom";

export default function PayoutEngine() {
  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date", 200) });
  const { data: settings = [] } = useQuery({ queryKey: ["settings"], queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }) });

  const s = settings[0] || {};
  const basis = s.payout_basis || "net_profit";

  const activeJobs = jobs.filter(j => ["in_progress", "contracted", "completed"].includes(j.status));

  // Manager pay is always 10% of gross profit (after overhead, before owner/workers)
  const MANAGER_PAY_PCT = 10;

  // Remaining buckets apply to net profit AFTER manager pay is taken out
  const buckets = {
    tax_reserve: { label: "Tax Reserve", pct: s.tax_reserve_percent || 25, total: 0 },
    subcontractor_reserve: { label: "Subcontractor Reserve", pct: s.subcontractor_reserve_percent || 10, total: 0 },
    operating_reserve: { label: "Operating Reserve", pct: s.operating_reserve_percent || 10, total: 0 },
    owner_payout: { label: "Owner Payout", pct: s.owner_payout_percent || 30, total: 0 },
    retained_earnings: { label: "Retained Earnings", pct: s.retained_earnings_percent || 10, total: 0 },
  };

  const jobBreakdowns = activeJobs.map(j => {
    const revenue = (j.contract_amount || 0) + (j.change_orders_total || 0);
    const directCosts = (j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0) + (j.permit_costs || 0) + (j.equipment_costs || 0);
    const overhead = j.overhead_costs || 0;
    // Gross profit = revenue minus direct costs and overhead (but before manager pay & owner distributions)
    const grossProfit = revenue - directCosts - overhead - (j.other_costs || 0);
    // Manager (business manager) gets 10% of gross profit — first distribution
    const managerPay = Math.max(0, grossProfit * (MANAGER_PAY_PCT / 100));
    // Net profit after manager pay — used for remaining bucket distributions
    const netAfterManager = grossProfit - managerPay;
    const cashCollected = j.deposits_received || 0;

    let basisAmount = netAfterManager;
    if (basis === "gross_profit") basisAmount = netAfterManager;
    else if (basis === "cash_collected") basisAmount = cashCollected;

    const allocations = {};
    Object.keys(buckets).forEach(k => {
      const amt = Math.max(0, basisAmount * (buckets[k].pct / 100));
      allocations[k] = amt;
      buckets[k].total += amt;
    });

    return { job: j, revenue, directCosts, overhead, grossProfit, managerPay, netAfterManager, cashCollected, basisAmount, allocations };
  });

  const totalBasis = jobBreakdowns.reduce((sum, jb) => sum + jb.basisAmount, 0);

  return (
    <div>
      <PageHeader title="Payout & Reserve Engine" description="Automatic reserve allocation and payout recommendations">
        <Link to="/Settings">
          <Badge variant="outline" className="text-xs cursor-pointer hover:bg-muted">
            <Info className="w-3 h-3 mr-1" /> Edit Rules in Settings
          </Badge>
        </Link>
      </PageHeader>

      <GuidedPrompt message={`Allocations based on ${basis.replace(/_/g, " ")}. Change this in Settings.`} variant="info" />

      {/* Summary buckets */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
        {Object.values(buckets).map(b => (
          <Card key={b.label} className="p-4 text-center">
            <p className="text-xs text-muted-foreground">{b.label}</p>
            <p className="text-lg font-bold mt-1">{formatCurrency(b.total)}</p>
            <p className="text-xs text-muted-foreground">{b.pct}%</p>
          </Card>
        ))}
      </div>

      {/* Per-job breakdown */}
      <h3 className="text-sm font-semibold mt-8 mb-3">Per-Job Breakdown</h3>
      {jobBreakdowns.length === 0 ? (
        <p className="text-sm text-muted-foreground">No active or completed jobs to calculate.</p>
      ) : (
        <div className="space-y-4">
          {jobBreakdowns.map(({ job, revenue, directCosts, overhead, grossProfit, netProfit, cashCollected, basisAmount, allocations }) => (
            <Card key={job.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold">{job.title}</p>
                  <p className="text-xs text-muted-foreground">{job.client_name || "—"}</p>
                </div>
                <Badge variant="outline" className="text-xs">{job.status?.replace(/_/g, " ")}</Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
                <div><span className="text-muted-foreground">Revenue</span><br /><strong>{formatCurrency(revenue)}</strong></div>
                <div><span className="text-muted-foreground">Direct Costs</span><br /><strong>{formatCurrency(directCosts)}</strong></div>
                <div><span className="text-muted-foreground">Gross Profit</span><br /><strong className={grossProfit >= 0 ? "text-green-600" : "text-red-600"}>{formatCurrency(grossProfit)}</strong></div>
                <div><span className="text-muted-foreground">Net Profit</span><br /><strong className={netProfit >= 0 ? "text-green-600" : "text-red-600"}>{formatCurrency(netProfit)}</strong></div>
              </div>
              <div className="border-t pt-3">
                <p className="text-xs text-muted-foreground mb-2">Allocations ({basis.replace(/_/g, " ")}: {formatCurrency(basisAmount)})</p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
                  {Object.entries(allocations).map(([k, v]) => (
                    <div key={k} className="text-center p-2 bg-muted rounded">
                      <p className="text-muted-foreground truncate">{buckets[k].label}</p>
                      <p className="font-semibold">{formatCurrency(v)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}