import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

const STAGES = [
  { key: "lead", label: "Lead Received", color: "bg-gray-100 text-gray-700" },
  { key: "bid_preparing", label: "Bid Preparing", color: "bg-blue-100 text-blue-700" },
  { key: "bid_sent", label: "Bid Sent", color: "bg-blue-100 text-blue-700" },
  { key: "contract_signed", label: "Contract Signed", color: "bg-purple-100 text-purple-700" },
  { key: "scheduled", label: "Scheduled", color: "bg-yellow-100 text-yellow-700" },
  { key: "materials_ordered", label: "Materials", color: "bg-orange-100 text-orange-700" },
  { key: "in_progress", label: "In Progress", color: "bg-green-100 text-green-700" },
  { key: "completed", label: "Completed", color: "bg-gray-100 text-gray-700" },
];

export default function JobPipelineVisualization({ jobStages, jobs = [], contracts = [], bids = [] }) {
   // Count jobs in each stage - use job status directly
   const stageCounts = {};
   STAGES.forEach(s => stageCounts[s.key] = 0);

   // Build a map of job_id to contract for signed status lookup
   const contractMap = {};
   contracts.forEach(c => {
     if (c.job_id) contractMap[c.job_id] = c;
   });

   // Map job statuses to pipeline stages
   const statusMapping = {
     'bidding': 'bid_sent',
     'contracted': 'contract_signed',
     'in_progress': 'in_progress',
     'completed': 'completed',
   };

   // Count bids sent (all bids except rejected/expired)
   bids.forEach(b => {
     if (b.status !== 'rejected' && b.status !== 'expired') {
       stageCounts['bid_sent']++;
     }
   });

   // Count signed contracts without jobs
   contracts.forEach(c => {
     if (!c.job_id && (c.status === 'signed' || c.status === 'active') && c.signed_and_accepted) {
       stageCounts['contract_signed']++;
     }
   });

   jobs.forEach(j => {
     let stage = statusMapping[j.status];

     // For contracted jobs, only count as "contract_signed" if contract is actually signed
     if (j.status === 'contracted') {
       const contract = contractMap[j.id];
       stage = (contract?.signed_and_accepted) ? 'contract_signed' : 'bid_sent';
     }

     if (stage && stageCounts.hasOwnProperty(stage)) {
       stageCounts[stage]++;
     }
   });

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Job Pipeline</h3>
      <div className="flex items-center justify-between overflow-x-auto pb-2 gap-2">
        {STAGES.map((stage, i) => (
          <React.Fragment key={stage.key}>
            <div className="flex flex-col items-center min-w-fit">
              <Badge className={`${stage.color} text-xs mb-2`}>{stage.label}</Badge>
              <div className={`w-10 h-10 rounded-full ${stage.color} flex items-center justify-center font-bold text-sm`}>
                {stageCounts[stage.key]}
              </div>
            </div>
            {i < STAGES.length - 1 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </React.Fragment>
        ))}
      </div>
    </Card>
  );
}