import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles, FileText, Upload, ArrowLeft, FileCheck, BarChart2, ShieldAlert,
  CheckCircle2, History, Camera, Wand2
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency, getStatusColor } from "@/lib/formatters";
import { useToast } from "@/components/ui/use-toast";
import { calculateBidIntelligence } from "@/lib/bidIntelligence";

// Existing untouched components
import BidWizard from "@/components/bids/BidWizard";
import BidImportWizard from "@/components/bids/BidImportWizard";
import BidIntelligencePanel from "@/components/bids/BidIntelligencePanel";
import BidHistoricalComparison from "@/components/bids/BidHistoricalComparison";
import BidValidationPanel from "@/components/bids/BidValidationPanel";
import PayoutProjection from "@/components/bids/PayoutProjection";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";

// New Smart components
import QuickGenerateTab from "@/components/bids/smart/QuickGenerateTab";
import LineItemTable from "@/components/bids/smart/LineItemTable";
import BidSummaryPanel from "@/components/bids/smart/BidSummaryPanel";
import SmartBidActionsBar from "@/components/bids/smart/SmartBidActionsBar";
import PhotoBidGenerator from "@/components/bids/smart/PhotoBidGenerator";

const STATUS_OPTIONS = ["draft", "sent", "approved", "rejected", "expired"];

