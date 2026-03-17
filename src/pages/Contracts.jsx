import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileCheck, MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import GuidedPrompt from "@/components/shared/GuidedPrompt";
import { formatCurrency, getStatusColor } from "@/lib/formatters";
import AdvancedContractEditor from "@/components/contracts/AdvancedContractEditor";

const emptyContract = {
  title: "",
  client_id: "",
  client_name: "",
  client_last_name: "",
  job_id: "",
  bid_id: "",
  status: "draft",
  contract_amount: 0,
  deposit_amount: 0,
  deposit_percent: 0,
  start_of_construction_amount: 0,
  final_payment_amount: 0,
  scope_summary: "",
  payment_schedule: "",
  change_order_terms: "",
  start_date: "",
  estimated_completion: "",
  notes: "",
};

export default function Contracts() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [form, setForm] = useState(emptyContract);
  const [editId, setEditId] = useState(null);
  const qc = useQueryClient();

  const { data: contracts = [] } = useQuery({
    queryKey: ["contracts"],
    queryFn: () => base44.entities.Contract.list("-created_date", 200),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("-created_date", 200),
  });

  const { data: bids = [] } = useQuery({
    queryKey: ["bids"],
    queryFn: () => base44.entities.Bid.filter({ status: "approved" }),
  });

  const { data: settings = [] } = useQuery({
    queryKey: ["settings"],
    queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }),
  });

  const saveMutation = useMutation({
    mutationFn: (data) =>
      editId ? base44.entities.Contract.update(editId, data) : base44.entities.Contract.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contracts"] });
      setDialogOpen(false);
      setEditId(null);
      setForm(emptyContract);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Contract.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contracts"] }),
  });

  const openEdit = (c) => {
    setForm(c);
    setEditId(c.id);
    setDialogOpen(true);
  };

  const openFromBid = (b) => {
    // Calculate payment amounts from bid
    const depositAmt = b.deposit_amount || 0;
    const bidAmount = b.bid_amount || 0;
    const startConstructionAmt = bidAmount * 0.35; // 35% of bid
    const finalPaymentAmt = bidAmount - depositAmt - startConstructionAmt;

    setForm({
      ...emptyContract,
      title: `Contract - ${b.title}`,
      client_id: b.client_id || "",
      client_name: b.client_name || "",
      client_last_name: b.client_last_name || "",
      bid_id: b.id,
      contract_amount: bidAmount,
      deposit_amount: depositAmt,
      deposit_percent: b.deposit_percent || 50,
      start_of_construction_amount: startConstructionAmt,
      final_payment_amount: finalPaymentAmt,
      scope_summary: b.scope_summary || "",
      payment_schedule: b.terms_and_conditions || "",
      change_order_terms: b.change_orders || "",
      notes: (b.exclusions ? `Exclusions: ${b.exclusions}\n\n` : "") + (b.disclaimer || ""),
    });
    setEditId(null);
    setDialogOpen(true);
  };

  const openCreate = () => {
    setForm(emptyContract);
    setEditId(null);
    setDialogOpen(true);
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setNum = (k, v) => setForm((f) => ({ ...f, [k]: parseFloat(v) || 0 }));

  const missingSchedule = contracts.filter((c) => c.status !== "cancelled" && !c.payment_schedule);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contracts"
        description="Convert bids into contracts and manage terms"
        actionLabel="New Contract"
        onAction={openCreate}
      />

      {missingSchedule.length > 0 && (
        <GuidedPrompt
          message={`${missingSchedule.length} contract(s) are missing payment schedules.`}
          variant="warning"
        />
      )}

      {bids.length > 0 && (
        <Card className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Approved Bids Ready for Contract
          </p>
          <div className="flex gap-2 flex-wrap">
            {bids.map((b) => (
              <Button key={b.id} variant="outline" size="sm" onClick={() => openFromBid(b)}>
                Convert: {b.title}
              </Button>
            ))}
          </div>
        </Card>
      )}

      {contracts.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          title="No contracts yet"
          description="Create a contract or convert an approved bid."
          actionLabel="New Contract"
          onAction={openCreate}
        />
      ) : (
        <div className="grid gap-3">
          {contracts.map((c) => (
            <Card key={c.id} className="p-4 flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{c.title}</p>
                  <Badge className={`text-xs ${getStatusColor(c.status)}`}>{c.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {c.client_name || "No client"} · {formatCurrency(c.contract_amount)}
                </p>
                {!c.payment_schedule && (
                  <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded mt-2 inline-block">
                    ⚠ Missing payment schedule
                  </span>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedContract(c);
                      setPreviewOpen(true);
                    }}
                  >
                    <Eye className="w-3.5 h-3.5 mr-2" />
                    View & Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openEdit(c)}>
                    <Pencil className="w-3.5 h-3.5 mr-2" />
                    Edit Details
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(c.id)}>
                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Contract" : "New Contract"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Client Name</Label>
                <Input value={form.client_name} onChange={(e) => set("client_name", e.target.value)} />
              </div>
              <div>
                <Label>Client Last Name</Label>
                <Input value={form.client_last_name} onChange={(e) => set("client_last_name", e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["draft", "sent", "signed", "active", "completed", "cancelled"].map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Contract Amount</Label>
                <Input
                  type="number"
                  value={form.contract_amount}
                  onChange={(e) => setNum("contract_amount", e.target.value)}
                />
              </div>
              <div>
                <Label>Deposit Amount</Label>
                <Input
                  type="number"
                  value={form.deposit_amount}
                  onChange={(e) => setNum("deposit_amount", e.target.value)}
                />
              </div>
              <div>
                <Label>Deposit %</Label>
                <Input
                  type="number"
                  value={form.deposit_percent}
                  onChange={(e) => setNum("deposit_percent", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start of Construction Amount</Label>
                <Input
                  type="number"
                  value={form.start_of_construction_amount}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div>
                <Label>Final Payment Amount</Label>
                <Input
                  type="number"
                  value={form.final_payment_amount}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
              </div>
              <div>
                <Label>Est. Completion</Label>
                <Input
                  type="date"
                  value={form.estimated_completion}
                  onChange={(e) => set("estimated_completion", e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Scope Summary</Label>
              <Textarea value={form.scope_summary} onChange={(e) => set("scope_summary", e.target.value)} rows={3} />
            </div>
            <div>
              <Label>Payment Schedule</Label>
              <Textarea
                value={form.payment_schedule}
                onChange={(e) => set("payment_schedule", e.target.value)}
                rows={3}
                placeholder="e.g. 50% deposit, 25% at framing, 25% at completion"
              />
            </div>
            <div>
              <Label>Change Order Terms</Label>
              <Textarea
                value={form.change_order_terms}
                onChange={(e) => set("change_order_terms", e.target.value)}
                rows={2}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
            </div>
            <Button
              className="w-full"
              onClick={() => saveMutation.mutate(form)}
              disabled={!form.title || saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving..." : editId ? "Update" : "Create Contract"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {previewOpen && selectedContract && (
        <AdvancedContractEditor
          contract={selectedContract}
          company={settings[0] || {}}
          onClose={() => setPreviewOpen(false)}
          onSave={() => qc.invalidateQueries({ queryKey: ["contracts"] })}
        />
      )}
    </div>
  );
}