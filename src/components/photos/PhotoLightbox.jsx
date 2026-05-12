import React, { useCallback, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/formatters";

export default function PhotoLightbox({ photo, photos, onClose, onNavigate }) {
  const idx = photo ? photos.findIndex(p => p.id === photo.id) : -1;
  const hasPrev = idx > 0;
  const hasNext = idx < photos.length - 1;

  const handleKey = React.useCallback((e) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowLeft" && hasPrev) onNavigate(photos[idx - 1]);
    if (e.key === "ArrowRight" && hasNext) onNavigate(photos[idx + 1]);
  }, [idx, hasPrev, hasNext, photos, onClose, onNavigate]);

  React.useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" onClick={onClose}>
      {/* Top bar */}
      <div className="flex items-center justify-between p-4 shrink-0" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <Badge className="bg-white/20 text-white border-0">{photo.phase || "Other"}</Badge>
          {photo.is_client_visible
            ? <span className="flex items-center gap-1 text-green-400 text-xs"><Eye className="w-3 h-3" /> Client Visible</span>
            : <span className="flex items-center gap-1 text-white/40 text-xs"><EyeOff className="w-3 h-3" /> Internal Only</span>}
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center px-16 overflow-hidden" onClick={e => e.stopPropagation()}>
        <button
          type="button"
          aria-label="Previous photo"
          onClick={() => hasPrev && onNavigate(photos[idx - 1])}
          disabled={!hasPrev}
          className="absolute left-4 text-white/70 hover:text-white disabled:opacity-20 p-2"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        <img
          src={photo.file_url}
          alt={photo.caption || ""}
          className="max-w-full max-h-full object-contain rounded"
        />
        <button
          type="button"
          aria-label="Next photo"
          onClick={() => hasNext && onNavigate(photos[idx + 1])}
          disabled={!hasNext}
          className="absolute right-4 text-white/70 hover:text-white disabled:opacity-20 p-2"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>

      {/* Bottom caption */}
      <div className="p-4 text-center shrink-0" onClick={e => e.stopPropagation()}>
        {photo.caption && <p className="text-white font-medium mb-1">{photo.caption}</p>}
        <p className="text-white/50 text-sm">
          {formatDate(photo.taken_at)} &nbsp;·&nbsp; {idx + 1} of {photos.length}
          {photo.uploaded_by ? ` · Uploaded by ${photo.uploaded_by}` : ""}
        </p>
      </div>
    </div>
  );
}