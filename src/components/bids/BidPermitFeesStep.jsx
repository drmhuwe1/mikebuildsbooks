import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, Plus, DollarSign, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import GuidedPrompt from "@/components/shared/GuidedPrompt";
import PermitFeeChecker from "@/components/permits/PermitFeeChecker";

export default function BidPermitFeesStep({ form, onUpdate, projectData }) {
  const [feeItems, setFeeItems] = useState(form.permit_fee_items || []);
  const [showFeeChecker, setShowFeeChecker] = useState(false);
  const [manualFee, setManualFee] = useState({ name: "", amount: 0 });

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
        message="Review permit-related fees. Use AI Fee Intelligence to auto-detect fees, or add them manually." 
        variant="info" 
      />

      <div className="flex gap-2">
        <Button onClick={() => setShowFeeChecker(true)} className="gap-2">
          <DollarSign className="w-4 h-4" />
          Run Fee Intelligence
        </Button>
        <Button variant="outline">Learn More</Button>
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