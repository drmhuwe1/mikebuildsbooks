import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Mail, Printer, Download, FileText, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const METHOD_ICON = {
  email: Mail,
  fax: Printer,
  print: Printer,
  download: Download,
};

const METHOD_COLOR = {
  email: "bg-blue-100 text-blue-700",
  fax: "bg-purple-100 text-purple-700",
  print: "bg-gray-100 text-gray-700",
  download: "bg-green-100 text-green-700",
};

const STATUS_COLOR = {
  sent: "bg-green-100 text-green-700",
  delivered: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  pending: "bg-yellow-100 text-yellow-700",
};

function formatTs(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function JobDeliveryHistory({ jobId }) {
  const { data: deliveries = [], isLoading } = useQuery({
    queryKey: ["deliveries", jobId],
    queryFn: () => base44.entities.DocumentDelivery.filter({ job_id: jobId }, "-sent_at", 50),
    enabled: !!jobId,
  });

  if (isLoading) return <p className="text-xs text-muted-foreground py-2">Loading history...</p>;
  if (deliveries.length === 0) return (
    <div className="flex items-center gap-2 py-4 text-muted-foreground">
      <Clock className="w-4 h-4" />
      <p className="text-xs">No delivery history yet for this job.</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {deliveries.map(d => {
        const Icon = METHOD_ICON[d.delivery_method] || FileText;
        return (
          <div key={d.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card text-sm">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${METHOD_COLOR[d.delivery_method]}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-foreground text-xs truncate">{d.doc_title || d.doc_type}</span>
                <Badge className={`text-[10px] px-1.5 py-0 ${METHOD_COLOR[d.delivery_method]}`}>
                  {d.delivery_method}
                </Badge>
                <Badge className={`text-[10px] px-1.5 py-0 ${STATUS_COLOR[d.status] || "bg-gray-100 text-gray-700"}`}>
                  {d.status}
                </Badge>
              </div>
              {d.recipient && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  To: {d.recipient}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground mt-0.5">{formatTs(d.sent_at)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}