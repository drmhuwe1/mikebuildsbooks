import React from "react";
import { Link } from "react-router-dom";
import { buildJobAssistant } from "@/lib/assistantLogic";
import { formatCurrency } from "@/lib/formatters";
import { ArrowRight, AlertTriangle, CheckCircle, Sparkles } from "lucide-react";

export default function JobAssistantPanel({ job, contracts, bids }) {
  const { steps, issues, profit, margin, outstanding } = buildJobAssistant(job, contracts, bids);

  if (!job) return null;

  return (
    <div className="space-y-3">
      {/* Next Steps */}
      {steps.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Recommended Next Steps
          </p>
          <div className="space-y-1.5">
            {steps.map((step, i) => (
              <div key={i} className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs border ${
                step.priority === "high" ? "bg-orange-50 border-orange-200 text-orange-900" :
                step.priority === "medium" ? "bg-blue-50 border-blue-200 text-blue-900" :
                "bg-muted border-border text-foreground"
              }`}>
                <span>{i === 0 ? "→ " : ""}{step.text}</span>
                <Link to={step.link} className="shrink-0 font-medium flex items-center gap-0.5 text-primary hover:underline">
                  Go <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Issues */}
      {issues.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Missing or At-Risk Items
          </p>
          <div className="space-y-1">
            {issues.map((issue, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-yellow-800 bg-yellow-50 px-3 py-1.5 rounded border border-yellow-200">
                <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0 text-yellow-600" />
                {issue}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Financials */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <div className="text-center p-2 bg-muted rounded-lg">
          <p className="text-[10px] text-muted-foreground">Profit</p>
          <p className={`text-xs font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(profit)}</p>
        </div>
        <div className="text-center p-2 bg-muted rounded-lg">
          <p className="text-[10px] text-muted-foreground">Margin</p>
          <p className={`text-xs font-bold ${margin >= 15 ? "text-green-600" : margin >= 5 ? "text-orange-600" : "text-red-600"}`}>{margin.toFixed(1)}%</p>
        </div>
        <div className="text-center p-2 bg-muted rounded-lg">
          <p className="text-[10px] text-muted-foreground">Outstanding</p>
          <p className={`text-xs font-bold ${outstanding > 0 ? "text-orange-600" : "text-green-600"}`}>{formatCurrency(outstanding)}</p>
        </div>
      </div>

      {steps.length === 0 && issues.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-3 py-2 rounded border border-green-200">
          <CheckCircle className="w-3.5 h-3.5" /> This job looks complete — no immediate actions needed.
        </div>
      )}
    </div>
  );
}