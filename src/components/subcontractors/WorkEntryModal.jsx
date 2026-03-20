import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/formatters";

const JOB_PHASES = ["Pre-Construction","Demo","Foundation","Framing","Rough-In","Insulation","Drywall","Finish Work","Final","Other"];
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function calcPay(payType, hoursWorked, payRate) {
  if (payType === "Hourly") return (hoursWorked || 0) * (payRate || 0);
  if (payType === "Daily") return payRate || 0;
  if (payType === "Weekly") return payRate || 0;
  return 0;
}

export default function WorkEntryModal({ open, onClose, subcontractor, jobs = [], prefilledJobId = null }) {
  const qc = useQueryClient();
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    job_id: prefilledJobId || "",
    work_date: today,
    hours_worked: 8,
    pay_type: subcontractor?.default_pay_type || "Daily",
    pay_rate: subcontractor?.default_pay_rate || 0,
    job_phase: "Other",
    description: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        job_id: prefilledJobId || "",
        work_date: today,
        hours_worked: 8,
        pay_type: subcontractor?.default_pay_type || "Daily",
        pay_rate: subcontractor?.default_pay_rate || 0,
        job_phase: "Other",
        description: "",
        notes: "",
      });
    }
  }, [open, subcontractor, prefilledJobId]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const calculatedPay = calcPay(form.pay_type, form.hours_worked, form.pay_rate);
  const selectedJob = jobs.find(j => j.id === form.job_id);
  const dayOfWeek = form.work_date ? DAYS[new Date(form.work_date + "T12:00:00").getDay()] : "";

  const handleSave = async () => {
    if (!form.job_id || !form.work_date) return;
    setSaving(true);
    await base44.entities.SubcontractorWorkEntry.create({
      subcontractor_id: subcontractor.id,
      subcontractor_name: subcontractor.name,
      job_id: form.job_id,
      job_title: selectedJob?.title || "",
      work_date: form.work_date,
      day_of_week: dayOfWeek,
      hours_worked: form.pay_type === "Hourly" ? (form.hours_worked || 0) : 0,
      pay_type: form.pay_type,
      pay_rate: form.pay_rate || 0,
      calculated_pay: calculatedPay,
      description: form.description,
      job_phase: form.job_phase,
      notes: form.notes,
      payment_status: "Unpaid",
    });
    qc.invalidateQueries({ queryKey: ["workEntries"] });
    qc.invalidateQueries({ queryKey: ["workEntries", subcontractor.id] });
    setSaving(false);
    onClose();
  };

  const activeJobs = jobs.filter(j => ["bidding","contracted","in_progress"].includes(j.status));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Work Entry — {subcontractor?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Job *</Label>
            <Select value={form.job_id} onValueChange={v => set("job_id", v)}>
              <SelectTrigger><SelectValue placeholder="Select job…" /></SelectTrigger>
              <SelectContent>
                {activeJobs.map(j => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Work Date *</Label>
              <Input type="date" value={form.work_date} onChange={e => set("work_date", e.target.value)} />
              {dayOfWeek && <p className="text-xs text-muted-foreground mt-1">{dayOfWeek}</p>}
            </div>
            <div>
              <Label>Job Phase</Label>
              <Select value={form.job_phase} onValueChange={v => set("job_phase", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{JOB_PHASES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Pay Type</Label>
              <Select value={form.pay_type} onValueChange={v => set("pay_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hourly">Hourly</SelectItem>
                  <SelectItem value="Daily">Daily</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Pay Rate ($)</Label>
              <Input type="number" step="0.01" value={form.pay_rate} onChange={e => set("pay_rate", parseFloat(e.target.value) || 0)} />
            </div>
          </div>
          {form.pay_type === "Hourly" && (
            <div>
              <Label>Hours Worked</Label>
              <Input type="number" step="0.5" value={form.hours_worked} onChange={e => set("hours_worked", parseFloat(e.target.value) || 0)} />
            </div>
          )}
          <div className="p-3 bg-muted/30 rounded-lg flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Calculated Pay</span>
            <span className="text-lg font-bold text-green-700">{formatCurrency(calculatedPay)}</span>
          </div>
          <div>
            <Label>Description of Work</Label>
            <Textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="What was worked on today…" rows={2} />
          </div>
          <div>
            <Label>Notes (internal)</Label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={1} />
          </div>
          <Button className="w-full" onClick={handleSave} disabled={!form.job_id || !form.work_date || saving}>
            {saving ? "Saving…" : "Save Work Entry"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}