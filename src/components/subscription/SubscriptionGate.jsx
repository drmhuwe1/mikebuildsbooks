import React from "react";
import { useSubscription, PLAN_LABELS, PLAN_UPGRADE_NEEDED } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Lock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

class SubscriptionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback || null;
    return this.props.children;
  }
}

function SubscriptionGateInner({ feature, children }) {
  const { hasFeature, isLoading, plan } = useSubscription();

  if (isLoading) return null;

  if (hasFeature(feature)) return children;

  const requiredPlan = PLAN_UPGRADE_NEEDED[feature?.toLowerCase()] || "starter";
  const requiredLabel = PLAN_LABELS[requiredPlan] || "Starter";

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-4">
      <div className="w-16 h-16 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center">
        <Lock className="w-7 h-7 text-yellow-400" />
      </div>
      <h2 className="text-xl font-bold">Upgrade Required</h2>
      <p className="text-muted-foreground max-w-sm text-sm">
        This feature is available on the <strong>{requiredLabel}</strong> plan and above.
        You're currently on the <strong>{PLAN_LABELS[plan] || "Free Trial"}</strong> plan.
      </p>
      <Link to="/Landing#pricing">
        <Button className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold mt-2">
          Upgrade Now <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </Link>
    </div>
  );
}

export default function SubscriptionGate({ feature, children }) {
  return (
    <SubscriptionErrorBoundary fallback={children}>
      <SubscriptionGateInner feature={feature}>{children}</SubscriptionGateInner>
    </SubscriptionErrorBoundary>
  );
}