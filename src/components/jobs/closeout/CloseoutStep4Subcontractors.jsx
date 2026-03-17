import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";
import { CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function CloseoutStep4Subcontractors({ job, subs, jobSubPayments }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [payments, setPayments] = React.useState({});

  const createPayment = useMutation({
    mutationFn: (data) => base44.entities.SubcontractorPayment.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subPayments"] });
      toast({ title: "Payment recorded" });
    },
  });

  const jobSubs = subs.filter(s => {
    const hasPayment = jobSubPayments.some(p => p.subcontractor_id === s.id);
    return hasPayment || job.subcontractor_costs > 0;
  });

  const allSubs = subs;

  const getPaidForSub = (subId) =>
    jobSubPayments.filter(p => p.subcontractor_id === subId && p.status === "paid").reduce((sum, p) => sum + (p.amount || 0), 0);

  const handleRecord = async (sub) => {
    const amount = parseFloat(payments[sub.id] || 0);
    if (!amount) return;
    await createPayment.mutateAsync({
      subcontractor_id: sub.id,
      subcontractor_name: sub.name,
      job_id: job.id,
      job_title: job.title,
      amount,
      payment_date: new Date().toISOString().split("T")[0],
      description: "Final closeout payment",
      status: "paid",
    });
    setPayments(p => ({ ...p, [sub.id]: "" }));
  };

  const subsWithPayments = allSubs.filter(s =>
    jobSubPayments.some(p => p.subcontractor_id === s.id)
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold">Step 4 — Subcontractor Payments</h2>
        <p className="text-sm text-muted-foreground mt-1">Review all subcontractor payments for this job and record any remaining balances.</p>
      </div>

      {subsWithPayments.length === 0 && (
        <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-4 text-center">
          No subcontractor payments recorded for this job yet.
        </div>
      )}

      {subsWithPayments.map(sub => {
        const paid = getPaidForSub(sub.id);
        const pending = jobSubPayments.filter(p => p.subcontractor_id === sub.id && p.status === "pending").reduce((sum, p) => sum + (p.amount || 0), 0);
        return (
          <div key={sub.id} className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{sub.name}</p>
                <p className="text-xs text-muted-foreground">{sub.specialty || sub.company || "—"}</p>
              </div>
              {pending === 0 ? (
                <Badge className="bg-green-100 text-green-700 text-xs"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>
              ) : (
                <Badge className="bg-yellow-100 text-yellow-700 text-xs">Balance: {formatCurrency(pending)}</Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span className="text-muted-foreground">Total Paid</span><br /><strong>{formatCurrency(paid)}</strong></div>
              <div><span className="text-muted-foreground">Remaining</span><br /><strong className={pending > 0 ? "text-red-600" : "text-green-600"}>{formatCurrency(pending)}</strong></div>
            </div>
            {pending > 0 && (
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-xs">Record Final Payment ($)</Label>
                  <Input
                    type="number"
                    value={payments[sub.id] || ""}
                    onChange={e => setPayments(p => ({ ...p, [sub.id]: e.target.value }))}
                    placeholder={String(pending)}
                  />
                </div>
                <Button size="sm" onClick={() => handleRecord(sub)} disabled={createPayment.isPending}>
                  Record
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}