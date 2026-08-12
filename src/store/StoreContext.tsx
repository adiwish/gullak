import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type {
  AppData,
  BalancedActivity,
  Direction,
  GraphWidget,
  Metric,
  MetricKind,
  Milestone,
  MilestoneStatus,
  Todo,
} from '@/types'
import { buildSeed, CHART_COLORS } from '@/data/seed'
import { uid } from '@/lib/utils'
import { addWeeksISO, minISO, todayISO } from '@/lib/date'
import { spillPenalty } from '@/lib/money'
import { isRemote } from '@/lib/supabase'
import { loadRemote, saveRemote, shared, subscribeRemote } from '@/store/remote'

export interface NewCategoryInput {
  name: string
  kind: MetricKind
  direction: Direction
  unit?: string
  startDate?: string
  milestones: { target: number; reward: number; durationWeeks: number }[]
}

export interface NewMilestoneInput {
  target: number
  reward: number
  durationWeeks: number
}

export interface TodoInput {
  title: string
  date: string
  milestoneId?: string
  logValue?: number
}

export interface BalancedActivityInput {
  name: string
  unit: string
  timerUnit?: 'minutes' | 'hours'
  minimum?: number
  dailyLimit: number
}

const STORAGE_KEY = 'gullak.v2'

function profileNameKey(name: string): string {
  return name.trim().toLocaleLowerCase()
}

function starterBalancedActivities(profileId: string): BalancedActivity[] {
  const createdAt = new Date().toISOString()
  return [
    {
      id: uid(),
      profileId,
      name: 'Coding',
      unit: 'minutes',
      timerUnit: 'minutes',
      minimum: 20,
      dailyLimit: 120,
      sortOrder: 0,
      createdAt,
    },
    {
      id: uid(),
      profileId,
      name: 'Reading',
      unit: 'pages',
      minimum: 10,
      dailyLimit: 40,
      sortOrder: 1,
      createdAt,
    },
  ]
}

function load(): AppData {
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        return normalizeData(JSON.parse(raw) as AppData)
      } catch {
        /* fall through to seed */
      }
    }
  }
  return buildSeed()
}

function normalizeData(data: AppData): AppData {
  return {
    ...data,
    todos: data.todos ?? [],
    balancedActivities: (data.balancedActivities ?? []).map((activity) => {
      const legacy = activity as BalancedActivity & { minimum?: number; maximum?: number }
      return {
        ...activity,
        minimum: legacy.minimum,
        dailyLimit: activity.dailyLimit ?? legacy.maximum ?? 1,
      }
    }),
    balancedDailyLogs: data.balancedDailyLogs ?? [],
  }
}

interface StoreValue {
  data: AppData
  setCurrentProfile: (id: string) => void
  addProfile: (name: string, passcode?: string) =>
    | { ok: true; id: string }
    | { ok: false; reason: 'duplicate' }
  logValue: (metricId: string, value: number, date?: string) => void
  achieve: (milestoneId: string) => void
  spill: (milestoneId: string) => void
  surrender: (milestoneId: string) => void
  withdraw: (amount: number, note?: string) => void
  toggleWidgetVisible: (widgetId: string) => void
  toggleLineVisible: (widgetId: string, lineId: string) => void
  resetToSeed: () => void
  // CRUD
  addCategory: (input: NewCategoryInput) => void
  updateMetric: (id: string, patch: Partial<Metric>) => void
  deleteMetric: (id: string) => void
  addMilestone: (metricId: string, input: NewMilestoneInput) => void
  updateMilestone: (id: string, patch: Partial<Milestone>) => void
  deleteMilestone: (id: string) => void
  moveMilestone: (id: string, dir: -1 | 1) => void
  addWidget: (title: string) => string
  updateWidget: (id: string, patch: Partial<GraphWidget>) => void
  deleteWidget: (id: string) => void
  addLine: (widgetId: string, metricId: string) => void
  removeLine: (widgetId: string, lineId: string) => void
  addTodo: (input: TodoInput) => string
  updateTodo: (id: string, patch: Partial<TodoInput>) => void
  deleteTodo: (id: string) => void
  setTodoCompleted: (id: string, completed: boolean, logValue?: number) => void
  addBalancedActivity: (input: BalancedActivityInput) => string
  updateBalancedActivity: (id: string, input: BalancedActivityInput) => void
  deleteBalancedActivity: (id: string) => void
  setBalancedDailyTotal: (
    activityId: string,
    date: string,
    value: number,
    source: 'manual' | 'timer',
  ) => void
  deleteBalancedDailyTotal: (activityId: string, date: string) => void
}

