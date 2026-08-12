import type { BalancedActivity } from '@/types'
import { balancedStatus, balancedStatusLabel } from '@/lib/balanced'
import { cn } from '@/lib/utils'

export function balancedStatusClasses(status: ReturnType<typeof balancedStatus>): string {
  switch (status) {
    case 'not-recorded': return 'border-border bg-muted/50 text-muted-foreground'
    case 'below-minimum': return 'border-blue-400/50 bg-blue-500/10 text-blue-700 dark:text-blue-300'
    case 'something': return 'border-blue-400/50 bg-blue-500/15 text-blue-700 dark:text-blue-300'
    case 'light': return 'border-sky-400/50 bg-sky-500/15 text-sky-700 dark:text-sky-300'
    case 'good': return 'border-emerald-400/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
    case 'excellent': return 'border-green-500/60 bg-green-500/20 text-green-700 dark:text-green-300'
    case 'over-maximum': return 'border-orange-500/50 bg-orange-500/15 text-orange-700 dark:text-orange-300'
  }
}

export function BalancedRangeBar({ activity, value }: { activity: BalancedActivity; value?: number }) {
  const scale = activity.dailyLimit > 0 ? activity.dailyLimit : 1
  const pointer = value === undefined ? undefined : Math.min(100, Math.max(0, (value / scale) * 100))
  const minimumPointer = activity.minimum === undefined
    ? undefined
    : Math.min(100, Math.max(0, (activity.minimum / scale) * 100))
  const status = balancedStatus(activity, value)

  return (
    <div>
      <div
        className="relative h-3 overflow-visible rounded-full bg-blue-500/20"
        role="img"
        aria-label={`Progress toward daily limit ${activity.dailyLimit}. ${balancedStatusLabel(status, activity)}`}
      >
        <span className="absolute inset-y-0 bg-sky-500/35" style={{ left: '20%', width: '30%' }} />
        <span className="absolute inset-y-0 bg-emerald-500/45" style={{ left: '50%', width: '30%' }} />
        <span className="absolute inset-y-0 bg-green-500/70" style={{ left: '80%', right: 0 }} />
        {minimumPointer !== undefined && (
          <span className="absolute inset-y-[-2px] w-px bg-foreground/60" style={{ left: `${minimumPointer}%` }} />
        )}
        {pointer !== undefined && (
          <span
            className={cn(
              'absolute top-1/2 h-5 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-card',
              status === 'over-maximum' ? 'bg-orange-600' : 'bg-foreground',
            )}
            style={{ left: `${pointer}%` }}
          />
        )}
      </div>
      <div className="mt-1.5 grid grid-cols-4 text-[10px] text-muted-foreground">
        <span>{activity.minimum === undefined ? '20% Started' : `Min ${activity.minimum}`}</span>
        <span className="text-center">50% Good</span>
        <span className="text-center">80% Excellent</span>
        <span className="text-right">Limit {activity.dailyLimit}</span>
      </div>
    </div>
  )
}
