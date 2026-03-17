import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format, isWithinInterval, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { formatCurrency } from "@/lib/formatters";

export default function JobCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => base44.entities.Job.list(),
  });

  const { data: subcontractors = [] } = useQuery({
    queryKey: ["subcontractors"],
    queryFn: () => base44.entities.Subcontractor.list(),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["subcontractorPayments"],
    queryFn: () => base44.entities.SubcontractorPayment.list(),
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const jobsInMonth = useMemo(() => {
    return jobs.filter(job => {
      const start = job.start_date ? new Date(job.start_date) : null;
      const end = job.projected_completion ? new Date(job.projected_completion) : null;
      if (!start) return false;
      if (!end) return start <= monthEnd && start >= monthStart;
      return (
        (start <= monthEnd && end >= monthStart) ||
        (start >= monthStart && start <= monthEnd)
      );
    });
  }, [jobs, monthStart, monthEnd]);

  const getJobsForDay = (day) => {
    return jobsInMonth.filter(job => {
      const start = job.start_date ? new Date(job.start_date) : null;
      const end = job.projected_completion ? new Date(job.projected_completion) : null;
      if (!start) return false;
      if (!end) return isSameDay(day, start);
      return isWithinInterval(day, { start, end });
    });
  };

  const getSummaryMetrics = () => {
    const active = jobsInMonth.filter(j => j.status === "in_progress" || j.status === "scheduled");
    const totalRevenue = jobsInMonth.reduce((s, j) => s + (j.contract_amount || 0), 0);
    const totalCosts = jobsInMonth.reduce((s, j) => s + 
      ((j.material_costs || 0) + (j.labor_costs || 0) + (j.subcontractor_costs || 0) + 
       (j.permit_costs || 0) + (j.equipment_costs || 0) + (j.overhead_costs || 0)), 0
    );
    return { active: active.length, totalRevenue, totalCosts, margin: totalRevenue - totalCosts };
  };

  const metrics = getSummaryMetrics();
  const subMap = Object.fromEntries(subcontractors.map(s => [s.id, s]));

  const statusColor = (status) => {
    const colors = {
      bidding: "bg-blue-100 text-blue-800",
      contracted: "bg-green-100 text-green-800",
      in_progress: "bg-orange-100 text-orange-800",
      completed: "bg-gray-100 text-gray-800",
      on_hold: "bg-yellow-100 text-yellow-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div>
      <PageHeader title="Job Calendar" description="Upcoming projects, revenue projections, and crew assignments" />

      <div className="grid grid-cols-4 gap-3 mb-6">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Active Jobs</p>
          <p className="text-2xl font-bold">{metrics.active}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Projected Revenue</p>
          <p className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Estimated Costs</p>
          <p className="text-2xl font-bold">{formatCurrency(metrics.totalCosts)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Projected Margin</p>
          <p className={`text-2xl font-bold ${metrics.margin >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatCurrency(metrics.margin)}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">{format(currentDate, "MMMM yyyy")}</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} className="text-center font-semibold text-sm text-muted-foreground py-2">
              {d}
            </div>
          ))}

          {days.map(day => {
            const dayJobs = getJobsForDay(day);
            const isCurrentMonth = isSameDay(day, monthStart) || isSameDay(day, monthEnd) || (day > monthStart && day < monthEnd);
            
            return (
              <div key={day.toISOString()} className={`min-h-24 p-2 border rounded-lg ${!isCurrentMonth ? "bg-muted/30" : "bg-card"}`}>
                <p className="text-xs font-semibold text-muted-foreground">{format(day, "d")}</p>
                <div className="space-y-1 mt-1">
                  {dayJobs.slice(0, 2).map(job => (
                    <div key={job.id} className={`text-xs px-2 py-1 rounded ${statusColor(job.status)} truncate cursor-pointer hover:opacity-80`}>
                      {job.title}
                    </div>
                  ))}
                  {dayJobs.length > 2 && <p className="text-xs text-muted-foreground px-2">+{dayJobs.length - 2} more</p>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="mt-6 space-y-4">
        <h3 className="text-lg font-semibold">Jobs This Month</h3>
        {jobsInMonth.length === 0 ? (
          <p className="text-muted-foreground">No jobs scheduled for {format(currentDate, "MMMM")}</p>
        ) : (
          jobsInMonth.map(job => {
            const jobPayments = payments.filter(p => p.job_id === job.id);
            const jobSubs = [...new Set(jobPayments.map(p => p.subcontractor_id))].map(id => subMap[id]).filter(Boolean);

            return (
              <Card key={job.id} className="p-4">
                <div className="grid grid-cols-5 gap-4">
                  <div>
                    <p className="font-semibold text-sm">{job.title}</p>
                    <p className="text-xs text-muted-foreground">{job.client_name}</p>
                    <Badge className={statusColor(job.status)} variant="outline">
                      {job.status?.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Timeline</p>
                    <p className="text-sm font-medium">
                      {job.start_date ? format(new Date(job.start_date), "MMM d") : "TBD"} → {job.projected_completion ? format(new Date(job.projected_completion), "MMM d") : "TBD"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Contract Value</p>
                    <p className="text-sm font-semibold">{formatCurrency(job.contract_amount || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Costs</p>
                    <p className="text-sm font-semibold">{formatCurrency((job.material_costs || 0) + (job.labor_costs || 0) + (job.subcontractor_costs || 0))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Crew</p>
                    <div className="flex flex-wrap gap-1">
                      {jobSubs.length === 0 ? (
                        <span className="text-xs text-muted-foreground">No crew</span>
                      ) : (
                        jobSubs.map(sub => (
                          <Button
                            key={sub.id}
                            variant="ghost"
                            size="sm"
                            className="text-xs h-auto px-2 py-0.5"
                            onClick={() => {/* Navigate to subcontractor payment details */}}
                            title={`${sub.name}${sub.company ? ` (${sub.company})` : ""}`}
                          >
                            {sub.name.split(" ")[0]}
                          </Button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}