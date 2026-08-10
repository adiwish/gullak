import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useStore } from '@/store/StoreContext'
import { activeMilestone, metricsOf } from '@/store/selectors'
import { addDaysISO, todayISO } from '@/lib/date'
import { formatDate } from '@/lib/format'
import { CHART_COLORS } from '@/data/seed'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'

type Range = '7' | '30' | 'all'

export function FocusProgressGraph() {
  const { data } = useStore()
  const metrics = useMemo(
    () => metricsOf(data, data.currentProfileId!),
    [data.currentProfileId, data.metrics],
  )
  const metricIds = useMemo(() => metrics.map((metric) => metric.id), [metrics])
  const [visibleMetricIds, setVisibleMetricIds] = useState<string[]>(metricIds)
  const [range, setRange] = useState<Range>('30')

  useEffect(() => {
    setVisibleMetricIds((current) => {
      const valid = current.filter((id) => metricIds.includes(id))
      const added = metricIds.filter((id) => !current.includes(id))
      return [...valid, ...added]
    })
  }, [metricIds])

  const metricById = useMemo(() => new Map(metrics.map((metric) => [metric.id, metric])), [metrics])
  const colorById = useMemo(
    () => new Map(metrics.map((metric, index) => [metric.id, CHART_COLORS[index % CHART_COLORS.length]])),
    [metrics],
  )
  const soloMetric = visibleMetricIds.length === 1 ? metricById.get(visibleMetricIds[0]) : undefined
  const soloMilestone = soloMetric ? activeMilestone(data, soloMetric.id) : undefined
  const chartData = useMemo(() => {
    if (visibleMetricIds.length === 0) return []
    const start = range === 'all' ? '' : addDaysISO(todayISO(), range === '7' ? -6 : -29)
    const logs = data.dailyLogs.filter(
      (log) => visibleMetricIds.includes(log.metricId) && (!start || log.date >= start),
    )
    const dates = Array.from(new Set(logs.map((log) => log.date))).sort()
    return dates.map((date) => {
      const row: Record<string, string | number | null> = { date }
      for (const metricId of visibleMetricIds) {
        row[metricId] = logs.find((log) => log.metricId === metricId && log.date === date)?.value ?? null
      }
      return row
    })
  }, [data.dailyLogs, range, visibleMetricIds])

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-col items-stretch gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="uppercase tracking-wider text-muted-foreground">Progress</CardTitle>
            {soloMilestone && soloMetric && (
              <p className="mt-1 text-xs text-muted-foreground">
                Current target: {soloMilestone.target} {soloMetric.unit}
              </p>
            )}
          </div>
          <Select
            aria-label="Progress range"
            className="w-24"
            value={range}
            onChange={(event) => setRange(event.target.value as Range)}
          >
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="all">All</option>
          </Select>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Progress metrics">
          {metrics.map((metric) => {
            const visible = visibleMetricIds.includes(metric.id)
            return (
              <button
                key={metric.id}
                type="button"
                aria-pressed={visible}
                onClick={() => setVisibleMetricIds((current) =>
                  current.includes(metric.id)
                    ? current.filter((id) => id !== metric.id)
                    : [...current, metric.id],
                )}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium transition-opacity',
                  !visible && 'opacity-40',
                )}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colorById.get(metric.id) }} />
                {metric.name}
              </button>
            )
          })}
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        {metrics.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            Create a metric to see progress.
          </div>
        ) : visibleMetricIds.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            Select at least one metric above.
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <p className="font-serif text-xl">No progress logged yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Complete a linked to-do to add the first point.</p>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 14, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 5" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => formatDate(String(value))}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  width={42}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value, _name, item) => {
                    const metric = metricById.get(String(item.dataKey))
                    return [`${value} ${metric?.unit ?? ''}`.trim(), metric?.name ?? 'Metric']
                  }}
                  labelFormatter={(value) => formatDate(String(value))}
                />
                {soloMilestone && (
                  <ReferenceLine
                    y={soloMilestone.target}
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="4 4"
                    label={{ value: 'target', position: 'insideTopRight', fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  />
                )}
                {visibleMetricIds.map((metricId) => {
                  const metric = metricById.get(metricId)
                  const color = colorById.get(metricId)
                  return (
                    <Line
                      key={metricId}
                      type="monotone"
                      dataKey={metricId}
                      name={metric?.name ?? 'Metric'}
                      stroke={color}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: color }}
                      activeDot={{ r: 5 }}
                      connectNulls
                    />
                  )
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
