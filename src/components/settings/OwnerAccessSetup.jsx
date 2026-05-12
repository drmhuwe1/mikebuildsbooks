import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Lock, Eye, EyeOff } from "lucide-react";

export default function OwnerAccessSetup() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [requirePin, setRequirePin] = useState(true);
  const [portalType, setPortalType] = useState("field_operations");
  const [editMode, setEditMode] = useState(false);

  const { data: ownerAccess = null } = useQuery({
    queryKey: ["ownerAccess"],
    queryFn: async () => {
      const records = await base44.entities.OwnerAccess.list();
      return records[0] || null;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!email || !email.includes("@")) {
        throw new Error("Invalid email address");
      }
      if (requirePin && (!pin || pin.length < 4)) {
        throw new Error("PIN must be at least 4 digits");
      }

      if (ownerAccess?.id) {
        return await base44.entities.OwnerAccess.update(ownerAccess.id, {
          owner_email: email,
          pin_code: pin,
          require_pin: requirePin,
          portal_type: portalType,
          is_enabled: true
        });
      } else {
        return await base44.entities.OwnerAccess.create({
          owner_email: email,
          pin_code: pin,
          require_pin: requirePin,
          portal_type: portalType,
          is_enabled: true
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ownerAccess"] });
      setEditMode(false);
      alert("Owner access credentials saved successfully");
    },
    onError: (err) => {
      alert("Error: " + err.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  if (!editMode && ownerAccess) {
    return (
      <Card className="p-6 border-green-200 bg-green-50">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-900">Field Payments Access Configured</h3>
              <p className="text-sm text-green-700 mt-0.5">Owner can access Field Payments with special credentials</p>
            </div>
          </div>
          <Button onClick={() => setEditMode(true)} variant="outline" size="sm">
            Edit
          </Button>
        </div>

        <div className="bg-white rounded-lg p-4 space-y-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Email</p>
            <p className="font-mono font-semibold">{ownerAccess.owner_email}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Portal Type</p>
            <p className="font-mono font-semibold text-sm capitalize">{ownerAccess.portal_type || "field_payments"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">PIN Protection</p>
            <Badge variant={ownerAccess.require_pin ? "default" : "secondary"} className="text-xs mt-1">
              {ownerAccess.require_pin ? "Required" : "Disabled"}
            </Badge>
          </div>
          {ownerAccess.last_access_date && (
            <div>
              <p className="text-muted-foreground text-xs">Last Access</p>
              <p className="text-sm">{new Date(ownerAccess.last_access_date).toLocaleString()}</p>
            </div>
          )}
          {ownerAccess.access_count > 0 && (
            <div>
              <p className="text-muted-foreground text-xs">Total Accesses</p>
              <p className="text-sm font-semibold">{ownerAccess.access_count}</p>
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-blue-200 bg-blue-50">
      <div className="flex items-center gap-2 mb-4">
        <Lock className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-blue-900">Field Payments Owner Access</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-blue-700 mb-4">
          Set up special credentials for the owner to access Field Payments for on-site payment collection.
        </p>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Owner Email Address</label>
          <Input
            type="email"
            placeholder="owner@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">This email will log in to Field Payments</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Portal Type</label>
          <select
            value={portalType}
            onChange={(e) => setPortalType(e.target.value)}
            className="w-full h-10 border border-input rounded-md px-3 text-sm mb-4"
          >
            <option value="field_payments">Field Payments Only</option>
            <option value="field_operations">Full Field Operations Portal</option>
          </select>
          <p className="text-xs text-muted-foreground mb-4">
            Field Operations includes payments, contracts, receipts, pay sheets, and hours entry.
          </p>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
            <input
              type="checkbox"
              checked={requirePin}
              onChange={(e) => setRequirePin(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            Require PIN Code
          </label>
          {requirePin && (
            <div className="relative">
              <Input
                type={showPin ? "text" : "password"}
                placeholder="Enter 4-digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="h-10 pr-10"
                maxLength="4"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                aria-label={showPin ? "Hide PIN" : "Show PIN"}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <p className="text-xs text-muted-foreground mt-1">4-digit code for extra security</p>
            </div>
          )}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-700">
            These credentials grant exclusive access to Field Payments only. The user cannot access other app features.
          </p>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            type="submit"
            disabled={saveMutation.isPending || !email}
            className="flex-1"
          >
            {saveMutation.isPending ? "Saving..." : "Save Credentials"}
          </Button>
          {ownerAccess && (
            <Button
              type="button"
              onClick={() => setEditMode(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}