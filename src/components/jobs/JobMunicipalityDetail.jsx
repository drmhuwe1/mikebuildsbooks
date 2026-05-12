import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import MunicipalityContactPanel from "@/components/municipality/MunicipalityContactPanel";
import InspectionTracker from "@/components/municipality/InspectionTracker";
import GuidedPrompt from "@/components/shared/GuidedPrompt";
import { AlertCircle, Search, Loader2 } from "lucide-react";

export default function JobMunicipalityDetail({ jobId, job }) {
  const qc = useQueryClient();
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState(null);

  const { data: municipality, isLoading } = useQuery({
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

  const hasJobAddress = job?.zip_code || job?.city || job?.address;

  const handleAutoLookup = async () => {
    setIsLookingUp(true);
    setLookupError(null);
    try {
      const response = await base44.functions.invoke('identifyMunicipality', {
        address: job?.address || "",
        city: job?.city || "",
        state: job?.state || "PA",
        zipCode: job?.zip_code || "",
      });

      // Save to Municipality entity linked to this job
      await base44.entities.Municipality.create({
        job_id: jobId,
        municipality: response.data?.municipality || response.municipality || "",
        county: response.data?.county || response.county || "",
        state: response.data?.state || response.state || job?.state || "",
        zip_code: job?.zip_code || "",
        building_dept_name: response.data?.building_dept_name || response.building_dept_name || "",
        building_dept_phone: response.data?.building_dept_phone || response.building_dept_phone || "",
        building_dept_email: response.data?.building_dept_email || response.building_dept_email || "",
        zoning_dept_name: response.data?.zoning_dept_name || response.zoning_dept_name || "",
        zoning_dept_phone: response.data?.zoning_dept_phone || response.zoning_dept_phone || "",
        permit_office_address: response.data?.permit_office_address || response.permit_office_address || "",
        permit_office_hours: response.data?.permit_office_hours || response.permit_office_hours || "",
        permit_website: response.data?.permit_website || response.permit_website || "",
        online_permit_portal: response.data?.online_permit_portal || response.online_permit_portal || "",
        office_notes: response.data?.office_notes || response.office_notes || "",
      });

      qc.invalidateQueries({ queryKey: ["municipality", jobId] });
    } catch (err) {
      setLookupError("Could not identify municipality. Try editing manually.");
      console.error(err);
    } finally {
      setIsLookingUp(false);
    }
  };

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

          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
            </div>
          ) : !municipality ? (
            <Card className="p-5 border-yellow-200 bg-yellow-50 space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm text-yellow-900">Municipality Information Not Set</p>
                  <p className="text-xs text-yellow-800 mt-1">
                    {hasJobAddress
                      ? "Click below to automatically identify the local permit office from this job's address."
                      : "Enter a project address on the job to enable auto-identification, or edit manually."}
                  </p>
                </div>
              </div>
              {hasJobAddress && (
                <Button
                  onClick={handleAutoLookup}
                  disabled={isLookingUp}
                  className="w-full"
                >
                  {isLookingUp ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Looking up permit office…</>
                  ) : (
                    <><Search className="w-4 h-4 mr-2" /> Auto-Identify Permit Office</>
                  )}
                </Button>
              )}
              {lookupError && <p className="text-xs text-red-600">{lookupError}</p>}
            </Card>
          ) : (
            <MunicipalityContactPanel
              municipality={municipality}
              onUpdate={() => qc.invalidateQueries({ queryKey: ["municipality", jobId] })}
            />
          )}
        </TabsContent>

        <TabsContent value="inspections" className="mt-4">
          <InspectionTracker jobId={jobId} municipalityId={municipality?.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}