import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import MunicipalityContactPanel from "@/components/municipality/MunicipalityContactPanel";
import InspectionTracker from "@/components/municipality/InspectionTracker";
import GuidedPrompt from "@/components/shared/GuidedPrompt";
import { AlertCircle } from "lucide-react";

export default function JobMunicipalityDetail({ jobId }) {
  const { data: municipality } = useQuery({
    queryKey: ["municipality", jobId],
    queryFn: async () => {
      try {
        const results = await base44.entities.Municipality.filter({ job_id: jobId });
        return results[0] || null;
      } catch {
        return null;
      }
    },
  });

  return (
    <div className="space-y-4">
      <Tabs defaultValue="municipality" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="municipality">Permit Office</TabsTrigger>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
        </TabsList>

        <TabsContent value="municipality" className="mt-4 space-y-4">
          <GuidedPrompt
            message="Keep municipality information updated for accurate permit requirements, fees, and inspection scheduling."
            variant="info"
          />
          <MunicipalityContactPanel municipality={municipality} />
        </TabsContent>

        <TabsContent value="inspections" className="mt-4">
          <InspectionTracker jobId={jobId} municipalityId={municipality?.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}