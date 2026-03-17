export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatPercent(value) {
  if (value == null || isNaN(value)) return "0%";
  return `${Number(value).toFixed(1)}%`;
}

export function getStatusColor(status) {
  const colors = {
    active: "bg-green-100 text-green-700",
    inactive: "bg-red-100 text-red-700",
    prospect: "bg-blue-100 text-blue-700",
    bidding: "bg-yellow-100 text-yellow-700",
    contracted: "bg-blue-100 text-blue-700",
    in_progress: "bg-green-100 text-green-700",
    on_hold: "bg-orange-100 text-orange-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    draft: "bg-yellow-100 text-yellow-700",
    sent: "bg-blue-100 text-blue-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    expired: "bg-red-100 text-red-700",
    signed: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    paid: "bg-green-100 text-green-700",
    overdue: "bg-red-100 text-red-700",
    not_started: "bg-yellow-100 text-yellow-700",
    blocked: "bg-red-100 text-red-700",
  };
  return colors[status] || "bg-muted text-muted-foreground";
}