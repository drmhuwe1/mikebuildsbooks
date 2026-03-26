import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Trash2, ImageIcon, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function SubPaysheetTab({ sub }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ pay_period: "", job_title: "", notes: "" });
  const [lightbox, setLightbox] = useState(null);

  const { data: paysheets = [] } = useQuery({
    queryKey: ["paysheets", sub.id],
    queryFn: () => base44.entities.SubPaysheet.filter({ subcontractor_id: sub.id }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SubPaysheet.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["paysheets", sub.id] }),
  });

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.SubPaysheet.create({
      subcontractor_id: sub.id,
      subcontractor_name: sub.name,
      photo_url: file_url,
      pay_period: form.pay_period,
      job_title: form.job_title,
      notes: form.notes,
      upload_date: new Date().toISOString().split("T")[0],
    });
    qc.invalidateQueries({ queryKey: ["paysheets", sub.id] });
    setUploading(false);
    setForm({ pay_period: "", job_title: "", notes: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast({ title: "Pay sheet uploaded" });
  };

  const sorted = [...paysheets].sort((a, b) => (b.upload_date || "").localeCompare(a.upload_date || ""));

  return (
    <div className="space-y-4">
      {/* Upload form */}
      <div className="border rounded-lg p-4 bg-muted/20 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Upload Signed Pay Sheet</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Pay Period</Label>
            <Input value={form.pay_period} onChange={e => setForm(f => ({ ...f, pay_period: e.target.value }))} placeholder="e.g. Week of 3/24/26" className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-xs">Job (optional)</Label>
            <Input value={form.job_title} onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))} placeholder="Job name" className="h-8 text-xs" />
          </div>
        </div>
        <div>
          <Label className="text-xs">Notes (optional)</Label>
          <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any notes about this pay sheet" className="h-8 text-xs" />
        </div>
        <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleUpload} />
        <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-1.5 w-full">
          <Upload className="w-3.5 h-3.5" />
          {uploading ? "Uploading..." : "Choose Photo / File to Upload"}
        </Button>
      </div>

      {/* Uploaded pay sheets */}
      {sorted.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground bg-muted/20 rounded-lg">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No pay sheets uploaded yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {sorted.map(ps => (
            <div key={ps.id} className="border rounded-lg overflow-hidden bg-card relative group">
              <img
                src={ps.photo_url}
                alt="Pay sheet"
                className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setLightbox(ps)}
              />
              <button
                onClick={() => deleteMutation.mutate(ps.id)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
              <div className="p-2">
                <p className="text-xs font-semibold truncate">{ps.pay_period || "No period"}</p>
                {ps.job_title && <p className="text-xs text-muted-foreground truncate">{ps.job_title}</p>}
                <p className="text-xs text-muted-foreground">{ps.upload_date}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setLightbox(null)} className="absolute -top-10 right-0 text-white"><X className="w-6 h-6" /></button>
            <img src={lightbox.photo_url} alt="Pay sheet" className="w-full rounded-lg" />
            <div className="mt-2 text-white text-sm">
              {lightbox.pay_period && <p><strong>Period:</strong> {lightbox.pay_period}</p>}
              {lightbox.job_title && <p><strong>Job:</strong> {lightbox.job_title}</p>}
              {lightbox.notes && <p><strong>Notes:</strong> {lightbox.notes}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}