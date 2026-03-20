import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronDown, ChevronUp, Cloud, Users, Eye, EyeOff } from "lucide-react";
import DailyLogModal from "./DailyLogModal";
import { formatDate } from "@/lib/formatters";

const WEATHER_ICONS = {
  Clear: "☀️", Cloudy: "☁️", Rain: "🌧️", Snow: "❄️", Wind: "💨", "Extreme Heat": "🌡️"
};

export default function JobDailyLogTab({ job }) {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [expanded, setExpanded] = useState(new Set());

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["dailyLogs", job.id],
    queryFn: () => base44.entities.DailyLog.filter({ job_id: job.id }, "-date"),
  });

  const { data: photos = [] } = useQuery({
    queryKey: ["jobPhotos", job.id],
    queryFn: () => base44.entities.JobPhoto.filter({ job_id: job.id }),
  });

  const photoMap = React.useMemo(() => {
    const map = {};
    photos.forEach(p => { map[p.id] = p; });
    return map;
  }, [photos]);

  const toggleExpand = (id) =>
    setExpanded(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{logs.length} log entr{logs.length !== 1 ? "ies" : "y"}</p>
        <Button size="sm" onClick={() => setModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Log Entry
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="font-medium">No log entries yet</p>
          <p className="text-sm">Track daily progress with log entries</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => {
            const isOpen = expanded.has(log.id);
            const linkedPhotos = (log.linked_photos || []).map(id => photoMap[id]).filter(Boolean);
            return (
              <div key={log.id} className="border rounded-lg overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
                  onClick={() => toggleExpand(log.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{WEATHER_ICONS[log.weather_conditions] || "📋"}</span>
                    <div>
                      <p className="font-semibold text-sm">{formatDate(log.date)}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.weather_conditions} · {log.crew_count || 0} crew
                        {log.created_by ? ` · ${log.created_by}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {log.is_client_visible
                      ? <Badge className="bg-green-100 text-green-700 text-xs gap-1"><Eye className="w-3 h-3" /> Shared</Badge>
                      : <Badge variant="outline" className="text-xs gap-1"><EyeOff className="w-3 h-3" /> Internal</Badge>}
                    {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t bg-muted/20 p-3 space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Work Performed</p>
                      <p className="text-sm whitespace-pre-wrap">{log.work_performed || "—"}</p>
                    </div>
                    {log.materials_delivered && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Materials Delivered</p>
                        <p className="text-sm whitespace-pre-wrap">{log.materials_delivered}</p>
                      </div>
                    )}
                    {log.issues_or_delays && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Issues / Delays</p>
                        <p className="text-sm whitespace-pre-wrap text-orange-700">{log.issues_or_delays}</p>
                      </div>
                    )}
                    {linkedPhotos.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Linked Photos</p>
                        <div className="flex gap-2 flex-wrap">
                          {linkedPhotos.map(p => (
                            <img key={p.id} src={p.thumbnail_url || p.file_url} alt="" className="w-16 h-16 object-cover rounded border" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <DailyLogModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        jobId={job.id}
        jobTitle={job.title}
        onSaved={() => qc.invalidateQueries({ queryKey: ["dailyLogs", job.id] })}
      />
    </div>
  );
}