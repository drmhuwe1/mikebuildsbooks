import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, X, Check } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { useToast } from "@/components/ui/use-toast";

export default function ManagerPayoutTracker() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const year = String(new Date().getFullYear());

  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date", 500) });
  const { data: settings = [] } = useQuery({ queryKey: ["settings"], queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }) });
  const { data: payments = [] } = useQuery({ queryKey: ["managerPayments"], queryFn: () => base44.entities.ManagerPayment.list("-payment_date", 500) });
  const { data: jobReceipts = [] } = useQuery({ queryKey: ["all-receipts"], queryFn: () => base44.entities.JobReceipt.list("-date", 500) });
  const { data: subLabor = [] } = useQuery({ queryKey: ["subLabor"], queryFn: () => base44.entities.SubcontractorWorkEntry.list("-created_date", 500) });

  const company = settings[0] || {};
  const [showModal, setShowModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ payment_date: new Date().toISOString().split("T")[0], amount_paid: "", payment_method: "Check", check_number: "", notes: "" });

  // Manager owed = mgr_pay_percent % of gross profit
  // Gross profit = total collected revenue − job receipt expenses − paid sub labor
  const managerOwed = useMemo(() => {
    const totalRevenue = jobs.reduce((sum, j) => sum + (j.deposits_received || 0), 0);
    const receiptTotal = jobReceipts.filter(r => !r.is_estimated).reduce((sum, r) => sum + (r.amount || 0), 0);
    const subLaborTotal = subLabor.filter(e => e.payment_status === "Paid").reduce((sum, e) => sum + (e.calculated_pay || 0), 0);
    const grossProfit = Math.max(0, totalRevenue - receiptTotal - subLaborTotal);
    return grossProfit * ((company.manager_pay_percent || 10) / 100);
  }, [jobs, jobReceipts, subLabor, company]);

  // YTD payments in current year
  const yearPayments = useMemo(() => payments.filter(p => (p.payment_date || "").startsWith(year)), [payments, year]);
  const yearTotal = useMemo(() => yearPayments.reduce((sum, p) => sum + (p.amount_paid || 0), 0), [yearPayments]);
  const remaining = useMemo(() => Math.max(0, managerOwed - yearTotal), [managerOwed, yearTotal]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ManagerPayment.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["managerPayments"] });
      setPaymentForm({ payment_date: new Date().toISOString().split("T")[0], amount_paid: "", payment_method: "Check", check_number: "", notes: "" });
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

  const handleAddPayment = () => {
    if (!paymentForm.payment_date || parseFloat(paymentForm.amount_paid) <= 0) {
      toast({ title: "Invalid payment", variant: "destructive" });
      return;
    }
    const amountPaid = parseFloat(paymentForm.amount_paid);
    const ytdAfter = yearTotal + amountPaid;
    createMutation.mutate({
      ...paymentForm,
      amount_paid: amountPaid,
      ytd_total_after: ytdAfter,
    });
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
          <Button size="sm" onClick={() => setShowModal(true)} className="gap-1.5">
            <Plus className="w-4 h-4" /> Record Payment
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 bg-blue-50 rounded border border-blue-200">
            <p className="text-xs text-blue-700 mb-1">Total Owed</p>
            <p className="text-lg font-bold text-blue-900">{formatCurrency(managerOwed)}</p>
          </div>
          <div className="p-3 bg-green-50 rounded border border-green-200">
            <p className="text-xs text-green-700 mb-1">{year} Paid</p>
            <p className="text-lg font-bold text-green-900">{formatCurrency(yearTotal)}</p>
          </div>
          <div className={`p-3 rounded border ${remaining > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <p className={`text-xs mb-1 ${remaining > 0 ? 'text-red-700' : 'text-green-700'}`}>Remaining</p>
            <p className={`text-lg font-bold ${remaining > 0 ? 'text-red-900' : 'text-green-900'}`}>{formatCurrency(remaining)}</p>
          </div>
        </div>

        {/* Payment History */}
        {yearPayments.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Payment History</p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {yearPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                  <div className="flex-1">
                    <p className="font-medium">{formatCurrency(p.amount_paid)} • {p.payment_method}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(p.payment_date)} {p.check_number && `(Check #${p.check_number})`}</p>
                    {p.notes && <p className="text-xs text-muted-foreground italic">{p.notes}</p>}
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(p.id)}
                    disabled={deleteMutation.isPending}
                    className="text-destructive hover:bg-destructive/10 rounded p-1 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Record Payment Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Manager Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
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
              <p className="text-xs text-muted-foreground mt-1">Remaining to pay: {formatCurrency(remaining)}</p>
            </div>
            <div>
              <Label>Payment Method</Label>
              <Select value={paymentForm.payment_method} onValueChange={(v) => setPaymentForm({ ...paymentForm, payment_method: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleAddPayment} disabled={createMutation.isPending} className="gap-1.5">
              <Check className="w-4 h-4" /> Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}