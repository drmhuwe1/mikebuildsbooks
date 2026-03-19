import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, CheckCircle2, Clock } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";

export default function JobPaymentTracking({ job, subPayments = [] }) {
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [paymentData, setPaymentData] = useState({ amount: "", date: "" });
  const qc = useQueryClient();

  const addPaymentMutation = useMutation({
    mutationFn: () =>
      base44.entities.Job.update(job.id, {
        deposits_received: (job.deposits_received || 0) + parseFloat(paymentData.amount),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
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
        <div className="p-3 bg-amber-50 rounded border border-amber-200 mb-3">
          <p className="text-xs text-amber-700 mb-1">Total Payouts</p>
          <p className="text-lg font-bold text-amber-900">{formatCurrency(totalSubPayouts)}</p>
        </div>

        {subPayments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payouts recorded</p>
        ) : (
          <div className="space-y-2">
            {subPayments.map((payment) => (
              <Card key={payment.id} className="p-3 flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm">{payment.subcontractor_name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(payment.payment_date)}</p>
                  {payment.calculation_notes && (
                    <p className="text-xs text-muted-foreground mt-1">{payment.calculation_notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="font-bold text-sm">{formatCurrency(payment.amount || 0)}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {payment.status === "paid" ? (
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                      ) : (
                        <Clock className="w-3 h-3 text-yellow-600" />
                      )}
                      {payment.status}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deletePaymentMutation.mutate(payment.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}