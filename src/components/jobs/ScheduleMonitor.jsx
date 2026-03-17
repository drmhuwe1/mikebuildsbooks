import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { monitorScheduleVariance, analyzePhaseProgress } from "@/lib/timelineIntelligence";
import { formatDate } from "@/lib/formatters";

export default function ScheduleMonitor({ job, phases = [] }) {
  const scheduleStatus = useMemo(() => monitorScheduleVariance(job), [job]);
  const phaseStatus = useMemo(() => analyzePhaseProgress(job, phases), [job, phases]);

  if (!job.start_date) {
    return (
      <Card className="p-4 bg-gray-50 border-gray-200">
        <p className="text-sm text-muted-foreground">Set a start date to track schedule progress.</p>
      </Card>
    );
  }

  const isOnTrack = scheduleStatus.variance === null || scheduleStatus.variance <= 0;
  const daysOverdue = Math.abs(scheduleStatus.daysOverdue);

  return (
    <div className="space-y-3">
      {/* Status Card */}
      <Card className={`p-4 border-l-4 ${isOnTrack ? "border-l-green-500 bg-green-50" : "border-l-red-500 bg-red-50"}`}>
        <div className="flex items-center gap-2 mb-1">
          {isOnTrack ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className="font-semibold text-sm text-green-700">On Schedule</p>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <p className="font-semibold text-sm text-red-700">Behind Schedule</p>
            </>
          )}
        </div>

        {scheduleStatus.variance !== null && (
          <p className={`text-sm ${isOnTrack ? "text-green-600" : "text-red-600"}`}>
            {isOnTrack ? (
              <>On track for {formatDate(job.projected_completion)}</>
            ) : (
              <>{daysOverdue} day{daysOverdue !== 1 ? "s" : ""} behind schedule</>
            )}
          </p>
        )}

        {scheduleStatus.alerts.length > 0 && (
          <div className="mt-2 space-y-1">
            {scheduleStatus.alerts.map((alert, i) => (
              <p key={i} className="text-xs text-muted-foreground">• {alert.message}</p>
            ))}
          </div>
        )}
      </Card>

      {/* Phase Progress */}
      {phaseStatus.length > 0 && (
        <Card className="p-4">
          <h4 className="text-sm font-semibold mb-3">Phase Progress</h4>
          <div className="space-y-2">
            {phaseStatus.map((phase, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {phase.status === "completed" && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                  {phase.status === "in_progress" && (
                    <Clock className="w-4 h-4 text-blue-600 animate-pulse" />
                  )}
                  {phase.status === "not_started" && (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{phase.name}</p>
                    {phase.isOverdue && (
                      <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                        Overdue
                      </Badge>
                    )}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        phase.status === "completed"
                          ? "bg-green-600"
                          : phase.status === "in_progress"
                          ? "bg-blue-600"
                          : "bg-gray-300"
                      }`}
                      style={{ width: `${phase.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {phase.status === "completed" && "Completed"}
                    {phase.status === "in_progress" && `${phase.progress}% complete`}
                    {phase.status === "not_started" && `Not started (${phase.estimated_duration_days} days estimated)`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}