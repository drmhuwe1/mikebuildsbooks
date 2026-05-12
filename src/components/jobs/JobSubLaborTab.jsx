import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Plus, Pencil } from "lucide-react";
import WorkEntryModal from "@/components/subcontractors/WorkEntryModal";
import { formatCurrency } from "@/lib/formatters";

function SubRow({ sub, entries, job, onAddEntry, onEditEntry }) {
  const [expanded, setExpanded] = useState(false);

  const displayName = sub?.name || entries[0]?.subcontractor_name || "Unknown";

  const totalHours = entries.reduce((s, e) => s + (e.hours_worked || 0), 0);
  const totalEarned = entries.reduce((s, e) => s + (e.calculated_pay || 0), 0);
  const totalPaid = entries.filter(e => e.payment_status === "Paid").reduce((s, e) => s + (e.calculated_pay || 0), 0);
  const totalOwed = totalEarned - totalPaid;

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        aria-expanded={expanded}
        aria-label={`${displayName}, ${entries.length} work entries. ${expanded ? "Collapse" : "Expand"} list.`}
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/20 transition-colors"
      >
        <div className="text-left flex-1">
          <p className="text-sm font-semibold">{displayName}</p>
          <p className="text-xs text-muted-foreground">{sub?.specialty || "—"} · {entries.length} entries</p>
        </div>
        <div className="flex items-center gap-4 mr-2">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Hours</p>
            <p className="text-sm font-semibold">{totalHours.toFixed(1)}h</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Earned</p>
            <p className="text-sm font-semibold">{formatCurrency(totalEarned)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Owed</p>
            <p className={`text-sm font-semibold ${totalOwed > 0 ? "text-red-600" : "text-green-600"}`}>{formatCurrency(totalOwed)}</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="border-t bg-muted/10 p-3 space-y-2">
          {[...entries].sort((a, b) => (b.work_date || "").localeCompare(a.work_date || "")).map(e => (
            <div
              key={e.id}
              className="flex items-center justify-between text-xs p-2 bg-card rounded border cursor-pointer hover:bg-muted/20 transition-colors"
              onClick={() => onEditEntry(e)}
            >
              <div>
                <span className="font-medium">{e.work_date}</span>
                <span className="text-muted-foreground ml-2">{e.job_phase}</span>
                {e.description && <p className="text-muted-foreground truncate max-w-xs">{e.description}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span>{e.pay_type}{e.pay_type === "Hourly" ? ` · ${e.hours_worked}h` : ""}</span>
                <span className="font-semibold">{formatCurrency(e.calculated_pay)}</span>
                <Badge variant={e.payment_status === "Paid" ? "default" : "secondary"} className="text-xs">
                  {e.payment_status}
                </Badge>
                {e.timesheet_url && (
                  <a href={e.timesheet_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline" onClick={ev => ev.stopPropagation()}>Timesheet</a>
                )}
                <Pencil className="w-3 h-3 text-muted-foreground" />
              </div>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => onAddEntry()} className="gap-1 h-7 text-xs w-full">
            <Plus className="w-3 h-3" /> Add Entry for {sub?.name || "Sub"}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function JobSubLaborTab({ job }) {
  const [showModal, setShowModal] = useState(false);
  const [modalSubId, setModalSubId] = useState(null);
  const [editEntry, setEditEntry] = useState(null);

  const { data: entries = [] } = useQuery({
    queryKey: ["workEntries", "job", job.id],
    queryFn: () => base44.entities.SubcontractorWorkEntry.filter({ job_id: job.id }),
  });

  const { data: subs = [] } = useQuery({
    queryKey: ["subcontractors"],
    queryFn: () => base44.entities.Subcontractor.list("-created_date", 200),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => base44.entities.Job.list("-created_date", 200),
  });

  // Group by subcontractor
  const bySub = {};
  entries.forEach(e => {
    if (!bySub[e.subcontractor_id]) bySub[e.subcontractor_id] = [];
    bySub[e.subcontractor_id].push(e);
  });

  const totalLaborCost = entries.reduce((s, e) => s + (e.calculated_pay || 0), 0);
  const totalPaid = entries.filter(e => e.payment_status === "Paid").reduce((s, e) => s + (e.calculated_pay || 0), 0);
  const totalOwed = totalLaborCost - totalPaid;
  const subBudget = job.subcontractor_costs || 0;

  const openAdd = (subId) => {
    setEditEntry(null);
    setModalSubId(subId);
    setShowModal(true);
  };

  const openEdit = (entry) => {
    setEditEntry(entry);
    setModalSubId(entry.subcontractor_id);
    setShowModal(true);
  };

  // Find sub for modal
  const modalSub = modalSubId ? subs.find(s => s.id === modalSubId) : subs[0];

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-700">Sub Budget</p>
          <p className="text-lg font-bold text-blue-900">{formatCurrency(subBudget)}</p>
        </div>
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-xs text-amber-700">Total Labor Cost</p>
          <p className="text-lg font-bold text-amber-900">{formatCurrency(totalLaborCost)}</p>
          {subBudget > 0 && (
            <p className={`text-xs mt-0.5 ${totalLaborCost > subBudget ? "text-red-600 font-semibold" : "text-green-600"}`}>
              {totalLaborCost > subBudget ? `$${(totalLaborCost - subBudget).toFixed(0)} over budget` : `$${(subBudget - totalLaborCost).toFixed(0)} under budget`}
            </p>
          )}
        </div>
        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
          <p className="text-xs text-red-700">Total Owed</p>
          <p className="text-lg font-bold text-red-900">{formatCurrency(totalOwed)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{Object.keys(bySub).length} Subcontractor(s)</p>
        <Button size="sm" onClick={() => { setModalSubId(null); setShowModal(true); }} className="gap-1 h-8">
          <Plus className="w-3.5 h-3.5" /> Add Work Entry
        </Button>
      </div>

      {Object.keys(bySub).length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground bg-muted/20 rounded-lg">
          No subcontractor labor logged for this job yet.
        </div>
      ) : (
        <div className="space-y-2">
          {Object.entries(bySub).map(([subId, subEntries]) => {
            const sub = subs.find(s => s.id === subId);
            return (
              <SubRow key={subId} sub={sub} entries={subEntries} job={job} onAddEntry={() => openAdd(subId)} onEditEntry={openEdit} />
            );
          })}
        </div>
      )}

      {showModal && (
        <WorkEntryModal
          open={showModal}
          onClose={() => { setShowModal(false); setModalSubId(null); setEditEntry(null); }}
          subcontractor={modalSubId ? subs.find(s => s.id === modalSubId) : null}
          subs={subs}
          jobs={jobs}
          prefilledJobId={job.id}
          editEntry={editEntry}
        />
      )}
    </div>
  );
}