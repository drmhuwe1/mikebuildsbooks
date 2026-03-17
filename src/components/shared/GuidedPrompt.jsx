import React from "react";
import { AlertTriangle, Info, CheckCircle, ArrowRight } from "lucide-react";

const variants = {
  warning: { icon: AlertTriangle, bg: "bg-yellow-50 border-yellow-200", text: "text-yellow-800", iconColor: "text-yellow-600" },
  info: { icon: Info, bg: "bg-blue-50 border-blue-200", text: "text-blue-800", iconColor: "text-blue-600" },
  success: { icon: CheckCircle, bg: "bg-green-50 border-green-200", text: "text-green-800", iconColor: "text-green-600" },
  error: { icon: AlertTriangle, bg: "bg-red-50 border-red-200", text: "text-red-800", iconColor: "text-red-600" },
};

export default function GuidedPrompt({ message, variant = "info", action, actionLabel }) {
  const v = variants[variant];
  const IconComp = v.icon;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${v.bg} ${v.text}`}>
      <IconComp className={`w-4 h-4 shrink-0 ${v.iconColor}`} />
      <span className="text-sm flex-1">{message}</span>
      {action && (
        <button
          onClick={action}
          className="text-sm font-medium flex items-center gap-1 hover:underline shrink-0"
        >
          {actionLabel || "Fix"} <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}