import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader, AlertCircle, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

export default function BidLaborEstimatorFromDocument({ onClose, isOpen }) {
  const [file, setFile] = useState(null);
  const [laborBreakdown, setLaborBreakdown] = useState(null);
  const [selectedSubs, setSelectedSubs] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: subs = [] } = useQuery({ queryKey: ["subcontractors"], queryFn: () => base44.entities.Subcontractor.list() });

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setIsAnalyzing(true);
    try {
      // Upload file to Base44
      const uploadRes = await base44.integrations.Core.UploadFile({ file: uploadedFile });
      const fileUrl = uploadRes.file_url;

      // Use AI to extract labor breakdown from bid document
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this bid document and extract labor information. Return a JSON with:
        {
          "total_labor_hours": number,
          "labor_phases": [
            { "phase_name": "string", "hours": number, "description": "string" }
          ],
          "estimated_total_labor_cost": number,
          "notes": "string"
        }`,
        file_urls: [fileUrl],
        response_json_schema: {
          type: "object",
          properties: {
            total_labor_hours: { type: "number" },
            labor_phases: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  phase_name: { type: "string" },
                  hours: { type: "number" },
                  description: { type: "string" },
                },
              },
            },
            estimated_total_labor_cost: { type: "number" },
            notes: { type: "string" },
          },
        },
      });

      setLaborBreakdown(result);
      setFile(uploadedFile);
      
      // Auto-select subcontractors based on phases
      const autoSelected = {};
      result.labor_phases?.forEach((phase, idx) => {
        if (subs[idx]) {
          autoSelected[subs[idx].id] = { hours: phase.hours, phase: phase.phase_name };
        }
      });
      setSelectedSubs(autoSelected);
    } catch (error) {
      alert(`Error analyzing document: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const projectedPayouts = Object.entries(selectedSubs)
    .map(([subId, allocation]) => {
      const sub = subs.find(s => s.id === subId);
      const rate = sub?.hourly_rate || 0;
      const hours = allocation.hours || 0;
      const payout = hours * rate;
      return {
        subId,
        sub,
        hours,
        rate,
        payout,
        phase: allocation.phase,
      };
    })
    .filter(p => p.hours > 0);

  const totalProjectedPayout = projectedPayouts.reduce((sum, p) => sum + p.payout, 0);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Extract Labor Estimate from Bid Document</DialogTitle>
          <DialogDescription>
            Upload a bid PDF or image and AI will extract labor hours to project subcontractor payouts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload */}
          {!laborBreakdown && (
            <div className="border-2 border-dashed border-yellow-300 rounded-lg p-8 text-center bg-yellow-50">
              <label className="cursor-pointer flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-yellow-600" />
                <span className="text-sm font-semibold text-yellow-900">Click to upload bid document</span>
                <span className="text-xs text-yellow-700">(PDF, PNG, JPG, or any image)</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg"
                  disabled={isAnalyzing}
                />
              </label>
            </div>
          )}

          {isAnalyzing && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader className="w-4 h-4 animate-spin" />
              Analyzing document with AI...
            </div>
          )}

          {/* Labor Breakdown */}
          {laborBreakdown && (
            <>
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-blue-900 text-sm">Bid Analysis Complete</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Total Labor Hours: <strong>{laborBreakdown.total_labor_hours}</strong> hrs | 
                      Estimated Cost: <strong>{formatCurrency(laborBreakdown.estimated_total_labor_cost)}</strong>
                    </p>
                    {laborBreakdown.notes && (
                      <p className="text-xs text-blue-700 mt-2 italic">{laborBreakdown.notes}</p>
                    )}
                  </div>
                </div>
              </Card>

              {/* Labor Phases */}
              <div>
                <p className="text-sm font-semibold mb-3">Labor Phases Detected</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {laborBreakdown.labor_phases?.map((phase, idx) => (
                    <div key={idx} className="bg-gray-50 border rounded-lg p-3 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">{phase.phase_name}</p>
                          <p className="text-gray-600 text-xs mt-0.5">{phase.description}</p>
                        </div>
                        <Badge variant="outline">{phase.hours} hrs</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subcontractor Assignment */}
              <div>
                <p className="text-sm font-semibold mb-3">Assign to Subcontractors</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {subs.map(sub => {
                    const allocation = selectedSubs[sub.id];
                    const hours = allocation?.hours || 0;
                    const payout = hours * (sub.hourly_rate || 0);

                    return (
                      <div key={sub.id} className="border rounded-lg p-3 flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={!!allocation}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedSubs(prev => ({
                                ...prev,
                                [sub.id]: { hours: 0, phase: "" },
                              }));
                            } else {
                              setSelectedSubs(prev => {
                                const next = { ...prev };
                                delete next[sub.id];
                                return next;
                              });
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{sub.name}</p>
                          <p className="text-xs text-gray-500">{formatCurrency(sub.hourly_rate || 0)}/hr</p>
                        </div>
                        {allocation && (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={hours}
                              onChange={e => {
                                const newHours = parseFloat(e.target.value) || 0;
                                setSelectedSubs(prev => ({
                                  ...prev,
                                  [sub.id]: { ...prev[sub.id], hours: newHours },
                                }));
                              }}
                              className="w-16 px-2 py-1 border rounded text-xs"
                              placeholder="Hours"
                            />
                            <span className="text-xs font-semibold text-gray-700 min-w-24 text-right">
                              {formatCurrency(payout)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Projected Payouts Summary */}
              {projectedPayouts.length > 0 && (
                <Card className="p-4 bg-green-50 border-green-200">
                  <p className="text-sm font-semibold text-green-900 mb-3">Projected Subcontractor Payouts</p>
                  <div className="space-y-2 text-xs">
                    {projectedPayouts.map(p => (
                      <div key={p.subId} className="flex items-center justify-between">
                        <span className="text-gray-700">
                          <strong>{p.sub.name}</strong> ({p.hours} hrs @ {formatCurrency(p.rate)}/hr)
                        </span>
                        <span className="font-semibold text-green-700">{formatCurrency(p.payout)}</span>
                      </div>
                    ))}
                    <div className="border-t border-green-200 pt-2 mt-2 flex justify-between items-center">
                      <span className="font-semibold text-green-900">Total Projected Payout</span>
                      <span className="text-lg font-bold text-green-700">{formatCurrency(totalProjectedPayout)}</span>
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {laborBreakdown && (
              <Button onClick={() => {
                alert(`Projected payouts:\n${projectedPayouts.map(p => `${p.sub.name}: ${formatCurrency(p.payout)}`).join("\n")}`);
                onClose();
              }}>
                Save & Use Estimates
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}