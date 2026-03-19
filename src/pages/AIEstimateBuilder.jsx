import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import AIEstimatePanel from "@/components/bids/AIEstimatePanel";
import BidWizard from "@/components/bids/BidWizard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AIEstimateBuilder() {
  const [estimate, setEstimate] = useState(null);
  const [syncToBidModal, setSyncToBidModal] = useState(false);
  const [selectedBid, setSelectedBid] = useState(null);
  const [showBidWizard, setShowBidWizard] = useState(false);

  const qc = useQueryClient();
  const { data: bids = [] } = useQuery({
    queryKey: ["bids"],
    queryFn: () => base44.entities.Bid.list("-created_date", 100)
  });

  const draftBids = bids.filter(b => b.status === "draft");

  const handleEstimateUpdate = (est) => {
    setEstimate(est);
  };

  const handleSyncEstimate = async (bidId) => {
    if (!estimate) return;

    try {
      const bid = bids.find(b => b.id === bidId);
      if (!bid) return;

      // Update bid with AI estimate data
      await base44.entities.Bid.update(bidId, {
        material_cost: estimate.estimate?.totalMaterialCost || bid.material_cost,
        labor_hours: estimate.estimate?.totalLaborHours || bid.labor_hours,
        labor_rate: bid.labor_rate || 45,
        ai_estimate_metadata: JSON.stringify(estimate)
      });

      qc.invalidateQueries({ queryKey: ["bids"] });
      setSyncToBidModal(false);
      setEstimate(null);

      alert(`✓ Estimate synced to "${bid.title}". You can now review and adjust in the Bid Wizard.`);
    } catch (error) {
      alert("Error syncing estimate: " + error.message);
    }
  };

  const handleCreateNewBidWithEstimate = () => {
    if (estimate) {
      setShowBidWizard(true);
    }
  };

  return (
    <div>
      <PageHeader 
        title="AI Cost & Labor Estimator" 
        description="Generate estimates for materials, labor, and timeline. Then sync into a bid or create a new one."
      />

      {!showBidWizard ? (
        <div className="grid grid-cols-3 gap-6">
          {/* Estimator */}
          <div className="col-span-2">
            <AIEstimatePanel onEstimateUpdate={handleEstimateUpdate} />
          </div>

          {/* Sync Panel */}
          {estimate && (
            <div className="col-span-1 space-y-3">
              <Card className="p-4 bg-blue-50 border-blue-200">
                <p className="font-semibold text-blue-900 text-sm mb-3">Estimate Ready</p>
                <div className="space-y-2">
                  <p className="text-xs text-blue-800">
                    <strong>Material:</strong> ${estimate.estimate?.totalMaterialCost?.toFixed(2) || "—"}
                  </p>
                  <p className="text-xs text-blue-800">
                    <strong>Labor:</strong> {estimate.estimate?.totalLaborHours?.toFixed(1) || "—"} hrs
                  </p>
                  <p className="text-xs text-blue-800">
                    <strong>Est. Timeline:</strong> {estimate.estimate?.estimatedDays || "—"} days
                  </p>
                </div>
              </Card>

              <div className="space-y-2">
                <Button 
                  onClick={() => setSyncToBidModal(true)}
                  className="w-full bg-green-600 hover:bg-green-700 gap-2"
                >
                  <Check className="w-4 h-4" />
                  Sync to Existing Bid
                </Button>

                <Button 
                  onClick={handleCreateNewBidWithEstimate}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create New Bid with This
                </Button>

                <Button 
                  onClick={() => setEstimate(null)}
                  variant="ghost"
                  className="w-full text-xs"
                >
                  Clear Estimate
                </Button>
              </div>

              {draftBids.length > 0 && (
                <div className="border-t pt-3">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Or pick a bid:</p>
                  <div className="space-y-1">
                    {draftBids.slice(0, 5).map(bid => (
                      <button
                        key={bid.id}
                        onClick={() => handleSyncEstimate(bid.id)}
                        className="w-full text-left px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors truncate"
                      >
                        {bid.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div>
          <Button 
            onClick={() => setShowBidWizard(false)}
            variant="ghost"
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Estimator
          </Button>
          <BidWizard 
            onClose={() => setShowBidWizard(false)}
            initialData={{
              material_cost: estimate?.estimate?.totalMaterialCost || 0,
              labor_hours: estimate?.estimate?.totalLaborHours || 0,
              ai_estimate_metadata: estimate
            }}
          />
        </div>
      )}

      {/* Sync to Bid Modal */}
      <Dialog open={syncToBidModal} onOpenChange={setSyncToBidModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sync Estimate to Bid</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {draftBids.length === 0 ? (
              <p className="text-sm text-gray-600">No draft bids available. Create a new bid instead.</p>
            ) : (
              <>
                <p className="text-sm text-gray-600">Select a bid to sync this estimate:</p>
                <div className="space-y-2">
                  {draftBids.map(bid => (
                    <button
                      key={bid.id}
                      onClick={() => handleSyncEstimate(bid.id)}
                      className="w-full text-left p-3 border rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <p className="font-semibold text-sm">{bid.title}</p>
                      <p className="text-xs text-gray-500">{bid.client_name || "—"}</p>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}