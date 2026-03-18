import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Users } from "lucide-react";

export default function Step1Client({ data, onChange, existingClients }) {
  const [mode, setMode] = useState(data.client_id ? "existing" : "new");

  const handleExistingSelect = (clientId) => {
    const client = existingClients.find(c => c.id === clientId);
    if (!client) return;
    
    // Auto-populate from client data
    const fullName = client.name || "";
    const nameParts = fullName.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";
    
    onChange({
      client_id: client.id,
      client_name: firstName,
      client_last_name: lastName,
      client_phone: client.phone || "",
      client_email: client.email || "",
      client_address: client.address || "",
      client_billing_address: client.address || "",
    });
  };

  const set = (k, v) => onChange({ ...data, [k]: v });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => { setMode("new"); onChange({ ...data, client_id: "" }); }}
          className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${mode === "new" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
        >
          <UserPlus className="w-4 h-4" /> New Client
        </button>
        <button
          onClick={() => setMode("existing")}
          className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${mode === "existing" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
        >
          <Users className="w-4 h-4" /> Existing Client
        </button>
      </div>

      {mode === "existing" && (
        <div>
          <Label>Select Client</Label>
          <Select value={data.client_id || ""} onValueChange={handleExistingSelect}>
            <SelectTrigger><SelectValue placeholder="Choose a client..." /></SelectTrigger>
            <SelectContent>
              {existingClients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label>Client / Company Name *</Label>
        <Input value={data.client_name || ""} onChange={e => set("client_name", e.target.value)} placeholder="Full name or business name" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Phone Number</Label>
          <Input value={data.client_phone || ""} onChange={e => set("client_phone", e.target.value)} placeholder="(555) 555-5555" />
        </div>
        <div>
          <Label>Email Address</Label>
          <Input type="email" value={data.client_email || ""} onChange={e => set("client_email", e.target.value)} placeholder="client@email.com" />
        </div>
      </div>
      <div>
        <Label>Property / Job Site Address *</Label>
        <Input value={data.client_address || ""} onChange={e => set("client_address", e.target.value)} placeholder="123 Main St, City, State, ZIP" />
      </div>
      <div>
        <Label>Billing Address <span className="text-muted-foreground text-xs">(optional — if different)</span></Label>
        <Input value={data.client_billing_address || ""} onChange={e => set("client_billing_address", e.target.value)} placeholder="Billing address if different" />
      </div>
    </div>
  );
}