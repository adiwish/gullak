export type Direction = 'higher' | 'lower'
export type MetricKind = 'category' | 'plain'
export type MetricStatus = 'active' | 'surrendered' | 'completed'
export type MilestoneStatus = 'upcoming' | 'active' | 'achieved' | 'surrendered'
export type TxnType = 'achieve' | 'spill' | 'withdraw'

export interface Profile {
  id: string
  name: string
  /** Light gate only. Hashed in the Supabase adapter; plain here for local dev. */
  passcode?: string
}

export interface Metric {
  id: string
  profileId: string
  name: string
  kind: MetricKind
  direction: Direction
  unit?: string
  /** ISO date (yyyy-mm-dd). Category start; milestone 1 default. */
  startDate?: string
  status: MetricStatus
  sortOrder: number
}

export interface Milestone {
  id: string
  metricId: string
  seq: number
  target: number
  reward: number
  durationWeeks: number
  /** Explicit override; else computed from category/previous. */
  startDate?: string
  status: MilestoneStatus
  spillCount: number
  activatedOn?: string
  deadline?: string
  /** Effective completion = min(action date, deadline). */
  completedOn?: string
}

export interface DailyLog {
  id: string
  metricId: string
  /** ISO date */
  date: string
  value: number
}

export interface Transaction {
  id: string
  profileId: string
  type: TxnType
  /** Signed: +reward (achieve) / -half (spill) / -amount (withdraw). */
  amount: number
  milestoneId?: string
  note?: string
  createdAt: string
}

export interface GraphLine {
  id: string
  metricId: string
  color?: string
  visible: boolean
}

export interface GraphWidget {
  id: string
  profileId: string
  title: string
  visible: boolean
  sortOrder: number
  lines: GraphLine[]
}

export interface AppData {
  profiles: Profile[]
  metrics: Metric[]
  milestones: Milestone[]
  dailyLogs: DailyLog[]
  transactions: Transaction[]
  widgets: GraphWidget[]
  currentProfileId?: string
}
