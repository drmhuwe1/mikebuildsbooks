import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/formatters";
import { Upload, FileText, X } from "lucide-react";

const JOB_PHASES = ["Pre-Construction","Demo","Foundation","Framing","Rough-In","Insulation","Drywall","Finish Work","Final","Other"];
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function calcPay(hoursWorked, payRate) {
  return (hoursWorked || 0) * (payRate || 0);
}

export default function WorkEntryModal({ open, onClose, subcontractor, subs = [], jobs = [], prefilledJobId = null }) {
  const qc = useQueryClient();
  const today = new Date().toISOString().split("T")[0];

  // If no subcontractor passed in, allow selecting from the subs list
  const [selectedSubId, setSelectedSubId] = useState(subcontractor?.id || "");
  const activeSub = subcontractor || subs.find(s => s.id === selectedSubId) || null;

  const [form, setForm] = useState({
    job_id: prefilledJobId || "",
    work_date: today,
    hours_worked: 8,
    pay_type: activeSub?.default_pay_type || "Daily",
    pay_rate: activeSub?.default_pay_rate || 0,
    job_phase: "Other",
    description: "",
    notes: "",
    payment_status: "Unpaid",
  });
  const [timesheetFile, setTimesheetFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const sub = subcontractor || subs.find(s => s.id === selectedSubId);
      setForm({
        job_id: prefilledJobId || "",
        work_date: today,
        hours_worked: 8,
        pay_type: sub?.default_pay_type || "Daily",
        pay_rate: sub?.default_pay_rate || 0,
        job_phase: "Other",
        description: "",
        notes: "",
        payment_status: "Unpaid",
      });
      setTimesheetFile(null);
      setSelectedSubId(subcontractor?.id || "");
    }
  }, [open, subcontractor, prefilledJobId]);

  // Update pay defaults when sub is selected from dropdown
  const handleSubSelect = (subId) => {
    setSelectedSubId(subId);
    const sub = subs.find(s => s.id === subId);
    if (sub) {
      setForm(f => ({ ...f, pay_type: sub.default_pay_type || "Daily", pay_rate: sub.default_pay_rate || 0 }));
    }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const calculatedPay = calcPay(form.hours_worked, form.pay_rate);
  const selectedJob = jobs.find(j => j.id === form.job_id);
  const dayOfWeek = form.work_date ? DAYS[new Date(form.work_date + "T12:00:00").getDay()] : "";

  const handleSave = async () => {
    if (!form.job_id || !form.work_date || !activeSub) return;
    setSaving(true);

    let timesheetUrl = "";
    if (timesheetFile) {
      setUploading(true);
      const res = await base44.integrations.Core.UploadFile({ file: timesheetFile });
      timesheetUrl = res.file_url || "";
      setUploading(false);
    }

    await base44.entities.SubcontractorWorkEntry.create({
      subcontractor_id: activeSub.id,
      subcontractor_name: activeSub.name,
      job_id: form.job_id,
      job_title: selectedJob?.title || "",
      work_date: form.work_date,
      day_of_week: dayOfWeek,
      hours_worked: form.hours_worked || 0,
      pay_type: form.pay_type,
      pay_rate: form.pay_rate || 0,
      calculated_pay: calculatedPay,
      description: form.description,
      job_phase: form.job_phase,
      notes: form.notes,
      payment_status: form.payment_status,
      timesheet_url: timesheetUrl,
    });
    qc.invalidateQueries({ queryKey: ["workEntries"] });
    qc.invalidateQueries({ queryKey: ["workEntries", activeSub.id] });
    qc.invalidateQueries({ queryKey: ["subLabor"] });
    setSaving(false);
    onClose();
  };

  const activeJobs = jobs.filter(j => ["bidding","contracted","in_progress"].includes(j.status));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Work Entry{activeSub ? ` — ${activeSub.name}` : ""}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {/* Subcontractor selector (only when no sub is pre-selected) */}
          {!subcontractor && subs.length > 0 && (
            <div>
              <Label>Subcontractor *</Label>
              <Select value={selectedSubId} onValueChange={handleSubSelect}>
                <SelectTrigger><SelectValue placeholder="Select subcontractor…" /></SelectTrigger>
                <SelectContent>
                  {subs.filter(s => s.status !== "inactive").map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}{s.specialty ? ` · ${s.specialty}` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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
          <div>
            <Label>Hours Worked</Label>
            <Input type="number" step="0.5" value={form.hours_worked} onChange={e => set("hours_worked", parseFloat(e.target.value) || 0)} />
          </div>
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
          <div>
           <Label>Payment Status</Label>
           <Select value={form.payment_status} onValueChange={v => set("payment_status", v)}>
             <SelectTrigger><SelectValue /></SelectTrigger>
             <SelectContent>
               <SelectItem value="Unpaid">Unpaid</SelectItem>
               <SelectItem value="Paid">Paid</SelectItem>
             </SelectContent>
           </Select>
          </div>

          {/* Timesheet Upload */}
          <div>
            <Label>Timesheet / Pay Sheet (optional)</Label>
            {timesheetFile ? (
              <div className="flex items-center gap-2 p-2 bg-muted/30 rounded border text-sm mt-1">
                <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="flex-1 truncate">{timesheetFile.name}</span>
                <button onClick={() => setTimesheetFile(null)} className="text-muted-foreground hover:text-destructive">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 p-2 border-2 border-dashed rounded cursor-pointer hover:bg-muted/20 mt-1">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Upload image or PDF</span>
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => setTimesheetFile(e.target.files[0] || null)} />
              </label>
            )}
          </div>

          <Button className="w-full" onClick={handleSave} disabled={!form.job_id || !form.work_date || !activeSub || saving || uploading}>
            {uploading ? "Uploading…" : saving ? "Saving…" : "Save Work Entry"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}