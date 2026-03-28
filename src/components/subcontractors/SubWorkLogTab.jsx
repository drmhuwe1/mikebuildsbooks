import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import WorkEntryModal from "./WorkEntryModal";
import { formatCurrency } from "@/lib/formatters";

export default function SubWorkLogTab({ sub, jobs = [] }) {
  const [showModal, setShowModal] = useState(false);
  const [filterJob, setFilterJob] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const qc = useQueryClient();
  const { data: entries = [] } = useQuery({
    queryKey: ["workEntries", sub.id],
    queryFn: () => base44.entities.SubcontractorWorkEntry.filter({ subcontractor_id: sub.id }),
  });

  const togglePaymentMutation = useMutation({
    mutationFn: (entry) => base44.entities.SubcontractorWorkEntry.update(entry.id, { payment_status: entry.payment_status === "Paid" ? "Unpaid" : "Paid" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workEntries", sub.id] }),
  });

  const filtered = entries.filter(e => {
    if (filterJob !== "all" && e.job_id !== filterJob) return false;
    if (filterStatus !== "all" && e.payment_status !== filterStatus) return false;
    if (filterFrom && e.work_date < filterFrom) return false;
    if (filterTo && e.work_date > filterTo) return false;
    return true;
  }).sort((a, b) => (b.work_date || "").localeCompare(a.work_date || ""));

  const totalHours = filtered.reduce((s, e) => s + (e.hours_worked || 0), 0);
  const totalEarned = filtered.reduce((s, e) => s + (e.calculated_pay || 0), 0);
  const totalPaid = filtered.filter(e => e.payment_status === "Paid").reduce((s, e) => s + (e.calculated_pay || 0), 0);
  const totalOwed = totalEarned - totalPaid;

  const jobsForFilter = [...new Map(entries.map(e => [e.job_id, e])).values()];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Job</p>
          <Select value={filterJob} onValueChange={setFilterJob}>
            <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              {jobsForFilter.map(e => <SelectItem key={e.job_id} value={e.job_id}>{e.job_title || e.job_id}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Status</p>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Unpaid">Unpaid</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">From</p>
          <Input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} className="h-8 text-xs w-36" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">To</p>
          <Input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} className="h-8 text-xs w-36" />
        </div>
        <Button size="sm" onClick={() => setShowModal(true)} className="gap-1 h-8 ml-auto">
          <Plus className="w-3.5 h-3.5" /> Add Work Entry
        </Button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground bg-muted/20 rounded-lg">
          No work entries found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2 font-semibold">Date</th>
                <th className="text-left px-3 py-2 font-semibold">Job</th>
                <th className="text-left px-3 py-2 font-semibold">Phase</th>
                <th className="text-right px-3 py-2 font-semibold">Hours</th>
                <th className="text-left px-3 py-2 font-semibold">Type</th>
                <th className="text-right px-3 py-2 font-semibold">Rate</th>
                <th className="text-right px-3 py-2 font-semibold">Pay</th>
                <th className="text-center px-3 py-2 font-semibold">Status</th>
                <th className="text-center px-3 py-2 font-semibold">Sheet</th>
                </tr>
                </thead>
                <tbody>
                {filtered.map(e => (
                <tr key={e.id} className="border-t hover:bg-muted/20 cursor-pointer" onClick={() => togglePaymentMutation.mutate(e)}>
                 <td className="px-3 py-2">
                   <div>{e.work_date}</div>
                   <div className="text-muted-foreground">{e.day_of_week}</div>
                 </td>
                 <td className="px-3 py-2">
                   <div className="font-medium">{e.job_title || "—"}</div>
                   {e.description && <div className="text-muted-foreground truncate max-w-[120px]">{e.description}</div>}
                 </td>
                 <td className="px-3 py-2">{e.job_phase || "—"}</td>
                 <td className="px-3 py-2 text-right">{e.hours_worked || "—"}</td>
                 <td className="px-3 py-2">{e.pay_type}</td>
                 <td className="px-3 py-2 text-right">{formatCurrency(e.pay_rate)}</td>
                 <td className="px-3 py-2 text-right font-semibold">{formatCurrency(e.calculated_pay)}</td>
                 <td className="px-3 py-2 text-center" onClick={e => e.stopPropagation()}>
                   <Badge variant={e.payment_status === "Paid" ? "default" : "secondary"} className="text-xs cursor-pointer" onClick={() => togglePaymentMutation.mutate(e)}>
                     {e.payment_status}
                   </Badge>
                 </td>
                 <td className="px-3 py-2 text-center">
                   {e.timesheet_url ? (
                     <a href={e.timesheet_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs">View</a>
                   ) : <span className="text-muted-foreground text-xs">—</span>}
                 </td>
                </tr>
                ))}
                </tbody>
                </table>
        </div>
      )}

      {/* Totals */}
      <div className="grid grid-cols-4 gap-3 bg-muted/20 rounded-lg p-3">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Total Hours</p>
          <p className="font-bold text-sm">{totalHours.toFixed(1)}h</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Total Earned</p>
          <p className="font-bold text-sm">{formatCurrency(totalEarned)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Total Paid</p>
          <p className="font-bold text-sm text-green-700">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Total Owed</p>
          <p className={`font-bold text-sm ${totalOwed > 0 ? "text-red-600" : "text-muted-foreground"}`}>{formatCurrency(totalOwed)}</p>
        </div>
      </div>

      <WorkEntryModal open={showModal} onClose={() => setShowModal(false)} subcontractor={sub} jobs={jobs} />
    </div>
  );
}