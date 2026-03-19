import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GuidedPrompt from "@/components/shared/GuidedPrompt";

export default function PermitStep1Project({ data, onChange }) {
  const [loadingMuni, setLoadingMuni] = useState(false);
  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => base44.entities.Client.list("-created_date", 500) });

  // Handle client selection - auto-populate customer name and address
  const handleClientSelect = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      onChange("customerName", client.name);
      const address = [client.address, client.city].filter(Boolean).join(", ");
      onChange("projectAddress", address);
      onChange("projectZipCode", client.zip_code || "");
      onChange("projectState", client.state || "PA");
    }
  };

  // Auto-lookup municipality when address changes
  const handleAddressChange = async (e) => {
    onChange("projectAddress", e.target.value);
    // Trigger municipality lookup if we have enough info
    if (data.projectZipCode && data.projectState) {
      await lookupMunicipality();
    }
  };

  const lookupMunicipality = async () => {
    if (!data.projectAddress || !data.projectZipCode || !data.projectState) return;
    
    setLoadingMuni(true);
    try {
      const response = await base44.functions.invoke("identifyMunicipality", {
        address: data.projectAddress,
        city: "",
        state: data.projectState,
        zipCode: data.projectZipCode,
      });
      if (response.data?.municipality) {
        onChange("municipality", response.data.municipality);
      }
    } catch (error) {
      console.error("Error looking up municipality:", error);
    } finally {
      setLoadingMuni(false);
    }
  };

  return (
    <div className="space-y-4">
      <GuidedPrompt message="Start by selecting a client or entering project details manually." variant="info" />
      
      <div>
        <Label>Select Client (Optional)</Label>
        <Select onValueChange={handleClientSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a client to auto-populate address..." />
          </SelectTrigger>
          <SelectContent>
            {clients.length === 0 && <SelectItem disabled value="">No clients available</SelectItem>}
            {clients.map(client => (
              <SelectItem key={client.id} value={client.id}>
                {client.name} {client.address ? `- ${client.address}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Project Type *</Label>
        <Select value={data.projectType} onValueChange={(v) => onChange("projectType", v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="deck">Deck</SelectItem>
            <SelectItem value="covered-deck">Covered Deck</SelectItem>
            <SelectItem value="porch-roof">Porch Roof</SelectItem>
            <SelectItem value="roof-existing">Roof Over Existing Deck</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Customer Name</Label>
        <Input value={data.customerName} onChange={(e) => onChange("customerName", e.target.value)} placeholder="John Smith" />
      </div>

      <div>
        <Label>Project Address *</Label>
        <Input value={data.projectAddress} onChange={handleAddressChange} placeholder="123 Main Street" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>ZIP Code</Label>
          <Input value={data.projectZipCode || ""} onChange={(e) => onChange("projectZipCode", e.target.value)} placeholder="19000" />
        </div>
        <div>
          <Label>State</Label>
          <Input value={data.projectState || "PA"} onChange={(e) => onChange("projectState", e.target.value)} placeholder="PA" maxLength="2" />
        </div>
      </div>

      <div>
        <Label>Township / Municipality {loadingMuni && "(Looking up...)"}</Label>
        <Input value={data.municipality} onChange={(e) => onChange("municipality", e.target.value)} placeholder="e.g., Springfield Township" disabled={loadingMuni} />
      </div>
    </div>
  );
}