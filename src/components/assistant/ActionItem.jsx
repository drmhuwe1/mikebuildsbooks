import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Calendar, HardHat, FileText, FileCheck, Clock, CreditCard, TrendingDown, ArrowRight, CheckCircle } from "lucide-react";

const ICONS = {
  AlertTriangle, Calendar, HardHat, FileText, FileCheck, Clock, CreditCard, TrendingDown,
};

const COLOR_CLASSES = {
  red: { bg: "bg-red-50 border-red-200", icon: "text-red-500", dot: "bg-red-500" },
  orange: { bg: "bg-orange-50 border-orange-200", icon: "text-orange-500", dot: "bg-orange-500" },
  yellow: { bg: "bg-yellow-50 border-yellow-200", icon: "text-yellow-600", dot: "bg-yellow-500" },
  blue: { bg: "bg-blue-50 border-blue-200", icon: "text-blue-500", dot: "bg-blue-500" },
  green: { bg: "bg-green-50 border-green-200", icon: "text-green-500", dot: "bg-green-500" },
};

export default function ActionItem({ item, onDismiss, dismissed }) {
  const Icon = ICONS[item.icon] || AlertTriangle;
  const colors = COLOR_CLASSES[item.color] || COLOR_CLASSES.yellow;

  if (dismissed) return null;

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${colors.bg} group`}>
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${colors.icon}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{item.title}</p>
        {item.detail && <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {onDismiss && (
          <button
            onClick={() => onDismiss(item.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-muted-foreground text-transparent"
            title="Dismiss"
          >
            <CheckCircle className="w-3.5 h-3.5" />
          </button>
        )}
        <Link
          to={item.link}
          className="text-xs font-medium flex items-center gap-1 text-primary hover:underline"
        >
          Go <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}