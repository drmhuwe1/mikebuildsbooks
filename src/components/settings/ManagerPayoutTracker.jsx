import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, X, Check, ChevronRight, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { useToast } from "@/components/ui/use-toast";

export default function ManagerPayoutTracker() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const year = String(new Date().getFullYear());

  const freshOpts = { staleTime: 0, refetchOnMount: "always", gcTime: 0 };
  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date", 500), ...freshOpts });
  const { data: settings = [] } = useQuery({ queryKey: ["settings"], queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }), ...freshOpts });
  const { data: payments = [] } = useQuery({ queryKey: ["managerPayments"], queryFn: () => base44.entities.ManagerPayment.list("-payment_date", 500), ...freshOpts });
  const { data: jobReceipts = [] } = useQuery({ queryKey: ["all-receipts"], queryFn: () => base44.entities.JobReceipt.list("-date", 500), ...freshOpts });

  const company = settings[0] || {};
  const [showModal, setShowModal] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showStatusWarning, setShowStatusWarning] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    payment_date: new Date().toISOString().split("T")[0],
    amount_paid: "",
    payment_method: "Check",
    check_number: "",
    job_id: "",
    job_title: "",
    notes: ""
  });

  const mgrPct = company.manager_pay_percent || 10;
  const mgrType = company.manager_pay_type || "percent";
  const mgrFlatAmt = company.manager_pay_flat_amount || 0;

  // Per-job breakdown — only jobs that have actually started
  const jobBreakdown = useMemo(() => {
    // Only open jobs — completed/cancelled excluded per updated pay schedule
    const activeJobs = jobs.filter(j =>
      j.status !== "completed" && j.status !== "cancelled"
    );
    return activeJobs.map(j => {
      const revenue = j.deposits_received || 0;
      const totalExpenses = jobReceipts
        .filter(r => r.job_id === j.id)
        .reduce((sum, r) => sum + (r.amount || 0), 0);
      const grossBeforeSubs = Math.max(0, revenue - totalExpenses);
      const rawPay = mgrType === "flat_rate" ? mgrFlatAmt : grossBeforeSubs * (mgrPct / 100);
      const mgrPay = j.manager_pay_waived ? 0 : rawPay;
      const waived = !!j.manager_pay_waived;

      // Payments attributed to this specific job
      const jobPayments = payments.filter(p => p.job_id === j.id);
      const jobPaidTotal = jobPayments.reduce((sum, p) => sum + (p.amount_paid || 0), 0);
      const jobRemaining = Math.max(0, mgrPay - jobPaidTotal);
      const isPaid = mgrPay > 0 && jobRemaining <= 0;

      return {
        id: j.id, title: j.title, client_name: j.client_name, status: j.status,
        revenue, totalExpenses, grossBeforeSubs, mgrPay, waived,
        jobPaidTotal, jobRemaining, isPaid, jobPayments
      };
    }).filter(j => j.revenue > 0 || j.mgrPay > 0);
  }, [jobs, jobReceipts, mgrPct, mgrType, mgrFlatAmt, payments]);

  const managerOwed = useMemo(() => jobBreakdown.reduce((sum, j) => sum + j.mgrPay, 0), [jobBreakdown]);

  const yearPayments = useMemo(() => payments.filter(p => (p.payment_date || "").startsWith(year)), [payments, year]);
  const yearTotal = useMemo(() => yearPayments.reduce((sum, p) => sum + (p.amount_paid || 0), 0), [yearPayments]);
  const remaining = useMemo(() => Math.max(0, managerOwed - yearTotal), [managerOwed, yearTotal]);

  // Jobs that still have unpaid manager balance — for the dropdown
  const unpaidJobs = useMemo(() => jobBreakdown.filter(j => !j.waived && j.jobRemaining > 0), [jobBreakdown]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ManagerPayment.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["managerPayments"] });
      setPaymentForm({
        payment_date: new Date().toISOString().split("T")[0],
        amount_paid: "", payment_method: "Check", check_number: "",
        job_id: "", job_title: "", notes: ""
      });
      setShowModal(false);
      toast({ title: "Payment recorded" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ManagerPayment.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["managerPayments"] });
      toast({ title: "Payment deleted" });
    },
  });

  const doSavePayment = () => {
    const amountPaid = parseFloat(paymentForm.amount_paid);
    const ytdAfter = yearTotal + amountPaid;
    createMutation.mutate({ ...paymentForm, amount_paid: amountPaid, ytd_total_after: ytdAfter });
    setShowStatusWarning(false);
  };

  const handleJobSelect = (jobId) => {
    if (jobId === "general") {
      setPaymentForm(f => ({ ...f, job_id: "", job_title: "" }));
      return;
    }
    const job = jobBreakdown.find(j => j.id === jobId);
    if (job) {
      setPaymentForm(f => ({
        ...f,
        job_id: jobId,
        job_title: job.title,
        amount_paid: String(job.jobRemaining > 0 ? job.jobRemaining.toFixed(2) : f.amount_paid)
      }));
    }
  };

  const handleAddPayment = () => {
    if (!paymentForm.payment_date || parseFloat(paymentForm.amount_paid) <= 0) {
      toast({ title: "Invalid payment", variant: "destructive" });
      return;
    }
    const riskyJobs = jobs.filter(j => j.status === "bidding" || j.status === "cancelled");
    if (riskyJobs.length > 0 && jobBreakdown.length > 0) {
      setShowStatusWarning(true);
      return;
    }
    doSavePayment();
  };

  if (!company.manager_name) {
    return (
      <Card className="p-5 bg-blue-50 border-blue-200">
        <p className="text-xs text-blue-800">Configure manager details above to enable payout tracking.</p>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-5 border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Manager Payout Tracking — {company.manager_name}</h3>
          <Button type="button" size="sm" onClick={() => setShowModal(true)} className="gap-1.5">
            <Plus className="w-4 h-4" /> Record Payment
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <button
            type="button"
            onClick={() => setShowBreakdown(true)}
            className="p-3 bg-blue-50 rounded border border-blue-200 text-left hover:bg-blue-100 transition-colors group"
          >
            <p className="text-xs text-blue-700 mb-1 flex items-center justify-between">
              Total Owed <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </p>
            <p className="text-lg font-bold text-blue-900">{formatCurrency(managerOwed)}</p>
            <p className="text-xs text-blue-600 mt-0.5">Click to see breakdown</p>
          </button>
          <div className="p-3 bg-green-50 rounded border border-green-200">
            <p className="text-xs text-green-700 mb-1">{year} Paid</p>
            <p className="text-lg font-bold text-green-900">{formatCurrency(yearTotal)}</p>
          </div>
          <div className={`p-3 rounded border ${remaining > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <p className={`text-xs mb-1 ${remaining > 0 ? 'text-red-700' : 'text-green-700'}`}>Remaining</p>
            <p className={`text-lg font-bold ${remaining > 0 ? 'text-red-900' : 'text-green-900'}`}>{formatCurrency(remaining)}</p>
          </div>
        </div>

        {/* Per-Job Payment Status */}
        {jobBreakdown.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Job Payment Status</p>
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {jobBreakdown.map(j => (
                <div key={j.id} className={`flex items-center justify-between p-2 rounded border text-xs ${
                  j.waived ? 'bg-orange-50 border-orange-200' :
                  j.isPaid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-100'
                }`}>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {j.waived
                      ? <span className="text-orange-500">🚫</span>
                      : j.isPaid
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                        : <Clock className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    }
                    <span className="font-medium truncate">{j.title}</span>
                    <span className="text-muted-foreground shrink-0">{j.client_name ? `· ${j.client_name}` : ""}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2 text-right">
                    <span className="text-muted-foreground">Owed: <strong>{j.waived ? "WAIVED" : formatCurrency(j.mgrPay)}</strong></span>
                    {!j.waived && (
                      <>
                        <span className="text-green-700">Paid: <strong>{formatCurrency(j.jobPaidTotal)}</strong></span>
                        {j.jobRemaining > 0 && <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Owes {formatCurrency(j.jobRemaining)}</Badge>}
                        {j.isPaid && <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">✓ Paid</Badge>}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment History */}
        {yearPayments.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Payment History</p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {yearPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                  <div className="flex-1">
                    <p className="font-medium">{formatCurrency(p.amount_paid)} · {p.payment_method}</p>
                    {p.job_title && <p className="text-xs text-purple-700 font-medium">📌 {p.job_title}</p>}
                    <p className="text-xs text-muted-foreground">{formatDate(p.payment_date)} {p.check_number && `(Check #${p.check_number})`}</p>
                    {p.notes && <p className="text-xs text-muted-foreground italic">{p.notes}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(p.id)}
                    disabled={deleteMutation.isPending}
                    className="text-destructive hover:bg-destructive/10 rounded p-1 transition-colors"
                    aria-label="Remove payment"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Total Owed Breakdown Dialog */}
      <Dialog open={showBreakdown} onOpenChange={setShowBreakdown}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Manager Pay Breakdown —{" "}
              {mgrType === "flat_rate" ? `$${mgrFlatAmt.toLocaleString()} flat rate per job` : `${mgrPct}% of Gross per Job`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-6 gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b pb-2">
              <span className="col-span-2">Job</span>
              <span className="text-right">Collected</span>
              <span className="text-right">Owed</span>
              <span className="text-right">Paid</span>
              <span className="text-right">Balance</span>
            </div>
            {jobBreakdown.map(j => (
              <div key={j.id} className={`grid grid-cols-6 gap-2 py-2 border-b border-border/50 last:border-0 ${j.isPaid ? 'opacity-60' : ''}`}>
                <div className="col-span-2 min-w-0">
                  <p className="font-medium truncate">{j.title}</p>
                  <p className="text-xs text-muted-foreground">{j.client_name || "—"} · <span className="capitalize">{j.status?.replace(/_/g, " ")}</span></p>
                  {j.waived && <p className="text-xs text-orange-600 font-medium">⚠ Pay Waived</p>}
                  {j.isPaid && <Badge className="bg-green-100 text-green-700 text-xs mt-0.5">✓ Paid</Badge>}
                </div>
                <p className="text-right">{formatCurrency(j.revenue)}</p>
                <p className="text-right font-semibold text-blue-700">{j.waived ? "—" : formatCurrency(j.mgrPay)}</p>
                <p className="text-right text-green-700">{formatCurrency(j.jobPaidTotal)}</p>
                <p className={`text-right font-bold ${j.jobRemaining > 0 && !j.waived ? 'text-red-600' : 'text-green-600'}`}>
                  {j.waived ? "—" : formatCurrency(j.jobRemaining)}
                </p>
              </div>
            ))}
            <div className="grid grid-cols-6 gap-2 pt-2 font-bold border-t-2">
              <span className="col-span-2">Total</span>
              <span className="text-right">{formatCurrency(jobBreakdown.reduce((s, j) => s + j.revenue, 0))}</span>
              <span className="text-right text-blue-700">{formatCurrency(managerOwed)}</span>
              <span className="text-right text-green-700">{formatCurrency(yearTotal)}</span>
              <span className={`text-right ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(remaining)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowBreakdown(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Warning Dialog */}
      <Dialog open={showStatusWarning} onOpenChange={setShowStatusWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="w-5 h-5" /> Unusual Job Status
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Some jobs are in <strong>Bidding</strong> or <strong>Cancelled</strong> status. Recording a manager payment against these is unusual. Proceed?
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowStatusWarning(false)}>Cancel</Button>
            <Button type="button" onClick={doSavePayment} disabled={createMutation.isPending} className="gap-1.5">
              <Check className="w-4 h-4" /> Yes, Record Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Payment Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Manager Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Job reference dropdown — shows unpaid jobs */}
            <div>
              <Label>Job Reference <span className="text-muted-foreground">(select which job this pay is for)</span></Label>
              <Select
                value={paymentForm.job_id || "general"}
                onValueChange={handleJobSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a job..." />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[9999]">
                  <SelectItem value="general">— General / No specific job —</SelectItem>
                  {unpaidJobs.map(j => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.title}{j.client_name ? ` · ${j.client_name}` : ""} (owes {formatCurrency(j.jobRemaining)})
                    </SelectItem>
                  ))}
                  {unpaidJobs.length === 0 && (
                    <SelectItem value="all-paid" disabled>All jobs paid ✓</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {paymentForm.job_id && (
                <p className="text-xs text-purple-700 mt-1">
                  📌 Payment will be attributed to: <strong>{paymentForm.job_title}</strong>
                </p>
              )}
            </div>

            <div>
              <Label>Payment Date</Label>
              <Input
                type="date"
                value={paymentForm.payment_date}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Amount Paid ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={paymentForm.amount_paid}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount_paid: e.target.value })}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground mt-1">Overall remaining: {formatCurrency(remaining)}</p>
            </div>
            <div>
              <Label>Payment Method</Label>
              <Select value={paymentForm.payment_method} onValueChange={(v) => setPaymentForm({ ...paymentForm, payment_method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent position="popper" className="z-[9999]">
                  <SelectItem value="Check">Check</SelectItem>
                  <SelectItem value="ACH">ACH</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Zelle">Zelle</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {paymentForm.payment_method === "Check" && (
              <div>
                <Label>Check Number (optional)</Label>
                <Input
                  value={paymentForm.check_number}
                  onChange={(e) => setPaymentForm({ ...paymentForm, check_number: e.target.value })}
                  placeholder="e.g. 1025"
                />
              </div>
            )}
            <div>
              <Label>Notes (optional)</Label>
              <Input
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                placeholder="e.g. Q1 bonus"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="button" onClick={handleAddPayment} disabled={createMutation.isPending} className="gap-1.5">
              <Check className="w-4 h-4" /> Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}