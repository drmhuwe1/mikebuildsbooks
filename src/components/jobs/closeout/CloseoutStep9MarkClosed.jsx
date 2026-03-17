import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Lock } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

export default function CloseoutStep9MarkClosed({ job, closeoutData, financials, onConfirm, saving }) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Step 9 — Mark Job Closed</h2>
        <p className="text-sm text-muted-foreground mt-1">Final review before locking this job as completed.</p>
      </div>

      <div className="rounded-lg border divide-y bg-muted/20">
        <div className="flex justify-between px-4 py-3 text-sm">
          <span className="text-muted-foreground">Job</span>
          <span className="font-semibold">{job.title}</span>
        </div>
        <div className="flex justify-between px-4 py-3 text-sm">
          <span className="text-muted-foreground">Completion Date</span>
          <span className="font-medium">{closeoutData.actual_completion || "Today"}</span>
        </div>
        <div className="flex justify-between px-4 py-3 text-sm">
          <span className="text-muted-foreground">Customer Sign-Off</span>
          <span className={closeoutData.customer_signoff ? "text-green-600 font-medium" : "text-yellow-600 font-medium"}>
            {closeoutData.customer_signoff ? "Yes ✓" : "Not recorded"}
          </span>
        </div>
        <div className="flex justify-between px-4 py-3 text-sm">
          <span className="text-muted-foreground">Final Revenue</span>
          <span className="font-semibold">{formatCurrency(financials.revenue)}</span>
        </div>
        <div className="flex justify-between px-4 py-3 text-sm">
          <span className="text-muted-foreground">Gross Profit</span>
          <span className={`font-semibold ${financials.grossProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatCurrency(financials.grossProfit)}
          </span>
        </div>
        <div className="flex justify-between px-4 py-3 text-sm">
          <span className="text-muted-foreground">Payouts Confirmed</span>
          <span className={closeoutData.payouts_confirmed ? "text-green-600 font-medium" : "text-yellow-600 font-medium"}>
            {closeoutData.payouts_confirmed ? "Yes ✓" : "Not confirmed"}
          </span>
        </div>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={e => setConfirmed(e.target.checked)}
          className="mt-0.5 w-4 h-4"
        />
        <span className="text-sm text-foreground">
          I confirm that all financial records, subcontractor payments, and documentation are complete. I understand this will mark the job as <strong>Completed</strong>.
        </span>
      </label>

      <Button
        className="w-full gap-2"
        size="lg"
        disabled={!confirmed || saving}
        onClick={onConfirm}
      >
        {saving ? (
          "Closing job..."
        ) : (
          <>
            <Lock className="w-4 h-4" /> Close & Lock Job
          </>
        )}
      </Button>

      {!confirmed && (
        <p className="text-xs text-center text-muted-foreground">Check the box above to enable job closeout.</p>
      )}
    </div>
  );
}