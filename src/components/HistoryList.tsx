import { Check, X } from 'lucide-react'
import { useStore } from '@/store/StoreContext'
import { historyItems } from '@/store/selectors'
import { formatDate, formatRupees } from '@/lib/format'
import { cn } from '@/lib/utils'

export function HistoryList() {
  const { data } = useStore()
  const pid = data.currentProfileId!
  const items = historyItems(data, pid)

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No history yet.</p>
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-card">
      {items.map(({ milestone, metric }) => {
        const achieved = milestone.status === 'achieved'
        return (
          <li
            key={milestone.id}
            className={cn(
              'flex items-center justify-between gap-3 px-4 py-2.5 text-sm',
              !achieved && 'opacity-55',
            )}
          >
            <div className="flex min-w-0 items-center gap-2">
              {achieved ? (
                <Check className="h-4 w-4 shrink-0 text-success" />
              ) : (
                <X className="h-4 w-4 shrink-0 text-danger" />
              )}
              <span className="truncate">
                {metric.name} · M{milestone.seq} · {milestone.target} {metric.unit}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="font-mono text-xs tabular text-muted-foreground">
                {achieved ? formatRupees(milestone.reward) : 'surrendered'}
              </span>
              <span className="text-xs text-muted-foreground">{formatDate(milestone.completedOn)}</span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
