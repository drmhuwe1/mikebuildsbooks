import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import { DollarSign, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";

export default function AllocationGuide({ metrics, settings }) {
  const [open, setOpen] = useState(false);
  const [approved, setApproved] = useState(false);
  const s = settings || {};
  const basis = metrics?.grossProfit || 0;

  if (basis <= 0) return null;

  const allocations = [
    { label: "Tax Reserve", pct: s.tax_reserve_percent || 25, color: "bg-red-100 text-red-700", why: "Set aside for quarterly/annual taxes. Do not spend." },
    { label: "Subcontractor Reserve", pct: s.subcontractor_reserve_percent || 10, color: "bg-orange-100 text-orange-700", why: "Buffer for pending subcontractor invoices." },
    { label: "Operating Reserve", pct: s.operating_reserve_percent || 10, color: "bg-yellow-100 text-yellow-700", why: "Covers unexpected operational costs." },
    { label: "Owner Payout", pct: s.owner_payout_percent || 30, color: "bg-green-100 text-green-700", why: "Recommended owner distribution this period." },
    { label: "Admin Compensation", pct: s.admin_compensation_percent || 15, color: "bg-blue-100 text-blue-700", why: "Management and admin team compensation." },
    { label: "Retained Earnings", pct: s.retained_earnings_percent || 10, color: "bg-purple-100 text-purple-700", why: "Keep in business for growth and stability." },
  ];

  const totalPct = allocations.reduce((s, a) => s + a.pct, 0);

  return (
    <Card className="p-5 border-green-200 bg-green-50/30">
      <button className="w-full flex items-center justify-between" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-green-900">Financial Allocation Guidance</h3>
            <p className="text-xs text-green-700">Based on {formatCurrency(basis)} estimated gross profit from active jobs</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-green-700" /> : <ChevronDown className="w-4 h-4 text-green-700" />}
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-green-800 bg-green-100 px-3 py-2 rounded-lg">
            Here's how to allocate the profit from your active jobs. These are recommendations — review the amounts before acting.
          </p>

          <div className="space-y-2">
            {allocations.map(a => (
              <div key={a.label} className="flex items-start gap-3 p-2.5 bg-white rounded-lg border border-green-100">
                <span className={`text-xs font-semibold px-2 py-1 rounded shrink-0 ${a.color}`}>{a.pct}%</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{a.label}</p>
                    <p className="text-sm font-bold">{formatCurrency(basis * a.pct / 100)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.why}</p>
                </div>
              </div>
            ))}
          </div>

          {totalPct !== 100 && (
            <p className="text-xs text-orange-700 bg-orange-50 px-3 py-2 rounded-lg">
              ⚠ Your allocation percentages add up to {totalPct}% (not 100%). Go to Settings to adjust.
            </p>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-green-200">
            <div>
              <p className="text-xs text-muted-foreground">Total allocated</p>
              <p className="text-sm font-bold">{formatCurrency(basis * totalPct / 100)}</p>
            </div>
            {!approved ? (
              <Button size="sm" onClick={() => setApproved(true)} className="gap-1.5 bg-green-600 hover:bg-green-700 text-white">
                <CheckCircle className="w-3.5 h-3.5" /> I've Reviewed This
              </Button>
            ) : (
              <p className="text-xs text-green-700 font-medium flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Reviewed
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}