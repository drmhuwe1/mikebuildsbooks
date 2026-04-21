import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { analyzeFinancialData } from "@/lib/financialIntelligence";

export default function FinancialAlertsWidget() {
  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date", 200) });
  const { data: materials = [] } = useQuery({ queryKey: ["materials"], queryFn: () => base44.entities.MaterialCost.list("-created_date", 200) });
  const { data: subPayments = [] } = useQuery({ queryKey: ["subPayments"], queryFn: () => base44.entities.SubcontractorPayment.list("-created_date", 200) });
  const { data: bills = [] } = useQuery({ queryKey: ["bills"], queryFn: () => base44.entities.Bill.list("-created_date", 200) });
  const { data: transactions = [] } = useQuery({ queryKey: ["transactions"], queryFn: () => base44.entities.BankTransaction.list("-created_date", 200) });
  const { data: settings = [] } = useQuery({ queryKey: ["settings"], queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }) });

  const analysis = useMemo(() => {
    if (!jobs.length) return { alerts: [] };
    return analyzeFinancialData(jobs, materials, subPayments, bills, transactions, settings[0] || {});
  }, [jobs, materials, subPayments, bills, transactions, settings]);

  const criticalAlerts = analysis.alerts.filter(a => a.severity === "error").slice(0, 3);
  const warningAlerts = analysis.alerts.filter(a => a.severity === "warning").length;

  return (
    <Card className="p-4 border-l-4 border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            Financial Alerts
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {analysis.alerts.length} total · {criticalAlerts.length} critical
          </p>
        </div>
        <Link to="/FinancialAlerts">
          <Button variant="ghost" size="sm" className="gap-1">
            View <ChevronRight className="w-3 h-3" />
          </Button>
        </Link>
      </div>

      {criticalAlerts.length > 0 && (
        <div className="space-y-2 text-sm">
          {criticalAlerts.map(alert => (
            <div key={alert.id} className="bg-white/70 rounded px-2.5 py-1.5 border-l-2 border-red-400">
              <p className="font-medium text-red-700">{alert.title}</p>
              <p className="text-xs text-red-600">{alert.message}</p>
            </div>
          ))}
        </div>
      )}

      {analysis.alerts.length === 0 && (
        <p className="text-sm text-muted-foreground">No issues detected. Your finances look good!</p>
      )}
    </Card>
  );
}