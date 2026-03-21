import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

// Plan hierarchy: what each tier includes
export const PLAN_FEATURES = {
  trial: ["dashboard", "clients", "jobs", "bidbuilder", "contracts"],

  starter: [
    "dashboard", "clients", "jobs", "bidbuilder", "contracts",
    "invoicing", "documents", "settings", "payoutengine",
    "subcontractors", "billscalendar", "jobcalendar", "jobtimeline",
    "dailyassistant", "helpguide",
    "quickbid", "changeorders", "expenses", "personalbillscalendar",
  ],

  pro: [
    "dashboard", "clients", "jobs", "bidbuilder", "contracts",
    "invoicing", "documents", "settings", "payoutengine",
    "subcontractors", "billscalendar", "jobcalendar", "jobtimeline",
    "dailyassistant", "helpguide",
    "quickbid", "changeorders", "expenses", "personalbillscalendar",
    // Pro-exclusive
    "banking", "taxexport", "businessfinancials", "personalfinancials",
    "financialsnapshot", "financialgoals", "financialscenariossimulator",
    "financialalerts", "operationscommandcenter",
    "permitdrawingwizard", "unifieddesignworkflow", "docgenerator",
    "smartbidbuilder", "aiestimatebuilder", "bidpackagewizard",
  ],

  professional: [
    "dashboard", "clients", "jobs", "bidbuilder", "contracts",
    "invoicing", "documents", "settings", "payoutengine",
    "subcontractors", "billscalendar", "jobcalendar", "jobtimeline",
    "dailyassistant", "helpguide",
    "quickbid", "changeorders", "expenses", "personalbillscalendar",
    "banking", "taxexport", "businessfinancials", "personalfinancials",
    "financialsnapshot", "financialgoals", "financialscenariossimulator",
    "financialalerts", "operationscommandcenter",
    "permitdrawingwizard", "unifieddesignworkflow", "docgenerator",
    "smartbidbuilder", "aiestimatebuilder", "bidpackagewizard",
    "customersupport",
  ],
};

export const PLAN_LABELS = {
  trial: "Free Trial",
  starter: "Starter",
  pro: "Pro",
  professional: "Professional",
};

export const PLAN_UPGRADE_NEEDED = {
  // Starter-gated
  invoicing: "starter",
  documents: "starter",
  payoutengine: "starter",
  subcontractors: "starter",
  billscalendar: "starter",
  quickbid: "starter",
  changeorders: "starter",
  expenses: "starter",
  personalbillscalendar: "starter",
  // Pro-gated
  banking: "pro",
  taxexport: "pro",
  businessfinancials: "pro",
  personalfinancials: "pro",
  financialsnapshot: "pro",
  financialgoals: "pro",
  financialscenariossimulator: "pro",
  financialalerts: "pro",
  operationscommandcenter: "pro",
  permitdrawingwizard: "pro",
  unifieddesignworkflow: "pro",
  docgenerator: "pro",
  smartbidbuilder: "pro",
  aiestimatebuilder: "pro",
  bidpackagewizard: "pro",
};

export function useSubscription() {
  const { user } = useAuth();

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ["subscription", user?.email],
    queryFn: () => base44.entities.Subscription.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  // Admins always get full access
  if (user?.role === "admin") {
    return {
      plan: "professional",
      status: "active",
      isActive: true,
      hasFeature: () => true,
      isLoading: false,
      subscription: null,
    };
  }

  const subscription = subscriptions[0] || null;
  const plan = subscription?.plan || "trial";
  const status = subscription?.status || "trialing";
  const isActive = status === "active" || status === "trialing";

  const hasFeature = (featureKey) => {
    if (!isActive) return false;
    const allowed = PLAN_FEATURES[plan] || PLAN_FEATURES.trial;
    return allowed.includes(featureKey.toLowerCase());
  };

  return { plan, status, isActive, hasFeature, isLoading, subscription };
}