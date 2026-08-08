import { Plus } from 'lucide-react'
import { useStore } from '@/store/StoreContext'
import { activeMilestone, categoriesOf } from '@/store/selectors'
import { MilestoneRow } from '@/components/MilestoneRow'
import { Button } from '@/components/ui/button'

export function ActiveMilestones({
  onEditMetric,
  onNewGoal,
}: {
  onEditMetric: (metricId: string) => void
  onNewGoal: () => void
}) {
  const { data } = useStore()
  const pid = data.currentProfileId!
  const rows = categoriesOf(data, pid)
    .filter((m) => m.status === 'active')
    .map((metric) => ({ metric, milestone: activeMilestone(data, metric.id) }))
    .filter((r) => r.milestone)

  return (
    <div className="space-y-3">
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No active milestones yet.</p>
      ) : (
        rows.map(({ metric, milestone }) => (
          <MilestoneRow key={milestone!.id} metric={metric} milestone={milestone!} onEdit={onEditMetric} />
        ))
      )}
      <Button variant="outline" size="sm" onClick={onNewGoal}>
        <Plus className="h-3.5 w-3.5" /> New goal
      </Button>
    </div>
  )
}

