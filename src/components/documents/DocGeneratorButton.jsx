import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { FileText, ChevronDown, FileCheck, DollarSign, BarChart2, Loader2 } from "lucide-react";
import DocPreviewModal from "./DocPreviewModal";
import {
  generateBidEstimate,
  generateClientProposal,
  generateContract,
  generateJobFinancialSummary,
} from "@/lib/docTemplates";

/**
 * A dropdown button that lives inside a Job row / detail dialog.
 * Generates documents scoped to the provided job.
 */
export default function DocGeneratorButton({ job }) {
  const [preview, setPreview] = useState(null); // { html, title }

  const { data: settings = [] } = useQuery({ queryKey: ["settings"], queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }) });
  const { data: bids = [] } = useQuery({ queryKey: ["bids"], queryFn: () => base44.entities.Bid.list("-created_date", 200) });
  const { data: contracts = [] } = useQuery({ queryKey: ["contracts"], queryFn: () => base44.entities.Contract.list("-created_date", 200) });
  const { data: subPayments = [] } = useQuery({ queryKey: ["subPayments"], queryFn: () => base44.entities.SubcontractorPayment.list("-payment_date", 500) });

  const company = settings[0] || {};
  const jobBid = bids.find(b => b.job_id === job?.id || b.client_id === job?.client_id);
  const jobContract = contracts.find(c => c.job_id === job?.id);
  const jobSubPayments = subPayments.filter(sp => sp.job_id === job?.id);

  if (!job) return null;

  const generate = (type) => {
    let html = "";
    let title = "";
    switch (type) {
      case "estimate":
        html = generateBidEstimate(jobBid || { title: job.title, client_name: job.client_name, bid_amount: job.contract_amount }, company);
        title = `Bid Estimate — ${job.title}`;
        break;
      case "proposal":
        html = generateClientProposal(job, jobBid, company);
        title = `Client Proposal — ${job.title}`;
        break;
      case "contract":
        html = generateContract(jobContract || { title: job.title, client_name: job.client_name, contract_amount: job.contract_amount, scope_summary: job.scope }, company);
        title = `Contract — ${job.title}`;
        break;
      case "financial":
         html = generateJobFinancialSummary(job, company, company, jobSubPayments, false);
         title = `Financial Summary — ${job.title}`;
         break;
      default: break;
    }
    if (html) setPreview({ html, title, docType: type });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Generate Doc <ChevronDown className="w-3.5 h-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onClick={() => generate("estimate")}>
            <FileText className="w-3.5 h-3.5 mr-2" /> Bid Estimate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => generate("proposal")}>
            <FileCheck className="w-3.5 h-3.5 mr-2" /> Client Proposal
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => generate("contract")}>
            <FileCheck className="w-3.5 h-3.5 mr-2" /> Contract
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => generate("financial")}>
            <BarChart2 className="w-3.5 h-3.5 mr-2" /> Financial Summary
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DocPreviewModal
        open={!!preview}
        onClose={() => setPreview(null)}
        html={preview?.html}
        title={preview?.title}
        docType={preview?.docType}
        job={job}
      />
    </>
  );
}