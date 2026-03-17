import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Mail, Phone, Download, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/formatters";

const METHOD_ICONS = {
  email: Mail,
  fax: Phone,
  download: Download,
  print: Download,
};

const STATUS_COLORS = {
  sent: "bg-green-100 text-green-700",
  delivered: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  pending: "bg-yellow-100 text-yellow-700",
};

export default function JobDeliveryHistory({ jobId }) {
  const { data: deliveries = [] } = useQuery({
    queryKey: ["deliveries", jobId],
    queryFn: () => base44.entities.DocumentDelivery.filter({ job_id: jobId }, "-sent_at", 20),
    enabled: !!jobId,
  });

  if (deliveries.length === 0) {
    return <p className="text-xs text-muted-foreground">No delivery history yet.</p>;
  }

  return (
    <div className="space-y-2">
      {deliveries.map(d => {
        const Icon = METHOD_ICONS[d.delivery_method] || Clock;
        return (
          <div key={d.id} className="flex items-start gap-2 text-xs">
            <Icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-medium">{d.doc_title || d.doc_type}</span>
                <Badge className={`text-[10px] py-0 px-1.5 ${STATUS_COLORS[d.status] || "bg-gray-100 text-gray-700"}`}>
                  {d.status}
                </Badge>
                <span className="text-muted-foreground capitalize">{d.delivery_method}</span>
              </div>
              {d.recipient && <p className="text-muted-foreground truncate">To: {d.recipient}</p>}
              {d.sent_at && <p className="text-muted-foreground">{formatDate(d.sent_at)}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}