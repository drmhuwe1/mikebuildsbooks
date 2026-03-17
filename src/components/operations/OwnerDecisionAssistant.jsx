import React from "react";
import { Card } from "@/components/ui/card";
import { Lightbulb, AlertCircle, CheckCircle, TrendingUp, Clock } from "lucide-react";
import { generateOperationalInsights } from "@/lib/businessHealthCalculations";

export default function OwnerDecisionAssistant({ jobs, bills, personalBills, bankAccounts, subcontractors, payments }) {
  const insights = generateOperationalInsights(jobs, bills, personalBills, bankAccounts, subcontractors, payments);

  const getIcon = (type) => {
    switch (type) {
      case "warning": return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case "success": return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "action": return <Lightbulb className="w-4 h-4 text-blue-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-primary" /> Decision Assistant
      </h3>
      <div className="space-y-2">
        {insights.length === 0 ? (
          <p className="text-xs text-muted-foreground">All operations running smoothly.</p>
        ) : (
          insights.map((insight, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 text-xs">
              {getIcon(insight.type)}
              <span className="text-gray-700">{insight.message}</span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}