import React from "react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { DollarSign, TrendingUp, TrendingDown, PiggyBank, AlertCircle, Minus } from "lucide-react";

function KPI({ label, value, icon: Icon, color = "text-foreground" }) {
  return (
    <Card className="p-4 flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className={`w-3.5 h-3.5 ${color}`} />}
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </Card>
  );
}

export default function PersonalKPIBar({ ownerIncome, monthlyObligations, surplus, savingsTotal, debtPayments, overdueAmount }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <KPI label="Owner Income" value={formatCurrency(ownerIncome)} icon={TrendingUp} color="text-green-600" />
      <KPI label="Monthly Obligations" value={formatCurrency(monthlyObligations)} icon={TrendingDown} color="text-red-500" />
      <KPI label="Monthly Surplus" value={formatCurrency(surplus)} icon={surplus >= 0 ? TrendingUp : TrendingDown} color={surplus >= 0 ? "text-green-600" : "text-red-600"} />
      <KPI label="Savings Total" value={formatCurrency(savingsTotal)} icon={PiggyBank} color="text-blue-600" />
      <KPI label="Debt Payments" value={formatCurrency(debtPayments)} icon={Minus} color="text-orange-500" />
      <KPI label="Overdue Bills" value={formatCurrency(overdueAmount)} icon={AlertCircle} color={overdueAmount > 0 ? "text-red-600" : "text-muted-foreground"} />
    </div>
  );
}