import React from "react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { CheckCircle, AlertTriangle } from "lucide-react";

function SummaryRow({ label, value, highlight, muted }) {
  return (
    <div className={`flex justify-between items-center py-1.5 ${highlight ? "border-t border-b my-1" : ""}`}>
      <span className={`text-sm ${muted ? "text-muted-foreground" : "text-foreground"}`}>{label}</span>
      <span className={`text-sm font-semibold ${highlight ? "text-primary text-base" : ""}`}>{value}</span>
    </div>
  );
}

export default function Step10Summary({ wizardData, warnings, settings }) {
  const s = settings || {};
  const taxPct = parseFloat(s.tax_reserve_percent) || 25;
  const ownerPct = parseFloat(s.owner_payout_percent) || 30;
  const managerPct = parseFloat(s.manager_pay_percent) || 10;

  const bid = wizardData._bidAmount || 0;
  const totalCost = wizardData._totalCost || 0;
  const gross = wizardData._grossProfit || 0;
  const subTotal = wizardData._subTotal || 0;
  const materialTotal = wizardData._materialSubtotal || 0;
  const laborCost = wizardData._laborCost || 0;

  const taxReserve = gross * (taxPct / 100);
  const ownerPayout = gross * (ownerPct / 100);
  const managerPay = Math.max(0, gross) * (managerPct / 100);

  const startDate = wizardData.start_date;
  const endDate = wizardData.projected_completion;
  let durationDays = "";
  if (startDate && endDate) {
    const diff = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
    durationDays = `${Math.round(diff)} days`;
  }

  return (
    <div className="space-y-5">
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {w}
            </div>
          ))}
        </div>
      )}

      {warnings.length === 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          <CheckCircle className="w-4 h-4" />
          All required information captured — ready to create job!
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Project Info */}
        <div className="border rounded-xl p-4 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Project</p>
          <p className="text-sm font-bold">{wizardData.title || "—"}</p>
          <p className="text-xs text-muted-foreground">{wizardData.client_name || "No client"}</p>
          <p className="text-xs text-muted-foreground">{wizardData.client_address || "No address"}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {startDate ? formatDate(startDate) : "No start"} → {endDate ? formatDate(endDate) : "No end"}
            {durationDays && ` (${durationDays})`}
          </p>
        </div>

        {/* Financial Summary */}
        <div className="border rounded-xl p-4 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Financials</p>
          <SummaryRow label="Bid Amount" value={formatCurrency(bid)} highlight />
          <SummaryRow label="Total Cost" value={formatCurrency(totalCost)} muted />
          <SummaryRow label="Materials" value={formatCurrency(materialTotal)} muted />
          <SummaryRow label="Labor" value={formatCurrency(laborCost)} muted />
          <SummaryRow label="Subcontractors" value={formatCurrency(subTotal)} muted />
          <SummaryRow label="Gross Profit" value={formatCurrency(gross)} />
        </div>
      </div>

      {/* Allocations */}
      <div className="border rounded-xl p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Profit Allocations (from Settings)</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: `Manager (${managerPct}%)`, value: managerPay, color: "text-purple-600" },
            { label: `Tax Reserve (${taxPct}%)`, value: taxReserve, color: "text-red-600" },
            { label: `Owner Payout (${ownerPct}%)`, value: ownerPayout, color: "text-green-600" },
          ].map(item => (
            <div key={item.label} className="text-center">
              <p className={`text-base font-bold ${item.color}`}>{formatCurrency(item.value)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Schedule */}
      {(wizardData.deposit_amount || wizardData.final_payment) && (
        <div className="border rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Payment Schedule</p>
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div>
              <p className="font-bold">{formatCurrency(parseFloat(wizardData.deposit_amount) || 0)}</p>
              <p className="text-xs text-muted-foreground">Deposit</p>
            </div>
            <div>
              <p className="font-bold">{formatCurrency(parseFloat(wizardData.progress_payment) || 0)}</p>
              <p className="text-xs text-muted-foreground">Progress</p>
            </div>
            <div>
              <p className="font-bold">{formatCurrency(parseFloat(wizardData.final_payment) || 0)}</p>
              <p className="text-xs text-muted-foreground">Final</p>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-center text-muted-foreground">Click "Create Job" to save this project and all financial details.</p>
    </div>
  );
}