import React, { useState } from "react";
import { AlertTriangle, CheckCircle, Info, X } from "lucide-react";

const VARIANTS = {
  error:   { icon: AlertTriangle, bg: "bg-red-50 border-red-200",    text: "text-red-800",   icon_c: "text-red-500" },
  warning: { icon: AlertTriangle, bg: "bg-yellow-50 border-yellow-200", text: "text-yellow-800", icon_c: "text-yellow-500" },
  success: { icon: CheckCircle,   bg: "bg-green-50 border-green-200", text: "text-green-800", icon_c: "text-green-500" },
  info:    { icon: Info,          bg: "bg-blue-50 border-blue-200",   text: "text-blue-800",  icon_c: "text-blue-500" },
};

export default function AssistantPrompts({ prompts = [] }) {
  const [dismissed, setDismissed] = useState([]);
  const visible = prompts.filter((_, i) => !dismissed.includes(i));
  if (visible.length === 0) return null;
  return (
    <div className="space-y-2">
      {prompts.map((p, i) => {
        if (dismissed.includes(i)) return null;
        const v = VARIANTS[p.variant] || VARIANTS.info;
        const Icon = v.icon;
        return (
          <div key={i} className={`flex items-start gap-3 px-4 py-2.5 rounded-lg border ${v.bg} ${v.text}`}>
            <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${v.icon_c}`} />
            <span className="text-sm flex-1">{p.message}</span>
            <button onClick={() => setDismissed(d => [...d, i])} className="shrink-0 opacity-50 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}