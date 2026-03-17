import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Eye, Mail, Printer, Download } from "lucide-react";
import DocPreviewModal from "@/components/documents/DocPreviewModal";
import { generateBidEstimate, generateContract } from "@/lib/docTemplates";

export default function Step9Documents({ wizardData, settings, job }) {
  const [preview, setPreview] = useState(null);
  const [emailTarget, setEmailTarget] = useState(wizardData.client_email || "");

  const company = settings || {};

  const bidObj = {
    title: wizardData.title,
    client_name: wizardData.client_name,
    bid_amount: wizardData._bidAmount || 0,
    scope_summary: wizardData.scope,
    material_cost: wizardData._materialSubtotal || 0,
    labor_hours: (parseFloat(wizardData.crew_size) || 0) * (parseFloat(wizardData.hours_per_day) || 0) * (parseFloat(wizardData.labor_days) || 0),
    labor_rate: parseFloat(wizardData.labor_rate) || 0,
    subcontractor_cost: wizardData._subTotal || 0,
    permit_cost: parseFloat(wizardData.permit_costs) || 0,
    overhead_percent: parseFloat(wizardData.overhead_percent) || 0,
    target_profit_margin: parseFloat(wizardData.target_profit_margin) || 0,
    gross_profit: wizardData._grossProfit || 0,
  };

  const contractObj = {
    title: wizardData.title,
    client_name: wizardData.client_name,
    contract_amount: wizardData._bidAmount || 0,
    deposit_amount: parseFloat(wizardData.deposit_amount) || 0,
    scope_summary: wizardData.scope,
    payment_schedule: wizardData.payment_schedule_notes,
    start_date: wizardData.start_date,
    estimated_completion: wizardData.projected_completion,
  };

  const actions = [
    {
      label: "Preview Estimate",
      icon: Eye,
      color: "text-blue-600",
      action: () => setPreview({ html: generateBidEstimate(bidObj, company), title: "Bid Estimate", docType: "bid_estimate" }),
    },
    {
      label: "Preview Contract",
      icon: FileText,
      color: "text-green-600",
      action: () => setPreview({ html: generateContract(contractObj, company), title: "Contract", docType: "contract" }),
    },
  ];

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Your job documents are ready to preview, email, or download. You can also do this later from the Jobs page.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {actions.map(a => (
          <button
            key={a.label}
            onClick={a.action}
            className="flex items-center gap-3 p-4 border rounded-xl hover:bg-muted/50 transition-colors text-left"
          >
            <a.icon className={`w-5 h-5 ${a.color}`} />
            <span className="text-sm font-medium">{a.label}</span>
          </button>
        ))}
      </div>

      <div className="p-4 bg-muted/30 rounded-xl space-y-3 border">
        <p className="text-sm font-semibold">Quick Email</p>
        <div>
          <Label>Send estimate to client email</Label>
          <div className="flex gap-2 mt-1">
            <Input
              type="email"
              value={emailTarget}
              onChange={e => setEmailTarget(e.target.value)}
              placeholder="client@email.com"
              className="flex-1"
            />
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setPreview({ html: generateBidEstimate(bidObj, company), title: "Bid Estimate", docType: "bid_estimate", prefillEmail: emailTarget })}
            >
              <Mail className="w-3.5 h-3.5" /> Send
            </Button>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg">
        💡 You can always generate documents from the Jobs page or Document Generator after the job is created.
      </p>

      {preview && (
        <DocPreviewModal
          open={!!preview}
          onClose={() => setPreview(null)}
          html={preview.html}
          title={preview.title}
          docType={preview.docType}
          job={job}
          prefillEmail={preview.prefillEmail}
        />
      )}
    </div>
  );
}