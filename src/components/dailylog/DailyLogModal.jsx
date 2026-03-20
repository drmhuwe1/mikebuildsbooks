import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";

const WEATHER = ["Clear","Cloudy","Rain","Snow","Wind","Extreme Heat"];

export default function DailyLogModal({ open, onOpenChange, jobId, jobTitle, onSaved }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    weather_conditions: "Clear",
    crew_count: "",
    work_performed: "",
    materials_delivered: "",
    issues_or_delays: "",
    is_client_visible: false,
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    const user = await base44.auth.me();
    await base44.entities.DailyLog.create({
      job_id: jobId,
      job_title: jobTitle,
      created_by: user?.full_name || "Unknown",
      date: form.date,
      weather_conditions: form.weather_conditions,
      crew_count: Number(form.crew_count) || 0,
      work_performed: form.work_performed,
      materials_delivered: form.materials_delivered,
      issues_or_delays: form.issues_or_delays,
      is_client_visible: form.is_client_visible,
      linked_photos: [],
    });
    setSaving(false);
    onSaved?.();
    onOpenChange(false);
    setForm({ date: new Date().toISOString().slice(0, 10), weather_conditions: "Clear", crew_count: "", work_performed: "", materials_delivered: "", issues_or_delays: "", is_client_visible: false });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Daily Log Entry</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={e => set("date", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Weather</Label>
              <Select value={form.weather_conditions} onValueChange={v => set("weather_conditions", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{WEATHER.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Crew Count</Label>
            <Input type="number" min="0" placeholder="0" value={form.crew_count} onChange={e => set("crew_count", e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>Work Performed <span className="text-red-500">*</span></Label>
            <Textarea rows={3} placeholder="Describe work completed today..." value={form.work_performed} onChange={e => set("work_performed", e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>Materials Delivered (optional)</Label>
            <Textarea rows={2} placeholder="List any materials delivered..." value={form.materials_delivered} onChange={e => set("materials_delivered", e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>Issues / Delays (optional)</Label>
            <Textarea rows={2} placeholder="Note any issues or delays..." value={form.issues_or_delays} onChange={e => set("issues_or_delays", e.target.value)} />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="logVis" checked={form.is_client_visible} onChange={e => set("is_client_visible", e.target.checked)} className="rounded" />
            <Label htmlFor="logVis" className="cursor-pointer">Share with client in their portal</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.work_performed.trim()}>
            {saving ? "Saving..." : "Save Log Entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}