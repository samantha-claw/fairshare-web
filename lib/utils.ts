// ==========================================
// 📦 IMPORTS
// ==========================================
// (none)

// ==========================================
// ⚙️ LOGIC
// ==========================================

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Math.abs(amount));
}

export function getAvatarFallback(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=e0e7ff&color=4338ca&bold=true`;
}