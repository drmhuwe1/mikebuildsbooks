import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import WorkEntryModal from "./WorkEntryModal";
import { formatCurrency } from "@/lib/formatters";

function getWeekStart(d) {
  const date = new Date(d);
  const day = date.getDay(); // 0=Sun
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  const mon = new Date(date.setDate(diff));
  mon.setHours(0, 0, 0, 0);
  return mon;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toLocalDateString(d) {
  return d.toISOString().split("T")[0];
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function SubScheduleTab({ sub, jobs = [] }) {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [showModal, setShowModal] = useState(false);
  const [prefillDate, setPrefillDate] = useState(null);

  const { data: entries = [] } = useQuery({
    queryKey: ["workEntries", sub.id],
    queryFn: () => base44.entities.SubcontractorWorkEntry.filter({ subcontractor_id: sub.id }),
  });

  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => toLocalDateString(addDays(weekStart, i)));
  }, [weekStart]);

  const prevWeek = () => setWeekStart(d => addDays(d, -7));
  const nextWeek = () => setWeekStart(d => addDays(d, 7));

  const weekLabel = `${weekDates[0]} – ${weekDates[6]}`;

  // Default scheduled days from subcontractor profile
  const scheduledDays = sub.default_scheduled_days || [];

  const dayEntries = useMemo(() => {
    const map = {};
    weekDates.forEach(d => { map[d] = []; });
    entries.forEach(e => {
      if (weekDates.includes(e.work_date)) {
        map[e.work_date].push(e);
      }
    });
    return map;
  }, [entries, weekDates]);

  const handleDayClick = (date) => {
    setPrefillDate(date);
    setShowModal(true);
  };

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={prevWeek} className="gap-1">
          <ChevronLeft className="w-3.5 h-3.5" /> Prev
        </Button>
        <p className="text-sm font-semibold">{weekLabel}</p>
        <Button variant="outline" size="sm" onClick={nextWeek} className="gap-1">
          Next <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      {scheduledDays.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Typical schedule: {scheduledDays.join(", ")}
        </p>
      )}

      {/* Weekly grid */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_LABELS.map((label, i) => {
          const date = weekDates[i];
          const dayEntryList = dayEntries[date] || [];
          const isToday = date === new Date().toISOString().split("T")[0];
          const isScheduled = scheduledDays.includes(label);
          const hasEntries = dayEntryList.length > 0;
          const totalPay = dayEntryList.reduce((s, e) => s + (e.calculated_pay || 0), 0);

          return (
            <div
              key={date}
              onClick={() => handleDayClick(date)}
              className={`
                min-h-[80px] rounded-lg border-2 p-2 cursor-pointer transition-all hover:shadow-md
                ${isToday ? "border-primary bg-primary/5" : hasEntries ? "border-green-400 bg-green-50" : isScheduled ? "border-dashed border-yellow-400 bg-yellow-50/50" : "border-border bg-card"}
              `}
            >
              <div className="flex flex-col items-center mb-1">
                <span className="text-xs font-bold">{label}</span>
                <span className="text-xs text-muted-foreground">{date.slice(5)}</span>
              </div>
              {hasEntries ? (
                <div className="space-y-1">
                  {dayEntryList.map(e => (
                    <div key={e.id} className="text-xs bg-green-100 rounded px-1 py-0.5 truncate">
                      <div className="font-semibold truncate">{e.job_title || "Job"}</div>
                      <div className="text-muted-foreground">{formatCurrency(e.calculated_pay)}</div>
                    </div>
                  ))}
                </div>
              ) : isScheduled ? (
                <div className="text-xs text-center text-yellow-600 mt-1">Planned</div>
              ) : (
                <div className="flex items-center justify-center h-8">
                  <Plus className="w-3 h-3 text-muted-foreground opacity-50" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Week summary */}
      {Object.values(dayEntries).some(arr => arr.length > 0) && (
        <div className="p-3 bg-muted/20 rounded-lg grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Days Worked</p>
            <p className="font-bold text-sm">{Object.values(dayEntries).filter(arr => arr.length > 0).length}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total Hours</p>
            <p className="font-bold text-sm">{Object.values(dayEntries).flat().reduce((s, e) => s + (e.hours_worked || 0), 0).toFixed(1)}h</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Week Pay</p>
            <p className="font-bold text-sm text-green-700">{formatCurrency(Object.values(dayEntries).flat().reduce((s, e) => s + (e.calculated_pay || 0), 0))}</p>
          </div>
        </div>
      )}

      <WorkEntryModal
        open={showModal}
        onClose={() => { setShowModal(false); setPrefillDate(null); }}
        subcontractor={sub}
        jobs={jobs}
      />
    </div>
  );
}