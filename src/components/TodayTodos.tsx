import { useEffect, useMemo, useState } from 'react'
import { Check, PencilLine, Plus, Trash2 } from 'lucide-react'
import { useStore } from '@/store/StoreContext'
import { todayISO } from '@/lib/date'
import { formatDateLong } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function TodayTodos({
  onNew,
  onEdit,
}: {
  onNew: () => void
  onEdit: (todoId: string) => void
}) {
  const { data, deleteTodo, setTodoCompleted } = useStore()
  const today = todayISO()
  const todos = useMemo(
    () => data.todos
      .filter((todo) => todo.profileId === data.currentProfileId && todo.date === today)
      .sort((a, b) => Number(a.completed) - Number(b.completed) || a.createdAt.localeCompare(b.createdAt)),
    [data.currentProfileId, data.todos, today],
  )
  const [values, setValues] = useState<Record<string, string>>({})

  useEffect(() => {
    setValues((current) => {
      const next = { ...current }
      for (const todo of todos) {
        if (next[todo.id] === undefined && todo.logValue !== undefined) next[todo.id] = String(todo.logValue)
      }
      return next
    })
  }, [todos])

  const milestoneById = new Map(data.milestones.map((milestone) => [milestone.id, milestone]))
  const metricById = new Map(data.metrics.map((metric) => [metric.id, metric]))

  return (
    <Card className="bg-background">
      <CardHeader>
        <div>
          <CardTitle className="uppercase tracking-wider text-muted-foreground">Today</CardTitle>
          <p className="mt-1 font-serif text-xl">{formatDateLong(today)}</p>
        </div>
        <Button size="sm" onClick={onNew}><Plus className="h-3.5 w-3.5" /> Add to-do</Button>
      </CardHeader>
      <CardContent className="pt-3">
        {todos.length === 0 ? (
          <button
            type="button"
            onClick={onNew}
            className="flex w-full flex-col items-center rounded-lg border border-dashed border-border px-4 py-12 text-center hover:bg-secondary/50"
          >
            <span className="font-serif text-xl">What will move you forward today?</span>
            <span className="mt-1 text-sm text-muted-foreground">Create your own task and optionally link a milestone.</span>
          </button>
        ) : (
          <div className="divide-y divide-border/80">
            {todos.map((todo) => {
              const milestone = todo.milestoneId ? milestoneById.get(todo.milestoneId) : undefined
              const metric = milestone ? metricById.get(milestone.metricId) : undefined
              const rawValue = values[todo.id] ?? ''
              const validValue = rawValue.trim() !== '' && Number.isFinite(Number(rawValue))
              const canComplete = !milestone || validValue || todo.logValue !== undefined

              return (
                <div
                  key={todo.id}
                  className="flex flex-col gap-3 py-5 first:pt-2 last:pb-2 sm:flex-row sm:items-center"
                >
                  <button
                    type="button"
                    aria-label={todo.completed ? `Mark ${todo.title} incomplete` : `Complete ${todo.title}`}
                    disabled={!todo.completed && !canComplete}
                    onClick={() => setTodoCompleted(todo.id, !todo.completed, validValue ? Number(rawValue) : undefined)}
                    title={todo.completed ? 'Mark incomplete' : canComplete ? 'Mark done' : 'Enter progress first'}
                    className={
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-40 ' +
                      (todo.completed
                        ? 'border-success bg-success text-success-foreground hover:opacity-80'
                        : 'border-muted-foreground/55 bg-transparent hover:border-accent hover:bg-accent/10')
                    }
                  >
                    {todo.completed && <Check className="h-4 w-4" strokeWidth={3} />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p
                      className={
                        todo.completed
                          ? 'text-base font-medium text-muted-foreground line-through decoration-muted-foreground/60'
                          : 'text-base font-semibold tracking-tight text-foreground'
                      }
                    >
                      {todo.title}
                    </p>
                    {milestone && metric && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {metric.name} · M{milestone.seq} · target {milestone.target} {metric.unit}
                      </p>
                    )}
                    {!todo.completed && milestone && !canComplete && (
                      <p className="mt-1 text-xs font-medium text-warning">Enter today&apos;s progress to mark done</p>
                    )}
                  </div>

                  {milestone && metric && !todo.completed && (
                    <div className="flex items-center gap-2 sm:w-40">
                      <Input
                        type="number"
                        inputMode="decimal"
                        aria-label={`Progress for ${todo.title}`}
                        value={rawValue}
                        onChange={(event) => setValues((current) => ({ ...current, [todo.id]: event.target.value }))}
                        placeholder="Actual"
                      />
                      <span className="text-xs text-muted-foreground">{metric.unit}</span>
                    </div>
                  )}

                  {todo.completed && todo.logValue !== undefined && metric && (
                    <span className="font-mono text-xs text-accent">+ log {todo.logValue} {metric.unit}</span>
                  )}

                  <div className="flex items-center gap-1 self-end sm:self-auto">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(todo.id)} aria-label={`Edit ${todo.title}`}>
                      <PencilLine className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-danger" onClick={() => deleteTodo(todo.id)} aria-label={`Delete ${todo.title}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
