import { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export function useBillBadge() {
  const today = new Date().toISOString().split("T")[0];

  const { data: bills = [] } = useQuery({
    queryKey: ["bills"],
    queryFn: () => base44.entities.Bill.list("-due_date", 200),
    refetchInterval: 5 * 60 * 1000, // refresh every 5 min
  });

  const { data: personalBills = [] } = useQuery({
    queryKey: ["personalBills"],
    queryFn: () => base44.entities.PersonalBill.list("-due_date", 200),
    refetchInterval: 5 * 60 * 1000,
  });

  useEffect(() => {
    const allBills = [...bills, ...personalBills];
    const urgentCount = allBills.filter(b => {
      if (b.status === "paid") return false;
      const soon = new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0];
      return b.due_date <= soon;
    }).length;

    // Set PWA badge via service worker
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "SET_BADGE", count: urgentCount });
    }

    // Also try direct API (Chrome 81+ standalone)
    if ("setAppBadge" in navigator) {
      if (urgentCount > 0) {
        navigator.setAppBadge(urgentCount).catch(() => {});
      } else {
        navigator.clearAppBadge().catch(() => {});
      }
    }
  }, [bills, personalBills]);
}