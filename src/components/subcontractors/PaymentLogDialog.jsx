import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";

export default function PaymentLogDialog({ open, onClose, subcontractor, jobs }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    payment_type: "hourly",
    hours_worked: 0,
    hourly_rate: subcontractor?.hourly_rate || 0,
    amount: 0,
    job_id: "",
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "venmo",
    payment_reference: "",
    notes: ""
  });

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.SubcontractorPayment.create({
      ...data,
      subcontractor_id: subcontractor.id,
      subcontractor_name: subcontractor.name,
      job_title: jobs.find(j => j.id === data.job_id)?.title || ""
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subPayments"] });
      onClose();
      setForm({
        payment_type: "hourly",
        hours_worked: 0,
        hourly_rate: subcontractor?.hourly_rate || 0,
        amount: 0,
        job_id: "",
        payment_date: new Date().toISOString().split("T")[0],
        payment_method: "venmo",
        payment_reference: "",
        notes: ""
      });
    }
  });

  const handleAmountChange = () => {
    if (form.payment_type === "hourly" && form.hours_worked && form.hourly_rate) {
      const calc = form.hours_worked * form.hourly_rate;
      setForm(f => ({
        ...f,
        amount: calc,
        calculation_notes: `${form.hours_worked} hours x $${form.hourly_rate}/hr`
      }));
    }
  };

  const handlePaymentTypeChange = (type) => {
    setForm(f => ({ ...f, payment_type: type, amount: 0, hours_worked: 0 }));
  };

  const canSubmit = form.job_id && form.amount > 0 && form.payment_date;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Payment - {subcontractor?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Job Selection */}
          <div>
            <Label>Job *</Label>
            <Select value={form.job_id} onValueChange={(v) => setForm(f => ({ ...f, job_id: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select job" />
              </SelectTrigger>
              <SelectContent>
                {jobs.filter(j => j.status !== "completed").map(job => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Type */}
          <div>
            <Label>Payment Type *</Label>
            <Select value={form.payment_type} onValueChange={handlePaymentTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Hourly Rate</SelectItem>
                <SelectItem value="per_day">Per Day</SelectItem>
                <SelectItem value="per_week">Per Week</SelectItem>
                <SelectItem value="fixed">Fixed Amount</SelectItem>
                <SelectItem value="lump_sum">Lump Sum</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Hours Input (for hourly) */}
          {form.payment_type === "hourly" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Hours Worked *</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={form.hours_worked}
                  onChange={(e) => {
                    setForm(f => ({ ...f, hours_worked: parseFloat(e.target.value) || 0 }));
                  }}
                  onBlur={handleAmountChange}
                />
              </div>
              <div>
                <Label>Hourly Rate *</Label>
                <Input
                  type="number"
                  value={form.hourly_rate}
                  onChange={(e) => {
                    setForm(f => ({ ...f, hourly_rate: parseFloat(e.target.value) || 0 }));
                  }}
                  onBlur={handleAmountChange}
                />
              </div>
            </div>
          )}

          {/* Amount */}
          <div>
            <Label>Total Amount *</Label>
            <Input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
              className="text-lg font-semibold"
            />
            {form.calculation_notes && (
              <p className="text-xs text-gray-500 mt-1">{form.calculation_notes}</p>
            )}
          </div>

          {/* Payment Date */}
          <div>
            <Label>Payment Date *</Label>
            <Input
              type="date"
              value={form.payment_date}
              onChange={(e) => setForm(f => ({ ...f, payment_date: e.target.value }))}
            />
          </div>

          {/* Payment Method */}
          <div>
            <Label>Payment Method *</Label>
            <Select value={form.payment_method} onValueChange={(v) => setForm(f => ({ ...f, payment_method: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="venmo">Venmo</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Reference */}
          <div>
            <Label>Payment Reference</Label>
            <Input
              placeholder={form.payment_method === "venmo" ? "Venmo transaction ID" : "Check # or reference"}
              value={form.payment_reference}
              onChange={(e) => setForm(f => ({ ...f, payment_reference: e.target.value }))}
            />
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea
              placeholder="Additional payment details..."
              value={form.notes}
              onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
            />
          </div>

          {/* Alert */}
          {form.amount > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                This payment of <strong>${form.amount.toFixed(2)}</strong> will be recorded and synced to Business Financials as a subcontractor expense.
              </p>
            </div>
          )}

          {/* Submit */}
          <Button
            className="w-full"
            onClick={() => mutation.mutate(form)}
            disabled={!canSubmit || mutation.isPending}
          >
            {mutation.isPending ? "Logging..." : "Log Payment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}