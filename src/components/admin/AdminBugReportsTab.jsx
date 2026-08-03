import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bug, RefreshCw, MessageSquare } from "lucide-react";
import { format } from "date-fns";

export default function AdminBugReportsTab() {
  const [filter, setFilter] = useState("all");

  const { data: reports = [], isLoading, refetch } = useQuery({
    queryKey: ["bug-reports"],
    queryFn: () => base44.entities.BugReport.list("-created_date", 200),
  });

  const filtered = filter === "all" ? reports : reports.filter(r => (r.issue_type || "bug") === filter);

  const formatDate = (d) => d ? format(new Date(d), "M/d/yyyy HH:mm") : "—";

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Bug className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-semibold text-lg">Bug Reports & Feedback ({reports.length})</h2>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
        </Button>
      </div>

      <div className="flex gap-2 mb-4">
        {["all", "bug", "feature_request", "unclear_feature"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              filter === f ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-input hover:bg-muted"
            }`}
          >
            {f === "all" ? "All" : f.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No reports yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="font-medium text-sm">{r.message?.slice(0, 80) || "Untitled"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {r.user_email || "Unknown"} · {formatDate(r.created_date)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {r.priority && (
                    <Badge variant={r.priority === "critical" ? "destructive" : "secondary"} className="text-xs capitalize">
                      {r.priority}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs capitalize">
                    {r.issue_type || "bug"}
                  </Badge>
                  {r.status && r.status !== "new" && (
                    <Badge variant="outline" className="text-xs capitalize">{r.status}</Badge>
                  )}
                </div>
              </div>
              {r.message ? (
                <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{r.message}</p>
              ) : null}
              {r.page_context ? (
                <p className="text-xs text-muted-foreground mt-2">📍 {r.page_context}</p>
              ) : null}
              {r.browser_info ? (
                <p className="text-xs text-muted-foreground mt-1">🌐 {r.browser_info}</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}