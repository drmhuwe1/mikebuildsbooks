import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";
import { Edit2, Check, X } from "lucide-react";

export default function ForecastedPayouts({ jobs = [], bids = [], settings = {} }) {
  const [editingJobId, setEditingJobId] = useState(null);
  const [overrides, setOverrides] = useState({});

  const managerPct = settings.manager_pay_percent ?? 10;

  // Active jobs (in_progress, contracted) + approved bids not yet converted to jobs
  const activeJobs = useMemo(() => {
    const jobList = jobs.filter(j => ["in_progress", "contracted"].includes(j.status));
    const bidList = bids.filter(b => b.status === "approved" && !jobs.some(j => j.bid_id === b.id));
    
    return [
      ...jobList.map(j => ({
        id: j.id,
        type: "job",
        title: j.title,
        status: j.status,
        laborHours: j.estimated_labor_hours || 0,
        contractAmount: j.contract_amount || 0,
        changeOrdersTotal: j.change_orders_total || 0,
        materialCosts: j.material_costs || 0,
        laborCosts: j.labor_costs || 0,
        subcontractorCosts: j.subcontractor_costs || 0,
        permitCosts: j.permit_costs || 0,
        equipmentCosts: j.equipment_costs || 0,
        overheadCosts: j.overhead_costs || 0,
        otherCosts: j.other_costs || 0,
      })),
      ...bidList.map(b => ({
        id: b.id,
        type: "bid",
        title: b.title,
        status: "bid_approved",
        laborHours: b.labor_hours || 0,
        contractAmount: b.bid_amount || 0,
        changeOrdersTotal: 0,
        materialCosts: b.material_cost || 0,
        laborCosts: (b.labor_hours || 0) * (b.labor_rate || 0),
        subcontractorCosts: b.subcontractor_cost || 0,
        permitCosts: b.permit_cost || 0,
        equipmentCosts: b.equipment_cost || 0,
        overheadCosts: 0,
        otherCosts: 0,
      })),
    ];
  }, [jobs, bids]);

  // Calculate forecasted payouts
  const payoutBreakdown = useMemo(() => {
    const breakdown = activeJobs.map(item => {
      const adjustedContract = (item.contractAmount || 0) + (item.changeOrdersTotal || 0);
      const allCosts = (item.materialCosts || 0) + (item.laborCosts || 0)
        + (item.subcontractorCosts || 0) + (item.permitCosts || 0)
        + (item.equipmentCosts || 0) + (item.overheadCosts || 0)
        + (item.otherCosts || 0);
      const laborCost = allCosts > 0 ? allCosts : (item.laborHours || 0) * (settings.default_labor_rate || 45);
      const jobProfit = Math.max(0, adjustedContract - laborCost);
      const managerJobPayout = jobProfit * (managerPct / 100);
      
      const overrideKey = `${item.type}-${item.id}`;
      const overridePayout = overrides[overrideKey];
      
      return {
        ...item,
        laborCost,
        jobProfit,
        managerJobPayout,
        displayPayout: overridePayout !== undefined ? overridePayout : managerJobPayout,
        isOverridden: overridePayout !== undefined,
      };
    });

    const totalGrossProfit = breakdown.reduce((s, b) => s + b.jobProfit, 0);
    const totalManagerPayout = breakdown.reduce((s, b) => s + b.displayPayout, 0);

    return { jobs: breakdown, totalGrossProfit, totalManagerPayout };
  }, [activeJobs, overrides, managerPct, settings.default_labor_rate]);

  const handleOverride = (jobType, jobId, value) => {
    const key = `${jobType}-${jobId}`;
    if (value === "" || value === null) {
      const newOverrides = { ...overrides };
      delete newOverrides[key];
      setOverrides(newOverrides);
    } else {
      setOverrides(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
    }
    setEditingJobId(null);
  };

  if (activeJobs.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        <p>No active jobs or approved bids to forecast payouts.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-semibold text-blue-900 mb-1">💰 Forecasted Payouts</p>
        <p className="text-xs text-blue-800">
          Shows manager payout forecasts based on job profit (contract amount − labor cost). 
          Labor cost = labor hours × ${settings.default_labor_rate || 45}/hr. Click to override estimates.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-4 border-green-200 bg-green-50">
          <p className="text-xs font-semibold text-green-900">Total Job Profit (Gross)</p>
          <p className="text-2xl font-bold text-green-700 mt-2">{formatCurrency(payoutBreakdown.totalGrossProfit)}</p>
          <p className="text-xs text-green-700 mt-1">From {activeJobs.length} active job{activeJobs.length !== 1 ? "s" : ""}</p>
        </Card>

        <Card className="p-4 border-primary/30 bg-primary/5">
          <p className="text-xs font-semibold text-primary">Total Manager Payout (Forecasted)</p>
          <p className="text-2xl font-bold text-primary mt-2">{formatCurrency(payoutBreakdown.totalManagerPayout)}</p>
          <p className="text-xs text-muted-foreground mt-1">{managerPct}% of job profit</p>
        </Card>
      </div>

      {/* Per-job breakdown */}
      <div className="space-y-3">
        <p className="text-sm font-semibold">Job Payout Details</p>
        {payoutBreakdown.jobs.map(job => (
          <Card key={`${job.type}-${job.id}`} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-semibold text-sm">{job.title}</p>
                  <Badge variant="outline" className="text-xs">
                    {job.type === "bid" ? "Approved Bid" : job.status}
                  </Badge>
                  {job.isOverridden && <Badge className="bg-yellow-100 text-yellow-800">Custom</Badge>}
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5 mb-2">
                  <p>Contract: {formatCurrency(job.contractAmount)}</p>
                  <p>Est. Labor: {job.laborHours}h @ ${settings.default_labor_rate || 45}/hr = {formatCurrency(job.laborCost)}</p>
                  <p className="font-semibold">Job Profit: {formatCurrency(job.jobProfit)}</p>
                </div>
              </div>

              <div className="text-right w-48">
                {editingJobId === `${job.type}-${job.id}` ? (
                  <div className="flex flex-col gap-2">
                    <div>
                      <Label className="text-xs">Manager Payout</Label>
                      <Input
                        type="number"
                        step="0.01"
                        defaultValue={job.displayPayout}
                        onBlur={(e) => handleOverride(job.type, job.id, e.target.value)}
                        className="text-sm"
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingJobId(null)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-2xl font-bold">{formatCurrency(job.displayPayout)}</p>
                    <p className="text-xs text-muted-foreground mb-2">
                      {job.isOverridden ? "Custom payout" : `${managerPct}% of profit`}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingJobId(`${job.type}-${job.id}`)}
                      className="gap-1"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}