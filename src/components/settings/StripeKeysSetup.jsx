import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Lock, ExternalLink, Eye, EyeOff, Check, Zap } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import StripeSetupWizard from "./StripeSetupWizard";

export default function StripeKeysSetup() {
  const [showSecret, setShowSecret] = useState(false);
  const [secretKey, setSecretKey] = useState("");
  const [pubKey, setPubKey] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: settings = [] } = useQuery({
    queryKey: ["settings"],
    queryFn: () => base44.entities.AppSettings.filter({ settings_key: "global" }),
  });

  const existing = settings[0];

  useEffect(() => {
    if (existing) {
      setSecretKey(existing.stripe_secret_key || "");
      setPubKey(existing.stripe_publishable_key || "");
    }
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: () =>
      existing
        ? base44.entities.AppSettings.update(existing.id, {
            stripe_secret_key: secretKey,
            stripe_publishable_key: pubKey,
          })
        : base44.entities.AppSettings.create({
            settings_key: "global",
            stripe_secret_key: secretKey,
            stripe_publishable_key: pubKey,
          }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast({ title: "Stripe keys saved successfully" });
    },
    onError: (err) => {
      toast({ title: "Error saving keys", description: err.message, variant: "destructive" });
    },
  });

  const handleWizardComplete = (keys) => {
    setSecretKey(keys.secretKey);
    setPubKey(keys.pubKey);
    setTimeout(() => saveMutation.mutate(), 300);
  };

  return (
    <Card className="p-6 border-blue-200 bg-blue-50">
      <div className="flex items-start gap-3 mb-4">
        <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 mb-1">Your Own Stripe Account</h3>
          <p className="text-sm text-blue-700">
            Connect your personal Stripe account to collect payments through your own merchant account.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 mb-4 space-y-4">
        <div className="text-sm space-y-2">
          <p className="font-semibold text-foreground">How it works:</p>
          <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground text-xs">
            <li>Create a Stripe account at <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">stripe.com</a></li>
            <li>Go to <strong>Dashboard → Settings → API Keys</strong></li>
            <li>Copy your <strong>Secret Key</strong> (starts with <code className="bg-muted px-1 rounded text-xs">sk_</code>)</li>
            <li>Copy your <strong>Publishable Key</strong> (starts with <code className="bg-muted px-1 rounded text-xs">pk_</code>)</li>
            <li>Paste both keys below and save</li>
            <li>All job payments now go directly to your Stripe account</li>
          </ol>
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Secret Key (sk_...)</Label>
            <div className="flex gap-2">
              <Input
                type={showSecret ? "text" : "password"}
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="sk_test_..."
                className="flex-1 text-xs"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSecret(!showSecret)}
                className="text-muted-foreground hover:text-foreground"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-xs">Publishable Key (pk_...)</Label>
            <Input
              type="text"
              value={pubKey}
              onChange={(e) => setPubKey(e.target.value)}
              placeholder="pk_test_..."
              className="text-xs"
            />
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded p-3 flex gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            <strong>Security:</strong> Keys are encrypted and stored securely. Only you can view/use them. Payments go to your Stripe account only.
          </p>
        </div>

        {secretKey && pubKey && (
          <div className="bg-green-50 border border-green-200 rounded p-3 flex gap-2">
            <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-green-700">
              <strong>Ready:</strong> Both keys are set. Customers can pay via Stripe on job payment pages.
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          onClick={() => setWizardOpen(true)}
          variant="outline"
          className="gap-2 flex-1 sm:flex-none"
        >
          <Zap className="w-4 h-4" />
          Use Setup Wizard
        </Button>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={!secretKey || !pubKey || saveMutation.isPending}
          className="flex-1 sm:flex-none gap-2"
        >
          <Lock className="w-4 h-4" />
          {saveMutation.isPending ? "Saving..." : "Save Stripe Keys"}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setSecretKey("");
            setPubKey("");
          }}
          disabled={!secretKey && !pubKey}
          className="sm:w-auto"
        >
          Clear
        </Button>
      </div>

      <StripeSetupWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onKeysReady={handleWizardComplete}
      />

      <p className="text-xs text-muted-foreground mt-3">
        <a href="https://stripe.com/docs/keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
          Find your Stripe API keys <ExternalLink className="w-3 h-3" />
        </a>
      </p>
    </Card>
  );
}