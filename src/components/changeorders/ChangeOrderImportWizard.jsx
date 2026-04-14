import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, Upload, Loader2, AlertCircle, CheckCircle, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/formatters";
import { useToast } from "@/components/ui/use-toast";

const STEPS = ["Upload", "Review", "Complete"];

export default function ChangeOrderImportWizard({ open, onClose, jobId, onCOCreated }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [cos, setCos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const saveChangeOrdersMutation = useMutation({
    mutationFn: async (cosToSave) => {
      const savedCOs = [];
      for (const co of cosToSave) {
        const existingCOs = await base44.entities.ChangeOrder.filter({ job_id: jobId });
        const num = String(existingCOs.length + 1).padStart(3, "0");

        const createdCO = await base44.entities.ChangeOrder.create({
          ...co.coData,
          job_id: jobId,
          change_order_number: `CO-${num}`,
        });
        savedCOs.push(createdCO);
      }
      return savedCOs;
    },
    onSuccess: (savedCOs) => {
      savedCOs.forEach(co => onCOCreated?.(co));
      qc.invalidateQueries({ queryKey: ["changeOrders"] });
      setStep(2);
      toast({ title: `Created ${savedCOs.length} change order(s)` });
    },
    onError: (err) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });

  const handleFileUpload = async (file) => {
    setLoading(true);
    setError(null);
    try {
      const fileName = file.name.toLowerCase();
      const fileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();

      const supportedExtensions = ['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png'];
      if (!supportedExtensions.includes(fileExtension)) {
        throw new Error('Unsupported file type. Please upload PDF, Word, or image.');
      }

      // Upload file
      const uploadResult = await base44.integrations.Core.UploadFile({ file });

      // Extract via AI
      const extractResult = await base44.integrations.Core.InvokeLLM({
        model: "gemini_3_pro",
        prompt: `You are a construction change order analyzer. Extract ALL information from this change order document. Return ONLY a JSON object with these keys:

{
  "title": "Change order title/description",
  "description": "Detailed scope of the change (what is being added/removed/modified)",
  "reason": "Why the change is needed (client_request, unforeseen_condition, design_change, material_substitution, other)",
  "line_items": [
    {
      "description": "Item description",
      "quantity": 1,
      "unit": "each/sq ft/hrs/etc",
      "unit_price": 100,
      "total_cost": 100
    }
  ],
  "tax_rate": 0,
  "notes": "Any additional notes or conditions"
}

IMPORTANT:
- Extract EVERY line item from the change order
- Calculate or extract unit prices and total costs accurately
- Include tax rate if applicable
- If no tax, set to 0`,
        file_urls: [uploadResult.file_url],
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            reason: { type: "string" },
            line_items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  quantity: { type: "number" },
                  unit: { type: "string" },
                  unit_price: { type: "number" },
                  total_cost: { type: "number" },
                },
              },
            },
            tax_rate: { type: "number" },
            notes: { type: "string" },
          },
        },
      });

      const newCOs = [
        ...cos,
        {
          fileName: file.name,
          fileUrl: uploadResult.file_url,
          extractedData: extractResult,
          editedData: extractResult,
        },
      ];

      setCos(newCOs);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to extract data from document");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCO = (index) => {
    setCos(cos.filter((_, i) => i !== index));
  };

  const handleEditCO = (index) => {
    setCurrentIndex(index);
    setStep(1);
  };

  const handleUpdateCOData = (editedData) => {
    const updated = [...cos];
    updated[currentIndex].editedData = editedData;
    setCos(updated);
  };

  const formatCOData = (editedData) => {
    const lineItems = (editedData.line_items || []).map(item => ({
      description: item.description,
      quantity: item.quantity || 1,
      unit: item.unit || "each",
      unit_price: item.unit_price || 0,
      total_cost: item.total_cost || 0,
    }));

    const subtotal = lineItems.reduce((s, item) => s + (item.total_cost || 0), 0);
    const taxAmount = (editedData.tax_rate || 0) > 0 ? subtotal * ((editedData.tax_rate || 0) / 100) : 0;
    const totalAmount = subtotal + taxAmount;

    return {
      title: editedData.title || "Change Order",
      description: editedData.description || "",
      reason: editedData.reason || "client_request",
      line_items: lineItems,
      tax_enabled: (editedData.tax_rate || 0) > 0,
      tax_rate: editedData.tax_rate || 0,
      notes: editedData.notes || "",
      status: "draft",
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
    };
  };

  const handleSaveAllCOs = () => {
    const cosToSave = cos.map(co => ({
      fileUrl: co.fileUrl,
      fileName: co.fileName,
      coData: formatCOData(co.editedData),
    }));
    saveChangeOrdersMutation.mutate(cosToSave);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`${step === 2 ? "max-w-3xl max-h-[90vh]" : "max-w-2xl max-h-[85vh]"} overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle>Import Change Order — Step {step + 1} of {STEPS.length}</DialogTitle>
        </DialogHeader>

        {/* Progress */}
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        {/* Content */}
        <div className="py-4 min-h-64">
          {/* Step 0: Upload */}
          {step === 0 && (
            <div className="space-y-4">
              {cos.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">{cos.length} document(s) loaded</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {cos.map((co, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                        <div className="text-sm flex-1 min-w-0">
                          <p className="font-medium truncate">{co.fileName}</p>
                          <p className="text-xs text-muted-foreground">{co.editedData.title || "Untitled"}</p>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditCO(idx)}>Edit</Button>
                          <Button size="sm" variant="ghost" onClick={() => handleRemoveCO(idx)}><X className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-semibold mb-2">Upload Change Order Document</p>
                <p className="text-xs text-muted-foreground mb-4">PDF, Word (.doc/.docx), or image (JPG/PNG)</p>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  disabled={loading}
                  className="hidden"
                  id="co-upload"
                />
                <label htmlFor="co-upload">
                  <Button asChild variant="outline" disabled={loading}>
                    <span>
                      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                      {loading ? "Uploading..." : "Choose File"}
                    </span>
                  </Button>
                </label>

                {error && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    <AlertCircle className="w-3 h-3 inline mr-1" /> {error}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 1: Edit Change Order */}
          {step === 1 && currentIndex !== null && (
            <div className="space-y-4">
              <div className="text-sm">
                <p className="font-semibold">{cos[currentIndex].fileName}</p>
                <p className="text-xs text-muted-foreground">Editing {currentIndex + 1} of {cos.length}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={cos[currentIndex].editedData.title || ""}
                    onChange={(e) => handleUpdateCOData({ ...cos[currentIndex].editedData, title: e.target.value })}
                    placeholder="e.g. Add French drain"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={cos[currentIndex].editedData.description || ""}
                    onChange={(e) => handleUpdateCOData({ ...cos[currentIndex].editedData, description: e.target.value })}
                    rows={3}
                    placeholder="Detailed scope of the change..."
                  />
                </div>

                <div>
                  <Label>Reason</Label>
                  <select
                    value={cos[currentIndex].editedData.reason || "client_request"}
                    onChange={(e) => handleUpdateCOData({ ...cos[currentIndex].editedData, reason: e.target.value })}
                    className="w-full px-3 py-2 border rounded text-sm"
                  >
                    <option value="client_request">Client Request</option>
                    <option value="unforeseen_condition">Unforeseen Condition</option>
                    <option value="design_change">Design Change</option>
                    <option value="material_substitution">Material Substitution</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Line Items */}
                <div>
                  <Label className="font-semibold">Line Items</Label>
                  <div className="space-y-2 mt-2">
                    {(cos[currentIndex].editedData.line_items || []).map((item, idx) => (
                      <Card key={idx} className="p-3 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Description"
                            value={item.description || ""}
                            onChange={(e) => {
                              const updated = [...(cos[currentIndex].editedData.line_items || [])];
                              updated[idx].description = e.target.value;
                              handleUpdateCOData({ ...cos[currentIndex].editedData, line_items: updated });
                            }}
                            className="text-xs"
                          />
                          <Input
                            type="number"
                            placeholder="Qty"
                            value={item.quantity || 1}
                            onChange={(e) => {
                              const updated = [...(cos[currentIndex].editedData.line_items || [])];
                              updated[idx].quantity = parseFloat(e.target.value) || 1;
                              handleUpdateCOData({ ...cos[currentIndex].editedData, line_items: updated });
                            }}
                            className="text-xs"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <Input placeholder="Unit" value={item.unit || "each"} className="text-xs" disabled />
                          <Input
                            type="number"
                            placeholder="Unit Price"
                            value={item.unit_price || 0}
                            onChange={(e) => {
                              const updated = [...(cos[currentIndex].editedData.line_items || [])];
                              updated[idx].unit_price = parseFloat(e.target.value) || 0;
                              handleUpdateCOData({ ...cos[currentIndex].editedData, line_items: updated });
                            }}
                            className="text-xs"
                          />
                          <div className="flex items-center px-2 py-1 bg-muted rounded text-xs font-medium">
                            Total: ${((item.quantity || 1) * (item.unit_price || 0)).toFixed(2)}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Tax Rate (%)</Label>
                  <Input
                    type="number"
                    value={cos[currentIndex].editedData.tax_rate || 0}
                    onChange={(e) => handleUpdateCOData({ ...cos[currentIndex].editedData, tax_rate: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={cos[currentIndex].editedData.notes || ""}
                    onChange={(e) => handleUpdateCOData({ ...cos[currentIndex].editedData, notes: e.target.value })}
                    rows={2}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Summary */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Ready to Create {cos.length} Change Order(s)</h3>
              {cos.map((co, idx) => {
                const data = formatCOData(co.editedData);
                return (
                  <Card key={idx} className="p-3">
                    <p className="font-medium text-sm">{data.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{data.line_items.length} line item(s)</p>
                    <p className="text-sm font-bold mt-2">
                      Total: <span className="text-primary">{formatCurrency(data.total_amount)}</span>
                    </p>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => {
              if (step === 1) {
                setCurrentIndex(null);
                setStep(0);
              } else if (step === 2) {
                setCurrentIndex(null);
                setStep(0);
              } else if (step === 0) {
                onClose();
              }
            }}
            disabled={loading}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> {step === 0 ? "Cancel" : "Back"}
          </Button>

          {step < 2 && (
            <Button
              onClick={() => {
                if (step === 0 && cos.length > 0) {
                  setCurrentIndex(0);
                  setStep(1);
                } else if (step === 1) {
                  setStep(2);
                }
              }}
              disabled={(step === 0 && cos.length === 0) || loading}
            >
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}

          {step === 2 && (
            <Button
              onClick={handleSaveAllCOs}
              disabled={saveChangeOrdersMutation.isPending}
            >
              {saveChangeOrdersMutation.isPending ? "Creating..." : `Create ${cos.length} Change Order(s)`}
              <CheckCircle className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}