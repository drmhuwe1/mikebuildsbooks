import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Plus, CheckCircle2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";

export default function JobPaymentTracking({ job, subPayments = [], ledgerPayments = [] }) {
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [paymentData, setPaymentData] = useState({ amount: "", date: "" });
  const qc = useQueryClient();

  const addPaymentMutation = useMutation({
    mutationFn: async () => {
      const amount = parseFloat(paymentData.amount);
      await base44.entities.Job.update(job.id, {
        deposits_received: (job.deposits_received || 0) + amount,
        total_paid_by_customer: (job.total_paid_by_customer || 0) + amount,
      });
      // Also update the linked contract's client_paid_amount so receivables stay accurate
      const linkedContracts = await base44.entities.Contract.filter({ job_id: job.id });
      const contract = linkedContracts[0];
      if (contract) {
        await base44.entities.Contract.update(contract.id, {
          client_paid_amount: (contract.client_paid_amount || 0) + amount,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["contracts"] });
      setPaymentData({ amount: "", date: "" });
      setShowAddPayment(false);
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: (paymentId) =>
      base44.entities.SubcontractorPayment.delete(paymentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subPayments"] });
    },
  });

  const outstanding = (job.contract_amount || 0) - (job.deposits_received || 0);
  const totalSubPayouts = subPayments.reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Client Payments */}
      <div>
        <h3 className="font-semibold text-sm mb-3">Client Payments</h3>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 bg-green-50 rounded border border-green-200">
            <p className="text-xs text-green-700 mb-1">Collected</p>
            <p className="text-lg font-bold text-green-900">{formatCurrency(job.deposits_received || 0)}</p>
          </div>
          <div className="p-3 bg-orange-50 rounded border border-orange-200">
            <p className="text-xs text-orange-700 mb-1">Outstanding</p>
            <p className="text-lg font-bold text-orange-900">{formatCurrency(Math.max(0, outstanding))}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded border border-blue-200">
            <p className="text-xs text-blue-700 mb-1">Contract Total</p>
            <p className="text-lg font-bold text-blue-900">{formatCurrency(job.contract_amount || 0)}</p>
          </div>
        </div>

        {showAddPayment ? (
          <Card className="p-4 mb-3">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Amount</Label>
                  <Input
                    type="number"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData(p => ({ ...p, amount: e.target.value }))}
                    placeholder="$0.00"
                  />
                </div>
                <div>
                  <Label className="text-xs">Date</Label>
                  <Input
                    type="date"
                    value={paymentData.date}
                    onChange={(e) => setPaymentData(p => ({ ...p, date: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => addPaymentMutation.mutate()}
                  disabled={!paymentData.amount}
                >
                  Add Payment
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddPayment(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => setShowAddPayment(true)}
          >
            <Plus className="w-3.5 h-3.5" /> Add Payment
          </Button>
        )}
      </div>

      {/* Subcontractor Payouts */}
      <div>
        <h3 className="font-semibold text-sm mb-3">Subcontractor Payouts</h3>
        {ledgerPayments.length > 0 ? (
          <div className="space-y-2">
            <div className="p-3 bg-amber-50 rounded border border-amber-200 mb-3">
              <p className="text-xs text-amber-700 mb-1">Total Paid to Subs</p>
              <p className="text-lg font-bold text-amber-900">{formatCurrency(ledgerPayments.reduce((s, p) => s + (p.amount_paid || 0), 0))}</p>
            </div>
            {ledgerPayments.map((payment) => (
              <Card key={payment.id} className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{payment.subcontractor_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(payment.payment_date)} · {payment.payment_method || ""}</p>
                    {payment.check_number && <p className="text-xs text-muted-foreground">Check #{payment.check_number}</p>}
                    {payment.notes && <p className="text-xs text-muted-foreground italic">{payment.notes}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-green-700">{formatCurrency(payment.amount_paid || 0)}</p>
                    <div className="flex items-center gap-1 text-xs text-green-600 justify-end">
                      <CheckCircle2 className="w-3 h-3" /> Paid
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : subPayments.length > 0 ? (
          <div className="space-y-2">
            {subPayments.map((payment) => (
              <Card key={payment.id} className="p-3 flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm">{payment.subcontractor_name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(payment.payment_date)}</p>
                </div>
                <p className="font-bold text-sm">{formatCurrency(payment.amount || 0)}</p>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No sub payouts recorded for this job. Record payments via the Sub Labor tab.</p>
        )}
      </div>
    </div>
  );
}