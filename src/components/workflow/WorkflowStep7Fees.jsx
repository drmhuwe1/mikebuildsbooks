import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import GuidedPrompt from "@/components/shared/GuidedPrompt";
import { DollarSign, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

export default function WorkflowStep7Fees({ data, estimatedFees, onChange }) {
  const totalEstimatedFees = estimatedFees.reduce((sum, f) => sum + f.estimatedAmount, 0);

  return (
    <div className="space-y-4">
      <GuidedPrompt
        message="Review estimated permit-related fees. These are estimates—final amounts should be confirmed with your building department."
        variant="info"
      />

      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-yellow-900 mb-1">⚠️ Fee Estimates</p>
            <p className="text-xs text-yellow-800">
              These are estimated amounts based on location and project type. Actual fees may differ based on project value, square footage, or specific local fee schedules. Always call to confirm.
            </p>
          </div>
        </div>
      </Card>

      <div className="space-y-2">
        {estimatedFees.map((fee, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm">{fee.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    {fee.type === "standard"
                      ? "Standard"
                      : fee.type === "optional"
                      ? "Optional"
                      : "Per Item"}
                  </Badge>
                </div>

                {fee.note && (
                  <p className="text-xs text-muted-foreground mb-2">{fee.note}</p>
                )}

                <div className="flex items-end gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Estimated Amount</p>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(fee.estimatedAmount)}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Confidence: <strong>{fee.confidence}</strong>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-blue-900">Total Estimated Permit Fees</p>
          <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalEstimatedFees)}</p>
        </div>
        <p className="text-xs text-blue-800">
          This estimate can be added to your bid in Step 10. Remember: always confirm final amounts with your building department before submitting the bid.
        </p>
      </Card>

      <Card className="p-4 bg-green-50 border-green-200">
        <h3 className="font-semibold text-sm text-green-900 mb-2">💡 Verification Steps</h3>
        <ol className="text-xs text-green-800 space-y-1 ml-3">
          <li>1. Contact your building department</li>
          <li>2. Provide project address, type, and scope</li>
          <li>3. Ask for permit fee schedule (they usually have it online)</li>
          <li>4. Ask about inspection fees and special fees</li>
          <li>5. Update your bid with actual amounts</li>
        </ol>
      </Card>

      <Card className="p-4">
        <p className="text-xs font-semibold mb-2">Building Department Contact Info</p>
        <p className="text-xs text-muted-foreground">
          For {data.municipality || "your municipality"}, contact:
        </p>
        <p className="text-xs mt-2">
          💡 Tip: Search "[City] building department" to find contact information and online fee schedules.
        </p>
      </Card>
    </div>
  );
}