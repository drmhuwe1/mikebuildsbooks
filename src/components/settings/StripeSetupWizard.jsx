import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, ExternalLink, Copy, ArrowRight } from "lucide-react";

export default function StripeSetupWizard({ isOpen, onClose, onKeysReady }) {
  const [step, setStep] = useState(1);
  const [secretKey, setSecretKey] = useState("");
  const [pubKey, setPubKey] = useState("");
  const [copied, setCopied] = useState("");

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(""), 2000);
  };

  const handleNext = () => {
    if (step < 6) {
      setStep(step + 1);
    } else {
      onKeysReady({ secretKey, pubKey });
      handleClose();
    }
  };

  const handleClose = () => {
    setStep(1);
    setSecretKey("");
    setPubKey("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Set Up Stripe Payments (Step {step} of 6)</DialogTitle>
          <DialogDescription>
            Follow these simple steps to collect payments directly into your Stripe account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* STEP 1: Create Account */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Step 1: Create Your Stripe Account</h3>
                <p className="text-sm text-blue-800 mb-4">
                  If you don't already have a Stripe account, you need to create one. It's free and takes less than 5 minutes.
                </p>
                <a
                  href="https://stripe.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Go to stripe.com to create an account <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <AlertCircle className="w-4 h-4 text-amber-600 inline mr-2" />
                <p className="text-xs text-amber-700 inline">
                  <strong>What you need:</strong> Just an email address and password. Stripe will ask for basic business info.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Confirm Setup */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <CheckCircle2 className="w-5 h-5 text-green-600 inline mr-2" />
                <p className="text-sm text-green-800 font-medium inline">Great! You've created your Stripe account.</p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">What happens next:</h3>
                <ol className="space-y-2 text-sm text-gray-700">
                  <li><strong>1.</strong> We'll help you find your API keys (unique codes for this app)</li>
                  <li><strong>2.</strong> You'll paste these keys into a simple form (takes 30 seconds)</li>
                  <li><strong>3.</strong> Your customers can start paying you directly</li>
                </ol>
              </div>

              <div className="text-sm text-gray-600">
                <p><strong>Where will the money go?</strong> Every payment goes directly into <u>your</u> Stripe account. This app never touches your money.</p>
              </div>
            </div>
          )}

          {/* STEP 3: Navigate to API Keys */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3">Step 3: Navigate to Your API Keys</h3>
                <p className="text-sm text-blue-800 mb-4">Follow these steps in your Stripe Dashboard:</p>
                <ol className="space-y-2 text-sm text-blue-800 ml-4 list-decimal">
                  <li>Log in to <strong>stripe.com</strong></li>
                  <li>Look for <strong>"Settings"</strong> icon (gear icon) in the top-right corner</li>
                  <li>Click <strong>"Settings"</strong></li>
                  <li>In the left sidebar, click <strong>"Developers"</strong></li>
                  <li>Then click <strong>"API Keys"</strong></li>
                </ol>
              </div>

              <div className="bg-gray-100 rounded-lg p-4 border-2 border-dashed border-gray-300">
                <p className="text-xs text-gray-600 text-center font-mono">
                  Dashboard → Settings → Developers → API Keys
                </p>
              </div>

              <Button
                onClick={() => {
                  window.open("https://dashboard.stripe.com/apikeys", "_blank");
                }}
                className="w-full gap-2"
                variant="outline"
              >
                Open Stripe API Keys Page <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* STEP 4: Get Secret Key */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3">Step 4: Copy Your Secret Key</h3>
                <p className="text-sm text-blue-800 mb-3">
                  On the API Keys page, you'll see two keys. Find the <strong>Secret Key</strong> section.
                </p>
                <div className="bg-white border border-blue-300 rounded p-3 mb-3">
                  <p className="text-xs text-gray-600 mb-2">It looks like this:</p>
                  <p className="font-mono text-xs text-gray-800 break-all">sk_test_51A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T</p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <AlertCircle className="w-4 h-4 text-amber-600 inline mr-2" />
                <p className="text-xs text-amber-700">
                  <strong>Important:</strong> The Secret Key starts with <code className="bg-amber-100 px-1 rounded">sk_</code>. Keep it secret—never share it!
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secret" className="text-sm">Paste Your Secret Key Here:</Label>
                <Input
                  id="secret"
                  placeholder="sk_test_..."
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="font-mono text-xs"
                />
                {secretKey && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Secret key entered ✓
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: Get Publishable Key */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3">Step 5: Copy Your Publishable Key</h3>
                <p className="text-sm text-blue-800 mb-3">
                  Still on the API Keys page, find the <strong>Publishable Key</strong> section (right below Secret Key).
                </p>
                <div className="bg-white border border-blue-300 rounded p-3 mb-3">
                  <p className="text-xs text-gray-600 mb-2">It looks like this:</p>
                  <p className="font-mono text-xs text-gray-800 break-all">pk_test_51A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pub" className="text-sm">Paste Your Publishable Key Here:</Label>
                <Input
                  id="pub"
                  placeholder="pk_test_..."
                  value={pubKey}
                  onChange={(e) => setPubKey(e.target.value)}
                  className="font-mono text-xs"
                />
                {pubKey && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Publishable key entered ✓
                  </p>
                )}
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-700">
                  <strong>What's the difference?</strong>
                  <br />• <strong>Secret Key:</strong> Keeps your money safe. Only your server uses it.
                  <br />• <strong>Publishable Key:</strong> Public. Customers' payment info goes through this safely.
                </p>
              </div>
            </div>
          )}

          {/* STEP 6: Confirm & Save */}
          {step === 6 && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <CheckCircle2 className="w-5 h-5 text-green-600 inline mr-2" />
                <h3 className="font-semibold text-green-900 mb-2 inline">Almost done!</h3>
              </div>

              <Card className="p-4 bg-gray-50">
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-600">Secret Key:</p>
                    <p className="font-mono text-xs text-gray-800 break-all">{secretKey || "Not entered yet"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Publishable Key:</p>
                    <p className="font-mono text-xs text-gray-800 break-all">{pubKey || "Not entered yet"}</p>
                  </div>
                </div>
              </Card>

              {secretKey && pubKey && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <CheckCircle2 className="w-4 h-4 text-green-600 inline mr-2" />
                  <p className="text-sm text-green-800 inline">
                    <strong>Perfect!</strong> Both keys are ready to save.
                  </p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Next:</strong> Click "Complete Setup" below to save your keys. Your customers can then pay you through Stripe!
                </p>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 6) * 100}%` }}
            ></div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleClose}>
              {step === 1 ? "Skip for Now" : "Cancel"}
            </Button>
            <Button
              onClick={handleNext}
              disabled={
                (step === 4 && !secretKey) ||
                (step === 5 && !pubKey) ||
                (step === 6 && (!secretKey || !pubKey))
              }
              className="gap-2"
            >
              {step === 6 ? "Complete Setup" : `Next`}
              {step < 6 && <ArrowRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}