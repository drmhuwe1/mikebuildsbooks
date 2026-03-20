import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Camera, Eye } from "lucide-react";
import PhotoLightbox from "./PhotoLightbox";
import { formatDate } from "@/lib/formatters";

const PHASES = ["Pre-Construction","Demo","Foundation","Framing","Rough-In","Insulation","Drywall","Finish Work","Final","Other"];

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

export default function ClientPhotoGallery({ jobId }) {
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ["jobPhotos", jobId, "client"],
    queryFn: () => base44.entities.JobPhoto.filter({ job_id: jobId, is_client_visible: true }, "-taken_at"),
  });

  const grouped = useMemo(() => {
    const g = {};
    PHASES.forEach(ph => { g[ph] = []; });
    photos.forEach(p => {
      const ph = p.phase || "Other";
      if (!g[ph]) g[ph] = [];
      g[ph].push(p);
    });
    return g;
  }, [photos]);

  const activePhasesWithPhotos = PHASES.filter(ph => grouped[ph].length > 0);

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Loading photos...</div>;

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Camera className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">No photos shared yet</p>
        <p className="text-sm">Your contractor will share project photos here as work progresses</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Eye className="w-4 h-4" />
        <span>{photos.length} photo{photos.length !== 1 ? "s" : ""} shared by your contractor</span>
      </div>

      {activePhasesWithPhotos.map(phase => (
        <div key={phase}>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-semibold text-sm">{phase}</h3>
            <Badge className={`text-xs ${PHASE_COLORS[phase] || PHASE_COLORS["Other"]}`}>
              {grouped[phase].length}
            </Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {grouped[phase].map(photo => (
              <div
                key={photo.id}
                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer border hover:border-primary/50 transition-all group"
                onClick={() => setLightboxPhoto(photo)}
              >
                <img src={photo.thumbnail_url || photo.file_url} alt={photo.caption || ""} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-all" />
                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-white text-xs truncate">{photo.caption}</p>
                    <p className="text-white/60 text-xs">{formatDate(photo.taken_at)}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {lightboxPhoto && (
        <PhotoLightbox
          photo={lightboxPhoto}
          photos={photos}
          onClose={() => setLightboxPhoto(null)}
          onNavigate={setLightboxPhoto}
        />
      )}
    </div>
  );
}