import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import GuidedPrompt from "@/components/shared/GuidedPrompt";
import { DollarSign, Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

export default function WorkflowStep10Bid({ data, fees, onChange }) {
  const [bidData, setBidData] = useState({
    title: data.projectType + " - " + data.customerName,
    directCosts: 0,
    permitFees: fees.reduce((sum, f) => sum + f.estimatedAmount, 0),
    laborHours: 0,
    laborRate: 45,
    overhead: 10,
    contingency: 5,
    profitMargin: 20,
  });

  const laborCost = bidData.laborHours * bidData.laborRate;
  const directCosts = bidData.directCosts + bidData.permitFees + laborCost;
  const overheadAmount = directCosts * (bidData.overhead / 100);
  const contingencyAmount = directCosts * (bidData.contingency / 100);
  const totalEstimatedCost = directCosts + overheadAmount + contingencyAmount;
  const bidAmount = totalEstimatedCost / (1 - bidData.profitMargin / 100);
  const grossProfit = bidAmount - totalEstimatedCost;

  const set = (key, value) => setBidData(d => ({ ...d, [key]: value }));

  return (
    <div className="space-y-4">
      <GuidedPrompt
        message="Integrate permit costs and design requirements into your project bid. Review and finalize before submitting to the client."
        variant="info"
      />

      {/* Project Summary */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-sm text-blue-900 mb-2">Project Summary</h3>
        <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
          <div><span className="text-muted-foreground">Type:</span> {data.projectType}</div>
          <div><span className="text-muted-foreground">Customer:</span> {data.customerName}</div>
          <div><span className="text-muted-foreground">Location:</span> {data.municipality}</div>
          <div><span className="text-muted-foreground">Address:</span> {data.projectAddress}</div>
        </div>
      </Card>

      {/* Cost Input */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Cost Components</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Direct Material & Subcontractor Costs ($)</Label>
            <Input
              type="number"
              value={bidData.directCosts}
              onChange={(e) => set("directCosts", parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label className="text-xs">Permit-Related Fees ($)</Label>
            <Input
              type="number"
              value={bidData.permitFees}
              onChange={(e) => set("permitFees", parseFloat(e.target.value) || 0)}
              disabled
            />
          </div>
          <div>
            <Label className="text-xs">Labor Hours</Label>
            <Input
              type="number"
              value={bidData.laborHours}
              onChange={(e) => set("laborHours", parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label className="text-xs">Labor Rate ($/hr)</Label>
            <Input
              type="number"
              value={bidData.laborRate}
              onChange={(e) => set("laborRate", parseFloat(e.target.value) || 45)}
            />
          </div>
        </div>
      </div>

      {/* Multipliers */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Overhead, Contingency & Profit</h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Overhead (%)</Label>
            <Input
              type="number"
              value={bidData.overhead}
              onChange={(e) => set("overhead", parseFloat(e.target.value) || 10)}
            />
          </div>
          <div>
            <Label className="text-xs">Contingency (%)</Label>
            <Input
              type="number"
              value={bidData.contingency}
              onChange={(e) => set("contingency", parseFloat(e.target.value) || 5)}
            />
          </div>
          <div>
            <Label className="text-xs">Profit Margin (%)</Label>
            <Input
              type="number"
              value={bidData.profitMargin}
              onChange={(e) => set("profitMargin", parseFloat(e.target.value) || 20)}
            />
          </div>
        </div>
      </div>

      {/* Permit Fees Summary */}
      {fees.length > 0 && (
        <Card className="p-3 bg-green-50 border-green-200">
          <h3 className="font-semibold text-sm text-green-900 mb-2">✓ Permit Fees Included</h3>
          <ul className="text-xs text-green-800 space-y-1 ml-3">
            {fees.map((fee, i) => (
              <li key={i}>
                → {fee.name}: <strong>{formatCurrency(fee.estimatedAmount)}</strong>
              </li>
            ))}
          </ul>
          <div className="mt-2 pt-2 border-t border-green-300 font-semibold text-green-900">
            Total Permit Fees: {formatCurrency(bidData.permitFees)}
          </div>
        </Card>
      )}

      {/* Bid Summary */}
      <Card className="p-4 bg-muted">
        <h3 className="font-semibold text-sm mb-3">Bid Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Materials & Subcontractors</span>
            <strong>{formatCurrency(bidData.directCosts)}</strong>
          </div>
          <div className="flex justify-between">
            <span>Labor ({bidData.laborHours}h × {formatCurrency(bidData.laborRate)}/hr)</span>
            <strong>{formatCurrency(laborCost)}</strong>
          </div>
          <div className="flex justify-between text-green-700 font-semibold">
            <span>Permit Fees & Inspections</span>
            <strong>{formatCurrency(bidData.permitFees)}</strong>
          </div>
          <div className="border-t pt-2 flex justify-between">
            <span>Direct Costs Total</span>
            <strong>{formatCurrency(directCosts)}</strong>
          </div>
          <div className="flex justify-between">
            <span>Overhead ({bidData.overhead}%)</span>
            <strong>{formatCurrency(overheadAmount)}</strong>
          </div>
          <div className="flex justify-between">
            <span>Contingency ({bidData.contingency}%)</span>
            <strong>{formatCurrency(contingencyAmount)}</strong>
          </div>
          <div className="border-t pt-2 flex justify-between">
            <span>Total Estimated Cost</span>
            <strong>{formatCurrency(totalEstimatedCost)}</strong>
          </div>
          <div className="border-t pt-2 flex justify-between text-lg font-bold text-primary">
            <span>Bid Amount</span>
            <strong>{formatCurrency(bidAmount)}</strong>
          </div>
          <div className="text-green-600 flex justify-between">
            <span>Gross Profit ({bidData.profitMargin}%)</span>
            <strong>{formatCurrency(grossProfit)}</strong>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline">💾 Save as Draft</Button>
        <Button className="bg-green-600 hover:bg-green-700">
          ✓ Create Bid in System
        </Button>
      </div>

      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <p className="text-xs font-semibold text-yellow-900 mb-1">💡 Next Steps</p>
        <ul className="text-xs text-yellow-800 space-y-1 ml-3">
          <li>→ Review bid amount with project specifications</li>
          <li>→ Verify permit fees with building department (still recommended)</li>
          <li>→ Set bid expiration date (typically 30 days)</li>
          <li>→ Send to customer for review and approval</li>
          <li>→ Upon approval, convert to contract and schedule project</li>
        </ul>
      </Card>
    </div>
  );
}