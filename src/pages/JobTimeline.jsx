import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Plus, Pencil, Trash2, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import GuidedPrompt from "@/components/shared/GuidedPrompt";
import { formatDate, getStatusColor } from "@/lib/formatters";

const TASK_TYPES = ["demolition","framing","electrical","plumbing","hvac","roofing","drywall","painting","flooring","finishing","inspection","cleanup","other"];
const emptyTask = { job_id: "", job_title: "", title: "", task_type: "other", status: "not_started", estimated_days: 1, crew_size: 1, start_date: "", end_date: "", notes: "", order: 0 };

export default function JobTimeline() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyTask);
  const [editId, setEditId] = useState(null);
  const [expandedJob, setExpandedJob] = useState(null);
  const qc = useQueryClient();

  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date", 200) });
  const { data: tasks = [] } = useQuery({ queryKey: ["jobTasks"], queryFn: () => base44.entities.JobTask.list("order", 1000) });

  const saveMutation = useMutation({
    mutationFn: (d) => editId ? base44.entities.JobTask.update(editId, d) : base44.entities.JobTask.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["jobTasks"] }); setDialogOpen(false); setEditId(null); setForm(emptyTask); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.JobTask.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobTasks"] }),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const activeJobs = jobs.filter(j => ["in_progress", "contracted"].includes(j.status));

  const openCreate = (jobId) => {
    const job = jobs.find(j => j.id === jobId);
    const jobTasks = tasks.filter(t => t.job_id === jobId);
    setForm({ ...emptyTask, job_id: jobId, job_title: job?.title || "", order: jobTasks.length });
    setEditId(null);
    setDialogOpen(true);
  };

  const openEdit = (t) => {
    setForm({ job_id: t.job_id, job_title: t.job_title || "", title: t.title, task_type: t.task_type || "other", status: t.status || "not_started", estimated_days: t.estimated_days || 1, crew_size: t.crew_size || 1, start_date: t.start_date || "", end_date: t.end_date || "", notes: t.notes || "", order: t.order || 0 });
    setEditId(t.id);
    setDialogOpen(true);
  };

  return (
    <div>
      <PageHeader title="Job Timeline" description="Track tasks, crew, and projected completion" />

      {activeJobs.length === 0 ? (
        <EmptyState icon={Clock} title="No active jobs" description="Create an active job first to add tasks and timelines." />
      ) : (
        <div className="space-y-4">
          {activeJobs.map(j => {
            const jobTasks = tasks.filter(t => t.job_id === j.id).sort((a, b) => (a.order || 0) - (b.order || 0));
            const totalDays = jobTasks.reduce((s, t) => s + (t.estimated_days || 0), 0);
            const completedTasks = jobTasks.filter(t => t.status === "completed").length;
            const blockedTasks = jobTasks.filter(t => t.status === "blocked").length;
            const isExpanded = expandedJob === j.id;

            return (
              <Card key={j.id} className="overflow-hidden">
                <button
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
                  onClick={() => setExpandedJob(isExpanded ? null : j.id)}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{j.title}</p>
                      <Badge className={`text-xs ${getStatusColor(j.status)}`}>{j.status?.replace(/_/g, " ")}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {jobTasks.length} tasks · ~{totalDays} days · {completedTasks}/{jobTasks.length} done
                      {blockedTasks > 0 && <span className="text-red-600 ml-2">⚠ {blockedTasks} blocked</span>}
                    </p>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t">
                    {jobTasks.length === 0 && (
                      <p className="text-sm text-muted-foreground py-4">No tasks yet. Add tasks to build the timeline.</p>
                    )}
                    <div className="space-y-2 mt-3">
                      {jobTasks.map((t, i) => (
                        <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">{i + 1}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{t.title}</span>
                              <Badge className={`text-xs ${getStatusColor(t.status)}`}>{t.status?.replace(/_/g, " ")}</Badge>
                              <Badge variant="outline" className="text-xs">{t.task_type}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {t.estimated_days}d · Crew: {t.crew_size} {t.start_date ? `· ${formatDate(t.start_date)}` : ""}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(t)} aria-label={t.title ? `Edit task: ${t.title}` : "Edit task"}><Pencil className="w-3 h-3" /></Button>
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(t.id)} aria-label={t.title ? `Delete task: ${t.title}` : "Delete task"}><Trash2 className="w-3 h-3" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => openCreate(j.id)}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Task
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId ? "Edit Task" : "New Task"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <GuidedPrompt message={`Task for: ${form.job_title}`} variant="info" />
            <div><Label>Task Title *</Label><Input value={form.title} onChange={e => set("title", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type</Label>
                <Select value={form.task_type} onValueChange={v => set("task_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TASK_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={v => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["not_started","in_progress","completed","blocked"].map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Est. Days</Label><Input type="number" value={form.estimated_days} onChange={e => set("estimated_days", parseInt(e.target.value) || 1)} /></div>
              <div><Label>Crew Size</Label><Input type="number" value={form.crew_size} onChange={e => set("crew_size", parseInt(e.target.value) || 1)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} /></div>
              <div><Label>End Date</Label><Input type="date" value={form.end_date} onChange={e => set("end_date", e.target.value)} /></div>
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} /></div>
            <Button className="w-full" onClick={() => saveMutation.mutate(form)} disabled={!form.title || saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : editId ? "Update" : "Add Task"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}