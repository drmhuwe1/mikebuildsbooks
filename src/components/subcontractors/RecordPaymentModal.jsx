import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/formatters";

export default function RecordPaymentModal({ open, onClose, subcontractor, unpaidEntries = [], existingPayments = [] }) {
  const qc = useQueryClient();
  const today = new Date().toISOString().split("T")[0];
  const [selected, setSelected] = useState([]);
  const [form, setForm] = useState({ payment_date: today, payment_method: "Check", check_number: "", notes: "", amount_paid: 0 });
  const [saving, setSaving] = useState(false);

  const totalDue = useMemo(() => selected.reduce((s, id) => {
    const e = unpaidEntries.find(x => x.id === id);
    return s + (e?.calculated_pay || 0);
  }, 0), [selected, unpaidEntries]);

  const totalHours = useMemo(() => selected.reduce((s, id) => {
    const e = unpaidEntries.find(x => x.id === id);
    return s + (e?.hours_worked || 0);
  }, 0), [selected, unpaidEntries]);

  const handleToggle = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    setSelected(unpaidEntries.map(e => e.id));
  };

  // Sync amount_paid when selection changes
  const amountPaid = form.amount_paid || totalDue;

  // Calculate YTD after this payment
  const ytdPaid = existingPayments
    .filter(p => p.is_paid && (p.payment_date || "").startsWith(String(new Date().getFullYear())))
    .reduce((s, p) => s + (p.amount_paid || 0), 0);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (selected.length === 0) return;
    setSaving(true);

    // Find date range
    const selectedEntries = unpaidEntries.filter(e => selected.includes(e.id));
    const dates = selectedEntries.map(e => e.work_date).sort();
    const payPeriodStart = dates[0];
    const payPeriodEnd = dates[dates.length - 1];

    const paidAmount = parseFloat(form.amount_paid) || totalDue;
    const ytdAfter = ytdPaid + paidAmount;

    const payment = await base44.entities.SubcontractorLedgerPayment.create({
      subcontractor_id: subcontractor.id,
      subcontractor_name: subcontractor.name,
      job_id: selectedEntries[0]?.job_id || "",
      job_title: selectedEntries[0]?.job_title || "",
      pay_period_start: payPeriodStart,
      pay_period_end: payPeriodEnd,
      work_entry_ids: selected,
      total_hours: totalHours,
      total_amount_due: totalDue,
      amount_paid: paidAmount,
      payment_date: form.payment_date,
      payment_method: form.payment_method,
      check_number: form.check_number,
      notes: form.notes,
      is_paid: true,
      ytd_total_after_this: ytdAfter,
    });

    // Mark each work entry as paid
    await Promise.all(selected.map(id =>
      base44.entities.SubcontractorWorkEntry.update(id, {
        payment_status: "Paid",
        payment_id: payment.id,
      })
    ));

    qc.invalidateQueries({ queryKey: ["workEntries"] });
    qc.invalidateQueries({ queryKey: ["workEntries", subcontractor.id] });
    qc.invalidateQueries({ queryKey: ["ledgerPayments"] });
    qc.invalidateQueries({ queryKey: ["ledgerPayments", subcontractor.id] });
    setSaving(false);
    onClose();
  };

  // Group unpaid entries by job
  const byJob = {};
  unpaidEntries.forEach(e => {
    if (!byJob[e.job_id]) byJob[e.job_id] = { title: e.job_title || "Unknown Job", entries: [] };
    byJob[e.job_id].entries.push(e);
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Payment — {subcontractor?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Unpaid entries */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Select Work Entries to Pay</Label>
              <button onClick={handleSelectAll} className="text-xs text-primary underline">Select All</button>
            </div>
            {unpaidEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 bg-muted/20 rounded-lg">No unpaid entries.</p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto border rounded-lg p-2">
                {Object.entries(byJob).map(([jobId, { title, entries }]) => (
                  <div key={jobId}>
                    <p className="text-xs font-semibold text-muted-foreground px-1 py-1">{title}</p>
                    {entries.map(e => (
                      <label key={e.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/30 cursor-pointer">
                        <input type="checkbox" checked={selected.includes(e.id)} onChange={() => handleToggle(e.id)} className="rounded" />
                        <span className="text-xs flex-1">
                          {e.work_date} · {e.job_phase} · {e.pay_type}
                          {e.pay_type === "Hourly" ? ` · ${e.hours_worked}h` : ""}
                        </span>
                        <span className="text-xs font-semibold">{formatCurrency(e.calculated_pay)}</span>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          {selected.length > 0 && (
            <div className="p-3 bg-green-50 rounded-lg space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Hours</span>
                <span className="font-semibold">{totalHours.toFixed(1)}h</span>
              </div>
              <div className="flex justify-between text-sm font-bold">
                <span>Amount Due</span>
                <span className="text-green-700">{formatCurrency(totalDue)}</span>
              </div>
            </div>
          )}

          {/* Payment details */}
          <div>
            <Label>Amount Paid</Label>
            <Input type="number" step="0.01" placeholder={formatCurrency(totalDue)}
              value={form.amount_paid || ""} onChange={e => set("amount_paid", parseFloat(e.target.value) || 0)} />
            <p className="text-xs text-muted-foreground mt-1">Leave empty to pay full amount due</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Payment Date</Label>
              <Input type="date" value={form.payment_date} onChange={e => set("payment_date", e.target.value)} />
            </div>
            <div>
              <Label>Payment Method</Label>
              <Select value={form.payment_method} onValueChange={v => set("payment_method", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Check">Check</SelectItem>
                  <SelectItem value="ACH">ACH</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Zelle">Zelle</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {form.payment_method === "Check" && (
            <div>
              <Label>Check Number</Label>
              <Input value={form.check_number} onChange={e => set("check_number", e.target.value)} placeholder="e.g. 1042" />
            </div>
          )}
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={1} />
          </div>

          <Button className="w-full" onClick={handleSave} disabled={selected.length === 0 || saving}>
            {saving ? "Recording…" : `Record Payment${selected.length > 0 ? ` (${selected.length} entries)` : ""}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}