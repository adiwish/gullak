import { useStore } from '@/store/StoreContext'
import { categoriesOf, upcomingMilestone } from '@/store/selectors'
import { formatRupees } from '@/lib/format'

export function UpcomingList() {
  const { data } = useStore()
  const pid = data.currentProfileId!
  const rows = categoriesOf(data, pid)
    .map((metric) => ({ metric, milestone: upcomingMilestone(data, metric.id) }))
    .filter((r) => r.milestone)

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Nothing queued up.</p>
  }

  return (
    <ul className="space-y-1.5">
      {rows.map(({ metric, milestone }) => (
        <li key={milestone!.id} className="flex items-baseline gap-2 text-sm text-muted-foreground">
          <span className="text-foreground/70">
            {metric.name} · M{milestone!.seq}
          </span>
          <span>—</span>
          <span>
            {milestone!.target} {metric.unit}
          </span>
          <span>·</span>
          <span className="font-mono tabular">{formatRupees(milestone!.reward)}</span>
          <span>·</span>
          <span>
            ~{milestone!.durationWeeks} {milestone!.durationWeeks === 1 ? 'week' : 'weeks'}
          </span>
        </li>
      ))}
    </ul>
  )
}
