import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Phone, Mail, Globe, ExternalLink, Copy, Edit2, Save, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function MunicipalityContactPanel({ municipality, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(municipality || {});
  const [isLookingUp, setIsLookingUp] = useState(false);
  const qc = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      if (municipality?.id) {
        return base44.entities.Municipality.update(municipality.id, data);
      } else {
        return base44.entities.Municipality.create(data);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["municipalities"] });
      setIsEditing(false);
      onUpdate?.();
    },
  });

  const handleSave = () => {
    updateMutation.mutate(editData);
  };

  const handleZipCodeChange = async (zipCode) => {
    setEditData(d => ({ ...d, zip_code: zipCode }));
    
    // Auto-lookup municipality when zip is entered
    if (zipCode && zipCode.length === 5) {
      setIsLookingUp(true);
      try {
        const response = await base44.functions.invoke('identifyMunicipality', {
          zipCode,
          state: editData.state || 'PA'
        });
        setEditData(d => ({
          ...d,
          municipality: response.municipality,
          county: response.county,
          state: response.state
        }));
      } catch (error) {
        console.error('Lookup error:', error);
      } finally {
        setIsLookingUp(false);
      }
    }
  };

  const handleCall = () => {
    if (editData.building_dept_phone) {
      window.location.href = `tel:${editData.building_dept_phone}`;
    }
  };

  const handleEmail = () => {
    if (editData.building_dept_email) {
      window.location.href = `mailto:${editData.building_dept_email}`;
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (!municipality && !isEditing) {
    return (
      <Card className="p-4 border-yellow-200 bg-yellow-50">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-sm text-yellow-900">Municipality Information Not Set</p>
            <p className="text-xs text-yellow-800 mt-1">Enter a project address to automatically identify and configure permit office information.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 border-blue-200 bg-blue-50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-sm">{editData.municipality || "Municipality"}</h3>
              {editData.data_verified && (
                <Badge className="text-xs bg-green-100 text-green-700">Verified</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{editData.county} County, {editData.state} {editData.zip_code}</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setIsEditing(!isEditing)}>
            <Edit2 className="w-3.5 h-3.5 mr-1" />
            {isEditing ? "Done" : "Edit"}
          </Button>
        </div>
      </Card>

      {isEditing ? (
        <Card className="p-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Municipality</Label>
                <Input value={editData.municipality || ""} onChange={(e) => setEditData(d => ({ ...d, municipality: e.target.value }))} className="text-sm" />
              </div>
              <div>
                <Label className="text-xs">County</Label>
                <Input value={editData.county || ""} onChange={(e) => setEditData(d => ({ ...d, county: e.target.value }))} className="text-sm" />
              </div>
              <div>
                <Label className="text-xs">State</Label>
                <Input value={editData.state || ""} onChange={(e) => setEditData(d => ({ ...d, state: e.target.value }))} className="text-sm" />
              </div>
              <div>
                <Label className="text-xs">ZIP Code {isLookingUp && <span className="text-xs text-muted-foreground">(Identifying...)</span>}</Label>
                <Input 
                  value={editData.zip_code || ""} 
                  onChange={(e) => handleZipCodeChange(e.target.value)} 
                  className="text-sm" 
                  disabled={isLookingUp}
                />
              </div>
            </div>

            <hr />

            <div>
              <Label className="text-xs font-bold mb-2 block">Building Department</Label>
              <div className="space-y-2">
                <Input placeholder="Department Name" value={editData.building_dept_name || ""} onChange={(e) => setEditData(d => ({ ...d, building_dept_name: e.target.value }))} className="text-sm" />
                <Input placeholder="Phone" value={editData.building_dept_phone || ""} onChange={(e) => setEditData(d => ({ ...d, building_dept_phone: e.target.value }))} className="text-sm" />
                <Input placeholder="Email" value={editData.building_dept_email || ""} onChange={(e) => setEditData(d => ({ ...d, building_dept_email: e.target.value }))} className="text-sm" />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold mb-2 block">Zoning Department</Label>
              <div className="space-y-2">
                <Input placeholder="Department Name" value={editData.zoning_dept_name || ""} onChange={(e) => setEditData(d => ({ ...d, zoning_dept_name: e.target.value }))} className="text-sm" />
                <Input placeholder="Phone" value={editData.zoning_dept_phone || ""} onChange={(e) => setEditData(d => ({ ...d, zoning_dept_phone: e.target.value }))} className="text-sm" />
                <Input placeholder="Email" value={editData.zoning_dept_email || ""} onChange={(e) => setEditData(d => ({ ...d, zoning_dept_email: e.target.value }))} className="text-sm" />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold mb-2 block">Permit Office</Label>
              <div className="space-y-2">
                <Input placeholder="Office Address" value={editData.permit_office_address || ""} onChange={(e) => setEditData(d => ({ ...d, permit_office_address: e.target.value }))} className="text-sm" />
                <Input placeholder="Office Hours (e.g., Mon-Fri 8AM-4PM)" value={editData.permit_office_hours || ""} onChange={(e) => setEditData(d => ({ ...d, permit_office_hours: e.target.value }))} className="text-sm" />
                <Input placeholder="Permit Website URL" value={editData.permit_website || ""} onChange={(e) => setEditData(d => ({ ...d, permit_website: e.target.value }))} className="text-sm" />
                <Input placeholder="Online Permit Portal URL" value={editData.online_permit_portal || ""} onChange={(e) => setEditData(d => ({ ...d, online_permit_portal: e.target.value }))} className="text-sm" />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold mb-2 block">Inspector Information</Label>
              <div className="space-y-2">
                <Input placeholder="Inspector Name" value={editData.inspector_name || ""} onChange={(e) => setEditData(d => ({ ...d, inspector_name: e.target.value }))} className="text-sm" />
                <Input placeholder="Inspector Phone" value={editData.inspector_phone || ""} onChange={(e) => setEditData(d => ({ ...d, inspector_phone: e.target.value }))} className="text-sm" />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold mb-2 block">Office Notes</Label>
              <Textarea placeholder="Special requirements, submission preferences, or scheduling instructions..." value={editData.office_notes || ""} onChange={(e) => setEditData(d => ({ ...d, office_notes: e.target.value }))} rows={3} className="text-sm" />
              <Textarea placeholder="Inspection scheduling instructions..." value={editData.inspection_scheduling_instructions || ""} onChange={(e) => setEditData(d => ({ ...d, inspection_scheduling_instructions: e.target.value }))} rows={2} className="text-sm mt-2" />
            </div>

            <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4 mr-1" /> {updateMutation.isPending ? "Saving..." : "Save Municipality Info"}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            {editData.building_dept_phone && (
              <Button size="sm" onClick={handleCall} className="bg-green-600 hover:bg-green-700">
                <Phone className="w-3.5 h-3.5 mr-1" /> Call
              </Button>
            )}
            {editData.building_dept_email && (
              <Button size="sm" onClick={handleEmail} className="bg-blue-600 hover:bg-blue-700">
                <Mail className="w-3.5 h-3.5 mr-1" /> Email
              </Button>
            )}
            {editData.permit_website && (
              <Button size="sm" variant="outline" onClick={() => window.open(editData.permit_website, '_blank')}>
                <Globe className="w-3.5 h-3.5 mr-1" /> Website
              </Button>
            )}
            {editData.online_permit_portal && (
              <Button size="sm" variant="outline" onClick={() => window.open(editData.online_permit_portal, '_blank')}>
                <ExternalLink className="w-3.5 h-3.5 mr-1" /> Portal
              </Button>
            )}
          </div>

          {/* Contact Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {editData.building_dept_name && (
              <Card className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <p className="text-xs font-bold text-blue-900 mb-2">{editData.building_dept_name}</p>
                {editData.building_dept_phone && (
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs text-blue-800">{editData.building_dept_phone}</span>
                    <button onClick={() => handleCopy(editData.building_dept_phone)} className="p-1 hover:bg-white rounded">
                      <Copy className="w-3 h-3 text-blue-600" />
                    </button>
                  </div>
                )}
                {editData.building_dept_email && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-blue-800 truncate">{editData.building_dept_email}</span>
                    <button onClick={() => handleCopy(editData.building_dept_email)} className="p-1 hover:bg-white rounded shrink-0">
                      <Copy className="w-3 h-3 text-blue-600" />
                    </button>
                  </div>
                )}
              </Card>
            )}

            {editData.zoning_dept_name && (
              <Card className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <p className="text-xs font-bold text-purple-900 mb-2">{editData.zoning_dept_name}</p>
                {editData.zoning_dept_phone && (
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs text-purple-800">{editData.zoning_dept_phone}</span>
                    <button onClick={() => handleCopy(editData.zoning_dept_phone)} className="p-1 hover:bg-white rounded">
                      <Copy className="w-3 h-3 text-purple-600" />
                    </button>
                  </div>
                )}
                {editData.zoning_dept_email && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-purple-800 truncate">{editData.zoning_dept_email}</span>
                    <button onClick={() => handleCopy(editData.zoning_dept_email)} className="p-1 hover:bg-white rounded shrink-0">
                      <Copy className="w-3 h-3 text-purple-600" />
                    </button>
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Permit Office Info */}
          {(editData.permit_office_address || editData.permit_office_hours) && (
            <Card className="p-3 text-xs">
              <p className="font-semibold mb-2">Permit Office</p>
              {editData.permit_office_address && <p className="text-muted-foreground mb-1">{editData.permit_office_address}</p>}
              {editData.permit_office_hours && <p className="text-muted-foreground">Hours: {editData.permit_office_hours}</p>}
            </Card>
          )}

          {/* Inspector Info */}
          {editData.inspector_name && (
            <Card className="p-3 bg-amber-50 border-amber-200 text-xs">
              <p className="font-semibold text-amber-900 mb-1">Inspector</p>
              <p className="text-amber-800">{editData.inspector_name}</p>
              {editData.inspector_phone && <p className="text-amber-800">{editData.inspector_phone}</p>}
            </Card>
          )}

          {/* Office Notes */}
          {editData.office_notes && (
            <Card className="p-3 bg-gray-50 text-xs">
              <p className="font-semibold mb-1">Office Notes</p>
              <p className="text-muted-foreground whitespace-pre-line">{editData.office_notes}</p>
            </Card>
          )}

          {/* Disclaimer */}
          <Card className="p-2 bg-yellow-50 border-yellow-200">
            <p className="text-xs text-yellow-800">
              ⚠️ <strong>Disclaimer:</strong> Municipality information is provided as guidance and should always be confirmed directly with the local permit office.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}