const StoreContext = createContext<StoreValue | undefined>(undefined)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(load)
  const dataRef = useRef(data)
  dataRef.current = data
  const profileNamesRef = useRef(new Set<string>())
  profileNamesRef.current = new Set(data.profiles.map((profile) => profileNameKey(profile.name)))
  const lastSync = useRef<string>('')

  // Persist locally always.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  // Optional shared online sync (only when Supabase env is configured).
  useEffect(() => {
    if (!isRemote) return
    let unsub = () => {}
    ;(async () => {
      const remote = await loadRemote()
      if (remote) {
        const normalized = normalizeData(remote)
        lastSync.current = JSON.stringify(shared(normalized))
        setData((d) => ({ ...normalized, currentProfileId: d.currentProfileId ?? normalized.currentProfileId }))
      } else {
        lastSync.current = JSON.stringify(shared(dataRef.current))
        void saveRemote(dataRef.current)
      }
      unsub = subscribeRemote((next) => {
        const normalized = normalizeData(next)
        const s = JSON.stringify(shared(normalized))
        if (s === lastSync.current) return
        lastSync.current = s
        setData((d) => ({ ...normalized, currentProfileId: d.currentProfileId }))
      })
    })()
    return () => unsub()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounced push of local changes to remote.
  useEffect(() => {
    if (!isRemote) return
    const s = JSON.stringify(shared(data))
    if (s === lastSync.current) return
    const t = setTimeout(() => {
      lastSync.current = s
      void saveRemote(data)
    }, 600)
    return () => clearTimeout(t)
  }, [data])

  const value = useMemo<StoreValue>(() => {
    const nextSeqActivation = (m: Milestone, completedOn: string): Partial<Milestone> => ({
      status: 'active',
      activatedOn: completedOn,
      deadline: addWeeksISO(completedOn, m.durationWeeks),
    })

    return {
      data,

      setCurrentProfile: (id) => setData((d) => ({ ...d, currentProfileId: id })),

      addProfile: (name, passcode) => {
        const trimmedName = name.trim()
        const nameKey = profileNameKey(trimmedName)
        if (profileNamesRef.current.has(nameKey)) {
          return { ok: false, reason: 'duplicate' }
        }

        // Reserve the name immediately so rapid repeated submissions cannot
        // create duplicates before React has rendered the updated state.
        profileNamesRef.current.add(nameKey)
        const id = uid()
        setData((d) => ({
          ...d,
          profiles: [...d.profiles, { id, name: trimmedName, passcode }],
          balancedActivities: [...d.balancedActivities, ...starterBalancedActivities(id)],
        }))
        return { ok: true, id }
      },

      logValue: (metricId, value, date = todayISO()) => {
        setData((d) => {
          const existing = d.dailyLogs.find((l) => l.metricId === metricId && l.date === date)
          if (existing) {
            return {
              ...d,
              dailyLogs: d.dailyLogs.map((l) =>
                l.id === existing.id ? { ...l, value } : l,
              ),
            }
          }
          return {
            ...d,
            dailyLogs: [...d.dailyLogs, { id: uid(), metricId, date, value }],
          }
        })
      },

      achieve: (milestoneId) => {
        setData((d) => {
          const m = d.milestones.find((x) => x.id === milestoneId)
          if (!m) return d
          const today = todayISO()
          const completedOn = m.deadline ? minISO(today, m.deadline) : today
          const next = d.milestones
            .filter((x) => x.metricId === m.metricId && x.seq === m.seq + 1)
            .sort((a, b) => a.seq - b.seq)[0]

          const milestones = d.milestones.map((x) => {
            if (x.id === m.id) return { ...x, status: 'achieved' as const, completedOn }
            if (next && x.id === next.id) return { ...x, ...nextSeqActivation(next, completedOn) }
            return x
          })

          const metrics = next
            ? d.metrics
            : d.metrics.map((x) => (x.id === m.metricId ? { ...x, status: 'completed' as const } : x))

          const transactions = [
            ...d.transactions,
            {
              id: uid(),
              profileId: metricProfile(d, m.metricId),
              type: 'achieve' as const,
              amount: m.reward,
              milestoneId: m.id,
              createdAt: today,
            },
          ]

          return { ...d, milestones, metrics, transactions }
        })
      },

      spill: (milestoneId) => {
        setData((d) => {
          const m = d.milestones.find((x) => x.id === milestoneId)
          if (!m) return d
          const today = todayISO()
          const base = m.deadline ? minISO(today, m.deadline) : today
          const milestones = d.milestones.map((x) =>
            x.id === m.id
              ? { ...x, spillCount: x.spillCount + 1, deadline: addWeeksISO(base, x.durationWeeks) }
              : x,
          )
          const transactions = [
            ...d.transactions,
            {
              id: uid(),
              profileId: metricProfile(d, m.metricId),
              type: 'spill' as const,
              amount: -spillPenalty(m.reward),
              milestoneId: m.id,
              createdAt: today,
            },
          ]
          return { ...d, milestones, transactions }
        })
      },

      surrender: (milestoneId) => {
        setData((d) => {
          const m = d.milestones.find((x) => x.id === milestoneId)
          if (!m) return d
          const today = todayISO()
          const completedOn = m.deadline ? minISO(today, m.deadline) : today
          const milestones = d.milestones.map((x) =>
            x.id === m.id ? { ...x, status: 'surrendered' as const, completedOn } : x,
          )
          const metrics = d.metrics.map((x) =>
            x.id === m.metricId ? { ...x, status: 'surrendered' as const } : x,
          )
          return { ...d, milestones, metrics }
        })
      },

      withdraw: (amount, note) => {
        setData((d) => ({
          ...d,
          transactions: [
            ...d.transactions,
            {
              id: uid(),
              profileId: d.currentProfileId!,
              type: 'withdraw' as const,
              amount: -Math.abs(amount),
              note,
              createdAt: todayISO(),
            },
          ],
        }))
      },

      toggleWidgetVisible: (widgetId) =>
        setData((d) => ({
          ...d,
          widgets: d.widgets.map((w) =>
            w.id === widgetId ? { ...w, visible: !w.visible } : w,
          ),
        })),

      toggleLineVisible: (widgetId, lineId) =>
        setData((d) => ({
          ...d,
          widgets: d.widgets.map((w) =>
            w.id === widgetId
              ? { ...w, lines: w.lines.map((l) => (l.id === lineId ? { ...l, visible: !l.visible } : l)) }
              : w,
          ),
        })),

      resetToSeed: () => setData(buildSeed()),

      addCategory: (input) =>
        setData((d) => {
          const start = input.startDate || todayISO()
          const sortOrder =
            Math.max(-1, ...d.metrics.filter((m) => m.profileId === d.currentProfileId).map((m) => m.sortOrder)) + 1
          const metricId = uid()
          const metric: Metric = {
            id: metricId,
            profileId: d.currentProfileId!,
            name: input.name,
            kind: input.kind,
            direction: input.direction,
            unit: input.unit,
            startDate: start,
            status: 'active',
            sortOrder,
          }
          const milestones =
            input.kind === 'category'
              ? input.milestones.map((m, i) => ({
                  id: uid(),
                  metricId,
                  seq: i + 1,
                  target: m.target,
                  reward: m.reward,
                  durationWeeks: m.durationWeeks,
                  status: (i === 0 ? 'active' : 'upcoming') as MilestoneStatus,
                  spillCount: 0,
                  activatedOn: i === 0 ? start : undefined,
                  deadline: i === 0 ? addWeeksISO(start, m.durationWeeks) : undefined,
                }))
              : []
          return { ...d, metrics: [...d.metrics, metric], milestones: [...d.milestones, ...milestones] }
        }),

      updateMetric: (id, patch) =>
        setData((d) => ({ ...d, metrics: d.metrics.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),

      deleteMetric: (id) =>
        setData((d) => ({
          ...d,
          metrics: d.metrics.filter((m) => m.id !== id),
          milestones: d.milestones.filter((m) => m.metricId !== id),
          dailyLogs: d.dailyLogs.filter((l) => l.metricId !== id),
          todos: d.todos.map((todo) => {
            const milestone = d.milestones.find((m) => m.id === todo.milestoneId)
            return milestone?.metricId === id ? { ...todo, milestoneId: undefined, logValue: undefined } : todo
          }),
          widgets: d.widgets.map((w) => ({ ...w, lines: w.lines.filter((l) => l.metricId !== id) })),
        })),

      addMilestone: (metricId, input) =>
        setData((d) => {
          const seq = Math.max(0, ...d.milestones.filter((m) => m.metricId === metricId).map((m) => m.seq)) + 1
          return {
            ...d,
            milestones: [
              ...d.milestones,
              {
                id: uid(),
                metricId,
                seq,
                target: input.target,
                reward: input.reward,
                durationWeeks: input.durationWeeks,
                status: 'upcoming',
                spillCount: 0,
              },
            ],
          }
        }),

      updateMilestone: (id, patch) =>
        setData((d) => ({
          ...d,
          milestones: d.milestones.map((m) => {
            if (m.id !== id) return m
            const next = { ...m, ...patch }
            if (next.status === 'active' && next.activatedOn && patch.durationWeeks !== undefined) {
              next.deadline = addWeeksISO(next.activatedOn, next.durationWeeks)
            }
            return next
          }),
        })),

      deleteMilestone: (id) =>
        setData((d) => {
          const target = d.milestones.find((m) => m.id === id)
          if (!target) return d
          const rest = d.milestones.filter((m) => m.id !== id)
          const reseq = rest
            .filter((m) => m.metricId === target.metricId)
            .sort((a, b) => a.seq - b.seq)
            .map((m, i) => ({ ...m, seq: i + 1 }))
          const others = rest.filter((m) => m.metricId !== target.metricId)
          return {
            ...d,
            milestones: [...others, ...reseq],
            todos: d.todos.map((todo) =>
              todo.milestoneId === id ? { ...todo, milestoneId: undefined, logValue: undefined } : todo,
            ),
          }
        }),

      moveMilestone: (id, dir) =>
        setData((d) => {
          const m = d.milestones.find((x) => x.id === id)
          if (!m) return d
          const siblings = d.milestones
            .filter((x) => x.metricId === m.metricId)
            .sort((a, b) => a.seq - b.seq)
          const idx = siblings.findIndex((x) => x.id === id)
          const j = idx + dir
          if (j < 0 || j >= siblings.length) return d
          const a = siblings[idx]
          const b = siblings[j]
          return {
            ...d,
            milestones: d.milestones.map((x) =>
              x.id === a.id ? { ...x, seq: b.seq } : x.id === b.id ? { ...x, seq: a.seq } : x,
            ),
          }
        }),

      addWidget: (title) => {
        const id = uid()
        setData((d) => ({
          ...d,
          widgets: [
            ...d.widgets,
            {
              id,
              profileId: d.currentProfileId!,
              title,
              visible: true,
              sortOrder:
                Math.max(-1, ...d.widgets.filter((w) => w.profileId === d.currentProfileId).map((w) => w.sortOrder)) + 1,
              lines: [],
            },
          ],
        }))
        return id
      },

      updateWidget: (id, patch) =>
        setData((d) => ({ ...d, widgets: d.widgets.map((w) => (w.id === id ? { ...w, ...patch } : w)) })),

      deleteWidget: (id) => setData((d) => ({ ...d, widgets: d.widgets.filter((w) => w.id !== id) })),

      addLine: (widgetId, metricId) =>
        setData((d) => ({
          ...d,
          widgets: d.widgets.map((w) => {
            if (w.id !== widgetId) return w
            if (w.lines.some((l) => l.metricId === metricId)) return w
            const color = CHART_COLORS[w.lines.length % CHART_COLORS.length]
            return { ...w, lines: [...w.lines, { id: uid(), metricId, color, visible: true }] }
          }),
        })),

      removeLine: (widgetId, lineId) =>
        setData((d) => ({
          ...d,
          widgets: d.widgets.map((w) =>
            w.id === widgetId ? { ...w, lines: w.lines.filter((l) => l.id !== lineId) } : w,
          ),
        })),

      addTodo: (input) => {
        const id = uid()
        setData((d) => ({
          ...d,
          todos: [
            ...d.todos,
            {
              id,
              profileId: d.currentProfileId!,
              title: input.title,
              date: input.date,
              milestoneId: input.milestoneId,
              logValue: input.logValue,
              completed: false,
              createdAt: new Date().toISOString(),
            },
          ],
        }))
        return id
      },

      updateTodo: (id, patch) =>
        setData((d) => ({
          ...d,
          todos: d.todos.map((todo) => (todo.id === id ? { ...todo, ...patch } : todo)),
        })),

      deleteTodo: (id) =>
        setData((d) => ({ ...d, todos: d.todos.filter((todo) => todo.id !== id) })),

      setTodoCompleted: (id, completed, suppliedValue) =>
        setData((d) => {
          const todo = d.todos.find((item) => item.id === id)
          if (!todo) return d

          const milestone = todo.milestoneId
            ? d.milestones.find((item) => item.id === todo.milestoneId)
            : undefined
          const valueToLog = suppliedValue ?? todo.logValue
          if (completed && milestone && !Number.isFinite(valueToLog)) return d

          let dailyLogs = d.dailyLogs
          if (completed && milestone && valueToLog !== undefined) {
            const existing = dailyLogs.find(
              (log) => log.metricId === milestone.metricId && log.date === todo.date,
            )
            dailyLogs = existing
              ? dailyLogs.map((log) =>
                  log.id === existing.id ? { ...log, value: valueToLog } : log,
                )
              : [
                  ...dailyLogs,
                  { id: uid(), metricId: milestone.metricId, date: todo.date, value: valueToLog },
                ]
          }

          return {
            ...d,
            dailyLogs,
            todos: d.todos.map((item) =>
              item.id === id
                ? {
                    ...item,
                    completed,
                    logValue: valueToLog,
                    completedAt: completed ? new Date().toISOString() : undefined,
                  }
                : item,
            ),
          }
        }),

      addBalancedActivity: (input) => {
        const id = uid()
        setData((d) => {
          const sortOrder = Math.max(
            -1,
            ...d.balancedActivities
              .filter((activity) => activity.profileId === d.currentProfileId)
              .map((activity) => activity.sortOrder),
          ) + 1
          const activity: BalancedActivity = {
            id,
            profileId: d.currentProfileId!,
            ...input,
            sortOrder,
            createdAt: new Date().toISOString(),
          }
          return { ...d, balancedActivities: [...d.balancedActivities, activity] }
        })
        return id
      },

      updateBalancedActivity: (id, input) =>
        setData((d) => ({
          ...d,
          balancedActivities: d.balancedActivities.map((activity) =>
            activity.id === id ? { ...activity, ...input } : activity,
          ),
        })),

      deleteBalancedActivity: (id) =>
        setData((d) => ({
          ...d,
          balancedActivities: d.balancedActivities.filter((activity) => activity.id !== id),
          balancedDailyLogs: d.balancedDailyLogs.filter((log) => log.activityId !== id),
        })),

      setBalancedDailyTotal: (activityId, date, value, source) =>
        setData((d) => {
          const existing = d.balancedDailyLogs.find(
            (log) => log.activityId === activityId && log.date === date,
          )
          const updatedAt = new Date().toISOString()
          return {
            ...d,
            balancedDailyLogs: existing
              ? d.balancedDailyLogs.map((log) =>
                  log.id === existing.id ? { ...log, value, source, updatedAt } : log,
                )
              : [
                  ...d.balancedDailyLogs,
                  { id: uid(), activityId, date, value, source, updatedAt },
                ],
          }
        }),

      deleteBalancedDailyTotal: (activityId, date) =>
        setData((d) => ({
          ...d,
          balancedDailyLogs: d.balancedDailyLogs.filter(
            (log) => log.activityId !== activityId || log.date !== date,
          ),
        })),
    }
  }, [data])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

function metricProfile(d: AppData, metricId: string): string {
  return d.metrics.find((m) => m.id === metricId)?.profileId ?? d.currentProfileId!
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
