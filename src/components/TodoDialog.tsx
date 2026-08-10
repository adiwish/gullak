import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@/store/StoreContext'
import { todayISO } from '@/lib/date'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'

export function TodoDialog({
  open,
  onClose,
  todoId,
}: {
  open: boolean
  onClose: () => void
  todoId?: string
}) {
  const { data, addTodo, updateTodo } = useStore()
  const todo = todoId ? data.todos.find((item) => item.id === todoId) : undefined
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(todayISO())
  const [milestoneId, setMilestoneId] = useState('')
  const [logValue, setLogValue] = useState('')

  const activeOptions = useMemo(() => {
    const metricById = new Map(
      data.metrics
        .filter((metric) => metric.profileId === data.currentProfileId)
        .map((metric) => [metric.id, metric]),
    )
    return data.milestones
      .filter((milestone) => milestone.status === 'active' && metricById.has(milestone.metricId))
      .map((milestone) => ({ milestone, metric: metricById.get(milestone.metricId)! }))
  }, [data.currentProfileId, data.metrics, data.milestones])

  const selected = activeOptions.find((option) => option.milestone.id === milestoneId)

  useEffect(() => {
    if (!open) return
    setTitle(todo?.title ?? '')
    setDate(todo?.date ?? todayISO())
    setMilestoneId(todo?.milestoneId ?? '')
    setLogValue(todo?.logValue === undefined ? '' : String(todo.logValue))
  }, [open, todo])

  function save() {
    if (!title.trim()) return
    const parsed = logValue.trim() === '' ? undefined : Number(logValue)
    const input = {
      title: title.trim(),
      date,
      milestoneId: milestoneId || undefined,
      logValue: Number.isFinite(parsed) ? parsed : undefined,
    }
    if (todo) updateTodo(todo.id, input)
    else addTodo(input)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={todo ? 'Edit to-do' : 'New to-do'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={!title.trim()}>{todo ? 'Save' : 'Add to-do'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="todo-title">Task</Label>
          <Input
            id="todo-title"
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Do 20 push-ups"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="todo-date">Date</Label>
          <Input id="todo-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="todo-milestone">Milestone (optional)</Label>
          <Select
            id="todo-milestone"
            value={milestoneId}
            onChange={(event) => {
              setMilestoneId(event.target.value)
              setLogValue('')
            }}
          >
            <option value="">No milestone</option>
            {activeOptions.map(({ milestone, metric }) => (
              <option key={milestone.id} value={milestone.id}>
                {metric.name} · M{milestone.seq} · {milestone.target} {metric.unit}
              </option>
            ))}
          </Select>
        </div>

        {selected && (
          <div className="space-y-1.5">
            <Label htmlFor="todo-log-value">Progress value (optional now)</Label>
            <Input
              id="todo-log-value"
              type="number"
              inputMode="decimal"
              value={logValue}
              onChange={(event) => setLogValue(event.target.value)}
              placeholder={`Actual ${selected.metric.unit || 'value'}`}
            />
            <p className="text-xs text-muted-foreground">
              You can enter the actual value now or before marking this task done.
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}
