import { useEffect, useMemo, useState } from 'react'
import { Clock3, Pause, Pencil, Play, Plus, RotateCcw, Square, Trash2 } from 'lucide-react'
import type { ProductMode } from '@/App'
import type { BalancedActivity } from '@/types'
import { useStore } from '@/store/StoreContext'
import { addDaysISO, todayISO } from '@/lib/date'
import {
  balancedLogFor,
  balancedStatus,
  balancedStatusLabel,
  durationValue,
  formatBalancedValue,
} from '@/lib/balanced'
import { formatDate, formatDateLong } from '@/lib/format'
import { Header } from '@/components/Header'
import { BalancedActivityDialog } from '@/components/BalancedActivityDialog'
import { BalancedRangeBar, balancedStatusClasses } from '@/components/BalancedRangeBar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface TimerState {
  profileId: string
  activityId: string
  date: string
  accumulatedMs: number
  runningSince?: number
}

const TIMER_KEY = 'gullak.balanced.timer'

function loadTimer(): TimerState | undefined {
  try {
    const raw = localStorage.getItem(TIMER_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as TimerState
    if (!parsed.profileId || !parsed.activityId || !parsed.date || !Number.isFinite(parsed.accumulatedMs)) return undefined
    return parsed
  } catch {
    return undefined
  }
}

function elapsedMs(timer: TimerState, now: number): number {
  return timer.accumulatedMs + (timer.runningSince ? Math.max(0, now - timer.runningSince) : 0)
}

function timerClock(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60
  return [hours, minutes, rest].map((part) => String(part).padStart(2, '0')).join(':')
}

export function BalancedPage({
  productMode,
  onProductModeChange,
}: {
  productMode: ProductMode
  onProductModeChange: (mode: ProductMode) => void
}) {
  const {
    data,
    deleteBalancedActivity,
    setBalancedDailyTotal,
    deleteBalancedDailyTotal,
  } = useStore()
  const profileId = data.currentProfileId!
  const activities = useMemo(
    () => data.balancedActivities
      .filter((activity) => activity.profileId === profileId)
      .sort((a, b) => a.sortOrder - b.sortOrder),
    [data.balancedActivities, profileId],
  )
  const [dialog, setDialog] = useState<{ open: boolean; activityId?: string }>({ open: false })
  const [timer, setTimer] = useState<TimerState | undefined>(loadTimer)
  const [now, setNow] = useState(Date.now())
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const today = todayISO()
  const dates = useMemo(() => Array.from({ length: 7 }, (_, index) => addDaysISO(today, index - 6)), [today])

  useEffect(() => {
    if (timer) localStorage.setItem(TIMER_KEY, JSON.stringify(timer))
    else localStorage.removeItem(TIMER_KEY)
  }, [timer])

  useEffect(() => {
    if (!timer?.runningSince) return
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [timer?.runningSince])

  useEffect(() => {
    if (timer && (!data.profiles.some((profile) => profile.id === timer.profileId)
      || !data.balancedActivities.some((activity) => activity.id === timer.activityId))) {
      setTimer(undefined)
    }
  }, [data.balancedActivities, data.profiles, timer])

  const activeTimerActivity = activities.find((activity) => activity.id === timer?.activityId && timer.profileId === profileId)
  const timerValue = timer && activeTimerActivity
    ? durationValue(elapsedMs(timer, now), activeTimerActivity.timerUnit!)
    : undefined
  const timerExistingValue = timer && activeTimerActivity
    ? balancedLogFor(data.balancedDailyLogs, activeTimerActivity.id, timer.date)?.value ?? 0
    : 0
  const timerProjectedValue = timerValue === undefined ? undefined : timerExistingValue + timerValue

  function startTimer(activity: BalancedActivity) {
    if (timer && (timer.profileId !== profileId || timer.activityId !== activity.id)) {
      if (!window.confirm('Another timer is active. Discard it and start this one?')) return
    }
    setNow(Date.now())
    setTimer({ profileId, activityId: activity.id, date: today, accumulatedMs: 0, runningSince: Date.now() })
  }

  function pauseTimer() {
    if (!timer?.runningSince) return
    const current = Date.now()
    setTimer({ ...timer, accumulatedMs: elapsedMs(timer, current), runningSince: undefined })
    setNow(current)
  }

  function resumeTimer() {
    if (!timer || timer.runningSince) return
    const current = Date.now()
    setTimer({ ...timer, runningSince: current })
    setNow(current)
  }

  function saveTimer() {
    if (!timer || !activeTimerActivity || timerValue === undefined) return
    setBalancedDailyTotal(activeTimerActivity.id, timer.date, timerExistingValue + timerValue, 'timer')
    setTimer(undefined)
  }

  function saveManual(activity: BalancedActivity) {
    const raw = drafts[activity.id]
    const value = Number(raw)
    if (raw === undefined || raw.trim() === '' || !Number.isFinite(value) || value < 0) return
    setBalancedDailyTotal(activity.id, today, value, 'manual')
    setDrafts((current) => ({ ...current, [activity.id]: '' }))
  }

  function removeActivity(activity: BalancedActivity) {
    if (!window.confirm(`Delete ${activity.name} and all of its Balanced logs?`)) return
    if (timer?.activityId === activity.id) setTimer(undefined)
    deleteBalancedActivity(activity.id)
  }

  const editingActivity = data.balancedActivities.find((activity) => activity.id === dialog.activityId)

  return (
    <div className="mx-auto max-w-5xl px-4 pb-20">
      <Header productMode={productMode} onProductModeChange={onProductModeChange} />

      <main className="space-y-6 pt-2">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Balanced</p>
            <h1 className="mt-1 font-serif text-3xl font-semibold">Sustainable progress</h1>
            <p className="mt-1 text-sm text-muted-foreground">Stay between your floor and ceiling. More is not always better.</p>
          </div>
          <Button onClick={() => setDialog({ open: true })}><Plus className="h-4 w-4" /> New activity</Button>
        </div>

        {activeTimerActivity && timer && (
          <Card className={cn(timerProjectedValue !== undefined && timerProjectedValue > activeTimerActivity.dailyLimit && 'border-orange-500/60')}>
            <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active timer · {activeTimerActivity.name}</p>
                <p className="mt-1 font-mono text-3xl tabular">{timerClock(elapsedMs(timer, now))}</p>
                <p className={cn('mt-1 text-xs text-muted-foreground', timerProjectedValue !== undefined && timerProjectedValue > activeTimerActivity.dailyLimit && 'font-medium text-orange-600 dark:text-orange-300')}>
                  {timerProjectedValue !== undefined && timerProjectedValue > activeTimerActivity.dailyLimit
                    ? `Daily limit crossed · total will be ${formatBalancedValue(timerProjectedValue, activeTimerActivity.unit)} ${activeTimerActivity.unit}`
                    : `Started for ${formatDate(timer.date)} · adds to that day's total`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {timer.runningSince
                  ? <Button variant="outline" onClick={pauseTimer}><Pause className="h-4 w-4" /> Pause</Button>
                  : <Button variant="outline" onClick={resumeTimer}><Play className="h-4 w-4" /> Resume</Button>}
                <Button onClick={saveTimer}><Square className="h-4 w-4" /> Add time</Button>
                <Button variant="ghost" onClick={() => window.confirm('Discard this timer?') && setTimer(undefined)}><RotateCcw className="h-4 w-4" /> Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <section aria-labelledby="balanced-today">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 id="balanced-today" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Today</h2>
              <p className="mt-1 font-serif text-xl">{formatDateLong(today)}</p>
            </div>
          </div>

          {activities.length === 0 ? (
            <button
              type="button"
              onClick={() => setDialog({ open: true })}
              className="flex w-full flex-col items-center rounded-lg border border-dashed border-border bg-card/50 px-4 py-16 text-center hover:bg-secondary/50"
            >
              <span className="font-serif text-xl">Set your first sustainable range</span>
              <span className="mt-1 text-sm text-muted-foreground">Set one daily limit. Progress bands are calculated automatically.</span>
            </button>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {activities.map((activity) => {
                const log = balancedLogFor(data.balancedDailyLogs, activity.id, today)
                const status = balancedStatus(activity, log?.value)
                const raw = drafts[activity.id] ?? ''
                const validDraft = raw.trim() !== '' && Number.isFinite(Number(raw)) && Number(raw) >= 0
                const timerIsThis = timer?.profileId === profileId && timer.activityId === activity.id
                return (
                  <Card key={activity.id}>
                    <CardHeader className="items-start">
                      <div>
                        <CardTitle className="text-base">{activity.name}</CardTitle>
                        <p className="mt-1 font-mono text-2xl tabular">
                          {log ? formatBalancedValue(log.value, activity.unit) : '—'} <span className="font-sans text-sm text-muted-foreground">{activity.unit}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={cn('rounded-full border px-2 py-1 text-[11px] font-medium', balancedStatusClasses(status))}>{balancedStatusLabel(status, activity)}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDialog({ open: true, activityId: activity.id })} aria-label={`Edit ${activity.name}`}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeActivity(activity)} aria-label={`Delete ${activity.name}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <BalancedRangeBar activity={activity} value={log?.value} />
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          inputMode="decimal"
                          value={raw}
                          onChange={(event) => setDrafts((current) => ({ ...current, [activity.id]: event.target.value }))}
                          onKeyDown={(event) => { if (event.key === 'Enter') saveManual(activity) }}
                          placeholder={log ? `Replace ${formatBalancedValue(log.value, activity.unit)}` : 'Enter total'}
                          aria-label={`Today's ${activity.name} total in ${activity.unit}`}
                        />
                        <Button variant="outline" disabled={!validDraft} onClick={() => saveManual(activity)}>Save</Button>
                        {log && <Button variant="ghost" size="icon" onClick={() => deleteBalancedDailyTotal(activity.id, today)} aria-label={`Clear today's ${activity.name} total`}><RotateCcw className="h-4 w-4" /></Button>}
                      </div>
                      {activity.timerUnit && !timerIsThis && (
                        <Button variant="outline" size="sm" onClick={() => startTimer(activity)}><Clock3 className="h-3.5 w-3.5" /> Start timer</Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </section>

        {activities.length > 0 && (
          <section aria-labelledby="balanced-week">
            <div className="mb-3">
              <h2 id="balanced-week" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">This week</h2>
              <p className="mt-1 text-sm text-muted-foreground">Rolling seven days · {formatDate(dates[0])}–{formatDate(dates[6])}</p>
            </div>
            <div className="space-y-3">
              {activities.map((activity) => {
                const days = dates.map((date) => {
                  const log = balancedLogFor(data.balancedDailyLogs, activity.id, date)
                  return { date, log, status: balancedStatus(activity, log?.value) }
                })
                const excellent = days.filter((day) => day.status === 'excellent').length
                const goodOrBetter = days.filter((day) => day.status === 'good' || day.status === 'excellent').length
                return (
                  <Card key={activity.id}>
                    <CardContent className="py-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">{activity.name}</p>
                        <p className="text-xs text-muted-foreground"><span className="font-semibold text-green-700 dark:text-green-300">{excellent}/7 excellent</span> · {goodOrBetter}/7 good+</p>
                      </div>
                      <div className="grid grid-cols-7 gap-1.5">
                        {days.map(({ date, log, status }) => (
                          <div key={date} className="min-w-0 text-center">
                            <p className="mb-1 text-[10px] uppercase text-muted-foreground">{new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2)}</p>
                            <div
                              className={cn('flex h-14 flex-col items-center justify-center rounded-md border px-0.5', balancedStatusClasses(status))}
                              title={`${formatDate(date)}: ${log ? `${formatBalancedValue(log.value, activity.unit)} ${activity.unit}` : 'Not recorded'} · ${balancedStatusLabel(status, activity)}`}
                              aria-label={`${formatDate(date)}, ${log ? `${log.value} ${activity.unit}` : 'not recorded'}, ${balancedStatusLabel(status, activity)}`}
                            >
                              <span className="truncate font-mono text-xs tabular">{log ? formatBalancedValue(log.value, activity.unit) : '—'}</span>
                              <span className="mt-0.5 hidden text-[9px] sm:block">{log ? activity.unit : ''}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>
        )}
      </main>

      <BalancedActivityDialog
        open={dialog.open}
        activity={editingActivity}
        onClose={() => setDialog({ open: false })}
      />
    </div>
  )
}
