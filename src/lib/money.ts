export function formatMoney(amount: number | string | undefined | null, currency: string = 'INR'): string {
  const n = Number(amount)
  if (!Number.isFinite(n)) return '—'
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(n)
  } catch {
    return `₹${Math.round(n)}`
  }
}

export function discountPercent(price: number | string | undefined | null, mrp: number | string | undefined | null): number {
  const p = Number(price)
  const m = Number(mrp)
  if (!Number.isFinite(p) || !Number.isFinite(m) || m <= p || m <= 0) return 0
  return Math.round(((m - p) / m) * 100)
}
