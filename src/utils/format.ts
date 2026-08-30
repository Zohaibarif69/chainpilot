export function formatCurrency(amount: number, abbreviated = false): string {
  if (abbreviated && amount >= 1000) {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    return `$${Math.round(amount / 1000)}K`;
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function formatPercent(n: number): string {
  return `${n}%`;
}

export function formatDelay(days: number): string {
  if (days === 0) return "On time";
  return `+${days} day${days !== 1 ? "s" : ""}`;
}
