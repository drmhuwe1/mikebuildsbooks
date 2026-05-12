import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/formatters";
import { Upload, FileText, X } from "lucide-react";

const JOB_PHASES = ["Pre-Construction","Demo","Foundation","Framing","Rough-In","Insulation","Drywall","Finish Work","Final","Other"];
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function NativeSelect({ value, onChange, children, className = "" }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring ${className}`}
    >
      {children}
    </select>
  );
}

function calcPay(hoursWorked, payRate) {
  return (hoursWorked || 0) * (payRate || 0);
}

export default function WorkEntryModal({ open, onClose, subcontractor, subs: subsProp = [], jobs: jobsProp = [], prefilledJobId = null }) {
  const qc = useQueryClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: fetchedSubs = [] } = useQuery({
    queryKey: ["subcontractors"],
    queryFn: () => base44.entities.Subcontractor.list("-created_date", 200),
  });
  const { data: fetchedJobs = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => base44.entities.Job.list("-created_date", 200),
  });

  const subs = fetchedSubs.length > 0 ? fetchedSubs : subsProp;
  const jobs = fetchedJobs.length > 0 ? fetchedJobs : jobsProp;

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

  const activeJobs = jobs.filter(j => j.status !== "cancelled");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Work Entry{activeSub ? ` — ${activeSub.name}` : ""}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {!subcontractor && subs.length > 0 && (
            <div>
              <Label>Subcontractor *</Label>
              <NativeSelect value={selectedSubId} onChange={handleSubSelect}>
                <option value="">Select subcontractor…</option>
                {subs.map(s => (
                  <option key={s.id} value={s.id}>{s.name}{s.specialty ? ` · ${s.specialty}` : ""}</option>
                ))}
              </NativeSelect>
            </div>
          )}

          <div>
            <Label>Job *</Label>
            <NativeSelect value={form.job_id} onChange={v => set("job_id", v)}>
              <option value="">Select job…</option>
              {activeJobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
            </NativeSelect>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Work Date *</Label>
              <Input type="date" value={form.work_date} onChange={e => set("work_date", e.target.value)} />
              {dayOfWeek && <p className="text-xs text-muted-foreground mt-1">{dayOfWeek}</p>}
            </div>
            <div>
              <Label>Job Phase</Label>
              <NativeSelect value={form.job_phase} onChange={v => set("job_phase", v)}>
                {JOB_PHASES.map(p => <option key={p} value={p}>{p}</option>)}
              </NativeSelect>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Pay Type</Label>
              <NativeSelect value={form.pay_type} onChange={v => set("pay_type", v)}>
                <option value="Hourly">Hourly</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
              </NativeSelect>
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
            <NativeSelect value={form.payment_status} onChange={v => set("payment_status", v)}>
              <option value="Unpaid">Unpaid</option>
              <option value="Paid">Paid</option>
            </NativeSelect>
          </div>

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