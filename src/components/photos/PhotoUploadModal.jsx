import React, { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, ImagePlus } from "lucide-react";
import { base44 } from "@/api/base44Client";

const PHASES = ["Pre-Construction","Demo","Foundation","Framing","Rough-In","Insulation","Drywall","Finish Work","Final","Other"];

export default function PhotoUploadModal({ open, onOpenChange, jobId, clientId, onUploaded }) {
  const [files, setFiles] = useState([]);
  const [phase, setPhase] = useState("Other");
  const [caption, setCaption] = useState("");
  const [takenAt, setTakenAt] = useState(new Date().toISOString().slice(0, 10));
  const [isClientVisible, setIsClientVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = (incoming) => {
    const arr = Array.from(incoming).filter(f => f.type.startsWith("image/"));
    setFiles(prev => [...prev, ...arr.map(f => ({ file: f, preview: URL.createObjectURL(f) }))]);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const handleUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    const user = await base44.auth.me();
    for (const { file } of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.JobPhoto.create({
        job_id: jobId,
        client_id: clientId,
        file_url,
        thumbnail_url: file_url,
        caption,
        phase,
        taken_at: takenAt,
        uploaded_by: user?.full_name || "Unknown",
        is_client_visible: isClientVisible,
      });
    }
    setUploading(false);
    setFiles([]);
    setCaption("");
    onUploaded?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Photos</DialogTitle>
        </DialogHeader>

        {/* Drop zone */}
        <div
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
        >
          <ImagePlus className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">Drag & drop photos here or click to browse</p>
          <p className="text-xs text-muted-foreground mt-1">Supports JPG, PNG, HEIC, WEBP</p>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
        </div>

        {/* Preview thumbnails */}
        {files.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {files.map((f, i) => (
              <div key={i} className="relative aspect-square rounded overflow-hidden group">
                <img src={f.preview} alt="" className="w-full h-full object-cover" />
                <button onClick={() => removeFile(i)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Phase</Label>
            <Select value={phase} onValueChange={setPhase}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PHASES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Date Taken</Label>
            <Input type="date" value={takenAt} onChange={e => setTakenAt(e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1">
            <Label>Caption (optional)</Label>
            <Input placeholder="Describe what's shown..." value={caption} onChange={e => setCaption(e.target.value)} />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <input type="checkbox" id="clientVis" checked={isClientVisible} onChange={e => setIsClientVisible(e.target.checked)} className="rounded" />
            <Label htmlFor="clientVis" className="cursor-pointer">Visible to client in their portal</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleUpload} disabled={!files.length || uploading} className="gap-2">
            <Upload className="w-4 h-4" />
            {uploading ? "Uploading..." : `Upload ${files.length > 0 ? files.length + " " : ""}Photo${files.length !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}