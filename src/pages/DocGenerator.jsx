import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { FileText, FileCheck, DollarSign, BarChart2, HardHat, Calendar, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/shared/PageHeader";
import GuidedPrompt from "@/components/shared/GuidedPrompt";
import DocPreviewModal from "@/components/documents/DocPreviewModal.jsx";
import {
  generateBidEstimate,
  generateClientProposal,
  generateContract,
  generateChangeOrder,
  generateJobFinancialSummary,
  generateSubPaymentSummary,
  generateBillSummary,
} from "@/lib/docTemplates";

const DOC_TYPES = [
  { id: "bid_estimate", label: "Bid Estimate", icon: FileText, desc: "Detailed cost breakdown and pricing for a specific bid" },
  { id: "client_proposal", label: "Client Proposal", icon: FileCheck, desc: "Professional proposal document for a job" },
  { id: "contract", label: "Construction Contract", icon: FileCheck, desc: "Full contract with scope, payment schedule, and signatures" },
  { id: "change_order", label: "Change Order", icon: DollarSign, desc: "Document a scope change and revised contract amount" },
  { id: "job_financial", label: "Job Financial Summary", icon: BarChart2, desc: "Profit, costs, and reserve allocation for a job" },
  { id: "sub_payment", label: "Subcontractor Payment Summary", icon: HardHat, desc: "YTD payments and 1099 tracking for all subcontractors" },
  { id: "bill_summary", label: "Bill Calendar Summary", icon: Calendar, desc: "Complete bill listing with due dates and payment status" },
];

export default function DocGenerator() {
  const [docType, setDocType] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedBidId, setSelectedBidId] = useState("");
  const [selectedContractId, setSelectedContractId] = useState("");
  const [changeData, setChangeData] = useState({ amount: 0, description: "", scheduleImpact: "" });
  const [preview, setPreview] = useState(null);

  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date", 200) });
  const { data: bids = [] } = useQuery({ queryKey: ["bids"], queryFn: () => base44.entities.Bid.list("-created_date", 200) });
  const { data: contracts = [] } = useQuery({ queryKey: ["contracts"], queryFn: () => base44.entities.Contract.list("-created_date", 200) });
  const { data: subs = [] } = useQuery({ queryKey: ["subcontractors"], queryFn: () => base44.entities.Subcontractor.list("-created_date", 200) });
  const { data: subPayments = [] } = useQuery({ queryKey: ["subPayments"], queryFn: () => base44.entities.SubcontractorPayment.list("-created_date", 500) });
  const { data: bills = [] } = useQuery({ queryKey: ["bills"], queryFn: () => base44.entities.Bill.list("-due_date", 500) });
  const { data: settings = [] } = useQuery({ queryKey: ["settings"], queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }) });

  const company = settings[0] || {};
  const selectedJob = jobs.find(j => j.id === selectedJobId);
  const selectedBid = bids.find(b => b.id === selectedBidId);
  const selectedContract = contracts.find(c => c.id === selectedContractId);

  const needsJob = ["client_proposal", "contract", "change_order", "job_financial", "bid_estimate"].includes(docType);
  const needsBid = docType === "bid_estimate";
  const needsContract = docType === "contract";
  const needsChangeOrder = docType === "change_order";

  const canGenerate = () => {
    if (!docType) return false;
    if (needsJob && !selectedJobId && !needsBid) return false;
    return true;
  };

  const generate = () => {
    let html = "";
    let title = "";

    switch (docType) {
      case "bid_estimate": {
        const bid = selectedBid || (selectedJob ? { title: selectedJob.title, client_name: selectedJob.client_name, bid_amount: selectedJob.contract_amount, scope_summary: selectedJob.scope } : null);
        if (!bid) return;
        html = generateBidEstimate(bid, company);
        title = `Bid Estimate — ${bid.title}`;
        break;
      }
      case "client_proposal":
        if (!selectedJob) return;
        html = generateClientProposal(selectedJob, selectedBid, company);
        title = `Client Proposal — ${selectedJob.title}`;
        break;
      case "contract": {
        const c = selectedContract || (selectedJob ? { title: selectedJob.title, client_name: selectedJob.client_name, contract_amount: selectedJob.contract_amount, scope_summary: selectedJob.scope } : null);
        if (!c) return;
        html = generateContract(c, company);
        title = `Contract — ${c.title}`;
        break;
      }
      case "change_order":
        if (!selectedJob) return;
        html = generateChangeOrder(selectedJob, changeData, company);
        title = `Change Order — ${selectedJob.title}`;
        break;
      case "job_financial":
        if (!selectedJob) return;
        html = generateJobFinancialSummary(selectedJob, company, company);
        title = `Financial Summary — ${selectedJob.title}`;
        break;
      case "sub_payment":
        html = generateSubPaymentSummary(subs, subPayments, company);
        title = "Subcontractor Payment Summary";
        break;
      case "bill_summary":
        html = generateBillSummary(bills, company);
        title = "Bill Calendar Summary";
        break;
    }

    if (html) setPreview({ html, title, docType });
  };

  return (
    <div>
      <PageHeader title="Document Generator" description="Create professional PDFs for clients, contracts, and internal records" />

      {!company.company_name && (
        <div className="mb-4">
          <GuidedPrompt message="Add your company info in Settings to populate document headers." variant="warning" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-8">
        {DOC_TYPES.map(dt => (
          <button
            key={dt.id}
            onClick={() => setDocType(dt.id)}
            className={`text-left p-4 rounded-xl border transition-all ${
              docType === dt.id
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border bg-card hover:border-primary/40 hover:bg-muted/50"
            }`}
          >
            <dt.icon className={`w-5 h-5 mb-2 ${docType === dt.id ? "text-primary" : "text-muted-foreground"}`} />
            <p className={`text-sm font-semibold mb-0.5 ${docType === dt.id ? "text-primary" : "text-foreground"}`}>{dt.label}</p>
            <p className="text-xs text-muted-foreground">{dt.desc}</p>
          </button>
        ))}
      </div>

      {docType && (
        <Card className="p-5 max-w-xl">
          <h3 className="text-sm font-semibold mb-4">
            Configure: {DOC_TYPES.find(d => d.id === docType)?.label}
          </h3>

          <div className="space-y-4">
            {needsJob && (
              <div>
                <Label>Job</Label>
                <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                  <SelectTrigger><SelectValue placeholder="Select a job" /></SelectTrigger>
                  <SelectContent>
                    {jobs.map(j => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {needsBid && (
              <div>
                <Label>Bid (optional — uses job data if not selected)</Label>
                <Select value={selectedBidId} onValueChange={setSelectedBidId}>
                  <SelectTrigger><SelectValue placeholder="Select a bid" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">None (use job data)</SelectItem>
                    {bids.map(b => <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {needsContract && (
              <div>
                <Label>Contract (optional — uses job data if not selected)</Label>
                <Select value={selectedContractId} onValueChange={setSelectedContractId}>
                  <SelectTrigger><SelectValue placeholder="Select a contract" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">None (use job data)</SelectItem>
                    {contracts.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {needsChangeOrder && selectedJob && (
              <div className="space-y-3 pt-1">
                <div>
                  <Label>Change Order Amount ($)</Label>
                  <Input type="number" value={changeData.amount} onChange={e => setChangeData(d => ({ ...d, amount: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={changeData.description} onChange={e => setChangeData(d => ({ ...d, description: e.target.value }))} rows={3} placeholder="Describe the scope change..." />
                </div>
                <div>
                  <Label>Schedule Impact</Label>
                  <Input value={changeData.scheduleImpact} onChange={e => setChangeData(d => ({ ...d, scheduleImpact: e.target.value }))} placeholder="e.g. Add 5 business days" />
                </div>
              </div>
            )}

            <Button onClick={generate} disabled={!canGenerate()} className="w-full gap-2">
              <Eye className="w-4 h-4" /> Preview Document
            </Button>
          </div>
        </Card>
      )}

      <DocPreviewModal
        open={!!preview}
        onClose={() => setPreview(null)}
        html={preview?.html}
        title={preview?.title}
        docType={preview?.docType}
        job={selectedJob}
      />
    </div>
  );
}