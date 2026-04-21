import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, CheckCircle2, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/formatters";

export default function JobCloseoutWizard({ job, onClose, onJobClosed }) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: settings = [] } = useQuery({
    queryKey: ["settings"],
    queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }),
  });
  const s = settings[0] || {};

  const [completionDate, setCompletionDate] = useState(
    job.actual_completion || new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");

  const closeMutation = useMutation({
    mutationFn: () => base44.entities.Job.update(job.id, {
      status: "completed",
      actual_completion: completionDate,
      notes: job.notes ? job.notes + (notes ? `\n\n[CLOSEOUT NOTE] ${notes}` : "") : notes,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      toast({ title: "Job closed!", description: `${job.title} marked as completed.` });
      onJobClosed?.();
      onClose();
    },
  });

  // Financial calculations from job data (no re-entry needed)
  const adjustedContract = (job.contract_amount || 0) + (job.change_orders_total || 0);
  const totalCosts = (job.material_costs || 0) + (job.labor_costs || 0) + (job.subcontractor_costs || 0)
    + (job.permit_costs || 0) + (job.equipment_costs || 0) + (job.overhead_costs || 0) + (job.other_costs || 0);
  const grossProfit = adjustedContract - totalCosts;
  const managerPct = s.manager_pay_percent ?? 10;
  const managerPay = Math.max(0, grossProfit) * (managerPct / 100);
  const taxPct = s.tax_reserve_percent ?? 25;
  const opsPct = s.operating_reserve_percent ?? 5;
  const netProfit = grossProfit - managerPay;
  const taxReserve = Math.max(0, netProfit) * (taxPct / 100);
  const opsReserve = Math.max(0, netProfit) * (opsPct / 100);
  const ownerTakeHome = netProfit - taxReserve - opsReserve;

  const totalCollected = (job.total_paid_by_customer || 0) > 0
    ? (job.total_paid_by_customer || 0)
    : (job.deposits_received || 0);
  const writeOff = job.write_off_amount || 0;
  const outstanding = Math.max(0, adjustedContract - totalCollected - writeOff);

  const rows = [
    { label: "Original Contract", value: job.contract_amount || 0, color: "text-foreground" },
    { label: `Change Orders`, value: job.change_orders_total || 0, color: "text-blue-600", hide: !job.change_orders_total },
    { label: "Adjusted Contract Total", value: adjustedContract, color: "text-foreground font-bold", border: true },
    { label: "Total Costs", value: -totalCosts, color: "text-red-600" },
    { label: "Gross Profit", value: grossProfit, color: grossProfit >= 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold", border: true },
    { label: `Manager Pay (${managerPct}%)`, value: -managerPay, color: "text-purple-600" },
    { label: "Net Profit", value: netProfit, color: netProfit >= 0 ? "text-green-700 font-bold" : "text-red-700 font-bold", border: true },
    { label: `Tax Reserve (${taxPct}%)`, value: -taxReserve, color: "text-yellow-700" },
    { label: `Op. Reserve (${opsPct}%)`, value: -opsReserve, color: "text-slate-500" },
    { label: "Owner Take-Home", value: ownerTakeHome, color: ownerTakeHome >= 0 ? "text-emerald-700 font-bold" : "text-red-700 font-bold", border: true },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Close Out Job</p>
            <p className="text-sm font-bold truncate">{job.title}</p>
            <p className="text-xs text-muted-foreground">{job.client_name}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Financial Summary */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> Financial Summary (from job data)
            </p>
            <div className="bg-muted/30 rounded-lg border divide-y text-sm">
              {rows.filter(r => !r.hide).map(r => (
                <div key={r.label} className={`flex justify-between items-center px-3 py-2 ${r.border ? "border-t-2 border-border mt-0" : ""}`}>
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className={r.color}>{formatCurrency(Math.abs(r.value))}{r.value < 0 && r.label !== "Total Costs" ? " (deducted)" : ""}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Status */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" /> Payment Status
            </p>
            <div className="bg-muted/30 rounded-lg border divide-y text-sm">
              <div className="flex justify-between px-3 py-2">
                <span className="text-muted-foreground">Collected</span>
                <span className="font-medium">{formatCurrency(totalCollected)}</span>
              </div>
              {writeOff > 0 && (
                <div className="flex justify-between px-3 py-2">
                  <span className="text-muted-foreground">Written Off</span>
                  <span className="text-red-600 font-medium">{formatCurrency(writeOff)}</span>
                </div>
              )}
              <div className="flex justify-between px-3 py-2">
                <span className="text-muted-foreground">Outstanding Balance</span>
                <span className={outstanding > 0 ? "text-orange-600 font-semibold" : "text-green-600 font-semibold"}>
                  {formatCurrency(outstanding)}
                </span>
              </div>
            </div>
            {outstanding > 0 && (
              <p className="text-xs text-orange-600 mt-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> There is still an outstanding balance — you can still close this job and collect later.
              </p>
            )}
          </div>

          {/* Completion Date + Notes */}
          <div className="space-y-3">
            <div>
              <Label>Actual Completion Date</Label>
              <Input type="date" value={completionDate} onChange={e => setCompletionDate(e.target.value)} />
            </div>
            <div>
              <Label>Closeout Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any final notes about this job..."
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t shrink-0 bg-card">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => closeMutation.mutate()}
            disabled={closeMutation.isPending}
            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle2 className="w-4 h-4" />
            {closeMutation.isPending ? "Closing..." : "Mark Job Closed"}
          </Button>
        </div>
      </div>
    </div>
  );
}