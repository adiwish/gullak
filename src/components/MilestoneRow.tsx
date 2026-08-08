import { useState } from 'react'
import { ArrowRight, PencilLine } from 'lucide-react'
import type { Metric, Milestone } from '@/types'
import { useStore } from '@/store/StoreContext'
import { targetMet, todayValue } from '@/store/selectors'
import { isOverdue, todayISO } from '@/lib/date'
import { formatDate, formatRupees } from '@/lib/format'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export function MilestoneRow({
  metric,
  milestone,
  onEdit,
}: {
  metric: Metric
  milestone: Milestone
  onEdit?: (metricId: string) => void
}) {
  const { data, achieve, spill, surrender, logValue } = useStore()
  const value = todayValue(data, metric.id, todayISO())
  const met = targetMet(metric, milestone, value)
  const overdue = isOverdue(milestone.deadline)
  const [entry, setEntry] = useState(value !== undefined ? String(value) : '')

  function onLog() {
    const v = Number(entry)
    if (!Number.isFinite(v) || entry.trim() === '') return
    logValue(metric.id, v)
  }

  function onSurrender() {
    if (window.confirm(`Surrender "${metric.name}"? This closes the whole category.`)) {
      surrender(milestone.id)
    }
  }

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Left: identity + target */}
        <div className="min-w-0 flex-1">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {metric.name} · M{milestone.seq}
            {milestone.spillCount > 0 && (
              <span className="ml-2 normal-case text-danger">spilled ×{milestone.spillCount}</span>
            )}
          </div>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="font-serif text-2xl font-semibold">{milestone.target}</span>
            <span className="text-sm text-muted-foreground">{metric.unit}</span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-sm">
            <span className="font-mono tabular text-accent">{formatRupees(milestone.reward)}</span>
            <span className="text-muted-foreground">·</span>
            {overdue ? (
              <Badge variant="warning">Needs action</Badge>
            ) : (
              <span className="text-muted-foreground">due {formatDate(milestone.deadline)}</span>
            )}
            {met && <Badge variant="success">Target reached</Badge>}
          </div>
        </div>

        {/* Middle: daily log */}
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            placeholder="Today"
            className="w-24"
            aria-label={`Log today's ${metric.name}`}
          />
          <Button variant="outline" size="sm" onClick={onLog}>
            Log
          </Button>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => achieve(milestone.id)} title="Mark achieved">
            Achieved <ArrowRight className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => spill(milestone.id)} title="Spill (retry, −½ reward)">
            Spill
          </Button>
          <Button variant="ghost" size="sm" onClick={onSurrender} className="text-danger" title="Surrender">
            Surrender
          </Button>
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(metric.id)}
              title="Edit goal"
              aria-label="Edit goal"
            >
              <PencilLine className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
