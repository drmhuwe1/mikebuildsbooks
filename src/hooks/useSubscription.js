import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
// v3 — no useQuery, pure async fetch

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
  const authContext = useAuth();
  const user = authContext?.user;
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Always call useEffect (no early returns before hooks)
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    if (user.role === "admin") {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    base44.entities.Subscription.filter({ user_email: user.email })
      .then(results => {
        if (!cancelled) setSubscription(results[0] || null);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [user]);

  if (!user) {
    return {
      plan: "trial",
      status: "trialing",
      isActive: false,
      hasFeature: () => false,
      isLoading: false,
      subscription: null,
    };
  }

  if (user.role === "admin") {
    return {
      plan: "professional",
      status: "active",
      isActive: true,
      hasFeature: () => true,
      isLoading: false,
      subscription: null,
    };
  }

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