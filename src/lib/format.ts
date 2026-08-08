export function formatRupees(n: number): string {
  const sign = n < 0 ? '−' : ''
  const abs = Math.abs(Math.round(n))
  return `${sign}₹${abs.toLocaleString('en-IN')}`
}

/** Compact "12 Aug" style. */
export function formatDate(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function formatDateLong(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
