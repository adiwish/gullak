import { Trophy, Frown } from 'lucide-react'
import { useStore } from '@/store/StoreContext'
import { fame, shame, type FameShameItem } from '@/store/selectors'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatRupees } from '@/lib/format'
import { cn } from '@/lib/utils'

function List({ items, empty, muted }: { items: FameShameItem[]; empty: string; muted?: boolean }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>
  }
  return (
    <ol className="space-y-2">
      {items.map(({ milestone, metric }, i) => (
        <li key={milestone.id} className="flex items-baseline justify-between gap-3 text-sm">
          <span className={cn('truncate', muted && 'text-muted-foreground')}>
            <span className="text-muted-foreground">{i + 1}.</span> {metric.name} — {milestone.target}{' '}
            {metric.unit}
          </span>
          <span className={cn('shrink-0 font-mono text-xs tabular', muted ? 'text-muted-foreground' : 'text-accent')}>
            {formatRupees(milestone.reward)}
          </span>
        </li>
      ))}
    </ol>
  )
}

export function HallOfFameShame() {
  const { data } = useStore()
  const pid = data.currentProfileId!

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5 uppercase tracking-wider text-muted-foreground">
            <Trophy className="h-3.5 w-3.5 text-accent" /> Hall of Fame
          </CardTitle>
        </CardHeader>
        <CardContent>
          <List items={fame(data, pid)} empty="No achievements yet — go earn one." />
        </CardContent>
      </Card>

      <Card className="opacity-90">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5 uppercase tracking-wider text-muted-foreground">
            <Frown className="h-3.5 w-3.5" /> Hall of Shame
          </CardTitle>
        </CardHeader>
        <CardContent>
          <List items={shame(data, pid)} empty="Nothing surrendered. Keep it that way." muted />
        </CardContent>
      </Card>
    </>
  )
}
