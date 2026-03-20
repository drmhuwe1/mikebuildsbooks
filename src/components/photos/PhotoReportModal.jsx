import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileDown } from "lucide-react";
import { PRINT_CSS } from "@/lib/docStyles";
import { generatePhotoReportPdf } from "@/lib/photoReportPdf";

const PHASES = ["Pre-Construction","Demo","Foundation","Framing","Rough-In","Insulation","Drywall","Finish Work","Final","Other"];

export default function PhotoReportModal({ open, onOpenChange, job, photos, company }) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedPhases, setSelectedPhases] = useState([]);
  const [clientVisibleOnly, setClientVisibleOnly] = useState(false);

  const togglePhase = (ph) =>
    setSelectedPhases(prev => prev.includes(ph) ? prev.filter(p => p !== ph) : [...prev, ph]);

  const handleGenerate = () => {
    const html = generatePhotoReportPdf(job, photos, company, {
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      phases: selectedPhases.length > 0 ? selectedPhases : undefined,
      clientVisibleOnly,
    });

    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${PRINT_CSS}
      .section-title { margin-top: 24px; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; }
    </style></head><body>${html}</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 800);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate Photo Report</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Date From (optional)</Label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Date To (optional)</Label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Phases to Include (leave blank for all)</Label>
            <div className="flex flex-wrap gap-2">
              {PHASES.map(ph => (
                <button
                  key={ph}
                  onClick={() => togglePhase(ph)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    selectedPhases.includes(ph)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {ph}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="coOnly"
              checked={clientVisibleOnly}
              onChange={e => setClientVisibleOnly(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="coOnly" className="cursor-pointer">Client-visible photos only</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleGenerate} className="gap-2">
            <FileDown className="w-4 h-4" />
            Generate PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}