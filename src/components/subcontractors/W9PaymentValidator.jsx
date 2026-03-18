import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";

export default function W9PaymentValidator({ contractor, paymentAmount }) {
  const w9Status = contractor.w9_status || "not_collected";
  const isCompliant = w9Status === "received";
  const ytdWithNew = (contractor.ytd_payments || 0) + (paymentAmount || 0);
  const requires1099 = ytdWithNew >= 600;

  if (!contractor) return null;

  return (
    <Card className={`p-4 border-2 ${
      !isCompliant 
        ? "border-red-200 bg-red-50" 
        : requires1099 
        ? "border-orange-200 bg-orange-50"
        : "border-green-200 bg-green-50"
    }`}>
      <div className="space-y-2">
        {/* W-9 Status */}
        <div className="flex items-start gap-2">
          {isCompliant ? (
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
          )}
          <div className="text-sm">
            <p className="font-semibold">
              {isCompliant ? "W-9 On File" : "⚠ W-9 Required"}
            </p>
            <p className={`text-xs ${isCompliant ? "text-green-700" : "text-red-700"}`}>
              {isCompliant 
                ? `Signed ${contractor.w9_date || ""}` 
                : "A W-9 must be collected before issuing 1099 payments."}
            </p>
          </div>
        </div>

        {/* 1099 Threshold Warning */}
        {isCompliant && requires1099 && (
          <div className="flex items-start gap-2 border-t pt-2 mt-2">
            <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
            <div className="text-xs">
              <p className="font-semibold text-orange-700">1099-NEC Required</p>
              <p className="text-orange-700">
                YTD: ${(contractor.ytd_payments || 0).toFixed(2)} + ${paymentAmount?.toFixed(2)} = ${ytdWithNew.toFixed(2)} (exceeds $600)
              </p>
            </div>
          </div>
        )}

        {/* Payment Ready */}
        {isCompliant && !requires1099 && (
          <div className="flex items-start gap-2 border-t pt-2 mt-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
            <p className="text-xs text-green-700">Ready to issue payment</p>
          </div>
        )}
      </div>
    </Card>
  );
}