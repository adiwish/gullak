/** yyyy-mm-dd for local "today". */
export function todayISO(): string {
  const d = new Date()
  const off = d.getTimezoneOffset()
  const local = new Date(d.getTime() - off * 60_000)
  return local.toISOString().slice(0, 10)
}

export function addWeeksISO(iso: string, weeks: number): string {
  const d = new Date(iso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + Math.round(weeks * 7))
  return d.toISOString().slice(0, 10)
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Earlier of two ISO dates (string compare works for yyyy-mm-dd). */
export function minISO(a: string, b: string): string {
  return a < b ? a : b
}

export function isOverdue(deadline?: string): boolean {
  return !!deadline && todayISO() > deadline
}

/** Whole days from a to b (b - a). */
export function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00').getTime()
  const db = new Date(b + 'T00:00:00').getTime()
  return Math.round((db - da) / 86_400_000)
}
