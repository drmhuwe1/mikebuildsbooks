import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, Plus, DollarSign, AlertTriangle, Loader2, MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import GuidedPrompt from "@/components/shared/GuidedPrompt";
import PermitFeeChecker from "@/components/permits/PermitFeeChecker";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

export default function BidPermitFeesStep({ form, onUpdate, projectData }) {
  const [feeItems, setFeeItems] = useState(form.permit_fee_items || []);
  const [showFeeChecker, setShowFeeChecker] = useState(false);
  const [manualFee, setManualFee] = useState({ name: "", amount: 0 });
  const { toast } = useToast();
  const [predicting, setPredicting] = useState(false);
  const [predictResult, setPredictResult] = useState(null);
  const [predictError, setPredictError] = useState(null);

  const handlePredictFromAddress = async () => {
    const addr = (projectData?.projectAddress || "").trim();
    if (!addr) {
      toast({ title: "Enter a project address first", description: "Add the project address on the Basics step, then predict permit costs.", variant: "destructive" });
      return;
    }
    setPredicting(true);
    setPredictError(null);
    try {
      const laborCost = (form.labor_hours || 0) * (form.labor_rate || 0);
      const estimatedValue = (form.material_cost || 0) + laborCost + (form.subcontractor_cost || 0) + (form.equipment_cost || 0);
      const res = await base44.functions.invoke("predictPermitFromAddress", {
        address: addr,
        projectType: projectData?.projectType || "deck",
        estimatedValue: estimatedValue > 0 ? Math.round(estimatedValue) : undefined,
        scopeDescription: form.scope_summary || "",
      });
      const data = res?.data || res;
      const jurisdiction = data.jurisdiction || {};
      if (jurisdiction.municipality) onUpdate("municipality", jurisdiction.municipality);
      if (jurisdiction.city) onUpdate("project_city", jurisdiction.city);
      if (jurisdiction.state) onUpdate("project_state", jurisdiction.state);
      if (jurisdiction.zip) onUpdate("project_zip_code", jurisdiction.zip);
      if (data.total_estimate_min && data.total_estimate_max) {
        onUpdate("permit_cost_min", data.total_estimate_min);
        onUpdate("permit_cost_max", data.total_estimate_max);
        onUpdate("permit_cost", Math.round((data.total_estimate_min + data.total_estimate_max) / 2));
      }
      setPredictResult(data);
      handleFeesDetected({ fees: data.fees || [] });
      toast({
        title: "Permit costs predicted",
        description: `${jurisdiction.municipality || jurisdiction.city || ""}${jurisdiction.county ? ", " + jurisdiction.county : ""} — ${data.fees?.length || 0} fees found.`,
      });
    } catch (err) {
      setPredictError(err.message || "Prediction failed");
      toast({ title: "Could not predict permit costs", description: err.message, variant: "destructive" });
    } finally {
      setPredicting(false);
    }
  };

  const totalFeeAmount = feeItems.reduce((sum, item) => item.included ? sum + (item.amount || 0) : sum, 0);

  const handleFeesDetected = (data) => {
    const newItems = data.fees.map(fee => ({
      id: Math.random().toString(36).substr(2, 9),
      name: fee.name || "Fee",
      description: fee.description,
      amount: fee.amount || 0,
      type: fee.type || "fixed",
      confidence: fee.confidence || "medium",
      source: fee.source || "Official Sources",
      dependsOn: fee.dependsOn,
      notes: fee.notes,
      included: fee.confidence === "high" || fee.amount > 0,
    }));

    setFeeItems(prev => [...prev, ...newItems]);
    onUpdate("permit_fee_items", [...feeItems, ...newItems]);
  };

  const toggleFeeIncluded = (id) => {
    const updated = feeItems.map(item => 
      item.id === id ? { ...item, included: !item.included } : item
    );
    setFeeItems(updated);
    onUpdate("permit_fee_items", updated);
  };

  const updateFeeAmount = (id, newAmount) => {
    const updated = feeItems.map(item =>
      item.id === id ? { ...item, amount: parseFloat(newAmount) || 0 } : item
    );
    setFeeItems(updated);
    onUpdate("permit_fee_items", updated);
  };

  const removeFee = (id) => {
    const updated = feeItems.filter(item => item.id !== id);
    setFeeItems(updated);
    onUpdate("permit_fee_items", updated);
  };

  const addManualFee = () => {
    if (manualFee.name && manualFee.amount > 0) {
      const newFee = {
        id: Math.random().toString(36).substr(2, 9),
        name: manualFee.name,
        amount: parseFloat(manualFee.amount) || 0,
        type: "fixed",
        confidence: "user-entered",
        source: "Manual Entry",
        included: true,
      };
      const updated = [...feeItems, newFee];
      setFeeItems(updated);
      onUpdate("permit_fee_items", updated);
      setManualFee({ name: "", amount: 0 });
    }
  };

  return (
    <div className="space-y-4">
      <GuidedPrompt 
        message="Enter the bid address on the Basics step, then click Predict Costs — we'll find the township, county, and estimated permit fees automatically. You can also run a manual lookup below." 
        variant="info" 
      />

      {projectData?.projectAddress ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 flex items-start gap-3">
          <MapPin className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-blue-900">Auto-detect jurisdiction & permit fees</p>
            <p className="text-xs text-blue-800 mt-0.5 truncate">Address: {projectData.projectAddress}</p>
            {predictResult?.jurisdiction && (
              <p className="text-xs text-blue-700 mt-1">
                <strong>Detected:</strong> {predictResult.jurisdiction.municipality || predictResult.jurisdiction.city}
                {predictResult.jurisdiction.county ? `, ${predictResult.jurisdiction.county}` : ""}, {predictResult.jurisdiction.state} {predictResult.jurisdiction.zip}
              </p>
            )}
            {predictResult?.summary && (
              <p className="text-xs text-blue-600 mt-1 italic">{predictResult.summary}</p>
            )}
            {predictError && <p className="text-xs text-red-600 mt-1">{predictError}</p>}
          </div>
          <Button onClick={handlePredictFromAddress} disabled={predicting} className="gap-2 shrink-0">
            {predicting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
            {predicting ? "Predicting..." : "Predict Costs"}
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Add a project address on the Basics step to auto-detect the township and predict permit fees.
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={() => setShowFeeChecker(true)} variant="outline" className="gap-2">
          <DollarSign className="w-4 h-4" />
          Run Fee Intelligence
        </Button>
      </div>

      {feeItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Detected Permit Fees</h3>
            <span className="text-sm text-muted-foreground">
              {feeItems.filter(f => f.included).length} of {feeItems.length} included
            </span>
          </div>

          {feeItems.map((fee) => (
            <Card key={fee.id} className="p-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={fee.included}
                  onCheckedChange={() => toggleFeeIncluded(fee.id)}
                  className="mt-1"
                />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{fee.name}</p>
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                      {fee.confidence}
                    </span>
                  </div>
                  
                  {fee.description && (
                    <p className="text-xs text-muted-foreground mb-2">{fee.description}</p>
                  )}

                  {fee.dependsOn && (
                    <p className="text-xs text-amber-600 mb-2">
                      <AlertTriangle className="w-3 h-3 inline mr-1" />
                      May depend on: {fee.dependsOn}
                    </p>
                  )}

                  {fee.source && (
                    <p className="text-xs text-muted-foreground">Source: {fee.source}</p>
                  )}

                  {fee.notes && (
                    <p className="text-xs text-muted-foreground italic mt-1">{fee.notes}</p>
                  )}
                </div>

                <div className="flex items-end gap-2">
                  <div className="text-right">
                    <Label className="text-xs text-muted-foreground">Amount ($)</Label>
                    <Input
                      type="number"
                      value={fee.amount}
                      onChange={e => updateFeeAmount(fee.id, e.target.value)}
                      className="w-24 text-right"
                      step="0.01"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFee(fee.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-blue-900">Total Permit-Related Fees:</span>
              <span className="text-lg font-bold text-blue-900">{formatCurrency(totalFeeAmount)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Manual Fee Entry */}
      <div className="border-t pt-4">
        <h3 className="font-semibold text-sm mb-3">Add Manual Fee</h3>
        <div className="flex gap-2">
          <Input
            placeholder="Fee name (e.g. Inspection Fee)"
            value={manualFee.name}
            onChange={e => setManualFee({ ...manualFee, name: e.target.value })}
            className="flex-1"
          />
          <Input
            type="number"
            placeholder="Amount"
            value={manualFee.amount}
            onChange={e => setManualFee({ ...manualFee, amount: e.target.value })}
            className="w-32"
            step="0.01"
          />
          <Button onClick={addManualFee} variant="outline">
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {/* Disclaimer */}
      <Alert>
        <AlertTriangle className="w-4 h-4" />
        <AlertDescription className="text-xs">
          <strong>Important:</strong> Permit fees are estimates based on official public information. Always confirm final fees with your local building department before submission. Fees may vary based on project value, square footage, or additional requirements.
        </AlertDescription>
      </Alert>

      <PermitFeeChecker
        open={showFeeChecker}
        onClose={() => setShowFeeChecker(false)}
        permitData={projectData}
        onFeesDetected={handleFeesDetected}
      />
    </div>
  );
}