import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileDown, Eye, EyeOff, Trash2, CheckSquare, Square, Tag } from "lucide-react";
import PhotoUploadModal from "./PhotoUploadModal";
import PhotoLightbox from "./PhotoLightbox";
import PhotoReportModal from "./PhotoReportModal";
import { formatDate } from "@/lib/formatters";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PHASES = ["All","Pre-Construction","Demo","Foundation","Framing","Rough-In","Insulation","Drywall","Finish Work","Final","Other"];

const PHASE_COLORS = {
  "Pre-Construction": "bg-blue-100 text-blue-700",
  "Demo": "bg-red-100 text-red-700",
  "Foundation": "bg-stone-100 text-stone-700",
  "Framing": "bg-amber-100 text-amber-700",
  "Rough-In": "bg-orange-100 text-orange-700",
  "Insulation": "bg-yellow-100 text-yellow-700",
  "Drywall": "bg-gray-100 text-gray-700",
  "Finish Work": "bg-purple-100 text-purple-700",
  "Final": "bg-green-100 text-green-700",
  "Other": "bg-slate-100 text-slate-700",
};

export default function JobPhotoGallery({ job, company }) {
  const qc = useQueryClient();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [activePhase, setActivePhase] = useState("All");
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkPhase, setBulkPhase] = useState("");

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ["jobPhotos", job.id],
    queryFn: () => base44.entities.JobPhoto.filter({ job_id: job.id }, "-taken_at"),
  });

  const filtered = useMemo(() =>
    activePhase === "All" ? photos : photos.filter(p => p.phase === activePhase),
  [photos, activePhase]);

  const phaseCounts = useMemo(() => {
    const counts = {};
    photos.forEach(p => { counts[p.phase] = (counts[p.phase] || 0) + 1; });
    return counts;
  }, [photos]);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(filtered.map(p => p.id)));
  const clearSelection = () => { setSelected(new Set()); };

  const bulkChangePhase = async () => {
    if (!bulkPhase || !selected.size) return;
    await Promise.all([...selected].map(id => base44.entities.JobPhoto.update(id, { phase: bulkPhase })));
    qc.invalidateQueries({ queryKey: ["jobPhotos", job.id] });
    clearSelection();
  };

  const bulkToggleVisibility = async (visible) => {
    await Promise.all([...selected].map(id => base44.entities.JobPhoto.update(id, { is_client_visible: visible })));
    qc.invalidateQueries({ queryKey: ["jobPhotos", job.id] });
    clearSelection();
  };

  const bulkDelete = async () => {
    if (!window.confirm(`Delete ${selected.size} photo${selected.size !== 1 ? "s" : ""}?`)) return;
    await Promise.all([...selected].map(id => base44.entities.JobPhoto.delete(id)));
    qc.invalidateQueries({ queryKey: ["jobPhotos", job.id] });
    clearSelection();
  };

  const lightboxFiltered = filtered;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" onClick={() => setUploadOpen(true)} className="gap-2">
            <Upload className="w-4 h-4" /> Upload Photos
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setReportOpen(true)} className="gap-2">
            <FileDown className="w-4 h-4" /> Generate Report
          </Button>
        </div>
        <Button
          type="button"
          size="sm"
          variant={bulkMode ? "default" : "outline"}
          onClick={() => { setBulkMode(!bulkMode); clearSelection(); }}
          className="gap-2"
        >
          <CheckSquare className="w-4 h-4" />
          {bulkMode ? "Exit Select" : "Select"}
        </Button>
      </div>

      {/* Bulk actions bar */}
      {bulkMode && selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="flex items-center gap-1">
            <Select value={bulkPhase} onValueChange={setBulkPhase}>
              <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Change Phase" /></SelectTrigger>
              <SelectContent>
                {PHASES.filter(p => p !== "All").map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button type="button" size="sm" variant="outline" onClick={bulkChangePhase} disabled={!bulkPhase} className="h-8 gap-1 text-xs">
              <Tag className="w-3 h-3" /> Apply
            </Button>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => bulkToggleVisibility(true)} className="h-8 gap-1 text-xs">
            <Eye className="w-3 h-3" /> Make Visible
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => bulkToggleVisibility(false)} className="h-8 gap-1 text-xs">
            <EyeOff className="w-3 h-3" /> Make Internal
          </Button>
          <Button type="button" size="sm" variant="destructive" onClick={bulkDelete} className="h-8 gap-1 text-xs">
            <Trash2 className="w-3 h-3" /> Delete
          </Button>
          <button type="button" onClick={selectAll} className="text-xs text-primary underline ml-auto">Select All</button>
          <button onClick={clearSelection} className="text-xs text-muted-foreground underline">Clear</button>
        </div>
      )}

      {/* Phase filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {PHASES.map(ph => (
          <button
            key={ph}
            onClick={() => setActivePhase(ph)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              activePhase === ph
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            {ph} {ph !== "All" && phaseCounts[ph] ? `(${phaseCounts[ph]})` : ph === "All" ? `(${photos.length})` : ""}
          </button>
        ))}
      </div>

      {/* Photo grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading photos...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Upload className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No photos yet</p>
          <p className="text-sm">Upload photos to document this job</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map(photo => (
            <div
              key={photo.id}
              className={`relative group rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                selected.has(photo.id) ? "border-primary ring-2 ring-primary/30" : "border-transparent hover:border-primary/30"
              }`}
              onClick={() => {
                if (bulkMode) { toggleSelect(photo.id); }
                else { setLightboxPhoto(photo); }
              }}
            >
              <div className="aspect-square bg-muted">
                <img src={photo.thumbnail_url || photo.file_url} alt={photo.caption || ""} className="w-full h-full object-cover" />
              </div>
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
              {/* Bulk select indicator */}
              {bulkMode && (
                <div className="absolute top-2 left-2">
                  {selected.has(photo.id)
                    ? <CheckSquare className="w-5 h-5 text-primary drop-shadow" />
                    : <Square className="w-5 h-5 text-white drop-shadow" />}
                </div>
              )}
              {/* Client visible indicator */}
              {photo.is_client_visible && (
                <div className="absolute top-2 right-2 bg-green-600 rounded-full p-1">
                  <Eye className="w-3 h-3 text-white" />
                </div>
              )}
              {/* Bottom info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <div className="flex items-end justify-between gap-1">
                  <div className="min-w-0">
                    {photo.caption && (
                      <p className="text-white text-xs font-medium truncate">{photo.caption}</p>
                    )}
                    <p className="text-white/60 text-xs">{formatDate(photo.taken_at)}</p>
                  </div>
                  <Badge className={`text-xs shrink-0 ${PHASE_COLORS[photo.phase] || PHASE_COLORS["Other"]}`}>
                    {photo.phase}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <PhotoUploadModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        jobId={job.id}
        clientId={job.client_id}
        onUploaded={() => qc.invalidateQueries({ queryKey: ["jobPhotos", job.id] })}
      />

      <PhotoReportModal
        open={reportOpen}
        onOpenChange={setReportOpen}
        job={job}
        photos={photos}
        company={company}
      />

      {lightboxPhoto && (
        <PhotoLightbox
          photo={lightboxPhoto}
          photos={lightboxFiltered}
          onClose={() => setLightboxPhoto(null)}
          onNavigate={setLightboxPhoto}
        />
      )}
    </div>
  );
}