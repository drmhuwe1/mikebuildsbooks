import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, CheckCircle2, Clock } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { useToast } from "@/components/ui/use-toast";

export default function JobManagerPayTab({ job }) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const freshOpts = { staleTime: 0, refetchOnMount: "always" };
  const { data: payments = [] } = useQuery({
    queryKey: ["managerPayments", job.id],
    queryFn: () => base44.entities.ManagerPayment.filter({ job_id: job.id }),
    enabled: !!job.id,
    ...freshOpts,
  });
  const { data: settings = [] } = useQuery({
    queryKey: ["settings"],
    queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }),
    ...freshOpts,
  });
  const { data: jobReceipts = [] } = useQuery({
    queryKey: ["job-receipts", job.id],
    queryFn: () => base44.entities.JobReceipt.filter({ job_id: job.id }),
    enabled: !!job.id,
    ...freshOpts,
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    payment_date: new Date().toISOString().split("T")[0],
    amount_paid: "",
    payment_method: "Check",
    check_number: "",
    notes: "",
  });

  const company = settings[0] || {};
  const mgrPct = company.manager_pay_percent || 10;
  const mgrType = company.manager_pay_type || "percent";
  const mgrFlatAmt = company.manager_pay_flat_amount || 0;

  const managerPay = useMemo(() => {
    if (job.manager_pay_waived) return 0;
    const revenue = job.deposits_received || 0;
    const expenses = jobReceipts.reduce((sum, r) => sum + (r.amount || 0), 0);
    const grossBeforeSubs = Math.max(0, revenue - expenses);
    return mgrType === "flat_rate" ? mgrFlatAmt : grossBeforeSubs * (mgrPct / 100);
  }, [job, jobReceipts, mgrType, mgrFlatAmt, mgrPct]);

  const totalPaid = useMemo(() => payments.reduce((sum, p) => sum + (p.amount_paid || 0), 0), [payments]);
  const remaining = Math.max(0, managerPay - totalPaid);
  const isPaid = managerPay > 0 && remaining <= 0;

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ManagerPayment.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["managerPayments"] });
      qc.invalidateQueries({ queryKey: ["managerPayments", job.id] });
      setForm({ payment_date: new Date().toISOString().split("T")[0], amount_paid: "", payment_method: "Check", check_number: "", notes: "" });
      setShowForm(false);
      toast({ title: "Manager payment recorded" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ManagerPayment.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["managerPayments"] });
      qc.invalidateQueries({ queryKey: ["managerPayments", job.id] });
      toast({ title: "Payment removed" });
    },
  });

  const handleSave = () => {
    const amount = parseFloat(form.amount_paid);
    if (!form.payment_date || amount <= 0) {
      toast({ title: "Enter a valid amount and date", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      ...form,
      amount_paid: amount,
      job_id: job.id,
      job_title: job.title,
    });
  };

  if (job.manager_pay_waived) {
    return (
      <div className="p-4 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
        🚫 Manager pay is <strong>waived</strong> for this job. No payment tracking needed.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-xs text-blue-700 mb-1">Mgr Pay Owed</p>
          <p className="text-lg font-bold text-blue-900">{formatCurrency(managerPay)}</p>
          <p className="text-xs text-blue-600">{mgrType === "flat_rate" ? `$${mgrFlatAmt} flat rate` : `${mgrPct}% of gross`}</p>
        </div>
        <div className="p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-xs text-green-700 mb-1">Total Paid</p>
          <p className="text-lg font-bold text-green-900">{formatCurrency(totalPaid)}</p>
        </div>
        <div className={`p-3 rounded border ${remaining > 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
          <p className={`text-xs mb-1 ${remaining > 0 ? "text-red-700" : "text-green-700"}`}>Remaining</p>
          <p className={`text-lg font-bold ${remaining > 0 ? "text-red-900" : "text-green-900"}`}>{formatCurrency(remaining)}</p>
        </div>
      </div>

      {/* Paid Badge */}
      {isPaid && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span className="text-sm font-semibold text-green-800">Manager fully paid for this job</span>
        </div>
      )}
      {!isPaid && managerPay > 0 && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded">
          <Clock className="w-5 h-5 text-amber-600" />
          <span className="text-sm font-semibold text-amber-800">{formatCurrency(remaining)} still owed to manager</span>
        </div>
      )}

      {/* Add Payment */}
      {!showForm ? (
        <Button type="button" size="sm" onClick={() => { setForm(f => ({ ...f, amount_paid: String(remaining > 0 ? remaining.toFixed(2) : "") })); setShowForm(true); }} className="gap-1.5">
          <Plus className="w-4 h-4" /> Record Manager Payment
        </Button>
      ) : (
        <div className="border rounded p-4 space-y-3 bg-muted/20">
          <p className="text-sm font-semibold">Record Payment</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date</Label>
              <Input type="date" value={form.payment_date} onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))} />
            </div>
            <div>
              <Label>Amount ($)</Label>
              <Input type="number" step="0.01" value={form.amount_paid} onChange={e => setForm(f => ({ ...f, amount_paid: e.target.value }))} placeholder="0.00" />
            </div>
            <div>
              <Label>Method</Label>
              <Select value={form.payment_method} onValueChange={v => setForm(f => ({ ...f, payment_method: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  {["Check", "ACH", "Cash", "Zelle", "Other"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {form.payment_method === "Check" && (
              <div>
                <Label>Check #</Label>
                <Input value={form.check_number} onChange={e => setForm(f => ({ ...f, check_number: e.target.value }))} placeholder="e.g. 1025" />
              </div>
            )}
            <div className="col-span-2">
              <Label>Notes (optional)</Label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional note" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handleSave} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Saving..." : "Save Payment"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Payment History */}
      {payments.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Payment History</p>
          <div className="space-y-1.5">
            {payments.map(p => (
              <div key={p.id} className="flex items-center justify-between p-2.5 bg-muted/30 rounded border text-sm">
                <div>
                  <p className="font-medium">{formatCurrency(p.amount_paid)} · {p.payment_method}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(p.payment_date)}{p.check_number ? ` · Check #${p.check_number}` : ""}</p>
                  {p.notes && <p className="text-xs text-muted-foreground italic">{p.notes}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(p.id)}
                  disabled={deleteMutation.isPending}
                  className="text-destructive hover:bg-destructive/10 rounded p-1"
                  aria-label="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {payments.length === 0 && !showForm && (
        <p className="text-sm text-muted-foreground">No manager payments recorded for this job yet.</p>
      )}
    </div>
  );
}