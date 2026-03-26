import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Lock, ExternalLink } from "lucide-react";

export default function StripeKeysSetup() {
  const handleConnectStripe = async () => {
    try {
      const url = await base44.connectors.connectAppUser("stripe_keys");
      window.open(url, "_blank");
      // Poll for completion and refresh
      const timer = setInterval(() => {
        // User will close the popup when done, you can add refresh logic here
      }, 500);
    } catch (err) {
      alert("Error: " + err.message);
    }
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

      <div className="bg-white rounded-lg p-4 mb-4 space-y-3">
        <div className="text-sm space-y-2">
          <p className="font-semibold text-foreground">How it works:</p>
          <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground">
            <li>Create a Stripe account at <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">stripe.com</a></li>
            <li>Get your Secret Key from Settings → API Keys (starts with <code className="bg-muted px-1 rounded text-xs">sk_</code>)</li>
            <li>Get your Publishable Key (starts with <code className="bg-muted px-1 rounded text-xs">pk_</code>)</li>
            <li>Click the button below and securely paste your keys</li>
            <li>Your payments now go directly to your Stripe account—no one else can use them</li>
          </ol>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded p-3 flex gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            <strong>Privacy:</strong> Your Stripe keys are encrypted and stored securely. No other user can view or access them.
          </p>
        </div>
      </div>

      <Button onClick={handleConnectStripe} className="w-full sm:w-auto">
        <Lock className="w-4 h-4 mr-2" />
        Connect Your Stripe Account
      </Button>

      <p className="text-xs text-muted-foreground mt-4">
        <a href="https://stripe.com/docs/keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
          How to find your Stripe API keys <ExternalLink className="w-3 h-3" />
        </a>
      </p>
    </Card>
  );
}