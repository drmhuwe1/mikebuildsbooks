import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Plus, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

export default function PaymentTracking({ job, onPaymentAdded }) {
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const qc = useQueryClient();

  const remaining = (job.contract_amount || 0) - (job.total_paid_by_customer || 0);
  const isPaid = remaining <= 0;

  const paymentMutation = useMutation({
    mutationFn: async (paymentData) => {
      const newTotal = (job.total_paid_by_customer || 0) + paymentData.amount;
      
      // Update job with payment
      await base44.entities.Job.update(job.id, {
        total_paid_by_customer: newTotal,
        deposits_received: newTotal,
      });

      // CRITICAL: Update linked contract's client_paid_amount (source of truth for revenue/tax reserve)
      const linkedContracts = await base44.entities.Contract.filter({ job_id: job.id });
      const contract = linkedContracts[0];
      if (contract) {
        await base44.entities.Contract.update(contract.id, {
          client_paid_amount: (contract.client_paid_amount || 0) + paymentData.amount,
        });
      }

      // Create bank transaction for income tracking
      await base44.entities.BankTransaction.create({
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["contracts"] });
  });

  const handleAddPayment = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    paymentMutation.mutate({ amount: parseFloat(amount), date });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Contract Amount</p>
          <p className="font-bold text-lg">{formatCurrency(job.contract_amount || 0)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Paid</p>
          <p className="font-bold text-lg text-green-600">{formatCurrency(job.total_paid_by_customer || 0)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Balance Due</p>
          <p className={`font-bold text-lg ${isPaid ? "text-green-600" : "text-red-600"}`}>
            {formatCurrency(Math.max(0, remaining))}
          </p>
        </div>
      </div>

      {isPaid && (
        <div className="bg-green-50 border border-green-200 rounded p-2 flex items-center gap-2 text-xs text-green-700">
          <AlertCircle className="w-4 h-4" />
          Payment complete
        </div>
      )}

      {!showForm ? (
        <Button size="sm" onClick={() => setShowForm(true)} variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-1" /> Record Payment
        </Button>
      ) : (
        <Card className="p-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Amount ($)</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="text-sm"
                max={remaining}
              />
            </div>
            <div>
              <Label className="text-xs">Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAddPayment}
              disabled={!amount || parseFloat(amount) <= 0 || paymentMutation.isPending}
              className="flex-1 text-xs"
            >
              {paymentMutation.isPending ? "Recording..." : "Record"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)} className="text-xs">
              Cancel
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}