import React from "react";
import { useSubscription, PLAN_LABELS } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Crown, ArrowRight, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

export default function SubscriptionBanner() {
  let plan, status, isLoading;
  try {
    ({ plan, status, isLoading } = useSubscription());
  } catch {
    return null;
  }

  if (isLoading) return null;
  // Don't show for active paid plans or admins
  if (plan === "professional" || plan === "pro" || plan === "starter") {
    if (status === "active") return null;
  }

  if (status === "past_due") {
    return (
      <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="text-sm font-medium">Your subscription payment is past due. Please update your payment method to restore full access.</span>
        </div>
        <Link to="/Landing#pricing">
          <Button size="sm" variant="destructive" className="shrink-0">Fix Now</Button>
        </Link>
      </div>
    );
  }

  // Trial / no subscription
  return (
    <div className="bg-yellow-400/10 border-b border-yellow-400/30 px-4 py-2.5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-yellow-800">
        <Crown className="w-4 h-4 shrink-0 text-yellow-500" />
        <span className="text-sm font-medium">
          You're on the <strong>Free Trial</strong> — limited features. Upgrade to unlock everything.
        </span>
      </div>
      <Link to="/Landing#pricing">
        <Button size="sm" className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold shrink-0">
          Upgrade <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </Link>
    </div>
  );
}