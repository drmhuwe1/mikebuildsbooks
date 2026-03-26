import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";

export default function PaymentAuditLog() {
  const { data: auditLogs = [] } = useQuery({
    queryKey: ["paymentAudit"],
    queryFn: () => base44.entities.FieldPaymentsAudit.list("-timestamp", 100)
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Field Payments Audit Log</h3>
      {auditLogs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No payment activity yet.</p>
      ) : (
        <div className="space-y-3">
          {auditLogs.map(log => (
            <Card key={log.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {log.status === "success" ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <div>
                    <p className="font-semibold text-sm">{log.client_name}</p>
                    <p className="text-xs text-muted-foreground">{log.user_email}</p>
                  </div>
                </div>
                <Badge variant={log.status === "success" ? "default" : "destructive"} className="text-xs">
                  {log.status === "success" ? "Success" : "Failed"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="font-semibold text-green-600">{formatCurrency(log.amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="font-semibold capitalize">{log.payment_type?.replace(/_/g, " ") || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Source</p>
                  <p className="font-semibold capitalize">{log.source?.replace(/_/g, " ") || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p className="text-xs">{formatDate(log.timestamp)}</p>
                </div>
              </div>

              <div className="pt-3 border-t space-y-1 text-xs">
                {log.job_title && <p className="text-muted-foreground">Job: {log.job_title}</p>}
                {log.stripe_transaction_id && (
                  <p className="text-muted-foreground font-mono">Ref: {log.stripe_transaction_id.slice(0, 12)}...</p>
                )}
                {log.error_message && (
                  <p className="text-red-600">Error: {log.error_message}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}