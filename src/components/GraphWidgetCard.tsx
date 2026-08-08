import { useMemo } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Eye, EyeOff, PencilLine } from 'lucide-react'
import type { GraphWidget } from '@/types'
import { useStore } from '@/store/StoreContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/format'
import { CHART_COLORS } from '@/data/seed'

export function GraphWidgetCard({
  widget,
  onEdit,
}: {
  widget: GraphWidget
  onEdit?: (widgetId: string) => void
}) {
  const { data, toggleWidgetVisible, toggleLineVisible } = useStore()

  const metricById = useMemo(
    () => new Map(data.metrics.map((m) => [m.id, m])),
    [data.metrics],
  )

  const chartData = useMemo(() => {
    const metricIds = widget.lines.map((l) => l.metricId)
    const dates = Array.from(
      new Set(data.dailyLogs.filter((l) => metricIds.includes(l.metricId)).map((l) => l.date)),
    ).sort()
    return dates.map((date) => {
      const row: Record<string, number | string | null> = { date }
      for (const line of widget.lines) {
        const log = data.dailyLogs.find((l) => l.metricId === line.metricId && l.date === date)
        row[line.metricId] = log ? log.value : null
      }
      return row
    })
  }, [data.dailyLogs, widget.lines])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="uppercase tracking-wider text-muted-foreground">
          {widget.title}
        </CardTitle>
        <div className="flex items-center gap-1">
          {widget.lines.map((line, i) => {
            const metric = metricById.get(line.metricId)
            const color = line.color ?? CHART_COLORS[i % CHART_COLORS.length]
            return (
              <button
                key={line.id}
                onClick={() => toggleLineVisible(widget.id, line.id)}
                className={cn(
                  'flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] transition-opacity',
                  !line.visible && 'opacity-40',
                )}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                {metric?.name ?? 'Metric'}
              </button>
            )
          })}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => toggleWidgetVisible(widget.id)}
            aria-label="Toggle widget"
          >
            {widget.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </Button>
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onEdit(widget.id)}
              aria-label="Edit graph"
            >
              <PencilLine className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!widget.visible ? (
          <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
            Hidden
          </div>
        ) : (
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 6, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => formatDate(String(v))}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  width={46}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelFormatter={(v) => formatDate(String(v))}
                />
                {widget.lines
                  .filter((l) => l.visible)
                  .map((line, i) => (
                    <Line
                      key={line.id}
                      type="monotone"
                      dataKey={line.metricId}
                      name={metricById.get(line.metricId)?.name ?? 'Metric'}
                      stroke={line.color ?? CHART_COLORS[i % CHART_COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                  ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
