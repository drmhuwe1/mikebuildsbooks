import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

function YTDBar({ ytdPaid }) {
  const threshold = 600;
  const pct = Math.min((ytdPaid / threshold) * 100, 100);
  const color = ytdPaid >= 600 ? "bg-red-500" : ytdPaid >= 500 ? "bg-yellow-500" : "bg-green-500";
  const label = ytdPaid >= 600 ? "🔴 1099 Required" : ytdPaid >= 500 ? "🟡 Approaching $600" : "🟢 Under $600";
  return (
    <div className="p-3 bg-muted/20 rounded-lg space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-semibold">YTD Paid {new Date().getFullYear()}</span>
        <span className="font-bold">{formatCurrency(ytdPaid)}</span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs font-medium">{label} (threshold: {formatCurrency(threshold)})</p>
    </div>
  );
}

export default function SubPaymentsTab({ sub }) {
  const { data: entries = [] } = useQuery({
    queryKey: ["workEntries", sub.id],
    queryFn: () => base44.entities.SubcontractorWorkEntry.filter({ subcontractor_id: sub.id }),
  });

  const unpaidEntries = entries.filter(e => e.payment_status === "Unpaid");
  const sortedEntries = [...entries].sort((a, b) => (b.work_date || "").localeCompare(a.work_date || ""));

  const ytdPaid = useMemo(() => {
    const year = String(new Date().getFullYear());
    return entries.filter(e => e.payment_status === "Paid" && (e.work_date || "").startsWith(year))
      .reduce((s, e) => s + (e.calculated_pay || 0), 0);
  }, [entries]);

  return (
    <div className="space-y-4">
      <YTDBar ytdPaid={ytdPaid} />

      <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
        <Info className="w-4 h-4 shrink-0 text-blue-500" />
        <span>Payments are recorded through the <strong>Job</strong>. Go to the job's sub labor tab to process a payment — it will automatically appear here.</span>
      </div>

      <p className="text-xs text-muted-foreground">{unpaidEntries.length} unpaid work {unpaidEntries.length === 1 ? "entry" : "entries"}</p>

      {sortedEntries.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground bg-muted/20 rounded-lg">
          No work entries recorded yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2 font-semibold">Date</th>
                <th className="text-left px-3 py-2 font-semibold">Job</th>
                <th className="text-right px-3 py-2 font-semibold">Hours</th>
                <th className="text-right px-3 py-2 font-semibold">Rate</th>
                <th className="text-right px-3 py-2 font-semibold">Calculated Pay</th>
                <th className="text-center px-3 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedEntries.map(e => (
                <tr key={e.id} className="border-t hover:bg-muted/20">
                  <td className="px-3 py-2">{e.work_date || "—"}</td>
                  <td className="px-3 py-2">{e.job_title || "—"}</td>
                  <td className="px-3 py-2 text-right">{(e.hours_worked || 0).toFixed(1)}h</td>
                  <td className="px-3 py-2 text-right">${(e.pay_rate || 0).toFixed(2)}/{e.pay_type}</td>
                  <td className="px-3 py-2 text-right font-semibold text-green-700">{formatCurrency(e.calculated_pay || 0)}</td>
                  <td className="px-3 py-2 text-center">
                    <Badge variant={e.payment_status === "Paid" ? "default" : "secondary"} className="text-xs">
                      {e.payment_status || "Unpaid"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}