import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/formatters";
import { TrendingUp, TrendingDown, PiggyBank, AlertCircle, Minus } from "lucide-react";

function KPI({ label, value, icon: IconComp, color = "text-foreground", onClick }) {
  return (
    <Card
      className={`p-4 flex flex-col gap-1 ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-1.5">
        {IconComp && <IconComp className={`w-3.5 h-3.5 ${color}`} />}
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      {onClick && <p className="text-xs text-muted-foreground mt-1">tap to see breakdown</p>}
    </Card>
  );
}

function DrillDownModal({ open, onClose, title, rows, emptyText }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">{emptyText || "No records found."}</p>
        ) : (
          <div className="space-y-2">
            {rows.map((row, i) => (
              <div key={i} className="flex justify-between items-start py-2 border-b last:border-0 text-sm">
                <div>
                  <p className="font-medium">{row.label}</p>
                  {row.sub && <p className="text-xs text-muted-foreground">{row.sub}</p>}
                </div>
                <p className={`font-bold shrink-0 ml-4 ${row.color || ""}`}>{formatCurrency(row.amount)}</p>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function PersonalKPIBar({ ownerIncome, monthlyObligations, surplus, savingsTotal, debtPayments, overdueAmount, txns = [], personalBills = [] }) {
  const [modal, setModal] = useState(null);

  const today = new Date().toISOString().split("T")[0];

  const drilldowns = {
    ownerIncome: {
      title: "Owner Income — Bank Draws (owner_draw inflow)",
      emptyText: "No owner draw transactions recorded. Add them in Banking as category 'owner_draw', type 'inflow'.",
      rows: txns
        .filter(t => t.category === "owner_draw" && t.type === "inflow")
        .map(t => ({ label: t.description || "Owner Draw", sub: t.date, amount: t.amount, color: "text-green-600" })),
    },
    obligations: {
      title: "Monthly Obligations — Recurring Personal Bills",
      emptyText: "No recurring personal bills found.",
      rows: personalBills
        .filter(b => b.is_recurring && b.status !== "cancelled")
        .map(b => ({ label: b.name || b.description || "Bill", sub: `Due: ${b.due_date || "—"} · ${b.category || ""}`, amount: b.amount })),
    },
    surplus: {
      title: "Monthly Surplus — Owner Income minus Paid Personal Bills",
      emptyText: "No data.",
      rows: [
        { label: "Owner Income (total draws)", amount: ownerIncome, color: "text-green-600" },
        { label: "Paid Personal Bills (expenses)", amount: personalBills.filter(b => b.status === "paid").reduce((s, b) => s + (b.amount || 0), 0), color: "text-red-500" },
        { label: "Surplus", amount: surplus, color: surplus >= 0 ? "text-green-600" : "text-red-600" },
      ],
    },
    savings: {
      title: "Savings — Paid Bills in 'savings' Category",
      emptyText: "No paid savings bills found.",
      rows: personalBills
        .filter(b => b.category === "savings" && b.status === "paid")
        .map(b => ({ label: b.name || b.description || "Savings", sub: b.due_date, amount: b.amount, color: "text-blue-600" })),
    },
    debt: {
      title: "Debt Payments — Paid Bills in 'debt' Category",
      emptyText: "No paid debt bills found.",
      rows: personalBills
        .filter(b => b.category === "debt" && b.status === "paid")
        .map(b => ({ label: b.name || b.description || "Debt", sub: b.due_date, amount: b.amount, color: "text-orange-500" })),
    },
    overdue: {
      title: "Overdue Personal Bills",
      emptyText: "No overdue bills.",
      rows: personalBills
        .filter(b => b.status !== "paid" && b.due_date < today)
        .map(b => ({ label: b.name || b.description || "Bill", sub: `Due: ${b.due_date}`, amount: b.amount, color: "text-red-600" })),
    },
  };

  const active = modal ? drilldowns[modal] : null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPI label="Owner Income" value={formatCurrency(ownerIncome)} icon={TrendingUp} color="text-green-600" onClick={() => setModal("ownerIncome")} />
        <KPI label="Monthly Obligations" value={formatCurrency(monthlyObligations)} icon={TrendingDown} color="text-red-500" onClick={() => setModal("obligations")} />
        <KPI label="Monthly Surplus" value={formatCurrency(surplus)} icon={surplus >= 0 ? TrendingUp : TrendingDown} color={surplus >= 0 ? "text-green-600" : "text-red-600"} onClick={() => setModal("surplus")} />
        <KPI label="Savings Total" value={formatCurrency(savingsTotal)} icon={PiggyBank} color="text-blue-600" onClick={() => setModal("savings")} />
        <KPI label="Debt Payments" value={formatCurrency(debtPayments)} icon={Minus} color="text-orange-500" onClick={() => setModal("debt")} />
        <KPI label="Overdue Bills" value={formatCurrency(overdueAmount)} icon={AlertCircle} color={overdueAmount > 0 ? "text-red-600" : "text-muted-foreground"} onClick={() => setModal("overdue")} />
      </div>
      {active && (
        <DrillDownModal
          open={!!modal}
          onClose={() => setModal(null)}
          title={active.title}
          rows={active.rows}
          emptyText={active.emptyText}
        />
      )}
    </>
  );
}