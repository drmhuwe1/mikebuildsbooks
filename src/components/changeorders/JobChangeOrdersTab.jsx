import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Pencil } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import ChangeOrderStatusBadge from "./ChangeOrderStatusBadge";
import ChangeOrderEditor from "./ChangeOrderEditor";

export default function JobChangeOrdersTab({ job }) {
  const [editing, setEditing] = useState(null); // null = list, "new" = create, id = edit
  const qc = useQueryClient();

  const { data: changeOrders = [], isLoading } = useQuery({
    queryKey: ["changeOrders", job.id],
    queryFn: () => base44.entities.ChangeOrder.filter({ job_id: job.id }),
  });

  const approvedTotal = changeOrders.filter(co => co.status === "approved").reduce((s, co) => s + (co.total_amount || 0), 0);
  const pendingTotal = changeOrders.filter(co => co.status === "sent").reduce((s, co) => s + (co.total_amount || 0), 0);

  if (editing === "new" || (editing && editing !== null)) {
    return (
      <ChangeOrderEditor
        changeOrderId={editing === "new" ? null : editing}
        jobId={job.id}
        onBack={() => setEditing(null)}
        onSaved={() => { setEditing(null); qc.invalidateQueries({ queryKey: ["changeOrders", job.id] }); }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs text-green-700">Approved CO Value</p>
          <p className="text-base font-bold text-green-900">{formatCurrency(approvedTotal)}</p>
        </div>
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-700">Pending Approval</p>
          <p className="text-base font-bold text-yellow-900">{formatCurrency(pendingTotal)}</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold">Change Orders ({changeOrders.length})</p>
        <Button size="sm" onClick={() => setEditing("new")} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" /> New Change Order
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>}

      {!isLoading && changeOrders.length === 0 && (
        <div className="py-8 text-center text-muted-foreground text-sm">
          <p>No change orders yet.</p>
          <Button size="sm" variant="outline" onClick={() => setEditing("new")} className="mt-3 gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Create First Change Order
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {changeOrders.map(co => (
          <div key={co.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/40 transition-colors">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono text-muted-foreground">{co.change_order_number}</span>
                <span className="text-sm font-medium truncate">{co.title}</span>
                <ChangeOrderStatusBadge status={co.status} />
              </div>
              <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                <span>{formatDate(co.created_date)}</span>
                <span className={`font-semibold ${(co.total_amount || 0) < 0 ? "text-red-600" : "text-green-700"}`}>
                  {(co.total_amount || 0) >= 0 ? "+" : ""}{formatCurrency(co.total_amount)}
                </span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setEditing(co.id)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}