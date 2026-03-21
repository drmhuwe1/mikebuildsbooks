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

export default function OwnerPayoutTracker() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const year = String(new Date().getFullYear());

  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date", 500) });
  const { data: settings = [] } = useQuery({ queryKey: ["settings"], queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }) });
  const { data: txns = [] } = useQuery({ queryKey: ["transactions"], queryFn: () => base44.entities.BankTransaction.list("-date", 500) });
  
  const company = settings[0] || {};
  const [showModal, setShowModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ payment_date: new Date().toISOString().split("T")[0], amount_paid: 0, payment_method: "Check", check_number: "", notes: "" });

  // Calculate owner's owed amount from job profit (after manager & reserves)
  const ownerOwed = useMemo(() => {
    return jobs.reduce((sum, job) => {
      const revenue = (job.deposits_received || 0);
      const costs = (job.material_costs || 0) + (job.labor_costs || 0) + (job.subcontractor_costs || 0) + (job.permit_costs || 0) + (job.equipment_costs || 0) + (job.overhead_costs || 0) + (job.other_costs || 0);
      const profit = revenue - costs;
      
      // Deduct manager pay and reserves
      const managerPay = profit * (company.manager_pay_percent || 10) / 100;
      const afterManager = profit - managerPay;
      const taxReserve = afterManager * (company.tax_reserve_percent || 25) / 100;
      const opReserve = afterManager * (company.operating_reserve_percent || 5) / 100;
      const ownerDraw = afterManager - taxReserve - opReserve;
      
      return sum + Math.max(0, ownerDraw);
    }, 0);
  }, [jobs, company]);

  // YTD owner draws from transactions
  const yearDraws = useMemo(() => {
    return txns.filter(t => (t.date || "").startsWith(year) && t.category === "owner_draw" && t.type === "outflow");
  }, [txns, year]);
  
  const yearTotal = useMemo(() => yearDraws.reduce((sum, t) => sum + (t.amount || 0), 0), [yearDraws]);
  const remaining = useMemo(() => Math.max(0, ownerOwed - yearTotal), [ownerOwed, yearTotal]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.BankTransaction.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      setPaymentForm({ payment_date: new Date().toISOString().split("T")[0], amount_paid: 0, payment_method: "Check", check_number: "", notes: "" });
      setShowModal(false);
      toast({ title: "Owner draw recorded" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BankTransaction.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast({ title: "Draw deleted" });
    },
  });

  const handleAddPayment = () => {
    if (!paymentForm.payment_date || paymentForm.amount_paid <= 0) {
      toast({ title: "Invalid draw", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      description: `Owner draw - ${paymentForm.notes || 'Personal distribution'}`,
      amount: parseFloat(paymentForm.amount_paid),
      type: "outflow",
      date: paymentForm.payment_date,
      category: "owner_draw",
      bank_account_id: null,
      bank_account_name: paymentForm.payment_method,
      is_categorized: true,
      notes: paymentForm.notes || "",
    });
  };

  return (
    <>
      <Card className="p-5 border-amber-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Owner Payout Tracking — {company.owner_name || "Owner"}</h3>
          <Button size="sm" onClick={() => setShowModal(true)} className="gap-1.5">
            <Plus className="w-4 h-4" /> Record Draw
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 bg-blue-50 rounded border border-blue-200">
            <p className="text-xs text-blue-700 mb-1">Total Owed</p>
            <p className="text-lg font-bold text-blue-900">{formatCurrency(ownerOwed)}</p>
          </div>
          <div className="p-3 bg-green-50 rounded border border-green-200">
            <p className="text-xs text-green-700 mb-1">{year} Drawn</p>
            <p className="text-lg font-bold text-green-900">{formatCurrency(yearTotal)}</p>
          </div>
          <div className={`p-3 rounded border ${remaining > 0 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
            <p className={`text-xs mb-1 ${remaining > 0 ? 'text-orange-700' : 'text-green-700'}`}>Remaining</p>
            <p className={`text-lg font-bold ${remaining > 0 ? 'text-orange-900' : 'text-green-900'}`}>{formatCurrency(remaining)}</p>
          </div>
        </div>

        {/* Draw History */}
        {yearDraws.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Draw History</p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {yearDraws.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                  <div className="flex-1">
                    <p className="font-medium">{formatCurrency(t.amount)} • {t.bank_account_name || "Bank Transfer"}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
                    {t.notes && <p className="text-xs text-muted-foreground italic">{t.notes}</p>}
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(t.id)}
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

      {/* Record Draw Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Owner Draw</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Draw Date</Label>
              <Input
                type="date"
                value={paymentForm.payment_date}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Amount ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={paymentForm.amount_paid}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount_paid: e.target.value })}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground mt-1">Available to draw: {formatCurrency(remaining)}</p>
            </div>
            <div>
              <Label>Payment Method</Label>
              <Select value={paymentForm.payment_method} onValueChange={(v) => setPaymentForm({ ...paymentForm, payment_method: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Check">Check</SelectItem>
                  <SelectItem value="ACH">ACH</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Zelle">Zelle</SelectItem>
                  <SelectItem value="Wire Transfer">Wire Transfer</SelectItem>
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
                placeholder="e.g. Monthly distribution"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleAddPayment} disabled={createMutation.isPending} className="gap-1.5">
              <Check className="w-4 h-4" /> Record Draw
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}