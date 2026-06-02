import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "@/components/shared/PageHeader";
import GuidedPrompt from "@/components/shared/GuidedPrompt";
import { formatCurrency, formatPercent, formatDate } from "@/lib/formatters";
import { Link } from "react-router-dom";

export default function PayoutEngine() {
  const [corrections, setCorrections] = useState({});
  const [selectedDetail, setSelectedDetail] = useState(null);

  // Fetch all required data FIRST
  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date", 500) });
  const { data: bids = [] } = useQuery({ queryKey: ["bids"], queryFn: () => base44.entities.Bid.list("-created_date", 500) });
  const { data: contracts = [] } = useQuery({ queryKey: ["contracts"], queryFn: () => base44.entities.Contract.list("-created_date", 500) });
  const { data: subPayments = [] } = useQuery({ queryKey: ["subPayments"], queryFn: () => base44.entities.SubcontractorPayment.list("-created_date", 500) });
  const { data: ledgerPayments = [] } = useQuery({ queryKey: ["ledgerPayments"], queryFn: () => base44.entities.SubcontractorLedgerPayment.list("-created_date", 500) });
  const { data: bankTxns = [] } = useQuery({ queryKey: ["bankTxns"], queryFn: () => base44.entities.BankTransaction.list("-date", 500) });
  const { data: subcontractors = [] } = useQuery({ queryKey: ["subcontractors"], queryFn: () => base44.entities.Subcontractor.list("-created_date", 500) });
  const { data: settings = [] } = useQuery({ queryKey: ["settings"], queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }) });
  const { data: subLabor = [] } = useQuery({ queryKey: ["subLabor"], queryFn: () => base44.entities.SubcontractorWorkEntry.list("-created_date", 500) });
  const { data: managerPayments = [] } = useQuery({ queryKey: ["managerPayments"], queryFn: () => base44.entities.ManagerPayment.list("-payment_date", 500) });
  const s = settings[0] || {};

  // Settings-dependent constants
  const MANAGER_PAY_PCT = s.manager_pay_percent ?? 10;
  const MANAGER_PAY_TYPE = s.manager_pay_type || "percent";
  const MANAGER_PAY_FLAT = s.manager_pay_flat_amount || 1500;
  const TAX_RESERVE_PCT = s.tax_reserve_percent || 25;
  const OPERATING_RESERVE_PCT = s.operating_reserve_percent || 5;
  const MANAGER_PAY_BASIS = s.manager_pay_basis || "gross_before_subs";

  const activeJobs = jobs.filter(j => ["in_progress", "contracted", "completed"].includes(j.status));
  // Manager pay: all open (contracted/in_progress) non-waived jobs
  const openNotStartedJobs = jobs.filter(j => ["contracted", "in_progress"].includes(j.status) && !j.manager_pay_waived);
  const activeJobIds = new Set(activeJobs.map(j => j.id));
  // All jobs that have ANY payment recorded (for the paid breakdown section)
  const paidJobs = jobs.filter(j => (j.deposits_received || 0) > 0);  

  const SIGNED_STATUSES = ["signed", "active", "completed"];
  // Jobs are the ONLY source of truth for total collected — use deposits_received (same as BusinessFinancials)
  const totalCollected = jobs.reduce((sum, j) => sum + (j.deposits_received || 0), 0);
  
  const totalExpenses = activeJobs.reduce((sum, j) => {
    const jobExpenses = (j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0) + (j.permit_costs || 0) + (j.equipment_costs || 0) + (j.overhead_costs || 0) + (j.other_costs || 0);
    return sum + jobExpenses;
  }, 0);
  // Include actual sub labor payments in total expenses (same as BusinessFinancials)
  const actualSubLaborExpenses = subLabor.filter(s => s.payment_status === "Paid").reduce((sum, s) => sum + (s.calculated_pay || 0), 0);
  const totalExpensesWithActualLabor = totalExpenses + actualSubLaborExpenses;
  const totalGrossProfit = Math.max(0, totalCollected - totalExpensesWithActualLabor);

  // Reserves based on totalCollected (consistent across app)
  const taxReserve = totalCollected * (TAX_RESERVE_PCT / 100);
  const operatingReserve = totalCollected * (OPERATING_RESERVE_PCT / 100);
  
  // Manager pay: flat rate per open (contracted/in_progress) AND not-started, non-waived job
  const openNonWaivedJobs = openNotStartedJobs; // already filtered above
  const totalManagerPay = MANAGER_PAY_TYPE === "flat_rate"
    ? openNonWaivedJobs.length * MANAGER_PAY_FLAT
    : Math.max(0, totalGrossProfit) * (MANAGER_PAY_PCT / 100);
  
  // Owner payout: remainder after reserves and manager pay
  const ownerPayout = Math.max(0, totalCollected - taxReserve - operatingReserve - totalManagerPay);

  // Get ALL subcontractor payouts across all jobs — from both SubcontractorPayment and SubcontractorLedgerPayment
  const allJobIds = new Set(jobs.map(j => j.id));
  const jobSubPayments = subPayments.filter(sp => allJobIds.has(sp.job_id));
  // Merge ledger payments as normalized records alongside SubcontractorPayment records
  const normalizedLedgerPayments = ledgerPayments
    .filter(lp => lp.is_paid && allJobIds.has(lp.job_id))
    .map(lp => ({
      id: "ledger_" + lp.id,
      subcontractor_id: lp.subcontractor_id,
      subcontractor_name: lp.subcontractor_name,
      job_id: lp.job_id,
      job_title: lp.job_title,
      amount: lp.amount_paid || lp.total_amount_due || 0,
      status: "paid",
      payment_date: lp.payment_date,
      calculation_notes: `Ledger: ${lp.pay_period_start || ""} – ${lp.pay_period_end || ""}`,
    }));
  // Combine both, avoiding duplicates (ledger payments that already have a SubcontractorPayment record)
  const allSubPayments = [...jobSubPayments, ...normalizedLedgerPayments];
  const subPayoutsPaid = allSubPayments.filter(sp => sp.status === "paid").reduce((sum, sp) => sum + (sp.amount || 0), 0);
  const subPayoutsPending = allSubPayments.filter(sp => sp.status === "pending").reduce((sum, sp) => sum + (sp.amount || 0), 0);
  // Total owed: actual ledger payments + SubcontractorWorkEntry paid labor
  const subLaborPaid = subLabor.filter(s => s.payment_status === "Paid").reduce((sum, s) => sum + (s.calculated_pay || 0), 0);
  const ledgerAndPaymentTotal = allSubPayments.reduce((sum, sp) => sum + (sp.amount || 0), 0);
  const totalSubPayoutsOwed = subLaborPaid + ledgerAndPaymentTotal;

  // YTD actual payments — CONSISTENT with BusinessFinancials
  const subPaid = subLaborPaid + subPayoutsPaid;
  // FIX 3: Use ManagerPayment entity (same source as BusinessFinancials) instead of BankTransaction[payroll]
  const managerPaid = managerPayments.reduce((sum, mp) => sum + (mp.amount_paid || 0), 0);
  const totalOwnerPaid = bankTxns.filter(t => t.category === "owner_draw" && t.type === "outflow").reduce((sum, t) => sum + (t.amount || 0), 0);

  const distributions = {
    tax_reserve: taxReserve,
    operating_reserve: operatingReserve,
    owner_payout: ownerPayout,
  };

  // What's still available (already distributed amounts subtracted from totalCollected)
  const totalAlreadyPaidOut = subPayoutsPaid + totalManagerPay;
  const netAvailableForDistribution = Math.max(0, totalCollected - totalAlreadyPaidOut - subPayoutsPending);

  // Per-job breakdown — ALL jobs with any payment recorded
  const jobBreakdowns = paidJobs.map(j => {
    const jobSubs = allSubPayments.filter(sp => sp.job_id === j.id);
    const subPaid = jobSubs.filter(sp => sp.status === "paid").reduce((sum, sp) => sum + (sp.amount || 0), 0);
    const subPending = jobSubs.filter(sp => sp.status === "pending").reduce((sum, sp) => sum + (sp.amount || 0), 0);
    const subTotal = jobSubs.reduce((sum, sp) => sum + (sp.amount || 0), 0);
    const linkedContract = contracts.find(c => c.job_id === j.id);
    // Use deposits_received as source of truth (same as BusinessFinancials)
    const cashCollected = j.deposits_received || 0;
    // Manager pay: % of Gross Before Labor & Subs
    // labor_costs and subcontractor_costs intentionally excluded — manager paid before any labor deductions
    const grossBeforeLaborAndSubs = Math.max(0, cashCollected
      - (j.material_costs || 0)
      - (j.permit_costs || 0)
      - (j.equipment_costs || 0)
      - (j.overhead_costs || 0)
      - (j.other_costs || 0));
    const managerPayForJob = j.manager_pay_waived
      ? 0
      : MANAGER_PAY_TYPE === "flat_rate"
        ? MANAGER_PAY_FLAT
        : grossBeforeLaborAndSubs * (MANAGER_PAY_PCT / 100);

    return {
      job: j,
      cashCollected,
      managerPayForJob,
      netAfterMgrForJob: cashCollected - managerPayForJob,
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

      <GuidedPrompt message={MANAGER_PAY_TYPE === "flat_rate"
        ? `Manager Pay: ${formatCurrency(MANAGER_PAY_FLAT)}/job × ${openNonWaivedJobs.length} open jobs = ${formatCurrency(totalManagerPay)}. Tax Reserve (${TAX_RESERVE_PCT}%) + Operating Reserve (${OPERATING_RESERVE_PCT}%) + Sub Payouts + Owner Payout (remainder).`
        : `All distributions are based on Total Collected: Manager Pay (${MANAGER_PAY_PCT}% of Gross Profit) + Tax Reserve (${TAX_RESERVE_PCT}%) + Operating Reserve (${OPERATING_RESERVE_PCT}%) + Sub Payouts + Owner Payout (remainder).`
      } variant="info" />

      {/* Jobs with payments summary */}
      <Card className="p-3 mt-4 text-xs bg-gray-50 border-gray-200">
        <p className="font-semibold mb-2">📊 Jobs with Payments ({paidJobs.length}):</p>
        <div className="space-y-1">
          {paidJobs.map(j => {
            const paid = j.deposits_received || 0;
            return (
              <div key={j.id} className="flex justify-between">
                <span>{j.title} <span className="text-muted-foreground">({j.status})</span></span>
                <span className="font-mono font-semibold text-green-700">Paid: {formatCurrency(paid)}</span>
              </div>
            );
          })}
          <div className="flex justify-between pt-1 border-t font-bold">
            <span>Total Collected</span>
            <span className="text-green-700">{formatCurrency(totalCollected)}</span>
          </div>
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

      {/* Summary cards — clickable for details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        <Card className="p-4 border-teal-200 bg-teal-50 cursor-pointer hover:shadow-md transition" onClick={() => setSelectedDetail({ type: "collected", data: { total: totalCollected, paidJobs } })}>
          <p className="text-sm font-semibold text-teal-700">Total Collected</p>
          <p className="text-xs text-teal-600 mb-2">All customer payments</p>
          <p className="text-2xl font-bold text-teal-700">{formatCurrency(totalCollected)}</p>
          <p className="text-xs text-teal-600 mt-2">Click to see breakdown</p>
        </Card>

        <Card className="p-4 border-orange-200 bg-orange-50 cursor-pointer hover:shadow-md transition" onClick={() => setSelectedDetail({ type: "expenses", data: { total: totalExpensesWithActualLabor, activeJobs, subLaborPaid: actualSubLaborExpenses } })}>
          <p className="text-sm font-semibold text-orange-700">Total Expenses</p>
          <p className="text-xs text-orange-600 mb-2">All job costs + actual sub labor</p>
          <p className="text-2xl font-bold text-orange-700">{formatCurrency(totalExpensesWithActualLabor)}</p>
          <p className="text-xs text-orange-600 mt-2">Click to see breakdown</p>
        </Card>

        <Card className="p-4 border-green-200 bg-green-50 cursor-pointer hover:shadow-md transition" onClick={() => setSelectedDetail({ type: "profit", data: { collected: totalCollected, expenses: totalExpenses, gross: totalGrossProfit } })}>
          <p className="text-sm font-semibold text-green-700">Gross Profit</p>
          <p className="text-xs text-green-600 mb-2">Collected minus expenses</p>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(totalGrossProfit)}</p>
          <p className="text-xs text-green-600 mt-2">Click to see breakdown</p>
        </Card>

        <Card className="p-4 border-primary/30 bg-primary/5 cursor-pointer hover:shadow-md transition" onClick={() => setSelectedDetail({ type: "manager", data: { total: totalManagerPay, collected: totalCollected, percent: MANAGER_PAY_PCT, payType: MANAGER_PAY_TYPE, flatAmount: MANAGER_PAY_FLAT, jobCount: openNonWaivedJobs.length, jobs: openNonWaivedJobs } })}>
          <p className="text-sm font-semibold text-primary">Business Manager Pay</p>
          <p className="text-xs text-muted-foreground mb-2">
            {MANAGER_PAY_TYPE === "flat_rate"
              ? `${formatCurrency(MANAGER_PAY_FLAT)}/job × ${openNonWaivedJobs.length} open job${openNonWaivedJobs.length !== 1 ? "s" : ""}`
              : `${MANAGER_PAY_PCT}% of Gross Profit (revenue − expenses)`}
          </p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(totalManagerPay)}</p>
          <p className="text-xs text-muted-foreground mt-2">Click to see breakdown</p>
        </Card>

        <Card className="p-4 border-orange-200 bg-orange-50 cursor-pointer hover:shadow-md transition" onClick={() => setSelectedDetail({ type: "subs", data: { owed: totalSubPayoutsOwed, paid: subPayoutsPaid, pending: subPayoutsPending, payments: allSubPayments } })}>
          <p className="text-sm font-semibold text-orange-700">Subcontractor Payouts</p>
          <p className="text-xs text-orange-600 mb-2">Paid: {formatCurrency(subPayoutsPaid)}</p>
          <div className="text-2xl font-bold text-orange-700 flex items-baseline gap-2">
            {formatCurrency(totalSubPayoutsOwed)}
            {subPayoutsPending > 0 && <span className="text-xs font-normal text-orange-600">(Pending: {formatCurrency(subPayoutsPending)})</span>}
          </div>
          <p className="text-xs text-orange-600 mt-2">Click to see breakdown</p>
        </Card>

        <Card className="p-4 border-purple-200 bg-purple-50 cursor-pointer hover:shadow-md transition" onClick={() => setSelectedDetail({ type: "ownerPayments", data: { txns: bankTxns.filter(t => t.category === "owner_draw" && t.type === "outflow"), total: totalOwnerPaid } })}>
          <p className="text-sm font-semibold text-purple-700">Owner Paid</p>
          <p className="text-xs text-purple-600 mb-2">{bankTxns.filter(t => t.category === "owner_draw" && t.type === "outflow").length} payments logged</p>
          <p className="text-2xl font-bold text-purple-700">{formatCurrency(totalOwnerPaid)}</p>
          <p className="text-xs text-purple-600 mt-2">Click to see history</p>
        </Card>
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selectedDetail} onOpenChange={() => setSelectedDetail(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDetail?.type === "collected" && "Total Collected Breakdown"}
              {selectedDetail?.type === "expenses" && "Total Expenses Breakdown"}
              {selectedDetail?.type === "profit" && "Gross Profit Calculation"}
              {selectedDetail?.type === "manager" && "Manager Pay Calculation"}
              {selectedDetail?.type === "subs" && "Subcontractor Payouts Breakdown"}
            </DialogTitle>
          </DialogHeader>

          {selectedDetail?.type === "collected" && (
            <div className="space-y-3 text-sm">
              <p className="font-semibold">All jobs with payments recorded:</p>
              {selectedDetail.data.paidJobs.map(j => (
                <div key={j.id} className="flex justify-between p-2 bg-muted rounded">
                  <div>
                    <span className="font-medium">{j.title}</span>
                    <span className="text-muted-foreground ml-2 text-xs">({j.client_name || "—"}) · {j.status}</span>
                  </div>
                  <span className="font-semibold text-green-700">{formatCurrency(j.deposits_received || 0)}</span>
                </div>
              ))}
              <div className="flex justify-between p-3 bg-teal-50 rounded font-semibold border border-teal-200 mt-4">
                <span>Total Collected</span>
                <span>{formatCurrency(selectedDetail.data.total)}</span>
              </div>
            </div>
          )}

          {selectedDetail?.type === "expenses" && (
            <div className="space-y-3 text-sm">
              <p className="font-semibold">Expenses by job:</p>
              {selectedDetail.data.activeJobs.map(j => {
                const jobExpenses = (j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0) + (j.permit_costs || 0) + (j.equipment_costs || 0) + (j.overhead_costs || 0) + (j.other_costs || 0);
                return (
                  <div key={j.id} className="p-3 border rounded space-y-1">
                    <p className="font-semibold">{j.title}</p>
                    <div className="text-xs space-y-0.5 ml-2">
                      {j.material_costs > 0 && <p>Materials: {formatCurrency(j.material_costs)}</p>}
                      {j.labor_costs > 0 && <p>Labor: {formatCurrency(j.labor_costs)}</p>}
                      {j.subcontractor_costs > 0 && <p>Subcontractors: {formatCurrency(j.subcontractor_costs)}</p>}
                      {j.permit_costs > 0 && <p>Permits: {formatCurrency(j.permit_costs)}</p>}
                      {j.equipment_costs > 0 && <p>Equipment: {formatCurrency(j.equipment_costs)}</p>}
                      {j.overhead_costs > 0 && <p>Overhead: {formatCurrency(j.overhead_costs)}</p>}
                      {j.other_costs > 0 && <p>Other: {formatCurrency(j.other_costs)}</p>}
                    </div>
                    <p className="text-right font-semibold mt-1">{formatCurrency(jobExpenses)}</p>
                  </div>
                );
              })}
              {selectedDetail.data.subLaborPaid > 0 && (
                <div className="p-3 border rounded space-y-1 bg-blue-50">
                  <p className="font-semibold">Actual Sub Labor Paid</p>
                  <p className="text-right font-semibold">{formatCurrency(selectedDetail.data.subLaborPaid)}</p>
                </div>
              )}
              <div className="flex justify-between p-3 bg-orange-50 rounded font-semibold border border-orange-200 mt-4">
                <span>Total (Job Budgets + Actual Sub Labor)</span>
                <span>{formatCurrency(selectedDetail.data.total)}</span>
              </div>
            </div>
          )}

          {selectedDetail?.type === "profit" && (
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-teal-50 rounded border border-teal-200">
                <div className="flex justify-between">
                  <span>Total Collected</span>
                  <span className="font-semibold">{formatCurrency(selectedDetail.data.collected)}</span>
                </div>
              </div>
              <div>−</div>
              <div className="p-3 bg-orange-50 rounded border border-orange-200">
                <div className="flex justify-between">
                  <span>Total Expenses</span>
                  <span className="font-semibold">{formatCurrency(selectedDetail.data.expenses)}</span>
                </div>
              </div>
              <div className="flex justify-between p-3 bg-green-50 rounded font-semibold border border-green-200 text-base mt-4">
                <span>=</span>
                <span>Gross Profit: {formatCurrency(selectedDetail.data.gross)}</span>
              </div>
            </div>
          )}

          {selectedDetail?.type === "manager" && (
            <div className="space-y-3 text-sm">
              {selectedDetail.data.payType === "flat_rate" ? (
                <>
                  <p className="text-muted-foreground">Flat rate of <strong>{formatCurrency(selectedDetail.data.flatAmount)}</strong> per open, non-waived job.</p>
                  <div className="space-y-2">
                    {selectedDetail.data.jobs.map(j => (
                      <div key={j.id} className="flex justify-between p-2 bg-muted rounded">
                        <div>
                          <span className="font-medium">{j.title}</span>
                          <span className="text-muted-foreground ml-2 text-xs">({j.status?.replace(/_/g, " ")})</span>
                        </div>
                        <span className="font-semibold text-primary">{formatCurrency(selectedDetail.data.flatAmount)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between p-3 bg-primary/10 rounded font-semibold border border-primary/30 mt-2">
                    <span>{selectedDetail.data.jobCount} job{selectedDetail.data.jobCount !== 1 ? "s" : ""} × {formatCurrency(selectedDetail.data.flatAmount)}</span>
                    <span className="text-primary">{formatCurrency(selectedDetail.data.total)}</span>
                  </div>
                </>
              ) : (
                <>
                  <p>Calculation: (Total Collected − Total Expenses) × {selectedDetail.data.percent}% = Gross Profit × {selectedDetail.data.percent}%</p>
                  <div className="p-3 bg-muted rounded">
                    <div className="flex justify-between">
                      <span>Total Collected</span>
                      <span className="font-semibold">{formatCurrency(selectedDetail.data.collected)}</span>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span>Minus: Materials & Equipment</span>
                      <span className="font-semibold">Deducted</span>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span>× {selectedDetail.data.percent}%</span>
                      <span className="font-semibold text-primary">{formatCurrency(selectedDetail.data.total)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {selectedDetail?.type === "subs" && (
            <div className="space-y-3 text-sm">
              <p className="font-semibold">Subcontractor payments:</p>
              {selectedDetail.data.payments.map(sp => (
                <div key={sp.id} className="flex justify-between p-2 bg-muted rounded text-xs">
                  <div>
                    <p className="font-semibold">{sp.subcontractor_name}</p>
                    <p className="text-muted-foreground">{sp.job_title}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(sp.amount)}</p>
                    <p className={`text-xs ${sp.status === "paid" ? "text-green-600" : "text-amber-600"}`}>{sp.status}</p>
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t space-y-2 mt-4">
                <div className="flex justify-between p-2 bg-green-50 rounded">
                  <span>Paid</span>
                  <span className="font-semibold text-green-600">{formatCurrency(selectedDetail.data.paid)}</span>
                </div>
                <div className="flex justify-between p-2 bg-amber-50 rounded">
                  <span>Pending</span>
                  <span className="font-semibold text-amber-600">{formatCurrency(selectedDetail.data.pending)}</span>
                </div>
                <div className="flex justify-between p-2 bg-orange-50 rounded border border-orange-200 font-semibold">
                  <span>Total Owed</span>
                  <span>{formatCurrency(selectedDetail.data.owed)}</span>
                </div>
              </div>
            </div>
          )}

          {selectedDetail?.type === "ownerPayments" && (
            <div className="space-y-3 text-sm">
              <p className="font-semibold">Owner payment history:</p>
              {!selectedDetail.data.txns || selectedDetail.data.txns.length === 0 ? (
                <p className="text-muted-foreground text-xs py-4">No owner payments recorded yet.</p>
              ) : (
                <>
                  {selectedDetail.data.txns.map(t => (
                    <div key={t.id} className="p-3 border rounded space-y-1">
                      <div className="flex justify-between">
                        <p className="font-semibold">{formatCurrency(t.amount)}</p>
                        <p className="text-xs text-muted-foreground">{t.date}</p>
                      </div>
                      <div className="text-xs space-y-0.5">
                        <p className="text-muted-foreground">Method: {t.bank_account_name || "Bank Transfer"}</p>
                        {t.notes && <p className="text-muted-foreground italic">Notes: {t.notes}</p>}
                      </div>
                    </div>
                  ))}
                </>
              )}
              <div className="flex justify-between p-3 bg-purple-50 rounded border border-purple-200 font-semibold mt-4">
                <span>Total Owner Paid</span>
                <span className="text-purple-700">{formatCurrency(selectedDetail.data.total)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
          <p className="text-xs text-muted-foreground mt-1">
            {MANAGER_PAY_TYPE === "flat_rate"
              ? `${formatCurrency(MANAGER_PAY_FLAT)}/job × ${openNonWaivedJobs.length} jobs`
              : `${MANAGER_PAY_PCT}% of gross profit`}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground mb-2">Tax Reserve</p>
          <p className="text-xl font-bold">{formatCurrency(distributions.tax_reserve)}</p>
          <p className="text-xs text-muted-foreground mt-1">{TAX_RESERVE_PCT}% of collected</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground mb-2">Operating Reserve</p>
          <p className="text-xl font-bold">{formatCurrency(distributions.operating_reserve)}</p>
          <p className="text-xs text-muted-foreground mt-1">{OPERATING_RESERVE_PCT}% of collected</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground mb-2">Owner Payout</p>
          <p className="text-xl font-bold">{formatCurrency(distributions.owner_payout)}</p>
          <p className="text-xs text-muted-foreground mt-1">After all deductions</p>
        </Card>
        <Card className="p-4 text-center border-orange-200 bg-orange-50">
          <p className="text-xs text-orange-700 font-semibold mb-2">Sub Payouts (Owed)</p>
          <p className="text-xl font-bold text-orange-700">{formatCurrency(totalSubPayoutsOwed)}</p>
          <p className="text-xs text-orange-600 mt-1">Actual Hourly</p>
        </Card>
      </div>

      {/* Projections for upcoming jobs with subcontractor corrections */}
      {(bids.length > 0 || contracts.length > 0 || allSubPayments.length > 0) && (
        <>
          <h3 className="text-sm font-semibold mt-8 mb-3">Payout Projections (Pending/Upcoming Jobs & Subcontractor Corrections)</h3>
          <Card className="p-4 mb-6 border-purple-200 bg-purple-50">
            <p className="text-xs text-purple-700 mb-3">Edit subcontractor hours/amounts for actual work completed</p>
            <div className="space-y-3">
              {allSubPayments.map(sp => {
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
              {bids.filter(b =>
                (b.status === "sent" || b.status === "approved") &&
                !contracts.some(c => c.bid_id === b.id || (b.job_id && c.job_id === b.job_id))
              ).map(b => {
                const projectedGross = b.bid_amount || 0;
                const projManagerPay = MANAGER_PAY_TYPE === "flat_rate" ? MANAGER_PAY_FLAT : projectedGross * (MANAGER_PAY_PCT / 100);
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
                  const projManagerPay = MANAGER_PAY_TYPE === "flat_rate" ? MANAGER_PAY_FLAT : projectedGross * (MANAGER_PAY_PCT / 100);
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
              <div className="flex items-center justify-between mb-4 pb-3 border-b">
                <div>
                  <p className="text-sm font-semibold">{job.title}</p>
                  <p className="text-xs text-muted-foreground">{job.client_name || "—"}</p>
                </div>
                <Badge variant="outline" className="text-xs">{job.status?.replace(/_/g, " ")}</Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
                <div>
                  <span className="text-muted-foreground">Paid by Customer</span><br />
                  <strong className="text-green-600">{formatCurrency(cashCollected)}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Manager Pay</span><br />
                  {job.manager_pay_waived
                    ? <strong className="text-muted-foreground">Waived</strong>
                    : <strong className="text-primary">{formatCurrency(managerPayForJob)}</strong>
                  }
                  {MANAGER_PAY_TYPE === "flat_rate" && !job.manager_pay_waived && (
                    <span className="block text-xs text-muted-foreground">flat rate</span>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground">Sub Payouts (Owed)</span><br />
                  <strong className="text-orange-600">{formatCurrency(totalSubPayouts)}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Remaining</span><br />
                  <strong className="text-blue-600">{formatCurrency(Math.max(0, cashCollected - managerPayForJob - totalSubPayouts))}</strong>
                </div>
              </div>
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