export default function SmartBidBuilder() {
  const { toast } = useToast();
  const qc = useQueryClient();

  // ── Data queries ────────────────────────────────────────────────────────────
  const { data: bids = [] } = useQuery({ queryKey: ["bids"], queryFn: () => base44.entities.Bid.list("-created_date", 200) });
  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => base44.entities.Client.list("-created_date", 200) });
  const { data: settings = [] } = useQuery({ queryKey: ["settings"], queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }) });
  const { data: allJobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date", 200) });
  const { data: allMaterials = [] } = useQuery({ queryKey: ["materials"], queryFn: () => base44.entities.MaterialCost.list("-created_date", 200) });
  const s = settings[0] || {};

  // ── UI state ────────────────────────────────────────────────────────────────
  const [view, setView] = useState("list"); // "list" | "create" | "wizard" | "import"
  const [editBid, setEditBid] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [contractDialog, setContractDialog] = useState(false);
  const [contractBidId, setContractBidId] = useState(null);
  const [activeInputTab, setActiveInputTab] = useState("quick");

  // ── Form state (create/edit view) ───────────────────────────────────────────
  const [form, setForm] = useState({
    title: "",
    client_id: "",
    client_name: "",
    client_last_name: "",
    status: "draft",
    bid_date: new Date().toISOString().split("T")[0],
  });
  const [lineItems, setLineItems] = useState([]);
  const [profitMargin, setProfitMargin] = useState(s.default_profit_margin ?? 20);
  const [savedBidId, setSavedBidId] = useState(null);
  const [aiData, setAiData] = useState(null);

  // ── Derived totals ───────────────────────────────────────────────────────────
  const totalCost = lineItems.reduce((s, r) => s + (r.estimatedCost || 0), 0);
  const grandTotal = totalCost > 0 ? totalCost / (1 - (profitMargin / 100)) : 0;
  const estimatedProfit = grandTotal - totalCost;

  const bidFormForIntelligence = useMemo(() => ({
    scope_summary: form.title,
    bid_amount: grandTotal,
    material_cost: lineItems.filter(r => r.category === "materials").reduce((s, r) => s + r.estimatedCost, 0),
    labor_hours: 0,
    labor_rate: s.default_labor_rate || 45,
    subcontractor_cost: lineItems.filter(r => r.category === "subcontractor").reduce((s, r) => s + r.estimatedCost, 0),
    overhead_percent: s.default_overhead_percent ?? 10,
    contingency_percent: s.default_contingency_percent ?? 5,
  }), [form.title, grandTotal, lineItems, s]);

  const bidIntelligence = useMemo(() =>
    calculateBidIntelligence(bidFormForIntelligence, allJobs, allMaterials, bids),
    [bidFormForIntelligence, allJobs, allMaterials, bids]
  );

  // ── Mutations ────────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      const materialCost = lineItems.filter(r => r.category === "materials").reduce((s, r) => s + r.estimatedCost, 0);
      const laborCost = lineItems.filter(r => r.category === "labor").reduce((s, r) => s + r.estimatedCost, 0);
      const subCost = lineItems.filter(r => r.category === "subcontractor").reduce((s, r) => s + r.estimatedCost, 0);
      const permitCost = lineItems.filter(r => r.category === "permit").reduce((s, r) => s + r.estimatedCost, 0);
      const equipCost = lineItems.filter(r => r.category === "equipment").reduce((s, r) => s + r.estimatedCost, 0);

      const bidData = {
        title: form.title,
        client_id: form.client_id,
        client_name: form.client_name,
        client_last_name: form.client_last_name,
        status: form.status,
        material_cost: materialCost,
        subcontractor_cost: subCost,
        permit_cost: permitCost,
        equipment_cost: equipCost,
        labor_hours: 0,
        labor_rate: s.default_labor_rate || 45,
        overhead_percent: s.default_overhead_percent ?? 10,
        contingency_percent: s.default_contingency_percent ?? 5,
        target_profit_margin: profitMargin,
        total_estimated_cost: Math.round(totalCost * 100) / 100,
        bid_amount: Math.round(grandTotal * 100) / 100,
        gross_profit: Math.round(estimatedProfit * 100) / 100,
        scope_summary: aiData?.projectDescription || "",
        estimated_duration: aiData?.estimatedDuration || "",
        deposit_percent: 50,
        deposit_amount: Math.round(grandTotal * 0.5 * 100) / 100,
        final_payment_amount: Math.round(grandTotal * 0.5 * 100) / 100,
      };

      let result;
       if (savedBidId) {
         result = await base44.entities.Bid.update(savedBidId, bidData);
       } else {
         result = await base44.entities.Bid.create(bidData);
         setSavedBidId(result.id);
       }
       return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bids"] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
      toast({ title: "Bid saved successfully." });
    },
  });

  const createContractMutation = useMutation({
    mutationFn: async (bidId) => {
      const bid = bids.find(b => b.id === bidId);
      return base44.entities.Contract.create({
        title: bid.title || `Contract for ${bid.client_name}`,
        bid_id: bidId,
        client_id: bid.client_id,
        client_name: bid.client_name,
        client_last_name: bid.client_last_name || "",
        client_address: bid.client_address || bid.project_address || "",
        job_id: bid.job_id,
        contract_amount: bid.bid_amount,
        deposit_amount: bid.deposit_amount,
        deposit_percent: bid.deposit_percent,
        start_of_construction_amount: bid.start_of_construction_amount || 0,
        start_of_construction_label: bid.start_of_construction_label || "",
        final_payment_amount: bid.final_payment_amount || 0,
        scope_summary: bid.scope_summary,
        project_description: bid.project_description || "",
        disclaimer: bid.disclaimer || "",
        change_order_terms: bid.change_orders || "",
        notes: [
          bid.additional_notes ? `Notes: ${bid.additional_notes}` : "",
          bid.exclusions ? `Exclusions: ${bid.exclusions}` : "",
          bid.notes ? bid.notes : "",
        ].filter(Boolean).join("\n\n"),
        status: "draft",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contracts"] });
      toast({ title: "Contract created from bid." });
      setContractDialog(false);
      setContractBidId(null);
    },
  });

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleClientChange = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    const parts = (client.name || "").split(" ");
    setForm(f => ({
      ...f,
      client_id: client.id,
      client_name: parts[0] || "",
      client_last_name: parts.slice(1).join(" ") || "",
    }));
  };

  const handleLineItemsGenerated = (items) => {
    const withIds = items.map((item, i) => ({ ...item, id: Date.now() + i }));
    setLineItems(withIds);
    setActiveInputTab("manual"); // switch to table view after generation
  };

  const openCreate = () => {
    setForm({ title: "", client_id: "", client_name: "", client_last_name: "", status: "draft", bid_date: new Date().toISOString().split("T")[0] });
    setLineItems([]);
    setSavedBidId(null);
    setAiData(null);
    setProfitMargin(s.default_profit_margin ?? 20);
    setView("create");
    setActiveInputTab("quick");
  };

  const openEdit = (bid) => {
    setEditBid(bid);
    setView("wizard");
  };

  // ── LIST VIEW ────────────────────────────────────────────────────────────────
  if (view === "wizard" && editBid) {
    return <BidWizard bid={editBid} onClose={() => { setView("list"); setEditBid(null); }} />;
  }

  if (view === "list") {
    return (
      <div>
        <PageHeader
          title="Smart Bid Builder"
          description="AI-powered bid creation — fast, intelligent, guided"
          actionLabel="+ New Smart Bid"
          onAction={openCreate}
        >
          <Button size="sm" variant="outline" onClick={() => setImportOpen(true)} className="gap-1.5">
            <Upload className="w-4 h-4" /> Import from Document
          </Button>
        </PageHeader>

        {bids.length === 0 ? (
          <EmptyState icon={FileText} title="No bids yet" description="Create your first AI-powered bid." actionLabel="Create Smart Bid" onAction={openCreate} />
        ) : (
          <div className="grid gap-3">
            {bids.map(b => {
              const grossProfit = (b.bid_amount || 0) - (b.total_estimated_cost || 0);
              return (
                <Card
                  key={b.id}
                  className="p-4 cursor-pointer hover:shadow-md hover:border-primary/40 transition-all"
                  onClick={() => openEdit(b)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{b.title}</p>
                        <Badge className={`text-xs ${getStatusColor(b.status)}`}>{b.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{b.client_name || "No client"}</p>
                      <div className="flex gap-4 mt-2 text-xs flex-wrap">
                        <span>Est. Cost: <strong>{formatCurrency(b.total_estimated_cost || 0)}</strong></span>
                        <span>Bid: <strong>{formatCurrency(b.bid_amount || 0)}</strong></span>
                        <span className="text-green-600">Profit: <strong>{formatCurrency(grossProfit)}</strong></span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4" onClick={e => e.stopPropagation()}>
                      {b.status === "draft" && (
                        <Button
                          size="sm"
                          className="gap-1"
                          onClick={() => { setContractBidId(b.id); setContractDialog(true); }}
                        >
                          <FileCheck className="w-3.5 h-3.5" /> Create Contract
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => base44.entities.Bid.delete(b.id).then(() => qc.invalidateQueries({ queryKey: ["bids"] }))}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {importOpen && (
          <BidImportWizard
            open={importOpen}
            onClose={() => setImportOpen(false)}
            onBidCreated={() => qc.invalidateQueries({ queryKey: ["bids"] })}
          />
        )}

        {/* Contract dialog */}
        <Dialog open={contractDialog} onOpenChange={setContractDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Contract from Bid</DialogTitle></DialogHeader>
            {contractBidId && (() => {
              const bid = bids.find(b => b.id === contractBidId);
              return (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Client:</span><span className="font-medium">{bid?.client_name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Project:</span><span className="font-medium">{bid?.title}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Amount:</span><span className="font-medium">{formatCurrency(bid?.bid_amount)}</span></div>
                </div>
              );
            })()}
            <DialogFooter>
              <Button variant="outline" onClick={() => setContractDialog(false)}>Cancel</Button>
              <Button onClick={() => createContractMutation.mutate(contractBidId)} disabled={createContractMutation.isPending}>
                {createContractMutation.isPending ? "Creating..." : "Create Contract"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ── CREATE VIEW ──────────────────────────────────────────────────────────────
  return (
    <div className="pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Button variant="ghost" size="sm" onClick={() => setView("list")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">Smart Bid Builder</h2>
        </div>
      </div>

      {/* Bid Header Card */}
      <Card className="p-4 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div>
            <Label className="text-xs mb-1 block">Client</Label>
            <Select value={form.client_id} onValueChange={handleClientChange}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Bid / Project Name *</Label>
            <Input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Roof Replacement - Johnson"
              className="h-9"
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Bid Date</Label>
            <Input
              type="date"
              value={form.bid_date}
              onChange={e => setForm(f => ({ ...f, bid_date: e.target.value }))}
              className="h-9"
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Status</Label>
            <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Main layout: left content + right summary */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-5">
        <div className="space-y-5">
          {/* Input Tabs: Quick Generate / Manual / Import */}
          <Card className="p-4">
            <Tabs value={activeInputTab} onValueChange={setActiveInputTab}>
              <TabsList className="mb-4 grid grid-cols-4 w-full">
                <TabsTrigger value="quick" className="gap-1.5 text-xs">
                  <Sparkles className="w-3.5 h-3.5" /> Quick Generate
                </TabsTrigger>
                <TabsTrigger value="photo" className="gap-1.5 text-xs">
                  <Camera className="w-3.5 h-3.5" /> Photo to Bid
                </TabsTrigger>
                <TabsTrigger value="manual" className="gap-1.5 text-xs">
                  <FileText className="w-3.5 h-3.5" /> Manual Builder
                </TabsTrigger>
                <TabsTrigger value="import" className="gap-1.5 text-xs">
                  <Upload className="w-3.5 h-3.5" /> Import Doc
                </TabsTrigger>
              </TabsList>

              <TabsContent value="quick">
                <QuickGenerateTab
                  settings={s}
                  onLineItemsGenerated={handleLineItemsGenerated}
                  onAIDataGenerated={setAiData}
                />
              </TabsContent>

              <TabsContent value="photo">
                <PhotoBidGenerator
                  settings={s}
                  onLineItemsGenerated={handleLineItemsGenerated}
                  onAIDataGenerated={setAiData}
                />
              </TabsContent>

              <TabsContent value="manual">
                <p className="text-xs text-muted-foreground mb-3">
                  Use the full guided wizard to enter all costs, terms, and payment schedule.
                </p>
                <Button
                  className="w-full gap-2"
                  onClick={() => { setView("wizard"); setEditBid(null); }}
                >
                  <FileText className="w-4 h-4" /> Open Full Bid Wizard
                </Button>
              </TabsContent>

              <TabsContent value="import">
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Upload an existing bid document and AI will extract line items automatically.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => setImportOpen(true)}
                  >
                    <Upload className="w-4 h-4" /> Open Import Wizard
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Line Item Table — always visible */}
          {(lineItems.length > 0 || activeInputTab === "quick") && (
            <div>
              <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Line Items
              </p>
              <LineItemTable lineItems={lineItems} onChange={setLineItems} />
            </div>
          )}

          {/* AI Panels */}
          {(lineItems.length > 0 || savedBidId) && (
            <Card className="p-4">
              <Tabs defaultValue="validation">
                <TabsList className="mb-4 grid grid-cols-3 w-full">
                  <TabsTrigger value="validation" className="text-xs gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Bid Validation
                  </TabsTrigger>
                  <TabsTrigger value="intelligence" className="text-xs gap-1">
                    <BarChart2 className="w-3.5 h-3.5" /> Market Intelligence
                  </TabsTrigger>
                  <TabsTrigger value="risk" className="text-xs gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> Risk Analysis
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="validation">
                  {savedBidId ? (
                    <BidValidationPanel bid={{ ...form, ...bidFormForIntelligence, id: savedBidId, bid_amount: grandTotal }} />
                  ) : (
                    <p className="text-xs text-muted-foreground">Save the bid first to run validation.</p>
                  )}
                </TabsContent>

                <TabsContent value="intelligence">
                  <BidIntelligencePanel intelligence={bidIntelligence} />
                </TabsContent>

                <TabsContent value="risk">
                  <div className="space-y-3">
                    {aiData?.riskFlags?.length > 0 ? (
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-orange-700 mb-2">⚠ AI-Detected Risk Flags</p>
                        {aiData.riskFlags.map((f, i) => (
                          <div key={i} className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded p-2">
                            <ShieldAlert className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-orange-800">{f}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Generate a bid with Quick Generate to see AI risk analysis.</p>
                    )}
                    {bidIntelligence?.warnings?.length > 0 && (
                      <div className="space-y-1.5 mt-3">
                        <p className="text-xs font-semibold text-yellow-700 mb-2">Market Risk Warnings</p>
                        {bidIntelligence.warnings.map((w, i) => (
                          <div key={i} className="text-xs text-yellow-800 bg-yellow-50 border border-yellow-200 rounded p-2">
                            {w.message}
                          </div>
                        ))}
                      </div>
                    )}
                    <BidHistoricalComparison similarJobs={bidIntelligence?.similarJobs || []} />
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          )}
        </div>

        {/* Right Summary Panel */}
        <div className="space-y-4">
          <Card className="p-4 sticky top-4">
            <BidSummaryPanel
              lineItems={lineItems}
              profitMargin={profitMargin}
              onProfitMarginChange={setProfitMargin}
            />
          </Card>

          {grandTotal > 0 && (
            <Card className="p-4">
              <PayoutProjection
                bid={{ bid_amount: grandTotal, ...bidFormForIntelligence }}
                settings={s}
                totalCostOverride={totalCost}
              />
            </Card>
          )}
        </div>
      </div>

      {/* Sticky Actions Bar */}
      <SmartBidActionsBar
        onSave={() => saveMutation.mutate()}
        onPreview={() => {}}
        onCreateContract={() => {
          if (savedBidId) { setContractBidId(savedBidId); setContractDialog(true); }
        }}
        isSaving={saveMutation.isPending}
        hasTitle={!!form.title}
        bidId={savedBidId}
      />

      {/* Import Wizard (untouched) */}
      {importOpen && (
        <BidImportWizard
          open={importOpen}
          onClose={() => setImportOpen(false)}
          onBidCreated={() => { qc.invalidateQueries({ queryKey: ["bids"] }); setImportOpen(false); }}
        />
      )}

      {/* Contract dialog */}
      <Dialog open={contractDialog} onOpenChange={setContractDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Contract from Bid</DialogTitle></DialogHeader>
          <div className="text-sm text-muted-foreground">
            This will create a draft contract pre-filled with your bid details, ready for signature.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContractDialog(false)}>Cancel</Button>
            <Button
              onClick={() => contractBidId && createContractMutation.mutate(contractBidId)}
              disabled={createContractMutation.isPending}
            >
              {createContractMutation.isPending ? "Creating..." : "Create Contract"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}