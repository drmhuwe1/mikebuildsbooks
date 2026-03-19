import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, Check, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

export default function AIEstimatePanel({ onEstimateUpdate }) {
  const [jobType, setJobType] = useState("");
  const [crewSize, setCrewSize] = useState(1);
  const [dimensions, setDimensions] = useState({});
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showOverrides, setShowOverrides] = useState(false);

  const handleGetEstimate = async () => {
    if (!jobType.trim()) {
      setError("Please enter a job type or description");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await base44.functions.invoke('estimateProjectCosts', {
        jobType,
        dimensions,
        crewSize: parseInt(crewSize) || 1
      });

      if (response.data?.success) {
        setEstimate(response.data.estimate);
      } else {
        setError(response.data?.error || "Failed to generate estimate");
      }
    } catch (err) {
      setError(err.message || "Error generating estimate");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (estimate && onEstimateUpdate) {
      onEstimateUpdate({
        jobType,
        crewSize: parseInt(crewSize),
        estimate,
        accepted: true,
        timestamp: new Date().toISOString()
      });
      // Optional: Clear after accept for fresh estimate
      // setEstimate(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-blue-900 text-sm">AI Cost & Labor Estimator</p>
            <p className="text-xs text-blue-800 mt-1">Describe your job and AI will estimate materials, labor hours, and timeline. Review and override any values.</p>
          </div>
        </div>
      </Card>

      {/* Input Section */}
      <div className="space-y-3 bg-gray-50 border rounded-lg p-4">
        <div>
          <Label className="text-sm font-semibold">Job Type or Description *</Label>
          <Textarea
            placeholder="e.g., 'Concrete slab foundation 20x30 ft' or 'Metal roof replacement' or 'Kitchen demolition and framing'"
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            rows={2}
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm">Crew Size</Label>
            <Input
              type="number"
              min="1"
              value={crewSize}
              onChange={(e) => setCrewSize(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">How many people working?</p>
          </div>

          <div>
            <Label className="text-sm">Regional Adjustment</Label>
            <Input
              type="text"
              placeholder="e.g., Northeast, Southeast"
              onChange={(e) => setDimensions(d => ({ ...d, region: e.target.value }))}
              className="mt-1"
            />
          </div>
        </div>

        <Button 
          onClick={handleGetEstimate}
          disabled={loading || !jobType.trim()}
          className="w-full gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating Estimate...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Get AI Estimate
            </>
          )}
        </Button>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}
      </div>

      {/* Results Section */}
      {estimate && (
        <div className="space-y-3">
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <p className="font-semibold text-green-900 text-sm">Estimate Generated</p>
              </div>
              <Badge className="bg-green-600 text-white text-xs">Ready to Review</Badge>
            </div>

            {/* Material Costs */}
            {estimate.totalMaterialCost > 0 && (
              <div className="mb-3 pb-3 border-b">
                <p className="text-xs text-green-800 font-semibold mb-1.5">Materials</p>
                {estimate.materialBreakdown && estimate.materialBreakdown.length > 0 ? (
                  <div className="space-y-1 text-xs">
                    {estimate.materialBreakdown.map((item, i) => (
                      <div key={i} className="flex justify-between text-green-800">
                        <span>{item.item}</span>
                        <span className="font-semibold">{formatCurrency(item.cost)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold text-green-900 pt-1 border-t mt-1">
                      <span>Total Materials</span>
                      <span>{formatCurrency(estimate.totalMaterialCost)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-green-800 font-semibold">{formatCurrency(estimate.totalMaterialCost)}</p>
                )}
              </div>
            )}

            {/* Labor Phases */}
            {estimate.laborPhases && estimate.laborPhases.length > 0 && (
              <div className="mb-3 pb-3 border-b">
                <p className="text-xs text-green-800 font-semibold mb-1.5">Labor Breakdown</p>
                <div className="space-y-1 text-xs">
                  {estimate.laborPhases.map((phase, i) => (
                    <div key={i} className="flex justify-between text-green-800">
                      <span>{phase.name}</span>
                      <span className="font-semibold">{phase.hours.toFixed(1)} hrs</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-green-900 pt-1 border-t mt-1">
                    <span>Total Labor</span>
                    <span>{estimate.totalLaborHours.toFixed(1)} hrs ({estimate.estimatedDays} days @ 8hr/day)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {estimate.notes && (
              <div>
                <p className="text-xs text-green-800 font-semibold mb-1">Notes</p>
                <p className="text-xs text-green-700 italic">{estimate.notes}</p>
              </div>
            )}
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={handleAccept}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Check className="w-4 h-4 mr-1" />
              Accept & Use in Bid
            </Button>
            <Button 
              onClick={() => setShowOverrides(!showOverrides)}
              variant="outline"
              className="flex-1"
            >
              {showOverrides ? 'Hide' : 'Override'} Values
            </Button>
            <Button 
              onClick={() => { setEstimate(null); setJobType(""); }}
              variant="ghost"
            >
              Start Over
            </Button>
          </div>

          {/* Override Fields */}
          {showOverrides && (
            <Card className="p-4 bg-yellow-50 border-yellow-200">
              <p className="text-xs font-semibold text-yellow-900 mb-3">Override AI Estimates</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-yellow-800">Material Cost</span>
                  <Input
                    type="number"
                    defaultValue={estimate.totalMaterialCost}
                    className="w-32"
                    onChange={(e) => setEstimate(est => ({ ...est, totalMaterialCost: parseFloat(e.target.value) }))}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-yellow-800">Labor Hours</span>
                  <Input
                    type="number"
                    defaultValue={estimate.totalLaborHours}
                    className="w-32"
                    onChange={(e) => setEstimate(est => ({ ...est, totalLaborHours: parseFloat(e.target.value) }))}
                  />
                </div>
                <p className="text-xs text-yellow-700 mt-2">Changes here won't affect the estimates — use for your own adjustments before accepting.</p>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}