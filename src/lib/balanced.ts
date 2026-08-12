import type { BalancedActivity, BalancedDailyLog } from '../types.js'

export type BalancedStatus =
  | 'not-recorded'
  | 'below-minimum'
  | 'something'
  | 'light'
  | 'good'
  | 'excellent'
  | 'over-maximum'

export function validDailyLimit(value: number): boolean {
  return Number.isFinite(value) && value > 0
}

export function validMinimum(value: number | undefined, dailyLimit: number): boolean {
  return value === undefined || (Number.isFinite(value) && value >= 0 && value <= dailyLimit)
}

export function balancedStatus(activity: BalancedActivity, value?: number): BalancedStatus {
  if (value === undefined) return 'not-recorded'
  if (activity.minimum !== undefined && value < activity.minimum) return 'below-minimum'
  const progress = value / activity.dailyLimit
  if (progress <= 0.2) return 'something'
  if (progress < 0.5) return 'light'
  if (progress < 0.8) return 'good'
  if (progress <= 1) return 'excellent'
  return 'over-maximum'
}

export function balancedStatusLabel(status: BalancedStatus, activity?: BalancedActivity): string {
  switch (status) {
    case 'not-recorded': return 'Do it today'
    case 'below-minimum': return 'Reach your minimum'
    case 'something': return activity?.minimum !== undefined ? 'Minimum done' : 'At least I did something'
    case 'light': return 'Light day'
    case 'good': return 'Good'
    case 'excellent': return 'Excellent'
    case 'over-maximum': return 'Daily limit crossed'
  }
}

export function balancedLogFor(
  logs: BalancedDailyLog[],
  activityId: string,
  date: string,
): BalancedDailyLog | undefined {
  return logs.find((log) => log.activityId === activityId && log.date === date)
}

export function durationValue(elapsedMs: number, unit: 'minutes' | 'hours'): number {
  const divisor = unit === 'minutes' ? 60_000 : 3_600_000
  return Math.max(0, elapsedMs) / divisor
}

export function formatBalancedValue(value: number, unit: string): string {
  const maximumFractionDigits = unit.toLowerCase() === 'hours' ? 2 : 1
  return new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(value)
}
