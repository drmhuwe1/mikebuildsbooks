import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Zap, ChevronDown, ChevronUp, AlertTriangle, Save, FileCheck,
  Pencil, Check, X, MapPin, Clock, Layers, ArrowRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import PageHeader from "@/components/shared/PageHeader";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { useToast } from "@/components/ui/use-toast";
import { Link, useLocation } from "react-router-dom";

const CATEGORY_COLORS = {
  materials: "bg-blue-100 text-blue-700",
  labor: "bg-yellow-100 text-yellow-700",
  subcontractor: "bg-purple-100 text-purple-700",
  permit: "bg-orange-100 text-orange-700",
  equipment: "bg-red-100 text-red-700",
  overhead: "bg-gray-100 text-gray-600",
  contingency: "bg-teal-100 text-teal-700",
};

export default function QuickBid() {
  const { toast } = useToast();
  const qc = useQueryClient();

  // Inputs
  const [prompt, setPrompt] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [options, setOptions] = useState({
    includePermits: true,
    includeContingency: true,
    includeEquipment: false,
    marginOverride: "",
  });

  // Output state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // parsed AI JSON
  const [lineItems, setLineItems] = useState([]);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editRow, setEditRow] = useState(null);

  // Contract dialog
  const [contractDialog, setContractDialog] = useState(false);
  const [savedBidId, setSavedBidId] = useState(null);

  // Data
  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => base44.entities.Client.list("-created_date", 200) });
  const { data: settings = [] } = useQuery({ queryKey: ["settings"], queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }) });
  const { data: recentBids = [] } = useQuery({
    queryKey: ["quick-bids"],
    queryFn: () => base44.entities.Bid.list("-created_date", 5),
  });

  const s = settings[0] || {};
  const laborRate = s.default_labor_rate || 45;
  const overheadPct = s.default_overhead_percent || 10;
  const contingencyPct = s.default_contingency_percent || 5;
  const profitMargin = options.marginOverride ? Number(options.marginOverride) : (s.default_profit_margin || 20);

  // Derived totals
  const subtotal = lineItems.reduce((sum, item) => sum + (parseFloat(item.estimatedCost) || 0), 0);
  const bidAmount = subtotal > 0 ? Math.round(subtotal / (1 - profitMargin / 100)) : 0;
  const profit = bidAmount - subtotal;
  const depositPct = 50;
  const depositAmount = Math.round(bidAmount * depositPct / 100);

  const selectedClient = clients.find(c => c.id === selectedClientId);

  // Generate bid via AI
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setLineItems([]);

    const systemContext = `
Company defaults:
- Labor rate: $${laborRate}/hr
- Overhead: ${overheadPct}%
- Contingency: ${contingencyPct}%
- Target profit margin: ${profitMargin}%
${!options.includePermits ? "- Do NOT include permit line items." : ""}
${!options.includeContingency ? "- Do NOT include contingency line items." : ""}
${!options.includeEquipment ? "- Only include equipment costs if absolutely essential." : ""}
    `.trim();

    const systemPrompt = `You are an expert construction estimator assistant for MikeBuildsBooks, a construction business management platform. When given a plain-English project description, extract the following and return ONLY valid JSON with no extra text:

{
  "projectType": "string (e.g. 'Roof Replacement', 'Deck Build', 'Addition')",
  "projectDescription": "string (cleaned summary of the project)",
  "estimatedSqFt": "number or null",
  "location": "string (city, state if detected)",
  "lineItems": [
    { "category": "materials | labor | subcontractor | permit | equipment | overhead | contingency", "description": "string", "estimatedCost": "number" }
  ],
  "riskFlags": ["string array of items needing contractor review"],
  "permitRequired": "boolean",
  "estimatedDuration": "string (e.g. '3-5 days')"
}

${systemContext}

Use industry-standard pricing for the detected region where possible. Apply realistic material and labor cost ranges for residential construction. If square footage is not provided, estimate based on typical project scope. Always include overhead as ${overheadPct}% of subtotal${options.includeContingency ? ` and contingency as ${contingencyPct}%` : ""}. Be conservative — it is better to slightly overestimate than underestimate.`;

    const aiResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Project description: ${prompt}`,
      response_json_schema: {
        type: "object",
        properties: {
          projectType: { type: "string" },
          projectDescription: { type: "string" },
          estimatedSqFt: { type: "number" },
          location: { type: "string" },
          lineItems: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                description: { type: "string" },
                estimatedCost: { type: "number" },
              },
            },
          },
          riskFlags: { type: "array", items: { type: "string" } },
          permitRequired: { type: "boolean" },
          estimatedDuration: { type: "string" },
        },
      },
    });

    setLoading(false);

    if (!aiResult || !aiResult.lineItems) {
      setError("We couldn't fully parse your project description. Try adding more detail like square footage, location, or material preferences.");
      return;
    }

    setResult(aiResult);
    setLineItems(aiResult.lineItems.map((item, i) => ({ ...item, id: i })));
  };

  // Edit line item inline
  const startEdit = (idx) => {
    setEditingIdx(idx);
    setEditRow({ ...lineItems[idx] });
  };
  const saveEdit = () => {
    setLineItems(prev => prev.map((item, i) => i === editingIdx ? { ...editRow, estimatedCost: parseFloat(editRow.estimatedCost) || 0 } : item));
    setEditingIdx(null);
    setEditRow(null);
  };
  const cancelEdit = () => { setEditingIdx(null); setEditRow(null); };
  const deleteRow = (idx) => setLineItems(prev => prev.filter((_, i) => i !== idx));

  // Save as Bid
  const saveMutation = useMutation({
    mutationFn: async () => {
      const client = clients.find(c => c.id === selectedClientId);
      return base44.entities.Bid.create({
        title: result?.projectType ? `${result.projectType}${client ? ` — ${client.name}` : ""}` : "Quick Bid",
        client_id: selectedClientId || null,
        client_name: client?.name || "",
        status: "draft",
        scope_summary: result?.projectDescription || prompt,
        project_description: result?.projectDescription || prompt,
        estimated_duration: result?.estimatedDuration || "",
        material_cost: lineItems.filter(i => i.category === "materials").reduce((s, i) => s + i.estimatedCost, 0),
        labor_hours: 0,
        labor_rate: laborRate,
        subcontractor_cost: lineItems.filter(i => i.category === "subcontractor").reduce((s, i) => s + i.estimatedCost, 0),
        permit_cost: lineItems.filter(i => i.category === "permit").reduce((s, i) => s + i.estimatedCost, 0),
        equipment_cost: lineItems.filter(i => i.category === "equipment").reduce((s, i) => s + i.estimatedCost, 0),
        overhead_percent: overheadPct,
        contingency_percent: contingencyPct,
        target_profit_margin: profitMargin,
        total_estimated_cost: subtotal,
        bid_amount: bidAmount,
        gross_profit: profit,
        deposit_percent: depositPct,
        deposit_amount: depositAmount,
        notes: result?.riskFlags?.length ? `Risk Flags:\n${result.riskFlags.join("\n")}` : "",
      });
    },
    onSuccess: (bid) => {
      qc.invalidateQueries({ queryKey: ["bids"] });
      qc.invalidateQueries({ queryKey: ["quick-bids"] });
      setSavedBidId(bid.id);
      toast({ title: "Bid saved as Draft", description: "You can find it in the Bid Builder." });
    },
  });

  // Create contract from saved bid
  const contractMutation = useMutation({
    mutationFn: async () => {
      const client = clients.find(c => c.id === selectedClientId);
      return base44.entities.Contract.create({
        title: result?.projectType ? `Contract — ${result.projectType}` : "Contract",
        bid_id: savedBidId || null,
        client_id: selectedClientId || null,
        client_name: client?.name || "",
        contract_amount: bidAmount,
        deposit_amount: depositAmount,
        deposit_percent: depositPct,
        scope_summary: result?.projectDescription || prompt,
        status: "draft",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contracts"] });
      setContractDialog(false);
      toast({ title: "Contract created", description: "Review it in the Contracts section." });
    },
  });

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10">
      <PageHeader
        title="Quick Bid"
        description="Describe your project in plain English and get a full bid estimate in seconds"
      />

      {/* Client selector + prompt */}
      <Card className="p-5 space-y-4">
        <div>
          <Label className="mb-1.5 block">Client (optional)</Label>
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a client..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>No client selected</SelectItem>
              {clients.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-1.5 block">Describe your project</Label>
          <Textarea
            rows={4}
            placeholder="e.g. Replace roof on a 2,400 sq ft colonial, asphalt shingles, 2-story, Pittsburgh PA, homeowner wants 30-year warranty"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            className="resize-none text-sm"
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="w-full gap-2"
          size="lg"
        >
          <Zap className="w-4 h-4" />
          {loading ? "Generating bid..." : "Generate Bid"}
        </Button>

        {/* Advanced Options */}
        <div>
          <button
            type="button"
            onClick={() => setAdvancedOpen(v => !v)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {advancedOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Advanced Options
          </button>
          {advancedOpen && (
            <div className="mt-3 space-y-3 pl-1">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-normal">Include permit fees</Label>
                <Switch checked={options.includePermits} onCheckedChange={v => setOptions(o => ({ ...o, includePermits: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-normal">Include contingency</Label>
                <Switch checked={options.includeContingency} onCheckedChange={v => setOptions(o => ({ ...o, includeContingency: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-normal">Include equipment costs</Label>
                <Switch checked={options.includeEquipment} onCheckedChange={v => setOptions(o => ({ ...o, includeEquipment: v }))} />
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-sm font-normal shrink-0">Margin override (%)</Label>
                <Input
                  type="number"
                  placeholder={`${profitMargin} (default)`}
                  value={options.marginOverride}
                  onChange={e => setOptions(o => ({ ...o, marginOverride: e.target.value }))}
                  className="w-28 h-8 text-sm"
                  min="0"
                  max="60"
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Error state */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <Card className="p-6 text-center space-y-2">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">AI is analyzing your project and building your estimate…</p>
        </Card>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-4">
          {/* Summary header */}
          <Card className="p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Project Type</p>
                <p className="font-semibold text-sm">{result.projectType}</p>
              </div>
              {result.location && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  {result.location}
                </div>
              )}
              {result.estimatedDuration && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  {result.estimatedDuration}
                </div>
              )}
              {result.estimatedSqFt && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Layers className="w-3.5 h-3.5" />
                  {result.estimatedSqFt.toLocaleString()} sq ft
                </div>
              )}
              {result.permitRequired && (
                <Badge className="bg-orange-100 text-orange-700 text-xs">Permit Required</Badge>
              )}
            </div>
            {result.projectDescription && (
              <p className="text-xs text-muted-foreground mt-2">{result.projectDescription}</p>
            )}
          </Card>

          {/* Risk flags */}
          {result.riskFlags?.length > 0 && (
            <div className="space-y-2">
              {result.riskFlags.map((flag, i) => (
                <div key={i} className="flex items-start gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-semibold text-yellow-700 mr-2">Review:</span>
                    <span className="text-xs text-yellow-800">{flag}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Line items table */}
          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
              <p className="text-sm font-semibold">Line Items</p>
              <p className="text-xs text-muted-foreground">{lineItems.length} items</p>
            </div>
            <div className="divide-y">
              {lineItems.map((item, idx) => (
                <div key={idx} className="px-4 py-3 flex items-center gap-3">
                  {editingIdx === idx ? (
                    <div className="flex-1 flex items-center gap-2 flex-wrap">
                      <Select value={editRow.category} onValueChange={v => setEditRow(r => ({ ...r, category: v }))}>
                        <SelectTrigger className="w-32 h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["materials","labor","subcontractor","permit","equipment","overhead","contingency"].map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input value={editRow.description} onChange={e => setEditRow(r => ({ ...r, description: e.target.value }))} className="flex-1 h-7 text-xs" />
                      <Input type="number" value={editRow.estimatedCost} onChange={e => setEditRow(r => ({ ...r, estimatedCost: e.target.value }))} className="w-24 h-7 text-xs" />
                      <button onClick={saveEdit} className="text-green-600 hover:text-green-700"><Check className="w-4 h-4" /></button>
                      <button onClick={cancelEdit} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <>
                      <Badge className={`text-xs shrink-0 ${CATEGORY_COLORS[item.category] || "bg-muted text-muted-foreground"}`}>
                        {item.category}
                      </Badge>
                      <p className="flex-1 text-sm">{item.description}</p>
                      <p className="text-sm font-semibold shrink-0">{formatCurrency(item.estimatedCost)}</p>
                      <button onClick={() => startEdit(idx)} className="text-muted-foreground hover:text-foreground shrink-0">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteRow(idx)} className="text-muted-foreground hover:text-destructive shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t bg-muted/20 px-4 py-3 space-y-1.5">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal (all costs)</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Profit margin ({profitMargin}%)</span>
                <span className="text-green-600">{formatCurrency(profit)}</span>
              </div>
              <div className="flex justify-between text-base font-bold border-t pt-2 mt-1">
                <span>Bid Amount</span>
                <span className="text-primary">{formatCurrency(bidAmount)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Deposit (50%)</span>
                <span>{formatCurrency(depositAmount)}</span>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || lineItems.length === 0}
              className="flex-1 gap-2"
              variant="outline"
            >
              <Save className="w-4 h-4" />
              {saveMutation.isPending ? "Saving..." : savedBidId ? "Bid Saved ✓" : "Save as Bid (Draft)"}
            </Button>
            <Button
              onClick={() => setContractDialog(true)}
              disabled={!savedBidId || contractMutation.isPending}
              className="flex-1 gap-2"
            >
              <FileCheck className="w-4 h-4" />
              Convert to Contract
            </Button>
          </div>
          {!savedBidId && (
            <p className="text-xs text-muted-foreground text-center">Save the bid first before converting to a contract.</p>
          )}
        </div>
      )}

      {/* Recent Quick Bids */}
      {recentBids.length > 0 && (
        <div>
          <p className="text-sm font-semibold mb-3">Recent Quick Bids</p>
          <div className="space-y-2">
            {recentBids.map(b => (
              <Link key={b.id} to="/BidBuilder">
                <Card className="p-3 flex items-center justify-between hover:shadow-sm transition-shadow cursor-pointer">
                  <div>
                    <p className="text-sm font-medium">{b.title}</p>
                    <p className="text-xs text-muted-foreground">{b.client_name || "No client"} · {formatDate(b.created_date)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-primary">{formatCurrency(b.bid_amount)}</p>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Convert to Contract dialog */}
      <Dialog open={contractDialog} onOpenChange={setContractDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert to Contract</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">This will create a draft contract pre-filled with your bid details. You can review and send it for client signature from the Contracts page.</p>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Client:</span><span className="font-medium">{selectedClient?.name || "None"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Project:</span><span className="font-medium">{result?.projectType}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount:</span><span className="font-medium">{formatCurrency(bidAmount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Deposit:</span><span className="font-medium">{formatCurrency(depositAmount)} (50%)</span></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContractDialog(false)}>Cancel</Button>
            <Button onClick={() => contractMutation.mutate()} disabled={contractMutation.isPending}>
              {contractMutation.isPending ? "Creating..." : "Create Contract"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}