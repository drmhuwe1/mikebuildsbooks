import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Check } from "lucide-react";

const STEPS = ["Category", "Account Info", "Review"];

export default function AccountConnectWizard({
  open,
  onClose,
  onSave,
}) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    account_category: "business",
    name: "",
    institution: "",
    account_type: "checking",
    current_balance: 0,
  });
  const [saving, setSaving] = useState(false);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(formData);
    setSaving(false);
    setStep(0);
    setFormData({
      account_category: "business",
      name: "",
      institution: "",
      account_type: "checking",
      current_balance: 0,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Bank Account</DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <React.Fragment key={s + i}>
              <button
                onClick={() => setStep(i)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-green-100 text-green-700" : "bg-muted"
                }`}
              >
                {i < step ? <Check className="w-3 h-3 inline mr-1" /> : null}{s}
              </button>
              {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border" />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Category */}
        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Is this account business or personal?</p>
            <div className="grid grid-cols-2 gap-2">
              {["business", "personal"].map(cat => (
                <Card
                  key={cat}
                  className={`p-4 cursor-pointer border-2 transition-all ${
                    formData.account_category === cat ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setFormData(f => ({ ...f, account_category: cat }))}
                >
                  <p className="font-semibold text-sm capitalize">{cat}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {cat === "business" ? "Business account" : "Personal account"}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Account Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Account Name *</Label>
              <Input
                placeholder="e.g., Business Checking"
                value={formData.name}
                onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Bank Name</Label>
                <Input
                  placeholder="Chase, Bank of America..."
                  value={formData.institution}
                  onChange={e => setFormData(f => ({ ...f, institution: e.target.value }))}
                />
              </div>
              <div>
                <Label>Account Type</Label>
                <Select value={formData.account_type} onValueChange={v => setFormData(f => ({ ...f, account_type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Checking</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Current Balance</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.current_balance}
                onChange={e => setFormData(f => ({ ...f, current_balance: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 2 && (
          <div className="space-y-4">
            <Card className="p-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Account Name</p>
                <p className="font-semibold">{formData.name || "—"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Bank</p>
                  <p className="font-semibold text-sm">{formData.institution || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="font-semibold text-sm capitalize">{formData.account_type}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="font-semibold text-sm capitalize">{formData.account_category}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Starting Balance</p>
                <p className="font-semibold text-sm">${formData.current_balance.toFixed(2)}</p>
              </div>
            </Card>
            <p className="text-xs text-muted-foreground">
              You'll be able to sync transactions and manage this account from the dashboard.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => step > 0 ? setStep(step - 1) : onClose()}
          >
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button className="flex-1" onClick={handleNext}>
              Next <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={!formData.name || saving}
            >
              {saving ? "Creating..." : "Connect Account"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}