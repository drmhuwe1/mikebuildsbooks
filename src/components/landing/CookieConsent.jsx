import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consentGiven = localStorage.getItem("cookieConsentGiven");
    if (!consentGiven) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookieConsentGiven", "true");
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem("cookieConsentGiven", "false");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-[100] bg-gray-900 border-t border-yellow-500/20 p-4 sm:p-6 shadow-2xl" 
      style={{maxWidth:'100vw',overflowX:'hidden'}}
      role="region"
      aria-label="Cookie consent banner"
      aria-live="polite"
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-gray-300 text-sm leading-relaxed">
            We use cookies and tracking pixels to improve your experience, enable session management, and understand how you use MikeBuildsBooks. By continuing, you agree to our{" "}
            <a 
              href="/privacy-policy" 
              className="text-yellow-400 hover:underline focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-gray-900 rounded px-1"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={handleReject}
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-800 focus:ring-2 focus:ring-gray-500"
            aria-label="Reject cookies"
          >
            Reject
          </Button>
          <Button
            onClick={handleAccept}
            size="sm"
            className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold focus:ring-2 focus:ring-yellow-600"
            aria-label="Accept cookies"
          >
            Accept
          </Button>
          <button
            onClick={handleReject}
            className="p-1 hover:bg-gray-800 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
            aria-label="Close cookie banner"
            title="Close"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}