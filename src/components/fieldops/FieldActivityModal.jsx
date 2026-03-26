import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

const ICONS = {
  payment_collected: "💰",
  signed_contract_upload: "📋",
  expense_receipt: "🧾",
  subcontractor_paysheet: "📄",
  subcontractor_hours: "⏱️"
};

const LABELS = {
  payment_collected: "Payment Collected",
  signed_contract_upload: "Signed Contract",
  expense_receipt: "Expense Receipt",
  subcontractor_paysheet: "Pay Sheet",
  subcontractor_hours: "Hours Entered"
};

export default function FieldActivityModal({ onClose }) {
  const { data: logs = [] } = useQuery({
    queryKey: ["fieldActivityLogs"],
    queryFn: () => base44.entities.FieldActivityLog.list("-timestamp", 50)
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md rounded-t-lg sm:rounded-lg">
        <div className="p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Recent Field Activity</h2>
            <button onClick={onClose} className="p-1 hover:bg-muted rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No activity yet</p>
          ) : (
            <div className="space-y-3">
              {logs.map(log => (
                <div key={log.id} className="p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{ICONS[log.item_type] || "📌"}</span>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-semibold text-sm">
                          {LABELS[log.item_type] || log.item_type}
                        </p>
                        <Badge variant="outline" className="text-xs shrink-0 capitalize">
                          {log.status}
                        </Badge>
                      </div>

                      {log.client_name && (
                        <p className="text-xs text-muted-foreground">
                          {log.client_name}
                        </p>
                      )}

                      {log.job_title && (
                        <p className="text-xs text-muted-foreground">
                          {log.job_title}
                        </p>
                      )}

                      {log.subcontractor_name && (
                        <p className="text-xs text-muted-foreground">
                          {log.subcontractor_name}
                        </p>
                      )}

                      {log.amount && (
                        <p className="text-xs font-semibold text-green-600 mt-1">
                          ${log.amount}
                        </p>
                      )}

                      {log.hours && (
                        <p className="text-xs font-semibold text-blue-600 mt-1">
                          {log.hours} hours
                        </p>
                      )}

                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>

                      {log.file_name && (
                        <p className="text-xs text-muted-foreground">
                          📎 {log.file_name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button onClick={onClose} className="w-full mt-6">
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
}