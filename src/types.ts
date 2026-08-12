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

export interface Todo {
  id: string
  profileId: string
  title: string
  /** ISO date this task belongs to. */
  date: string
  /** Optional link to the milestone this task helps progress. */
  milestoneId?: string
  /** Value written to DailyLog when a linked task is completed. */
  logValue?: number
  completed: boolean
  createdAt: string
  completedAt?: string
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

export type BalancedTimerUnit = 'minutes' | 'hours'

export interface BalancedActivity {
  id: string
  profileId: string
  name: string
  unit: string
  /** Present only when this activity can be measured with the built-in timer. */
  timerUnit?: BalancedTimerUnit
  /** Optional personal floor. When omitted, the default 20% encouragement band is used. */
  minimum?: number
  /** The user's protective 100% boundary. Status bands are derived internally. */
  dailyLimit: number
  sortOrder: number
  createdAt: string
}

export interface BalancedDailyLog {
  id: string
  activityId: string
  /** ISO date (yyyy-mm-dd). One total per activity per date. */
  date: string
  value: number
  source: 'manual' | 'timer'
  updatedAt: string
}

export interface AppData {
  profiles: Profile[]
  metrics: Metric[]
  milestones: Milestone[]
  dailyLogs: DailyLog[]
  todos: Todo[]
  transactions: Transaction[]
  widgets: GraphWidget[]
  balancedActivities: BalancedActivity[]
  balancedDailyLogs: BalancedDailyLog[]
  currentProfileId?: string
}
