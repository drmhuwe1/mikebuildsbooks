import { useEffect } from "react";
import { base44 } from "@/api/base44Client";

export function useBillBadge() {
  useEffect(() => {
    let cancelled = false;

    const update = async () => {
      try {
        const [bills, personalBills] = await Promise.all([
          base44.entities.Bill.list("-due_date", 200),
          base44.entities.PersonalBill.list("-due_date", 200),
        ]);
        if (cancelled) return;

        const soon = new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0];
        const urgentCount = [...bills, ...personalBills].filter(
          b => b.status !== "paid" && b.due_date <= soon
        ).length;

        if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: "SET_BADGE", count: urgentCount });
        }
        if ("setAppBadge" in navigator) {
          urgentCount > 0
            ? navigator.setAppBadge(urgentCount).catch(() => {})
            : navigator.clearAppBadge().catch(() => {});
        }
      } catch {
        // non-critical — badge failure should never crash the app
      }
    };

    update();
    const interval = setInterval(update, 5 * 60 * 1000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);
}