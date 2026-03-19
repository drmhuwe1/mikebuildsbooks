import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import { Receipt, Eye, X, ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";

const CATEGORY_LABELS = {
  materials: "Materials", labor: "Labor", subcontractor: "Subcontractor",
  equipment: "Equipment", permits: "Permits & Fees", overhead: "Overhead",
  fuel: "Fuel", tools: "Tools", other: "Other"
};

export default function ReceiptsViewer({ open, onOpenChange }) {
  const [viewImage, setViewImage] = useState(null);
  const [expandedJobs, setExpandedJobs] = useState({});

  const { data: receipts = [], isLoading } = useQuery({
    queryKey: ["all-receipts"],
    queryFn: () => base44.entities.JobReceipt.list("-date", 500),
    enabled: open,
  });

  // Group receipts by job
  const grouped = receipts.reduce((acc, r) => {
    const key = r.job_id || "unassigned";
    const label = r.job_title || "No Job";
    if (!acc[key]) acc[key] = { label, receipts: [], total: 0 };
    acc[key].receipts.push(r);
    acc[key].total += r.amount || 0;
    return acc;
  }, {});

  const sortedJobs = Object.entries(grouped).sort((a, b) => b[1].total - a[1].total);
  const grandTotal = receipts.reduce((sum, r) => sum + (r.amount || 0), 0);

  const toggleJob = (key) => setExpandedJobs(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" /> All Job Receipts
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-10">Loading receipts…</p>
          ) : receipts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No receipts have been uploaded yet.</p>
              <p className="text-sm mt-1">Open a job and go to the "Expenses" tab to add receipts.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Grand Total */}
              <Card className="p-4 bg-red-50 border-red-200">
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-red-900">Total Receipt Expenses (All Jobs)</p>
                  <p className="text-xl font-bold text-red-700">{formatCurrency(grandTotal)}</p>
                </div>
                <p className="text-xs text-red-600 mt-1">{receipts.length} receipt(s) across {sortedJobs.length} job(s)</p>
              </Card>

              {/* Jobs grouped */}
              {sortedJobs.map(([key, group]) => (
                <Card key={key} className="overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                    onClick={() => toggleJob(key)}
                  >
                    <div className="flex items-center gap-2">
                      {expandedJobs[key] ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      <span className="font-semibold text-sm">{group.label}</span>
                      <span className="text-xs text-muted-foreground">({group.receipts.length} receipt{group.receipts.length !== 1 ? "s" : ""})</span>
                    </div>
                    <span className="text-sm font-bold text-red-600">{formatCurrency(group.total)}</span>
                  </button>

                  {expandedJobs[key] && (
                    <div className="divide-y border-t">
                      {group.receipts.map(r => (
                        <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20">
                          {r.receipt_image_url ? (
                            <img src={r.receipt_image_url} alt="receipt" className="w-12 h-12 object-cover rounded border cursor-pointer flex-shrink-0" onClick={() => setViewImage(r.receipt_image_url)} />
                          ) : (
                            <div className="w-12 h-12 rounded border bg-muted flex items-center justify-center flex-shrink-0">
                              <Receipt className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{r.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {r.vendor && `${r.vendor} · `}
                              {CATEGORY_LABELS[r.category] || r.category}
                              {r.date && ` · ${format(new Date(r.date), "M/d/yyyy")}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-sm font-bold text-red-600">{formatCurrency(r.amount)}</span>
                            {r.receipt_image_url && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewImage(r.receipt_image_url)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image lightbox */}
      {viewImage && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4" onClick={() => setViewImage(null)}>
          <button className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2" onClick={() => setViewImage(null)}>
            <X className="w-5 h-5" />
          </button>
          <img src={viewImage} alt="receipt" className="max-w-full max-h-full rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}