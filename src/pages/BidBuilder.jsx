import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, ArrowLeft, ArrowRight, Check, Calculator, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/formatters";
import BidWizard from "@/components/bids/BidWizard";
import BidImportWizard from "@/components/bids/BidImportWizard";

export default function BidBuilder() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editBid, setEditBid] = useState(null);
  const qc = useQueryClient();

  const { data: bids = [] } = useQuery({ queryKey: ["bids"], queryFn: () => base44.entities.Bid.list("-created_date", 200) });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Bid.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bids"] }),
  });

  const openCreate = () => { setEditBid(null); setWizardOpen(true); };
  const openEdit = (b) => { setEditBid(b); setWizardOpen(true); };

  if (wizardOpen) {
    return <BidWizard bid={editBid} onClose={() => { setWizardOpen(false); setEditBid(null); }} />;
  }

  return (
    <div>
      <PageHeader title="Estimate & Bid Builder" description="Create professional bids with guided step-by-step workflow" actionLabel="New Bid" onAction={openCreate}>
        <Button size="sm" onClick={() => setImportOpen(true)} variant="outline" className="gap-1.5">
          <Upload className="w-4 h-4" /> Import Bid
        </Button>
      </PageHeader>

      {bids.length === 0 ? (
        <EmptyState icon={FileText} title="No bids yet" description="Create your first bid using the step-by-step builder." actionLabel="Create Bid" onAction={openCreate} />
      ) : (
        <div className="grid gap-3">
          {bids.map(b => (
            <Card key={b.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => openEdit(b)}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{b.title}</p>
                    <Badge className={`text-xs ${getStatusColor(b.status)}`}>{b.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{b.client_name || "No client"}</p>
                  <div className="flex gap-4 mt-2 text-xs">
                    <span>Est. Cost: <strong>{formatCurrency(b.total_estimated_cost)}</strong></span>
                    <span>Bid: <strong>{formatCurrency(b.bid_amount)}</strong></span>
                    <span className="text-green-600">Profit: <strong>{formatCurrency(b.gross_profit)}</strong></span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(b.id); }}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      {importOpen && <BidImportWizard open={importOpen} onClose={() => setImportOpen(false)} onBidCreated={() => qc.invalidateQueries({ queryKey: ["bids"] })} />}
    </div>
  );
}