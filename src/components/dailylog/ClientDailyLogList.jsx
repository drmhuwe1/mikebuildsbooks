import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, ChevronDown, ChevronUp } from "lucide-react";
import { formatDate } from "@/lib/formatters";

const WEATHER_ICONS = {
  Clear: "☀️", Cloudy: "☁️", Rain: "🌧️", Snow: "❄️", Wind: "💨", "Extreme Heat": "🌡️"
};

export default function ClientDailyLogList({ jobId }) {
  const [expanded, setExpanded] = useState(new Set());

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["dailyLogs", jobId, "client"],
    queryFn: () => base44.entities.DailyLog.filter({ job_id: jobId, is_client_visible: true }, "-date"),
  });

  const toggleExpand = (id) =>
    setExpanded(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Loading updates...</div>;

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">No project updates yet</p>
        <p className="text-sm">Your contractor will share daily progress updates here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {logs.map(log => {
        const isOpen = expanded.has(log.id);
        return (
          <div key={log.id} className="border rounded-lg overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-left"
              onClick={() => toggleExpand(log.id)}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{WEATHER_ICONS[log.weather_conditions] || "📋"}</span>
                <div>
                  <p className="font-semibold text-sm">{formatDate(log.date)}</p>
                  <p className="text-xs text-muted-foreground">
                    {log.weather_conditions} · {log.crew_count || 0} crew members on site
                  </p>
                </div>
              </div>
              {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>

            {isOpen && (
              <div className="border-t bg-muted/10 p-3 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Work Completed</p>
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
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Notes / Delays</p>
                    <p className="text-sm whitespace-pre-wrap text-orange-700">{log.issues_or_delays}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}