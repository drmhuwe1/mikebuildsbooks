import React from "react";
import { Card } from "@/components/ui/card";

export default function StatCard({ title, value, icon: Icon, subtitle, trend, className = "" }) {
  return (
    <Card className={`p-5 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="p-2.5 rounded-lg bg-primary/10">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
      </div>
      {trend && (
        <p className={`text-xs mt-3 font-medium ${trend.positive ? "text-green-600" : "text-red-600"}`}>
          {trend.positive ? "↑" : "↓"} {trend.text}
        </p>
      )}
    </Card>
  );
}