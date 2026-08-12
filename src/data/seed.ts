import type { AppData } from '@/types'

/** Palette used for graph lines (matches the design system). */
export const CHART_COLORS = ['#7E7A46', '#9C6B4A', '#6E7A5A', '#8A7E6A', '#5F6B70']

/**
 * Fresh, empty app state. No demo profiles or data — each user creates their own
 * profile (with a passcode) and their own goals, metrics and graphs.
 */
export function buildSeed(): AppData {
  return {
    profiles: [],
    metrics: [],
    milestones: [],
    dailyLogs: [],
    todos: [],
    transactions: [],
    widgets: [],
    balancedActivities: [],
    balancedDailyLogs: [],
    currentProfileId: undefined,
  }
}
