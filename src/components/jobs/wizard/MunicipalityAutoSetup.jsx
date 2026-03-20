import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { CheckCircle, Loader, AlertTriangle } from "lucide-react";

export default function MunicipalityAutoSetup({ jobId, address, city, state, zipCode }) {
  const [status, setStatus] = useState("idle"); // idle, loading, success, error
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!jobId || !zipCode || !state || status !== "idle") return;

    const setupMunicipality = async () => {
      setStatus("loading");
      try {
        const response = await base44.functions.invoke('createMunicipalityRecord', {
          jobId,
          address: address || "",
          city: city || "",
          state,
          zipCode,
        });

        if (response.data) {
          setStatus("success");
        } else {
          setStatus("error");
          setError("Failed to create municipality record");
        }
      } catch (err) {
        console.error("Municipality setup error:", err);
        setStatus("error");
        setError(err.message || "Failed to identify municipality");
      }
    };

    setupMunicipality();
  }, [jobId, address, city, state, zipCode, status]);

  if (status === "idle" || status === "loading") {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader className="w-3 h-3 animate-spin" />
        Identifying municipality...
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex items-center gap-2 text-xs text-green-600">
        <CheckCircle className="w-3 h-3" />
        Municipality details auto-populated
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex items-center gap-2 text-xs text-amber-600">
        <AlertTriangle className="w-3 h-3" />
        {error || "Could not auto-identify municipality"}
      </div>
    );
  }
}