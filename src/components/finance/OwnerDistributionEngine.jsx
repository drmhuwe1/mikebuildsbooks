import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";
import { DollarSign, AlertTriangle, CheckCircle, TrendingDown } from "lucide-react";

export default function OwnerDistributionEngine({ cashOnHand = 0, bizBillsDue30 = 0, taxReserve = 0, netProfit = 0, ownerDrawsPaid = 0, personalObligations = 0 }) {
  const { conservative, moderate, aggressive, safeAfter, warning } = useMemo(() => {
    const safeAfter = cashOnHand - taxReserve;
    const conservative = Math.max(0, safeAfter * 0.3);
    const moderate = Math.max(0, safeAfter * 0.5);
    const aggressive = Math.max(0, safeAfter * 0.75);
    const warning = safeAfter < 0
      ? "Business cash is too tight for any owner draw right now."
      : safeAfter < personalObligations
      ? "A draw may not fully cover your personal obligations this month."
      : null;
    return { conservative, moderate, aggressive, safeAfter, warning };
  }, [cashOnHand, taxReserve, personalObligations]);

  const options = [
    { label: "Conservative", amount: conservative, desc: "30% of available cash — safest option", color: "text-green-600", badge: "bg-green-100 text-green-700" },
    { label: "Moderate", amount: moderate, desc: "50% of available cash — balanced approach", color: "text-yellow-600", badge: "bg-yellow-100 text-yellow-700" },
    { label: "Aggressive", amount: aggressive, desc: "75% of available cash — higher risk", color: "text-orange-600", badge: "bg-orange-100 text-orange-700" },
  ];

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-5 h-5 text-primary" />
        <p className="text-sm font-bold">Safe Owner Distribution Engine</p>
      </div>

      {warning && (
        <div className="flex items-start gap-2 px-3 py-2 mb-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{warning}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
        <div className="text-center p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">Cash on Hand</p>
          <p className="font-bold text-blue-600">{formatCurrency(cashOnHand)}</p>
        </div>
        <div className="text-center p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">Biz Bills (30d)</p>
          <p className="font-bold text-red-500">{formatCurrency(bizBillsDue30)}</p>
        </div>
        <div className="text-center p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">Tax Reserve</p>
          <p className="font-bold text-yellow-600">{formatCurrency(taxReserve)}</p>
        </div>
      </div>

      <div className="p-3 bg-primary/5 rounded-lg mb-4 flex justify-between items-center">
        <span className="text-sm font-semibold">Available After Obligations</span>
        <span className={`text-lg font-bold ${safeAfter >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(safeAfter)}</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {options.map(o => (
          <div key={o.label} className="p-3 border rounded-lg text-center">
            <Badge className={`text-xs mb-1 ${o.badge}`}>{o.label}</Badge>
            <p className={`text-xl font-bold ${o.color}`}>{formatCurrency(o.amount)}</p>
            <p className="text-xs text-muted-foreground mt-1">{o.desc}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        Personal obligations due soon: <strong>{formatCurrency(personalObligations)}</strong> · Draws already paid: <strong>{formatCurrency(ownerDrawsPaid)}</strong>
      </p>
      <p className="text-xs text-muted-foreground mt-2">
        💡 To record owner draws, go to <strong>Banking</strong> and create a transaction with category <strong>"owner_draw"</strong>.
      </p>
    </Card>
  );
}