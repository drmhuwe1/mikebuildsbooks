import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, CheckCircle, AlertCircle, X, Camera, Pencil } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDate } from "@/lib/formatters";

const INSPECTION_TYPES = [
  { value: "foundation", label: "Foundation" },
  { value: "footer", label: "Footer" },
  { value: "framing", label: "Framing" },
  { value: "electrical", label: "Electrical" },
  { value: "plumbing", label: "Plumbing" },
  { value: "hvac", label: "HVAC" },
  { value: "roofing", label: "Roofing" },
  { value: "final", label: "Final" },
  { value: "other", label: "Other" },
];

export default function InspectionTracker({ jobId, municipalityId }) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    inspection_type: "foundation",
    status: "requested",
    requested_date: new Date().toISOString().split("T")[0],
  });

  const openEdit = (inspection) => {
    setEditingId(inspection.id);
    setFormData({
      inspection_type: inspection.inspection_type,
      status: inspection.status,
      requested_date: inspection.requested_date || "",
      scheduled_date: inspection.scheduled_date || "",
      inspector_name: inspection.inspector_name || "",
      inspector_notes: inspection.inspector_notes || "",
      result: inspection.result || "",
      follow_up_notes: inspection.follow_up_notes || "",
      photo_url: inspection.photo_url || null,
    });
    setShowDialog(true);
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData({
      inspection_type: "foundation",
      status: "requested",
      requested_date: new Date().toISOString().split("T")[0],
    });
    setShowDialog(true);
  };
  const qc = useQueryClient();

  const { data: inspections = [] } = useQuery({
    queryKey: ["inspections", jobId],
    queryFn: () => base44.entities.Inspection.filter({ job_id: jobId }),
  });

  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData(f => ({ ...f, photo_url: file_url }));
    setUploading(false);
  };

  const createMutation = useMutation({
    mutationFn: () =>
      base44.entities.Inspection.create({
        ...formData,
        job_id: jobId,
        municipality_id: municipalityId,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inspections", jobId] });
      setShowDialog(false);
      setFormData({
        inspection_type: "foundation",
        status: "requested",
        requested_date: new Date().toISOString().split("T")[0],
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (id) => base44.entities.Inspection.update(id, formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inspections", jobId] });
      setShowDialog(false);
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Inspection.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inspections", jobId] });
    },
  });

  const statusColors = {
    requested: "bg-blue-100 text-blue-700",
    scheduled: "bg-yellow-100 text-yellow-700",
    completed: "bg-gray-100 text-gray-700",
    passed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  };

  const resultColors = {
    passed: "bg-green-50 border-green-200",
    failed: "bg-red-50 border-red-200",
    conditional_pass: "bg-yellow-50 border-yellow-200",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Inspections</h3>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Log Inspection
        </Button>
      </div>

      {inspections.length === 0 && (
        <Card className="p-3 bg-gray-50">
          <p className="text-xs text-muted-foreground">No inspections logged yet. Add inspection records as work progresses.</p>
        </Card>
      )}

      <div className="space-y-2">
        {inspections.map((inspection) => (
          <Card key={inspection.id} className={`p-3 ${inspection.result ? resultColors[inspection.result] : ""}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">
                    {INSPECTION_TYPES.find(t => t.value === inspection.inspection_type)?.label || inspection.inspection_type}
                  </p>
                  <Badge className={`text-xs ${statusColors[inspection.status]}`}>{inspection.status}</Badge>
                  {inspection.result && (
                    <Badge className={`text-xs ${inspection.result === 'passed' ? 'bg-green-100 text-green-700' : inspection.result === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {inspection.result}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Requested: {inspection.requested_date} {inspection.scheduled_date && `• Scheduled: ${inspection.scheduled_date}`}
                </p>
                {inspection.inspector_name && <p className="text-xs mt-1">Inspector: {inspection.inspector_name}</p>}
                {inspection.inspector_notes && <p className="text-xs mt-1 text-gray-600">{inspection.inspector_notes}</p>}
                {inspection.follow_up_notes && (
                  <p className="text-xs mt-1 p-2 bg-yellow-100 rounded text-yellow-800">
                    📌 {inspection.follow_up_notes}
                  </p>
                )}
                {inspection.photo_url && (
                  <a href={inspection.photo_url} target="_blank" rel="noopener noreferrer" className="inline-block mt-2">
                    <img src={inspection.photo_url} alt="Inspection photo" className="h-16 w-24 object-cover rounded border hover:opacity-80 transition-opacity" />
                  </a>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openEdit(inspection)}
                  title="Edit inspection"
                >
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(inspection.id)}
                  disabled={deleteMutation.isPending}
                >
                  <X className="w-3.5 h-3.5 text-red-500" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add/Edit Inspection Dialog */}
      {showDialog && (
        <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) setEditingId(null); }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Inspection" : "Log Inspection"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1">Inspection Type</label>
                <select value={formData.inspection_type} onChange={(e) => setFormData(f => ({ ...f, inspection_type: e.target.value }))} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                  {INSPECTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Status</label>
                <select value={formData.status} onChange={(e) => setFormData(f => ({ ...f, status: e.target.value }))} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                  {["requested", "scheduled", "completed", "passed", "failed"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1">Requested Date</label>
                  <Input type="date" value={formData.requested_date} onChange={(e) => setFormData(f => ({ ...f, requested_date: e.target.value }))} className="text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">Scheduled Date</label>
                  <Input type="date" value={formData.scheduled_date || ""} onChange={(e) => setFormData(f => ({ ...f, scheduled_date: e.target.value }))} className="text-sm" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Inspector Name</label>
                <Input placeholder="Inspector name" value={formData.inspector_name || ""} onChange={(e) => setFormData(f => ({ ...f, inspector_name: e.target.value }))} className="text-sm" />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Inspector Notes</label>
                <Textarea placeholder="Notes from inspection..." value={formData.inspector_notes || ""} onChange={(e) => setFormData(f => ({ ...f, inspector_notes: e.target.value }))} rows={2} className="text-sm" />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Result</label>
                <select value={formData.result || ""} onChange={(e) => setFormData(f => ({ ...f, result: e.target.value }))} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="">— None —</option>
                  {["passed", "failed", "conditional_pass"].map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Follow-up Notes (if needed)</label>
                <Textarea placeholder="Required follow-up actions..." value={formData.follow_up_notes || ""} onChange={(e) => setFormData(f => ({ ...f, follow_up_notes: e.target.value }))} rows={2} className="text-sm" />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Inspection Photo</label>
                {formData.photo_url ? (
                  <div className="relative inline-block">
                    <img src={formData.photo_url} alt="Inspection" className="w-full max-h-40 object-cover rounded border" />
                    <button onClick={() => setFormData(f => ({ ...f, photo_url: null }))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-md p-3 hover:bg-muted/30 text-sm text-muted-foreground">
                    <Camera className="w-4 h-4" />
                    {uploading ? "Uploading..." : "Tap to add photo"}
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                  </label>
                )}
              </div>

              <div className="flex gap-2">
                {editingId ? (
                  <Button onClick={() => updateMutation.mutate(editingId)} disabled={updateMutation.isPending} className="flex-1 bg-green-600 hover:bg-green-700">
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                ) : (
                  <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="flex-1 bg-green-600 hover:bg-green-700">
                    {createMutation.isPending ? "Saving..." : "Log Inspection"}
                  </Button>
                )}
                <Button onClick={() => { setShowDialog(false); setEditingId(null); }} variant="outline" className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}