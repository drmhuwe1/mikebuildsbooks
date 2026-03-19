import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = localStorage.getItem("pwa_install_dismissed");
      if (!dismissed) setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("pwa_install_dismissed", "1");
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm bg-gray-900 border border-yellow-400/40 rounded-xl shadow-2xl p-4 flex items-center gap-3">
      <img
        src="https://media.base44.com/images/public/69b9774720c1d890b1162f57/e77fb292d_faviconimageMikeBuilds.png"
        alt="MikeBuildsBooks"
        className="w-10 h-10 rounded-lg shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold">Install MikeBuildsBooks</p>
        <p className="text-gray-400 text-xs">Add to your home screen for quick access</p>
      </div>
      <Button size="sm" onClick={handleInstall} className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold shrink-0 gap-1">
        <Download className="w-3.5 h-3.5" /> Install
      </Button>
      <button onClick={handleDismiss} className="text-gray-500 hover:text-gray-300 shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}