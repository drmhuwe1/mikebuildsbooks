import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/shared/PageHeader";
import GuidedPrompt from "@/components/shared/GuidedPrompt";
import { formatCurrency, formatPercent, formatDate } from "@/lib/formatters";
import { Link } from "react-router-dom";

export default function PayoutEngine() {
  const [corrections, setCorrections] = useState({});

  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date", 200) });
  const { data: settings = [] } = useQuery({ queryKey: ["settings"], queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }) });
  const { data: subPayments = [] } = useQuery({ queryKey: ["subPayments"], queryFn: () => base44.entities.SubcontractorPayment.list("-created_date", 500) });
  const { data: bids = [] } = useQuery({ queryKey: ["bids"], queryFn: () => base44.entities.Bid.list("-created_date", 200) });
  const { data: contracts = [] } = useQuery({ queryKey: ["contracts"], queryFn: () => base44.entities.Contract.list("-created_date", 200) });
  const { data: subcontractors = [] } = useQuery({ queryKey: ["subcontractors"], queryFn: () => base44.entities.Subcontractor.list("-created_date", 200) });

  const s = settings[0] || {};
  const MANAGER_PAY_PCT = s.manager_pay_percent ?? 10;
  const TAX_RESERVE_PCT = s.tax_reserve_percent || 25;
  const OPERATING_RESERVE_PCT = s.operating_reserve_percent || 5;
  const MANAGER_PAY_BASIS = s.manager_pay_basis || "gross_before_subs";

  const activeJobs = jobs.filter(j => ["in_progress", "contracted", "completed"].includes(j.status));
  const activeJobIds = new Set(activeJobs.map(j => j.id));

  // Calculate total collected: sum of all active contract payments (active status, not completed/cancelled)
  const totalCollected = contracts
    .filter(c => c.status === "active" || c.status === "signed" || c.status === "draft" || c.status === "sent")
    .reduce((sum, c) => sum + (c.client_paid_amount || 0), 0);
  
  const totalExpenses = activeJobs.reduce((sum, j) => {
    const jobExpenses = (j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0) + (j.permit_costs || 0) + (j.equipment_costs || 0) + (j.overhead_costs || 0) + (j.other_costs || 0);
    return sum + jobExpenses;
  }, 0);
  const totalGrossProfit = Math.max(0, totalCollected - totalExpenses);

  // Manager pay: before or after sub payouts depending on setting
  const totalManagerPay = MANAGER_PAY_BASIS === "gross_before_subs"
    ? totalGrossProfit * (MANAGER_PAY_PCT / 100)
    : Math.max(0, totalGrossProfit - totalSubPayoutsOwed) * (MANAGER_PAY_PCT / 100);

  // Net after manager pay
  const netAfterManager = totalGrossProfit - totalManagerPay;

  // Get actual subcontractor payouts for active jobs
  const jobSubPayments = subPayments.filter(sp => activeJobIds.has(sp.job_id));
  const totalSubPayoutsOwed = jobSubPayments.reduce((sum, sp) => sum + (sp.amount || 0), 0);

  // Calculate distributions: all reserves % of gross profit
  const taxReserve = totalGrossProfit * (TAX_RESERVE_PCT / 100);
  const operatingReserve = totalGrossProfit * (OPERATING_RESERVE_PCT / 100);
  const ownerPayout = Math.max(0, totalGrossProfit - totalManagerPay - taxReserve - operatingReserve - totalSubPayoutsOwed);

  const distributions = {
    tax_reserve: taxReserve,
    operating_reserve: operatingReserve,
    owner_payout: ownerPayout,
  };

  // Track paid vs pending subcontractor payouts
  const subPayoutsPaid = jobSubPayments.filter(sp => sp.status === "paid").reduce((sum, sp) => sum + (sp.amount || 0), 0);
  const subPayoutsPending = jobSubPayments.filter(sp => sp.status === "pending").reduce((sum, sp) => sum + (sp.amount || 0), 0);

  // What's still available (already distributed amounts subtracted)
  const totalAlreadyPaidOut = subPayoutsPaid + totalManagerPay;
  const netAvailableForDistribution = Math.max(0, totalGrossProfit - totalAlreadyPaidOut - subPayoutsPending);

  // Per-job breakdown with subcontractor payouts
  const jobBreakdowns = activeJobs.map(j => {
    const jobSubs = jobSubPayments.filter(sp => sp.job_id === j.id);
    const subPaid = jobSubs.filter(sp => sp.status === "paid").reduce((sum, sp) => sum + (sp.amount || 0), 0);
    const subPending = jobSubs.filter(sp => sp.status === "pending").reduce((sum, sp) => sum + (sp.amount || 0), 0);
    const subTotal = jobSubs.reduce((sum, sp) => sum + (sp.amount || 0), 0);
    const linkedContract = contracts.find(c => c.job_id === j.id);
    const cashCollected = linkedContract?.client_paid_amount || j.total_paid_by_customer || 0;

    return {
      job: j,
      cashCollected,
      managerPayForJob: cashCollected * (MANAGER_PAY_PCT / 100),
      netAfterMgrForJob: cashCollected - (cashCollected * (MANAGER_PAY_PCT / 100)),
      subPayments: jobSubs,
      subPayoutsPaid: subPaid,
      subPayoutsPending: subPending,
      totalSubPayouts: subTotal,
    };
  });

  // Check if there are pending payouts
  const hasPendingPayouts = subPayoutsPending > 0;

  return (
    <div>
      <PageHeader title="Payout & Reserve Engine" description="Automatic reserve allocation and payout recommendations">
        <Link to="/Settings">
          <Badge variant="outline" className="text-xs cursor-pointer hover:bg-muted">
            <Info className="w-3 h-3 mr-1" /> Edit Rules in Settings
          </Badge>
        </Link>
      </PageHeader>

      <GuidedPrompt message={`Distribution order (from gross profit): Tax Reserve (${TAX_RESERVE_PCT}%) → Operating Reserve (${OPERATING_RESERVE_PCT}%) → Subcontractor Payouts → Owner Payout (remainder) | Manager pay (${MANAGER_PAY_PCT}% of collected) calculated separately.`} variant="info" />

      {/* Debug: Active Contracts (all statuses except completed/cancelled) */}
      <Card className="p-3 mt-4 text-xs bg-gray-50 border-gray-200">
        <p className="font-semibold mb-2">📊 Active Contracts ({contracts.filter(c => c.status === "active" || c.status === "signed" || c.status === "draft" || c.status === "sent").length}):</p>
        <div className="space-y-1">
          {contracts.filter(c => c.status === "active" || c.status === "signed" || c.status === "draft" || c.status === "sent").map(c => (
            <div key={c.id} className="flex justify-between">
              <span>{c.title}</span>
              <span className="font-mono">${c.contract_amount} | Paid: {formatCurrency(c.client_paid_amount || 0)}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Pending payout alert */}
      {hasPendingPayouts && (
        <Card className="p-4 mt-4 border-amber-200 bg-amber-50 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Pending Payouts</p>
            <p className="text-xs text-amber-700 mt-1">{formatCurrency(subPayoutsPending)} awaiting payment to subcontractors. Ensure sufficient cash available before proceeding.</p>
          </div>
        </Card>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        <Card className="p-4 border-teal-200 bg-teal-50">
          <p className="text-sm font-semibold text-teal-700">Total Collected</p>
          <p className="text-xs text-teal-600 mb-2">All customer payments</p>
          <p className="text-2xl font-bold text-teal-700">{formatCurrency(totalCollected)}</p>
        </Card>

        <Card className="p-4 border-orange-200 bg-orange-50">
          <p className="text-sm font-semibold text-orange-700">Total Expenses</p>
          <p className="text-xs text-orange-600 mb-2">All job costs deducted</p>
          <p className="text-2xl font-bold text-orange-700">{formatCurrency(totalExpenses)}</p>
        </Card>

        <Card className="p-4 border-green-200 bg-green-50">
          <p className="text-sm font-semibold text-green-700">Gross Profit</p>
          <p className="text-xs text-green-600 mb-2">Collected minus expenses</p>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(totalGrossProfit)}</p>
        </Card>

        <Card className="p-4 border-primary/30 bg-primary/5">
          <p className="text-sm font-semibold text-primary">Business Manager Pay</p>
          <p className="text-xs text-muted-foreground mb-2">{MANAGER_PAY_PCT}% of gross {MANAGER_PAY_BASIS === "gross_before_subs" ? "(before sub payouts)" : "(after sub payouts)"}</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(totalManagerPay)}</p>
        </Card>

        <Card className="p-4 border-orange-200 bg-orange-50">
          <p className="text-sm font-semibold text-orange-700">Subcontractor Payouts</p>
          <p className="text-xs text-orange-600 mb-2">Paid: {formatCurrency(subPayoutsPaid)}</p>
          <div className="text-2xl font-bold text-orange-700 flex items-baseline gap-2">
            {formatCurrency(totalSubPayoutsOwed)}
            {subPayoutsPending > 0 && <span className="text-xs font-normal text-orange-600">(Pending: {formatCurrency(subPayoutsPending)})</span>}
          </div>
        </Card>
      </div>

      {/* Net available for distributions */}
      <Card className="p-4 mt-4 border-blue-200 bg-blue-50">
        <p className="text-sm font-semibold text-blue-900">Net Available for Distribution (After All Payouts)</p>
        <p className="text-2xl font-bold text-blue-700 mt-2">{formatCurrency(netAvailableForDistribution)}</p>
        <p className="text-xs text-blue-600 mt-1">After manager pay ({formatCurrency(totalManagerPay)}), paid subs ({formatCurrency(subPayoutsPaid)}), and pending subs ({formatCurrency(subPayoutsPending)})</p>
      </Card>

      {/* Distribution buckets */}
      <h3 className="text-sm font-semibold mt-6 mb-3">Distributions</h3>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <Card className="p-4 text-center border-primary/30 bg-primary/5">
          <p className="text-xs text-primary font-semibold mb-2">Business Manager Pay</p>
          <p className="text-xl font-bold text-primary">{formatCurrency(totalManagerPay)}</p>
          <p className="text-xs text-muted-foreground mt-1">{MANAGER_PAY_PCT}% {MANAGER_PAY_BASIS === "gross_before_subs" ? "before subs" : "after subs"}</p>
        </Card>
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
          <p className="text-xs text-muted-foreground mt-1">Remainder</p>
        </Card>
        <Card className="p-4 text-center border-orange-200 bg-orange-50">
          <p className="text-xs text-orange-700 font-semibold mb-2">Sub Payouts (Owed)</p>
          <p className="text-xl font-bold text-orange-700">{formatCurrency(totalSubPayoutsOwed)}</p>
          <p className="text-xs text-orange-600 mt-1">Actual Hourly</p>
        </Card>
      </div>

      {/* Projections for upcoming jobs with subcontractor corrections */}
      {(bids.length > 0 || contracts.length > 0 || jobSubPayments.length > 0) && (
        <>
          <h3 className="text-sm font-semibold mt-8 mb-3">Payout Projections (Pending/Upcoming Jobs & Subcontractor Corrections)</h3>
          <Card className="p-4 mb-6 border-purple-200 bg-purple-50">
            <p className="text-xs text-purple-700 mb-3">Edit subcontractor hours/amounts for actual work completed</p>
            <div className="space-y-3">
              {/* Subcontractor corrections for active jobs */}
              {jobSubPayments.map(sp => {
                const correctedAmount = corrections[sp.id] || sp.amount;
                const linkedSubcontractor = subcontractors.find(s => s.id === sp.subcontractor_id) || { name: sp.subcontractor_name };

                return (
                  <div key={sp.id} className="flex justify-between items-center p-3 bg-white rounded border border-purple-100 text-xs">
                    <div className="flex-1">
                      <p className="font-semibold">{sp.job_title}</p>
                      <p className="text-muted-foreground">{linkedSubcontractor.name || sp.subcontractor_name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{sp.calculation_notes || "Hourly"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={correctedAmount}
                        onChange={(e) => setCorrections(c => ({ ...c, [sp.id]: parseFloat(e.target.value) || 0 }))}
                        className="w-20 h-8 text-xs"
                        step="0.01"
                      />
                      <p className="w-16 text-right font-semibold">{formatCurrency(correctedAmount)}</p>
                    </div>
                  </div>
                );
              })}

              {/* Bid projections — skip bids that already have a contract (avoid double-counting) */}
              {bids.filter(b =>
                (b.status === "sent" || b.status === "approved") &&
                !contracts.some(c => c.bid_id === b.id || (b.job_id && c.job_id === b.job_id))
              ).map(b => {
                const projectedGross = b.bid_amount || 0;
                const projManagerPay = projectedGross * (MANAGER_PAY_PCT / 100);
                const projNetAfterMgr = projectedGross - projManagerPay;
                const projTaxRes = projectedGross * (TAX_RESERVE_PCT / 100);
                const projOpRes = projectedGross * (OPERATING_RESERVE_PCT / 100);
                const projOwner = Math.max(0, projNetAfterMgr - projTaxRes - projOpRes - (b.subcontractor_cost || 0));

                return (
                  <div key={b.id} className="flex justify-between items-start p-3 bg-white rounded border border-purple-100 text-xs">
                    <div>
                      <p className="font-semibold">{b.title}</p>
                      <p className="text-muted-foreground">{b.client_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-purple-700 font-semibold mb-1">{formatCurrency(projectedGross)} bid</p>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <p>Manager: {formatCurrency(projManagerPay)}</p>
                        <p>Tax Res: {formatCurrency(projTaxRes)}</p>
                        <p>Op Res: {formatCurrency(projOpRes)}</p>
                        <p className="font-semibold text-purple-600">Owner: {formatCurrency(projOwner)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Contract projections — deduplicate by job_id (show only the most recent contract per job) */}
              {contracts
                .filter(c => c.status !== "completed" && c.status !== "cancelled")
                .reduce((seen, c) => {
                  if (!c.job_id || !seen.jobIds.has(c.job_id)) {
                    if (c.job_id) seen.jobIds.add(c.job_id);
                    seen.contracts.push(c);
                  }
                  return seen;
                }, { contracts: [], jobIds: new Set() })
                .contracts
                .map(c => {
                  const projectedGross = c.contract_amount || 0;
                  const projManagerPay = projectedGross * (MANAGER_PAY_PCT / 100);
                  const projNetAfterMgr = projectedGross - projManagerPay;
                  const projTaxRes = projectedGross * (TAX_RESERVE_PCT / 100);
                  const projOpRes = projectedGross * (OPERATING_RESERVE_PCT / 100);
                  const jobSubPayoutsForContract = jobSubPayments.filter(sp => {
                    const jobForSub = activeJobs.find(j => j.id === sp.job_id);
                    return jobForSub && contracts.find(c2 => c2.job_id === jobForSub.id)?.id === c.id;
                  }).reduce((sum, sp) => sum + (sp.amount || 0), 0);
                  const projOwner = Math.max(0, projectedGross - projManagerPay - projTaxRes - projOpRes - jobSubPayoutsForContract);

                  return (
                    <div key={c.id} className="flex justify-between items-start p-3 bg-white rounded border border-purple-100 text-xs">
                      <div>
                        <p className="font-semibold">{c.title}</p>
                        <p className="text-muted-foreground">{c.client_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-purple-700 font-semibold mb-1">{formatCurrency(projectedGross)} contract</p>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <p>Manager: {formatCurrency(projManagerPay)}</p>
                          <p>Tax Res: {formatCurrency(projTaxRes)}</p>
                          <p>Op Res: {formatCurrency(projOpRes)}</p>
                          <p className="font-semibold text-purple-600">Owner: {formatCurrency(projOwner)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>
        </>
      )}

      {/* Per-job breakdown */}
      <h3 className="text-sm font-semibold mt-8 mb-3">Current Paid Breakdown</h3>
      {jobBreakdowns.length === 0 ? (
        <p className="text-sm text-muted-foreground">No active or completed jobs.</p>
      ) : (
        <div className="space-y-6">
          {jobBreakdowns.map(({ job, cashCollected, managerPayForJob, subPayments: subs, subPayoutsPaid, subPayoutsPending, totalSubPayouts }) => (
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
                  <span className="text-muted-foreground">Sub Payouts (Owed)</span>
                  <br />
                  <strong className="text-orange-600">{formatCurrency(totalSubPayouts)}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Remaining</span>
                  <br />
                  <strong className="text-blue-600">{formatCurrency(Math.max(0, cashCollected - managerPayForJob - totalSubPayouts))}</strong>
                </div>
              </div>

              {/* Subcontractor payouts for this job */}
              {subs.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Subcontractor Payouts</p>
                  <div className="space-y-2">
                    {subs.map((sp) => (
                      <div key={sp.id} className={`flex justify-between items-center p-2 rounded text-xs ${sp.status === "pending" ? "bg-amber-50 border border-amber-200" : "bg-muted/50"}`}>
                        <div>
                          <p className="font-medium">{sp.subcontractor_name}</p>
                          <p className="text-muted-foreground">{sp.calculation_notes || "Hourly payment"}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(sp.amount)}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {sp.status === "pending" ? (
                              <>
                                <span className="text-amber-600 font-medium">Pending</span>
                                <Badge className="text-xs bg-amber-100 text-amber-800 border-0">Awaiting Payment</Badge>
                              </>
                            ) : (
                              <p className="text-muted-foreground">{formatDate(sp.payment_date)}</p>
                            )}
                          </div>
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