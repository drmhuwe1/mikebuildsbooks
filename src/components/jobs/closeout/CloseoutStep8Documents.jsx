import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { FileText, BarChart2, HardHat } from "lucide-react";
import DocPreviewModal from "@/components/documents/DocPreviewModal";
import {
  generateJobFinancialSummary,
  generateSubPaymentSummary,
} from "@/lib/docTemplates";

export default function CloseoutStep8Documents({ job, subs, jobSubPayments }) {
  const [preview, setPreview] = useState(null);

  const { data: settings = [] } = useQuery({
    queryKey: ["settings"],
    queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }),
  });
  const company = settings[0] || {};

  const docs = [
    {
      id: "financial",
      label: "Final Job Profit Report",
      icon: BarChart2,
      desc: "Revenue, costs, and profit breakdown for this job",
      generate: () => ({
        html: generateJobFinancialSummary(job, company, company),
        title: `Final Profit Report — ${job.title}`,
        docType: "job_financial",
      }),
    },
    {
      id: "sub_payment",
      label: "Subcontractor Payment Summary",
      icon: HardHat,
      desc: "All subcontractor payments and 1099 tracking",
      generate: () => ({
        html: generateSubPaymentSummary(subs, jobSubPayments, company),
        title: `Subcontractor Summary — ${job.title}`,
        docType: "sub_payment",
      }),
    },
    {
      id: "completion",
      label: "Project Completion Summary",
      icon: FileText,
      desc: "Full project overview including scope, timeline, and final status",
      generate: () => ({
        html: generateJobFinancialSummary(job, company, company),
        title: `Project Completion — ${job.title}`,
        docType: "job_financial",
      }),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold">Step 8 — Final Documents</h2>
        <p className="text-sm text-muted-foreground mt-1">Generate and deliver closing documents. You can download, email, or fax each report.</p>
      </div>

      <div className="space-y-3">
        {docs.map(doc => (
          <div key={doc.id} className="rounded-lg border p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <doc.icon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{doc.label}</p>
              <p className="text-xs text-muted-foreground">{doc.desc}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPreview(doc.generate())}
            >
              Preview
            </Button>
          </div>
        ))}
      </div>

      <DocPreviewModal
        open={!!preview}
        onClose={() => setPreview(null)}
        html={preview?.html}
        title={preview?.title}
        docType={preview?.docType}
        job={job}
      />
    </div>
  );
}