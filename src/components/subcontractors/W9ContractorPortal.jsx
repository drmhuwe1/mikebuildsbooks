import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Copy, CheckCircle } from "lucide-react";

export default function W9ContractorPortal({ contractor }) {
  const [showSendLink, setShowSendLink] = useState(false);
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState(contractor.email || "");

  const portalUrl = `${window.location.origin}/contractor-w9/${btoa(contractor.id)}`;

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      return await base44.integrations.Core.SendEmail({
        to: email,
        subject: "Complete Your W-9 Form",
        body: `Hello ${contractor.name},\n\nPlease complete your W-9 form by visiting the link below:\n\n${portalUrl}\n\nThis link is secure and for your use only. The W-9 is required for tax compliance and 1099 reporting.\n\nBest regards`,
      });
    },
    onSuccess: () => {
      setShowSendLink(false);
      alert("Email sent successfully!");
    },
  });

  const copyToClipboard = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="p-4 bg-blue-50 border-blue-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-semibold text-sm text-blue-900 mb-2">Contractor Self-Service W-9 Portal</p>
          <p className="text-xs text-blue-800 mb-3">
            Share a secure link with the contractor so they can complete their W-9 themselves.
          </p>

          {!showSendLink ? (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowSendLink(true)}
              >
                <Mail className="w-3.5 h-3.5 mr-1" /> Email Portal Link
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Contractor Email</Label>
                <Input 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="contractor@example.com"
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Or copy this portal link:</Label>
                <div className="flex gap-2">
                  <input 
                    value={portalUrl} 
                    readOnly 
                    className="text-xs px-2 py-1 border rounded flex-1 bg-white font-mono text-blue-600 truncate"
                  />
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={copyToClipboard}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {copied && <p className="text-xs text-green-600 flex items-center gap-1 mt-1"><CheckCircle className="w-3 h-3" /> Copied!</p>}
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => sendEmailMutation.mutate()}
                  disabled={!email || sendEmailMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {sendEmailMutation.isPending ? "Sending..." : "Send Email"}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowSendLink(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}