import React from "react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { TrendingUp, TrendingDown, DollarSign, PiggyBank, AlertCircle, Clock } from "lucide-react";

function KPI({ label, value, icon: IconComp, color = "text-foreground", sub }) {
  return (
    <Card className="p-4 flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        {IconComp && <IconComp className={`w-3.5 h-3.5 ${color}`} />}
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </Card>
  );
}

export default function BusinessKPIBar({ revenue, expenses, grossProfit, projectedGrossProfit, netProfit, cashOnHand, taxReserve, receivables, overdueAmount, dueSoon, ownerDraws, subPaid = 0, managerPaid = 0, projectedSubPay = 0, projectedManagerPay = 0 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <KPI label="Total Revenue" value={formatCurrency(revenue)} icon={TrendingUp} color="text-green-600" />
      <KPI label="Total Expenses" value={formatCurrency(expenses)} icon={TrendingDown} color="text-red-500" />
      <KPI label="Gross Profit" value={formatCurrency(grossProfit)} icon={TrendingUp} color={grossProfit >= 0 ? "text-green-500" : "text-red-500"} />
      <KPI label="Projected Gross Profit" value={formatCurrency(projectedGrossProfit)} icon={TrendingUp} color={projectedGrossProfit >= 0 ? "text-green-500" : "text-red-500"} />
      <KPI label="Net Profit" value={formatCurrency(netProfit)} icon={DollarSign} color={netProfit >= 0 ? "text-green-600" : "text-red-600"} />
      <KPI label="Cash on Hand" value={formatCurrency(cashOnHand)} icon={PiggyBank} color="text-blue-600" />
      <KPI label="Tax Reserve Needed" value={formatCurrency(taxReserve)} icon={AlertCircle} color="text-yellow-600" />
      <KPI label="Outstanding Receivables" value={formatCurrency(receivables)} icon={Clock} color="text-blue-500" />
      <KPI label="Overdue Bills" value={formatCurrency(overdueAmount)} icon={AlertCircle} color={overdueAmount > 0 ? "text-red-600" : "text-muted-foreground"} />
      <KPI label="Bills Due (30 Days)" value={formatCurrency(dueSoon)} icon={Clock} color="text-orange-500" />
      <KPI label="Subcontractors Paid (YTD)" value={formatCurrency(subPaid)} icon={DollarSign} color="text-blue-600" />
      <KPI label="Subcontractors Projected" value={formatCurrency(projectedSubPay)} icon={DollarSign} color="text-blue-500" />
      <KPI label="Manager Paid (YTD)" value={formatCurrency(managerPaid)} icon={DollarSign} color="text-purple-600" />
      <KPI label="Manager Projected" value={formatCurrency(projectedManagerPay)} icon={DollarSign} color="text-purple-500" />
      <KPI label="Owner Draws Paid" value={formatCurrency(ownerDraws)} icon={DollarSign} color="text-green-600" />
    </div>
  );
}