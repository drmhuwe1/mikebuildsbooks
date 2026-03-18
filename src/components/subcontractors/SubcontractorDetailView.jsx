import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle } from "lucide-react";
import W9CompliancePanel from "./W9CompliancePanel";
import W9ContractorPortal from "./W9ContractorPortal";
import { formatCurrency } from "@/lib/formatters";

export default function SubcontractorDetailView({ sub, payments, jobs }) {
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <Card className="p-4">
        <button
          onClick={() => setExpanded(true)}
          className="w-full flex items-start justify-between hover:bg-muted/50 -mx-4 -my-4 px-4 py-4 rounded-lg transition-colors"
        >
          <div className="text-left flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">{sub.name}</p>
              {sub.w9_received ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />}
              <Badge variant="outline" className="text-xs">
                {sub.payment_rule === "fixed" ? "Fixed" : sub.payment_rule === "hourly" ? "Hourly" : sub.payment_rule === "percent_labor" ? "% Labor" : "% Profit"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{[sub.company, sub.specialty].filter(Boolean).join(" · ") || "—"}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>
      </Card>
    );
  }

  // Get payments for this subcontractor
  const subPayments = payments.filter(p => p.subcontractor_id === sub.id).sort((a, b) => (b.payment_date || "").localeCompare(a.payment_date || ""));
  const ytdPayments = subPayments.filter(p => p.status === "paid" && p.payment_date?.startsWith(String(new Date().getFullYear())));
  const totalYTD = ytdPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPaid = subPayments.filter(p => p.status === "paid").reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPending = subPayments.filter(p => p.status === "pending").reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <Card className="p-4 space-y-4">
      {/* Header */}
      <button
        onClick={() => setExpanded(false)}
        className="w-full flex items-start justify-between hover:bg-muted/50 -mx-4 -my-4 px-4 py-4 rounded-lg transition-colors"
      >
        <div className="text-left flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{sub.name}</p>
            {sub.w9_received ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />}
            <Badge variant="outline" className="text-xs">
              {sub.payment_rule === "fixed" ? "Fixed" : sub.payment_rule === "hourly" ? "Hourly" : sub.payment_rule === "percent_labor" ? "% Labor" : "% Profit"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{[sub.company, sub.specialty].filter(Boolean).join(" · ") || "—"}</p>
        </div>
        <ChevronUp className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 bg-muted/30 -mx-4 -my-4 p-4 rounded-lg">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">YTD Paid</p>
          <p className="text-sm font-semibold">{formatCurrency(totalYTD)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">All-Time Paid</p>
          <p className="text-sm font-semibold">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="text-sm font-semibold text-yellow-600">{formatCurrency(totalPending)}</p>
        </div>
      </div>

      {/* Job-Level Breakdown */}
      <div>
        <p className="text-xs font-semibold mb-3 uppercase tracking-wide text-muted-foreground">Work by Job</p>
        {subPayments.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No payments recorded</p>
        ) : (
          <div className="space-y-2">
            {subPayments.map(payment => {
              const job = jobs.find(j => j.id === payment.job_id);
              return (
                <div key={payment.id} className="border rounded-lg p-3 space-y-2">
                  {/* Job Title */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs font-semibold">{payment.job_title || job?.title || "—"}</p>
                      {payment.description && <p className="text-xs text-muted-foreground mt-0.5">{payment.description}</p>}
                    </div>
                    <Badge variant={payment.status === "paid" ? "default" : "secondary"} className="text-xs">
                      {payment.status === "paid" ? "Paid" : "Pending"}
                    </Badge>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-3 gap-2 bg-muted/40 -mx-3 -mb-2 p-3 rounded text-xs">
                    <div>
                      <span className="text-muted-foreground">Amount</span>
                      <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date</span>
                      <p className="font-semibold">{payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : "—"}</p>
                    </div>
                    {job && (
                      <div>
                        <span className="text-muted-foreground">Status</span>
                        <p className="font-semibold">{job.status?.replace(/_/g, " ") || "—"}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Contact Info */}
      {(sub.email || sub.phone) && (
        <div className="border-t pt-3 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</p>
          {sub.email && <p className="text-xs">{sub.email}</p>}
          {sub.phone && <p className="text-xs">{sub.phone}</p>}
        </div>
      )}
    </Card>
  );
}