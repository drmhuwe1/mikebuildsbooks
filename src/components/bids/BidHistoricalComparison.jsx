import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";

export default function BidHistoricalComparison({ similarJobs }) {
  if (similarJobs.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">No similar past jobs found for comparison.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">Comparison with Similar Jobs</h3>
      {similarJobs.map((job, i) => {
        const revenue = (job.contract_amount || 0) + (job.change_orders_total || 0);
        const cost = (job.material_costs || 0) + (job.labor_costs || 0) + (job.subcontractor_costs || 0) + (job.overhead_costs || 0);
        const profit = revenue - cost;
        const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0;
        const overUnder = cost > revenue ? "Over Budget" : "Under Budget";
        const overUnderAmount = Math.abs(cost - revenue);

        return (
          <Card key={i} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-semibold text-sm">{job.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(job.start_date)} → {formatDate(job.actual_completion || job.projected_completion)}
                </p>
              </div>
              <Badge className={cost > revenue ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}>
                {overUnder}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
              <div>
                <p className="text-muted-foreground mb-1">Original Bid</p>
                <p className="font-bold">{formatCurrency(revenue)}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Actual Cost</p>
                <p className="font-bold">{formatCurrency(cost)}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Profit</p>
                <p className={`font-bold ${profit > 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(profit)} ({margin}%)
                </p>
              </div>
            </div>

            {cost > revenue && (
              <div className="mt-3 p-2 bg-red-50 rounded text-xs text-red-700">
                Over budget by {formatCurrency(overUnderAmount)} — factor this into your current bid.
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}