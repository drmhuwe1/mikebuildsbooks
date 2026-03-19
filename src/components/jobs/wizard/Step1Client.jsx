import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Users } from "lucide-react";

export default function Step1Client({ data, onChange, existingClients }) {
  const [searchInput, setSearchInput] = useState(data.client_name || "");
  const [showDropdown, setShowDropdown] = useState(false);

  // Filter clients based on search input
  const filteredClients = useMemo(() => {
    if (!searchInput.trim()) return existingClients;
    return existingClients.filter(c => 
      c.name.toLowerCase().includes(searchInput.toLowerCase())
    );
  }, [searchInput, existingClients]);

  const handleClientSelect = (client) => {
    const fullName = client.name || "";
    const nameParts = fullName.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    onChange({
      ...data,
      client_id: client.id,
      client_name: firstName,
      client_last_name: lastName,
      client_phone: client.phone || "",
      client_email: client.email || "",
      client_address: client.address || "",
      client_billing_address: client.address || "",
    });
    setSearchInput(fullName);
    setShowDropdown(false);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    setShowDropdown(true);
    // Clear client_id when user types manually
    if (value.trim()) {
      onChange({ ...data, client_name: value, client_id: "" });
    }
  };

  const set = (k, v) => onChange({ ...data, [k]: v });

  return (
    <div className="space-y-5">
      <div>
        <Label>Client / Company Name *</Label>
        <div className="relative">
          <Input 
            value={searchInput} 
            onChange={handleInputChange}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            placeholder="Type to search existing clients or enter new name" 
          />
          {showDropdown && filteredClients.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-border rounded-md shadow-lg mt-1 z-10 max-h-40 overflow-y-auto">
              {filteredClients.map(client => (
                <button
                  key={client.id}
                  onMouseDown={() => handleClientSelect(client)}
                  className="w-full text-left px-3 py-2 hover:bg-muted text-sm transition-colors border-b last:border-b-0"
                >
                  <div className="font-medium">{client.name}</div>
                  {client.phone && <div className="text-xs text-muted-foreground">{client.phone}</div>}
                </button>
              ))}
            </div>
          )}
        </div>
        {data.client_id && (
          <p className="text-xs text-green-600 bg-green-50 border border-green-200 rounded px-3 py-1.5 mt-2">
            ✓ Selected from existing clients — info auto-filled below
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>First Name</Label>
          <Input value={data.client_name || ""} onChange={e => set("client_name", e.target.value)} placeholder="First name" readOnly={data.client_id ? true : false} />
        </div>
        <div>
          <Label>Last Name</Label>
          <Input value={data.client_last_name || ""} onChange={e => set("client_last_name", e.target.value)} placeholder="Last name" readOnly={data.client_id ? true : false} />
        </div>
      </div>

      <div>
        <Label>Client / Company Name *</Label>
        <Input value={data.client_name || ""} onChange={e => set("client_name", e.target.value)} placeholder="Full name or business name" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Phone Number</Label>
            <Input value={data.client_phone || ""} onChange={e => set("client_phone", e.target.value)} placeholder="(555) 555-5555" readOnly={data.client_id ? true : false} />
          </div>
          <div>
            <Label>Email Address</Label>
            <Input type="email" value={data.client_email || ""} onChange={e => set("client_email", e.target.value)} placeholder="client@email.com" readOnly={data.client_id ? true : false} />
          </div>
        </div>
      </div>
      <div>
        <Label>Property / Job Site Address *</Label>
        <Input value={data.client_address || ""} onChange={e => set("client_address", e.target.value)} placeholder="123 Main St, City, State, ZIP" readOnly={data.client_id ? true : false} />
      </div>
      <div>
        <Label>Billing Address <span className="text-muted-foreground text-xs">(optional — if different)</span></Label>
        <Input value={data.client_billing_address || ""} onChange={e => set("client_billing_address", e.target.value)} placeholder="Billing address if different" />
      </div>
    </div>
  );
}