import type { AppData, Metric, Milestone, Profile } from '@/types'
import { balanceOf } from '@/lib/money'

export interface FameShameItem {
  milestone: Milestone
  metric: Metric
}

export function currentProfile(d: AppData): Profile | undefined {
  return d.profiles.find((p) => p.id === d.currentProfileId)
}

export function metricsOf(d: AppData, profileId: string): Metric[] {
  return d.metrics
    .filter((m) => m.profileId === profileId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export function categoriesOf(d: AppData, profileId: string): Metric[] {
  return metricsOf(d, profileId).filter((m) => m.kind === 'category')
}

export function milestonesOf(d: AppData, metricId: string): Milestone[] {
  return d.milestones
    .filter((m) => m.metricId === metricId)
    .sort((a, b) => a.seq - b.seq)
}

export function activeMilestone(d: AppData, metricId: string): Milestone | undefined {
  return milestonesOf(d, metricId).find((m) => m.status === 'active')
}

export function upcomingMilestone(d: AppData, metricId: string): Milestone | undefined {
  return milestonesOf(d, metricId).find((m) => m.status === 'upcoming')
}

export function todayValue(d: AppData, metricId: string, today: string): number | undefined {
  return d.dailyLogs.find((l) => l.metricId === metricId && l.date === today)?.value
}

export function balance(d: AppData, profileId: string): number {
  return balanceOf(profileId, d.transactions)
}

export function targetMet(metric: Metric, milestone: Milestone, value: number | undefined): boolean {
  if (value === undefined) return false
  return metric.direction === 'higher' ? value >= milestone.target : value <= milestone.target
}

export function fame(d: AppData, profileId: string): FameShameItem[] {
  return joinForProfile(d, profileId, 'achieved')
    .sort((a, b) => b.milestone.reward - a.milestone.reward)
    .slice(0, 3)
}

export function shame(d: AppData, profileId: string): FameShameItem[] {
  return joinForProfile(d, profileId, 'surrendered')
    .sort((a, b) => b.milestone.reward - a.milestone.reward)
    .slice(0, 3)
}

export function historyItems(d: AppData, profileId: string): FameShameItem[] {
  const achieved = joinForProfile(d, profileId, 'achieved')
  const surrendered = joinForProfile(d, profileId, 'surrendered')
  return [...achieved, ...surrendered].sort((a, b) =>
    (b.milestone.completedOn ?? '').localeCompare(a.milestone.completedOn ?? ''),
  )
}

function joinForProfile(
  d: AppData,
  profileId: string,
  status: Milestone['status'],
): FameShameItem[] {
  const metricById = new Map(d.metrics.map((m) => [m.id, m]))
  return d.milestones
    .filter((m) => m.status === status)
    .map((milestone) => ({ milestone, metric: metricById.get(milestone.metricId)! }))
    .filter((x) => x.metric && x.metric.profileId === profileId)
}
