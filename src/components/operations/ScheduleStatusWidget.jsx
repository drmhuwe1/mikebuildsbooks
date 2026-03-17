import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { analyzeTimelineRisk } from "@/lib/timelineIntelligence";
import { formatDate } from "@/lib/formatters";

export default function ScheduleStatusWidget({ jobs = [] }) {
  const analysis = useMemo(() => {
    const activeJobs = jobs.filter(j => ["in_progress", "contracted"].includes(j.status));

    const onSchedule = [];
    const atRisk = [];
    const delayed = [];

    activeJobs.forEach(j => {
      const riskAnalysis = analyzeTimelineRisk(j, jobs);

      if (j.projected_completion) {
        const today = new Date();
        const projected = new Date(j.projected_completion);
        const daysUntil = Math.ceil((projected - today) / (1000 * 60 * 60 * 24));

        if (daysUntil < 0) {
          delayed.push({ job: j, daysOverdue: Math.abs(daysUntil), risk: riskAnalysis });
        } else if (riskAnalysis.riskLevel === "high" || daysUntil < 7) {
          atRisk.push({ job: j, daysUntil, risk: riskAnalysis });
        } else {
          onSchedule.push({ job: j, daysUntil, risk: riskAnalysis });
        }
      }
    });

    return { onSchedule, atRisk, delayed, activeJobs };
  }, [jobs]);

  const stats = [
    { label: "On Schedule", count: analysis.onSchedule.length, color: "bg-green-100 text-green-800" },
    { label: "At Risk", count: analysis.atRisk.length, color: "bg-yellow-100 text-yellow-800" },
    { label: "Delayed", count: analysis.delayed.length, color: "bg-red-100 text-red-800" },
  ];

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4" /> Schedule Status
        </h3>
        <Link to="/JobTimeline">
          <Button variant="ghost" size="sm" className="gap-1 text-xs">
            View <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {stats.map(stat => (
          <div key={stat.label} className={`rounded px-2 py-1.5 text-center ${stat.color}`}>
            <p className="text-2xl font-bold">{stat.count}</p>
            <p className="text-xs">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Job List */}
      <div className="space-y-2 text-sm">
        {analysis.delayed.length > 0 && (
          <>
            <p className="text-xs font-semibold text-red-700 mb-1.5 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Delayed Jobs
            </p>
            {analysis.delayed.slice(0, 2).map(({ job, daysOverdue }) => (
              <div key={job.id} className="bg-red-50 rounded p-2 border-l-2 border-red-400">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-xs">{job.title}</p>
                    <p className="text-xs text-muted-foreground">{job.client_name}</p>
                  </div>
                  <Badge className="bg-red-200 text-red-800 text-xs shrink-0">
                    {daysOverdue}d late
                  </Badge>
                </div>
              </div>
            ))}
          </>
        )}

        {analysis.atRisk.length > 0 && (
          <>
            <p className="text-xs font-semibold text-yellow-700 mb-1.5 flex items-center gap-1 mt-2">
              <AlertTriangle className="w-3 h-3" /> At Risk
            </p>
            {analysis.atRisk.slice(0, 2).map(({ job, daysUntil }) => (
              <div key={job.id} className="bg-yellow-50 rounded p-2 border-l-2 border-yellow-400">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-xs">{job.title}</p>
                    <p className="text-xs text-muted-foreground">{job.client_name}</p>
                  </div>
                  <Badge className="bg-yellow-200 text-yellow-800 text-xs shrink-0">
                    {daysUntil}d left
                  </Badge>
                </div>
              </div>
            ))}
          </>
        )}

        {analysis.onSchedule.length > 0 && analysis.atRisk.length === 0 && analysis.delayed.length === 0 && (
          <div className="bg-green-50 rounded p-3 text-center border border-green-200">
            <p className="text-xs text-green-700 flex items-center justify-center gap-1">
              <CheckCircle className="w-3 h-3" /> All active jobs on track
            </p>
          </div>
        )}

        {analysis.activeJobs.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">No active jobs to monitor</p>
        )}
      </div>
    </Card>
  );
}