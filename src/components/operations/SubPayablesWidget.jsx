import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { AlertTriangle } from "lucide-react";

export default function SubPayablesWidget() {
  const { data: entries = [] } = useQuery({
    queryKey: ["workEntries"],
    queryFn: () => base44.entities.SubcontractorWorkEntry.filter({ payment_status: "Unpaid" }),
  });

  const { data: subs = [] } = useQuery({
    queryKey: ["subcontractors"],
    queryFn: () => base44.entities.Subcontractor.list("-created_date", 200),
  });

  // Group unpaid by subcontractor
  const bySub = {};
  entries.forEach(e => {
    if (!bySub[e.subcontractor_id]) {
      bySub[e.subcontractor_id] = { name: e.subcontractor_name || "Unknown", total: 0, oldest: e.work_date };
    }
    bySub[e.subcontractor_id].total += (e.calculated_pay || 0);
    if (e.work_date < bySub[e.subcontractor_id].oldest) {
      bySub[e.subcontractor_id].oldest = e.work_date;
    }
  });

  const payables = Object.values(bySub).filter(s => s.total > 0).sort((a, b) => b.total - a.total);

  if (payables.length === 0) return null;

  const totalOwed = payables.reduce((s, p) => s + p.total, 0);

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-orange-500" />
        <h3 className="font-semibold text-sm">Subcontractor Payables</h3>
        <span className="ml-auto text-sm font-bold text-orange-600">{formatCurrency(totalOwed)}</span>
      </div>
      <div className="space-y-2">
        {payables.map((p, i) => (
          <div key={i} className="flex items-center justify-between text-xs p-2 bg-orange-50 rounded-lg border border-orange-200">
            <div>
              <p className="font-semibold">{p.name}</p>
              <p className="text-muted-foreground">Oldest unpaid: {p.oldest || "—"}</p>
            </div>
            <span className="font-bold text-orange-700">{formatCurrency(p.total)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}