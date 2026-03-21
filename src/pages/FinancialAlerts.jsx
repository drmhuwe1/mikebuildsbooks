import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, AlertCircle, TrendingDown, DollarSign, CheckCircle, Zap, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { analyzeFinancialData, getFinancialHealthScore } from "@/lib/financialIntelligence";

export default function FinancialAlerts() {
  const qc = useQueryClient();
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("new");
  const [detailAlert, setDetailAlert] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date", 200) });
  const { data: materials = [] } = useQuery({ queryKey: ["materials"], queryFn: () => base44.entities.MaterialCost.list("-created_date", 200) });
  const { data: subPayments = [] } = useQuery({ queryKey: ["subPayments"], queryFn: () => base44.entities.SubcontractorPayment.list("-created_date", 200) });
  const { data: bills = [] } = useQuery({ queryKey: ["bills"], queryFn: () => base44.entities.Bill.list("-created_date", 200) });
  const { data: transactions = [] } = useQuery({ queryKey: ["transactions"], queryFn: () => base44.entities.BankTransaction.list("-created_date", 200) });
  const { data: savedAlerts = [] } = useQuery({ queryKey: ["financialAlerts"], queryFn: () => base44.entities.FinancialAlert.list("-created_date", 200) });

  const updateAlertMutation = useMutation({
    mutationFn: (data) => base44.entities.FinancialAlert.update(data.id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["financialAlerts"] }),
  });

  const deleteAlertMutation = useMutation({
    mutationFn: (id) => base44.entities.FinancialAlert.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["financialAlerts"] }); setDetailOpen(false); },
  });

  // Analyze financial data
  const analysis = useMemo(() => {
    if (!jobs.length) return { alerts: [], jobRisks: {} };
    return analyzeFinancialData(jobs, materials, subPayments, bills, transactions);
  }, [jobs, materials, subPayments, bills, transactions]);

  const healthScore = useMemo(() => {
    return getFinancialHealthScore(jobs, materials, subPayments);
  }, [jobs, materials, subPayments]);

  // Combine saved and generated alerts
  const allAlerts = useMemo(() => {
    // Build a set of dismissed/resolved generated alert titles to suppress them
    const dismissedTitles = new Set(
      savedAlerts
        .filter(a => a.status === "dismissed" || a.status === "resolved")
        .map(a => a.title)
    );

    const generatedAlerts = analysis.alerts
      .filter(a => !dismissedTitles.has(a.title || a.message))
      .map(a => ({
        ...a,
        id: a.id,
        status: "new",
        isGenerated: true,
      }));
    
    const combined = [...generatedAlerts, ...savedAlerts];
    
    // Filter by type and status
    let filtered = combined;
    if (filterType !== "all") {
      filtered = filtered.filter(a => a.alert_type === filterType || a.type === filterType);
    }
    if (filterStatus !== "all") {
      filtered = filtered.filter(a => a.status === filterStatus);
    }
    
    return filtered.sort((a, b) => {
      const severityOrder = { error: 0, warning: 1, info: 2 };
      return (severityOrder[a.severity] || 2) - (severityOrder[b.severity] || 2);
    });
  }, [analysis.alerts, savedAlerts, filterType, filterStatus]);

  const unresolved = allAlerts.filter(a => a.status === "new" || a.status === "reviewed").length;
  const highRiskJobs = Object.values(analysis.jobRisks).filter(r => r.riskLevel?.level === "high").length;

  const handleStatusChange = (alertId, newStatus, notes = "") => {
    const alert = allAlerts.find(a => a.id === alertId);
    if (alert && alert.id) {
      if (alert.isGenerated) {
        // For generated alerts, create a dismissed record in database
        base44.entities.FinancialAlert.create({
          alert_type: alert.alert_type || alert.type,
          title: alert.title || alert.message,
          message: alert.message,
          severity: alert.severity,
          status: "dismissed",
          notes: `Auto-dismissed generated alert: ${alert.title}`,
        }).then(() => {
          qc.invalidateQueries({ queryKey: ["financialAlerts"] });
          setDetailOpen(false);
        });
      } else {
        updateAlertMutation.mutate({
          id: alertId,
          status: newStatus,
          notes: notes || alert.notes,
        });
        setDetailOpen(false);
      }
    }
  };

  const getAlertIcon = (severity) => {
    if (severity === "error") return <AlertTriangle className="w-5 h-5 text-red-600" />;
    if (severity === "warning") return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    return <Zap className="w-5 h-5 text-blue-600" />;
  };

  const getSeverityColor = (severity) => {
    if (severity === "error") return "bg-red-50 border-red-200";
    if (severity === "warning") return "bg-yellow-50 border-yellow-200";
    return "bg-blue-50 border-blue-200";
  };

  return (
    <div>
      <PageHeader 
        title="Financial Alerts" 
        description="Monitor anomalies, risks, and unusual patterns in your financial data"
      />

      {/* Health Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1 truncate">Health Score</p>
          <p className="text-2xl sm:text-3xl font-bold text-green-700">{healthScore}</p>
          <p className="text-xs text-green-600 mt-1 hidden sm:block">Overall financial health</p>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1 truncate">Alerts</p>
          <p className="text-2xl sm:text-3xl font-bold text-yellow-700">{unresolved}</p>
          <p className="text-xs text-yellow-600 mt-1 hidden sm:block">Unresolved</p>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1 truncate">Risk Jobs</p>
          <p className="text-2xl sm:text-3xl font-bold text-red-700">{highRiskJobs}</p>
          <p className="text-xs text-red-600 mt-1 hidden sm:block">Attention</p>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1 truncate">Active Jobs</p>
          <p className="text-2xl sm:text-3xl font-bold text-blue-700">{jobs.filter(j => j.status === 'in_progress').length}</p>
          <p className="text-xs text-blue-600 mt-1 hidden sm:block">Running</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 sm:gap-3 mb-4 flex-col sm:flex-row">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="high_costs">High Costs</SelectItem>
            <SelectItem value="low_costs">Low Costs</SelectItem>
            <SelectItem value="duplicate">Duplicates</SelectItem>
            <SelectItem value="budget_overrun">Budget Overruns</SelectItem>
            <SelectItem value="suspicious_pattern">Suspicious Patterns</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Alerts List */}
      {allAlerts.length === 0 ? (
        <EmptyState 
          icon={CheckCircle} 
          title="No alerts" 
          description="Your finances look clean! Keep monitoring for unusual patterns."
        />
      ) : (
        <div className="grid gap-2 sm:gap-3">
           {allAlerts.map(alert => (
             <Card key={alert.id} className={`p-3 sm:p-4 border-l-4 cursor-pointer hover:shadow-md transition-all ${getSeverityColor(alert.severity)}`}>
               <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
                 <div className="mt-0.5 shrink-0">{getAlertIcon(alert.severity)}</div>
                 <div className="flex-1 min-w-0">
                   <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                     <h3 className="font-semibold text-sm sm:text-base break-words">{alert.title || alert.message}</h3>
                     <Badge variant="outline" className="text-xs w-fit">
                       {alert.status || 'new'}
                     </Badge>
                   </div>
                   <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">{alert.message}</p>
                   {alert.jobTitle && (
                     <p className="text-xs text-muted-foreground mt-1 break-words">
                       <strong>Job:</strong> {alert.jobTitle}
                     </p>
                   )}
                   {alert.recommendation && (
                     <p className="text-xs bg-white/50 rounded px-2 py-1.5 mt-2 border-l-2 border-current break-words">
                       <strong>→</strong> {alert.recommendation}
                     </p>
                   )}
                 </div>
                 <div className="flex gap-1 shrink-0 self-start sm:self-center">
                   <Button 
                     variant="ghost" 
                     size="sm"
                     className="text-xs sm:text-sm"
                     onClick={() => { setDetailAlert(alert); setDetailOpen(true); }}
                   >
                     Review
                   </Button>
                   {alert.isGenerated ? (
                     <Button 
                       variant="ghost" 
                       size="sm"
                       className="text-muted-foreground hover:text-destructive hover:bg-red-50"
                       onClick={() => handleStatusChange(alert.id, "dismissed")}
                       title="Dismiss this alert"
                     >
                       <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                     </Button>
                   ) : (
                     <Button 
                       variant="ghost" 
                       size="sm"
                       className="text-destructive hover:bg-red-50"
                       onClick={() => deleteAlertMutation.mutate(alert.id)}
                     >
                       <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                     </Button>
                   )}
                 </div>
               </div>
             </Card>
           ))}
         </div>
      )}

      {/* Detail Dialog */}
      {detailAlert && (
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{detailAlert.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Details</p>
                <p className="text-sm text-muted-foreground">{detailAlert.message}</p>
              </div>
              
              {detailAlert.jobTitle && (
                <div className="bg-muted p-3 rounded">
                  <p className="text-sm font-medium">Related Job</p>
                  <p className="text-sm">{detailAlert.jobTitle}</p>
                </div>
              )}

              {detailAlert.recommendation && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                  <p className="text-sm font-medium text-blue-900">Recommendation</p>
                  <p className="text-sm text-blue-800">{detailAlert.recommendation}</p>
                </div>
              )}

              {detailAlert.isGenerated ? (
                <Button 
                  variant="outline"
                  onClick={() => handleStatusChange(detailAlert.id, "dismissed")}
                  className="w-full"
                >
                  Dismiss This Alert
                </Button>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium">Your Notes</label>
                    <Textarea 
                      value={detailAlert.notes || ""} 
                      onChange={(e) => setDetailAlert({...detailAlert, notes: e.target.value})}
                      rows={3}
                      placeholder="Add notes about your action..."
                      className="mt-1"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => handleStatusChange(detailAlert.id, "resolved", detailAlert.notes)}
                      className="flex-1"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" /> Resolved
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleStatusChange(detailAlert.id, "dismissed", detailAlert.notes)}
                      className="flex-1"
                    >
                      Dismiss
                    </Button>
                    <Button 
                      onClick={() => handleStatusChange(detailAlert.id, "reviewed", detailAlert.notes)}
                      className="flex-1"
                    >
                      Mark Reviewed
                    </Button>
                    <Button 
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteAlertMutation.mutate(detailAlert.id)}
                      disabled={deleteAlertMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}