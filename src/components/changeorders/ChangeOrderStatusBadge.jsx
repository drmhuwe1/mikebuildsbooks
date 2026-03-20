import React from "react";
import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG = {
  draft: { label: "Draft", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  sent: { label: "Sent to Client", className: "bg-blue-100 text-blue-800 border-blue-200" },
  approved: { label: "Approved", className: "bg-green-100 text-green-800 border-green-200" },
  declined: { label: "Declined", className: "bg-red-100 text-red-800 border-red-200" },
  void: { label: "Void", className: "bg-gray-100 text-gray-500 border-gray-200" },
};

export default function ChangeOrderStatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return <Badge variant="outline" className={`text-xs font-semibold ${cfg.className}`}>{cfg.label}</Badge>;
}