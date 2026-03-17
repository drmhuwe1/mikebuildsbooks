import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, AlertTriangle, TrendingUp, Lightbulb, ChevronDown } from "lucide-react";
import { predictProjectTimeline, analyzeTimelineRisk } from "@/lib/timelineIntelligence";
import { formatDate } from "@/lib/formatters";

export default function TimelinePredictorPanel({ job, allJobs, onEditTimeline }) {
  const [expanded, setExpanded] = React.useState(false);

  const timeline = useMemo(() => predictProjectTimeline(job, allJobs), [job, allJobs]);
  const riskAnalysis = useMemo(() => analyzeTimelineRisk(job, allJobs), [job, allJobs]);

  if (!timeline) return null;

  const riskColors = {
    low: { badge: "bg-green-100 text-green-800", text: "text-green-700", bg: "bg-green-50" },
    moderate: { badge: "bg-yellow-100 text-yellow-800", text: "text-yellow-700", bg: "bg-yellow-50" },
    high: { badge: "bg-red-100 text-red-800", text: "text-red-700", bg: "bg-red-50" },
  };

  const colors = riskColors[riskAnalysis.riskLevel];

  return (
    <Card className={`p-4 border-l-4 border-current ${colors.bg}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className={`w-4 h-4 ${colors.text}`} />
            <h4 className="font-semibold text-sm">Timeline Prediction</h4>
            <Badge className={colors.badge}>{riskAnalysis.riskLevel.charAt(0).toUpperCase() + riskAnalysis.riskLevel.slice(1)} Risk</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Confidence: <strong>{timeline.confidence}%</strong> ({riskAnalysis.similarJobsCount} similar projects)
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="gap-1"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </Button>
      </div>

      {/* Quick Summary */}
      <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
        <div className="bg-white/60 rounded p-2">
          <p className="text-muted-foreground">Start</p>
          <p className="font-semibold">{formatDate(timeline.estimatedStartDate)}</p>
        </div>
        <div className="bg-white/60 rounded p-2">
          <p className="text-muted-foreground">End</p>
          <p className="font-semibold">{formatDate(timeline.estimatedCompletionDate)}</p>
        </div>
        <div className="bg-white/60 rounded p-2">
          <p className="text-muted-foreground">Days</p>
          <p className="font-semibold">{timeline.estimatedTotalDays}</p>
        </div>
        <div className="bg-white/60 rounded p-2">
          <p className="text-muted-foreground">Labor Hours</p>
          <p className="font-semibold">{timeline.estimatedLaborHours.toFixed(0)}</p>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="space-y-3 pt-3 border-t border-border/30">
          {/* Risk Factors */}
          {riskAnalysis.factors.length > 0 && (
            <div className="bg-white/50 rounded p-3">
              <p className="text-xs font-semibold mb-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Risk Factors
              </p>
              <ul className="space-y-1 text-xs">
                {riskAnalysis.factors.map((factor, i) => (
                  <li key={i} className={`${colors.text}`}>• {factor}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Project Phases */}
          {timeline.phases.length > 0 && (
            <div className="bg-white/50 rounded p-3">
              <p className="text-xs font-semibold mb-2">Work Phases ({timeline.phases.length})</p>
              <div className="space-y-1.5">
                {timeline.phases.map((phase, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span>{phase.name}</span>
                    <span className="text-muted-foreground">{phase.estimated_duration_days} days</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Insights */}
          {timeline.insights.length > 0 && (
            <div className="bg-white/50 rounded p-3">
              <p className="text-xs font-semibold mb-2 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" /> AI Insights
              </p>
              <ul className="space-y-1.5 text-xs">
                {timeline.insights.map((insight, i) => (
                  <li key={i} className="text-muted-foreground leading-relaxed">{insight}</li>
                ))}
              </ul>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={onEditTimeline}
          >
            <Calendar className="w-3 h-3 mr-1" /> Edit Timeline
          </Button>
        </div>
      )}
    </Card>
  );
}