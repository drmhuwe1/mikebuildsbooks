import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/shared/PageHeader";
import GuidedPrompt from "@/components/shared/GuidedPrompt";
import { formatCurrency, formatPercent, formatDate } from "@/lib/formatters";
import { Link } from "react-router-dom";

export default function PayoutEngine() {
  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date", 200) });
  const { data: settings = [] } = useQuery({ queryKey: ["settings"], queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }) });
  const { data: subPayments = [] } = useQuery({ queryKey: ["subPayments"], queryFn: () => base44.entities.SubcontractorPayment.list("-created_date", 500) });

  const s = settings[0] || {};
  const MANAGER_PAY_PCT = s.manager_pay_percent ?? 10;
  const TAX_RESERVE_PCT = s.tax_reserve_percent || 25;
  const OPERATING_RESERVE_PCT = s.operating_reserve_percent || 5;
  const OWNER_PAYOUT_PCT = s.owner_payout_percent || 30;

  const activeJobs = jobs.filter(j => ["in_progress", "contracted", "completed"].includes(j.status));

  // Calculate gross profit from all payments collected (total paid by customer)
  const totalGrossProfit = activeJobs.reduce((sum, j) => sum + (j.total_paid_by_customer || 0), 0);

  // Manager pay from gross profit
  const totalManagerPay = totalGrossProfit * (MANAGER_PAY_PCT / 100);

  // Net after manager pay
  const netAfterManager = totalGrossProfit - totalManagerPay;

  // Calculate distributions from net after manager
  const distributions = {
    tax_reserve: netAfterManager * (TAX_RESERVE_PCT / 100),
    operating_reserve: netAfterManager * (OPERATING_RESERVE_PCT / 100),
    owner_payout: netAfterManager * (OWNER_PAYOUT_PCT / 100),
  };

  // Get actual subcontractor payouts for active jobs
  const activeJobIds = new Set(activeJobs.map(j => j.id));
  const jobSubPayments = subPayments.filter(sp => activeJobIds.has(sp.job_id));
  const totalSubPayouts = jobSubPayments.reduce((sum, sp) => sum + (sp.amount || 0), 0);

  // Per-job breakdown with subcontractor payouts
  const jobBreakdowns = activeJobs.map(j => {
    const jobSubs = jobSubPayments.filter(sp => sp.job_id === j.id);
    const subCostsForJob = jobSubs.reduce((sum, sp) => sum + (sp.amount || 0), 0);
    const cashCollected = j.total_paid_by_customer || 0;

    return {
      job: j,
      cashCollected,
      managerPayForJob: cashCollected * (MANAGER_PAY_PCT / 100),
      netAfterMgrForJob: cashCollected - (cashCollected * (MANAGER_PAY_PCT / 100)),
      subPayments: jobSubs,
      totalSubPayouts: subCostsForJob,
    };
  });

  return (
    <div>
      <PageHeader title="Payout & Reserve Engine" description="Automatic reserve allocation and payout recommendations">
        <Link to="/Settings">
          <Badge variant="outline" className="text-xs cursor-pointer hover:bg-muted">
            <Info className="w-3 h-3 mr-1" /> Edit Rules in Settings
          </Badge>
        </Link>
      </PageHeader>

      <GuidedPrompt message={`Distribution order: Tax Reserve (${TAX_RESERVE_PCT}%) → Operating Reserve (${OPERATING_RESERVE_PCT}%) → Owner Payout (${OWNER_PAYOUT_PCT}%) | Manager pay (${MANAGER_PAY_PCT}% of deposits) paid separately | Subcontractor payouts calculated from actual hourly earnings.`} variant="info" />

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        <Card className="p-4 border-green-200 bg-green-50">
          <p className="text-sm font-semibold text-green-700">Total Collected (Gross Profit)</p>
          <p className="text-xs text-green-600 mb-2">All payments from active jobs</p>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(totalGrossProfit)}</p>
        </Card>

        <Card className="p-4 border-primary/30 bg-primary/5">
          <p className="text-sm font-semibold text-primary">Business Manager Pay</p>
          <p className="text-xs text-muted-foreground mb-2">{MANAGER_PAY_PCT}% of deposits</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(totalManagerPay)}</p>
        </Card>

        <Card className="p-4 border-orange-200 bg-orange-50">
          <p className="text-sm font-semibold text-orange-700">Subcontractor Payouts</p>
          <p className="text-xs text-orange-600 mb-2">Actual hourly payments</p>
          <p className="text-2xl font-bold text-orange-700">{formatCurrency(totalSubPayouts)}</p>
        </Card>
      </div>

      {/* Net available for distributions */}
      <Card className="p-4 mt-4 border-blue-200 bg-blue-50">
        <p className="text-sm font-semibold text-blue-900">Net Available (After Manager Pay & Sub Payouts)</p>
        <p className="text-2xl font-bold text-blue-700 mt-2">{formatCurrency(netAfterManager - totalSubPayouts)}</p>
        <p className="text-xs text-blue-600 mt-1">Distributed to Tax Reserve, Operating Reserve, and Owner Payout</p>
      </Card>

      {/* Distribution buckets */}
      <h3 className="text-sm font-semibold mt-6 mb-3">Distributions</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground mb-2">Tax Reserve</p>
          <p className="text-xl font-bold">{formatCurrency(distributions.tax_reserve)}</p>
          <p className="text-xs text-muted-foreground mt-1">{TAX_RESERVE_PCT}%</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground mb-2">Operating Reserve</p>
          <p className="text-xl font-bold">{formatCurrency(distributions.operating_reserve)}</p>
          <p className="text-xs text-muted-foreground mt-1">{OPERATING_RESERVE_PCT}%</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground mb-2">Owner Payout</p>
          <p className="text-xl font-bold">{formatCurrency(distributions.owner_payout)}</p>
          <p className="text-xs text-muted-foreground mt-1">{OWNER_PAYOUT_PCT}%</p>
        </Card>
        <Card className="p-4 text-center border-orange-200 bg-orange-50">
          <p className="text-xs text-orange-700 font-semibold mb-2">Sub Payouts</p>
          <p className="text-xl font-bold text-orange-700">{formatCurrency(totalSubPayouts)}</p>
          <p className="text-xs text-orange-600 mt-1">Actual Hourly</p>
        </Card>
      </div>

      {/* Per-job breakdown */}
      <h3 className="text-sm font-semibold mt-8 mb-3">Per-Job Breakdown</h3>
      {jobBreakdowns.length === 0 ? (
        <p className="text-sm text-muted-foreground">No active or completed jobs.</p>
      ) : (
        <div className="space-y-6">
          {jobBreakdowns.map(({ job, cashCollected, managerPayForJob, subPayments: subs, totalSubPayouts: jobSubTotal }) => (
            <Card key={job.id} className="p-4">
              {/* Job header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b">
                <div>
                  <p className="text-sm font-semibold">{job.title}</p>
                  <p className="text-xs text-muted-foreground">{job.client_name || "—"}</p>
                </div>
                <Badge variant="outline" className="text-xs">{job.status?.replace(/_/g, " ")}</Badge>
              </div>

              {/* Job financials */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
                <div>
                  <span className="text-muted-foreground">Paid by Customer</span>
                  <br />
                  <strong className="text-green-600">{formatCurrency(cashCollected)}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Manager Pay</span>
                  <br />
                  <strong className="text-primary">{formatCurrency(managerPayForJob)}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Sub Payouts</span>
                  <br />
                  <strong className="text-orange-600">{formatCurrency(jobSubTotal)}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Remaining</span>
                  <br />
                  <strong className="text-blue-600">{formatCurrency(Math.max(0, cashCollected - managerPayForJob - jobSubTotal))}</strong>
                </div>
              </div>

              {/* Subcontractor payouts for this job */}
              {subs.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Subcontractor Payouts</p>
                  <div className="space-y-2">
                    {subs.map((sp) => (
                      <div key={sp.id} className="flex justify-between items-center p-2 bg-muted/50 rounded text-xs">
                        <div>
                          <p className="font-medium">{sp.subcontractor_name}</p>
                          <p className="text-muted-foreground">{sp.calculation_notes || "Hourly payment"}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(sp.amount)}</p>
                          <p className="text-muted-foreground">{sp.payment_date ? formatDate(sp.payment_date) : "Pending"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}