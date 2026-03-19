import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Check, Loader } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STEPS = ["Category", "Connect Bank", "Select Account", "Review"];

export default function AccountConnectWizard({
  open,
  onClose,
  onSave,
}) {
  const [step, setStep] = useState(0);
  const [linkToken, setLinkToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    account_category: "business",
    name: "",
    institution: "",
    account_type: "checking",
    current_balance: 0,
    plaid_account_id: "",
    plaid_item_id: "",
    is_connected_via_plaid: true,
  });
  const [plaidAccounts, setPlaidAccounts] = useState([]);
  const [saving, setSaving] = useState(false);

  // Load Plaid script
  useEffect(() => {
    if (!window.PlaidLink) {
      const script = document.createElement("script");
      script.src = "https://cdn.plaid.com/link/v3/stable/link-initialize.js";
      document.head.appendChild(script);
    }
  }, []);

  const createLinkToken = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("plaidCreateLinkToken", {
        accountCategory: formData.account_category
      });
      setLinkToken(res.data.link_token);
      openPlaidLink(res.data.link_token);
    } catch (err) {
      console.error("Failed to create link token:", err);
      alert("Failed to connect to Plaid. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openPlaidLink = (token) => {
    if (!window.Plaid) {
      alert("Plaid not loaded. Please refresh and try again.");
      return;
    }

    window.Plaid.create({
      token: token,
      onSuccess: async (publicToken, metadata) => {
        try {
          setLoading(true);
          const res = await base44.functions.invoke("plaidExchangeToken", {
            publicToken,
            accountCategory: formData.account_category,
            accountName: metadata.institution.name
          });

          setFormData(f => ({
            ...f,
            plaid_item_id: res.data.item_id,
            institution: res.data.institution_name
          }));
          setPlaidAccounts(res.data.accounts);
          setStep(2);
        } catch (err) {
          console.error("Token exchange failed:", err);
          alert("Failed to exchange token. Please try again.");
        } finally {
          setLoading(false);
        }
      },
      onExit: () => {
        // User closed Plaid Link
      }
    }).open();
  };

  const selectAccount = (account) => {
    setFormData(f => ({
      ...f,
      name: account.name,
      plaid_account_id: account.plaid_account_id,
      account_type: account.type,
      current_balance: account.balance || 0
    }));
    setStep(3);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
      
      // Sync transactions after account is created
      if (formData.plaid_item_id && formData.plaid_account_id) {
        try {
          await base44.functions.invoke("plaidSyncTransactions", {
            accessToken: formData.plaid_item_id,
            accountId: formData.plaid_account_id,
            bankAccountId: formData.plaid_account_id, // Will be updated to actual account ID
            accountCategory: formData.account_category
          });
        } catch (err) {
          console.warn("Transaction sync failed:", err);
        }
      }

      setSaving(false);
      setStep(0);
      setFormData({
        account_category: "business",
        name: "",
        institution: "",
        account_type: "checking",
        current_balance: 0,
        plaid_account_id: "",
        plaid_item_id: "",
        is_connected_via_plaid: true,
      });
      setPlaidAccounts([]);
      setLinkToken(null);
      onClose();
    } catch (err) {
      console.error("Save failed:", err);
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Connect Bank Account</DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <React.Fragment key={s + i}>
              <button
                onClick={() => i <= step && setStep(i)}
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

        {/* Step 2: Connect with Plaid */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Connect your bank account securely through Plaid.</p>
            <Card className="p-4 bg-blue-50 border-blue-200">
              <p className="text-xs text-blue-900">
                ✓ Secure connection (256-bit encrypted)
                <br />✓ Your login is never stored
                <br />✓ Automatic transaction sync
              </p>
            </Card>
            <Button
              className="w-full"
              onClick={createLinkToken}
              disabled={loading}
            >
              {loading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : null}
              {loading ? "Loading..." : "Connect with Plaid"}
            </Button>
          </div>
        )}

        {/* Step 3: Select Account */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Select which account to connect:</p>
            <div className="space-y-2">
              {plaidAccounts.map(acc => (
                <Card
                  key={acc.plaid_account_id}
                  className="p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => selectAccount(acc)}
                >
                  <p className="font-semibold text-sm">{acc.name}</p>
                  <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                    <span className="capitalize">{acc.type}</span>
                    <span>${acc.balance?.toFixed(2) || "0.00"}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 3 && (
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
                <p className="text-xs text-muted-foreground">Current Balance</p>
                <p className="font-semibold text-sm">${formData.current_balance.toFixed(2)}</p>
              </div>
            </Card>
            <p className="text-xs text-muted-foreground">
              Transactions will be automatically synced and categorized.
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
            <Button
              className="flex-1"
              onClick={() => step === 0 ? setStep(1) : null}
              disabled={step === 0 && !formData.account_category}
            >
              Next <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={!formData.name || saving}
            >
              {saving ? "Connecting..." : "Connect Account"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}