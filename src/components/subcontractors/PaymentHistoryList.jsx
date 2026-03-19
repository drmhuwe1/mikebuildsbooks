import React from "react";
import { formatCurrency } from "@/lib/formatters";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { TrendingDown } from "lucide-react";

export default function PaymentHistoryList({ payments, subcontractorId, jobs }) {
  const subPayments = payments.filter(p => p.subcontractor_id === subcontractorId).sort((a, b) => 
    new Date(b.payment_date) - new Date(a.payment_date)
  );

  if (subPayments.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <p className="text-sm">No payments logged yet</p>
      </div>
    );
  }

  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const ytdTotal = subPayments
    .filter(p => p.status === "paid" && new Date(p.payment_date) >= yearStart)
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-3">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-700 font-semibold">
          YTD Paid: <span className="text-base font-bold">{formatCurrency(ytdTotal)}</span>
        </p>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {subPayments.map(payment => {
          const job = jobs.find(j => j.id === payment.job_id);
          return (
            <Card key={payment.id} className="p-3 bg-gray-50">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {job?.title || "Unknown Job"}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {format(new Date(payment.payment_date), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900">
                    {formatCurrency(payment.amount)}
                  </p>
                  <Badge variant="outline" className="text-xs mt-1">
                    {payment.payment_method}
                  </Badge>
                </div>
              </div>

              {payment.calculation_notes && (
                <p className="text-xs text-gray-600 mb-1">{payment.calculation_notes}</p>
              )}

              {payment.notes && (
                <p className="text-xs text-gray-500 italic">{payment.notes}</p>
              )}

              {payment.synced_to_finances && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" /> Synced to financials
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}