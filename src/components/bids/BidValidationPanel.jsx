import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, CheckCircle2, Loader } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function BidValidationPanel({ bid, onValidationComplete }) {
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(false);

  const validateBid = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke("validateBid", {
        bid: {
          title: bid.title || "",
          client_name: bid.client_name || "",
          scope_summary: bid.scope_summary || "",
          material_cost: bid.material_cost || 0,
          labor_hours: bid.labor_hours || 0,
          labor_rate: bid.labor_rate || 0,
          subcontractor_cost: bid.subcontractor_cost || 0,
          permit_cost: bid.permit_cost || 0,
          equipment_cost: bid.equipment_cost || 0,
          bid_amount: bid.bid_amount || 0,
          valid_until: bid.valid_until || "",
        }
      });

      setValidation(response.data);
      onValidationComplete?.(response.data);
    } catch (err) {
      setValidation({ status: "error", message: err.message });
    }
    setLoading(false);
  };

  useEffect(() => {
    validateBid();
  }, [bid.id]);

  if (!validation) return null;

  const issues = validation.issues || [];
  const isComplete = issues.length === 0 && validation.status === "valid";

  return (
    <Card className={`p-4 border-l-4 ${isComplete ? "border-l-green-500 bg-green-50" : "border-l-yellow-500 bg-yellow-50"}`}>
      <div className="flex items-start gap-3">
        {isComplete ? (
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <h4 className={`font-semibold text-sm ${isComplete ? "text-green-800" : "text-yellow-800"}`}>
            {isComplete ? "✓ Bid Complete" : "⚠ Complete the Following"}
          </h4>
          
          {issues.length > 0 && (
            <ul className="mt-2 space-y-1">
              {issues.map((issue, i) => (
                <li key={i} className="text-xs text-yellow-700">
                  • {issue}
                </li>
              ))}
            </ul>
          )}

          {validation.legalChecks && (
            <div className="mt-3 pt-3 border-t border-yellow-200">
              <p className="text-xs font-semibold text-yellow-800 mb-1">Legal Requirements:</p>
              <ul className="space-y-1 text-xs text-yellow-700">
                {validation.legalChecks.map((check, i) => (
                  <li key={i} className={check.met ? "text-green-700" : "text-yellow-700"}>
                    {check.met ? "✓" : "⚠"} {check.requirement}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {loading && <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><Loader className="w-3 h-3 animate-spin" /> Validating...</p>}
        </div>
      </div>
    </Card>
  );
}