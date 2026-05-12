import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ImageIcon, X } from "lucide-react";

export default function SubPaysheetTab({ sub }) {
  const [lightbox, setLightbox] = useState(null);

  const { data: paysheets = [] } = useQuery({
    queryKey: ["paysheets", sub.id],
    queryFn: () => base44.entities.FieldActivityLog.filter({ 
      subcontractor_id: sub.id, 
      item_type: "subcontractor_paysheet" 
    }),
  });

  const sorted = [...paysheets].sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground bg-muted/20 p-2 rounded">Pay sheets uploaded through job sub-labor will appear here automatically.</p>

      {/* Paysheets from jobs */}
      {sorted.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground bg-muted/20 rounded-lg">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No pay sheets uploaded yet. Upload them through the job's sub-labor tab.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {sorted.map(ps => (
            <div key={ps.id} className="border rounded-lg overflow-hidden bg-card relative group">
              <img
                src={ps.file_url}
                alt="Pay sheet"
                className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setLightbox(ps)}
              />
              <div className="p-2">
                <p className="text-xs font-semibold truncate">{ps.job_title || "Pay Sheet"}</p>
                <p className="text-xs text-muted-foreground truncate">{ps.uploaded_by_name || "Uploaded"}</p>
                <p className="text-xs text-muted-foreground">{ps.timestamp?.split('T')[0]}</p>
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
            <img src={lightbox.file_url} alt="Pay sheet" className="w-full rounded-lg" />
            <div className="mt-2 text-white text-sm">
              {lightbox.job_title && <p><strong>Job:</strong> {lightbox.job_title}</p>}
              {lightbox.uploaded_by_name && <p><strong>Uploaded by:</strong> {lightbox.uploaded_by_name}</p>}
              {lightbox.timestamp && <p><strong>Date:</strong> {lightbox.timestamp.split('T')[0]}</p>}
              {lightbox.notes && <p><strong>Notes:</strong> {lightbox.notes}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}