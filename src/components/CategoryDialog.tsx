import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import type { Direction, MetricKind } from '@/types'
import { useStore } from '@/store/StoreContext'
import { milestonesOf } from '@/store/selectors'
import { todayISO } from '@/lib/date'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'

interface Row {
  target: string
  reward: string
  weeks: string
}

export function CategoryDialog({
  open,
  onClose,
  metricId,
}: {
  open: boolean
  onClose: () => void
  metricId?: string
}) {
  const {
    data,
    addCategory,
    updateMetric,
    deleteMetric,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    moveMilestone,
  } = useStore()

  const editing = !!metricId
  const metric = metricId ? data.metrics.find((m) => m.id === metricId) : undefined
  const milestones = metricId ? milestonesOf(data, metricId) : []

  const [name, setName] = useState('')
  const [kind, setKind] = useState<MetricKind>('category')
  const [direction, setDirection] = useState<Direction>('higher')
  const [unit, setUnit] = useState('')
  const [startDate, setStartDate] = useState(todayISO())
  const [rows, setRows] = useState<Row[]>([{ target: '', reward: '', weeks: '1' }])

  useEffect(() => {
    if (!open) return
    setName(metric?.name ?? '')
    setKind(metric?.kind ?? 'category')
    setDirection(metric?.direction ?? 'higher')
    setUnit(metric?.unit ?? '')
    setStartDate(metric?.startDate ?? todayISO())
    setRows([{ target: '', reward: '', weeks: '1' }])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, metricId])

  function handleCreate() {
    if (!name.trim()) return
    const ms =
      kind === 'category'
        ? rows
            .filter((r) => r.target !== '' && r.reward !== '')
            .map((r) => ({
              target: Number(r.target),
              reward: Number(r.reward),
              durationWeeks: Math.max(1, Number(r.weeks) || 1),
            }))
        : []
    addCategory({ name: name.trim(), kind, direction, unit: unit.trim() || undefined, startDate, milestones: ms })
    onClose()
  }

  function handleSaveEdit() {
    if (!metricId) return
    updateMetric(metricId, {
      name: name.trim(),
      direction,
      unit: unit.trim() || undefined,
      startDate,
    })
    onClose()
  }

  function handleDelete() {
    if (!metricId) return
    if (window.confirm(`Delete "${metric?.name}" and all its milestones & logs?`)) {
      deleteMetric(metricId)
      onClose()
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit goal' : 'New goal'}
      footer={
        <>
          {editing && (
            <Button variant="ghost" className="mr-auto text-danger" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={editing ? handleSaveEdit : handleCreate}>{editing ? 'Save' : 'Create'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="cat-name">Name</Label>
            <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Push-ups, DSA, Weight…" />
          </div>

          {!editing && (
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={kind} onChange={(e) => setKind(e.target.value as MetricKind)}>
                <option value="category">Goal (with milestones)</option>
                <option value="plain">Plain metric (track only)</option>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Direction</Label>
            <Select value={direction} onChange={(e) => setDirection(e.target.value as Direction)}>
              <option value="higher">Higher is better</option>
              <option value="lower">Lower is better</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-unit">Unit</Label>
            <Input id="cat-unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="reps, kg, questions" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-start">Start date</Label>
            <Input id="cat-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
        </div>

        {/* Milestones */}
        {(editing ? metric?.kind === 'category' : kind === 'category') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Milestones</Label>
              <span className="text-[11px] text-muted-foreground">target · reward ₹ · weeks</span>
            </div>

            {editing ? (
              <div className="space-y-2">
                {milestones.map((m, i) => (
                  <div key={m.id} className="flex items-center gap-2">
                    <span className="w-6 text-xs text-muted-foreground">M{m.seq}</span>
                    <Input
                      type="number"
                      defaultValue={m.target}
                      onBlur={(e) => updateMilestone(m.id, { target: Number(e.target.value) })}
                      className="w-20"
                      aria-label="target"
                    />
                    <Input
                      type="number"
                      defaultValue={m.reward}
                      onBlur={(e) => updateMilestone(m.id, { reward: Number(e.target.value) })}
                      className="w-24"
                      aria-label="reward"
                    />
                    <Input
                      type="number"
                      defaultValue={m.durationWeeks}
                      onBlur={(e) => updateMilestone(m.id, { durationWeeks: Math.max(1, Number(e.target.value) || 1) })}
                      className="w-16"
                      aria-label="weeks"
                    />
                    <div className="ml-auto flex items-center">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveMilestone(m.id, -1)} disabled={i === 0} aria-label="Move up">
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveMilestone(m.id, 1)} disabled={i === milestones.length - 1} aria-label="Move down">
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-danger" onClick={() => deleteMilestone(m.id)} aria-label="Delete milestone">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => addMilestone(metricId!, { target: 0, reward: 0, durationWeeks: 1 })}>
                  <Plus className="h-3.5 w-3.5" /> Add milestone
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {rows.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-6 text-xs text-muted-foreground">M{i + 1}</span>
                    <Input type="number" placeholder="target" value={r.target} onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, target: e.target.value } : x)))} className="w-20" />
                    <Input type="number" placeholder="₹" value={r.reward} onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, reward: e.target.value } : x)))} className="w-24" />
                    <Input type="number" placeholder="wks" value={r.weeks} onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, weeks: e.target.value } : x)))} className="w-16" />
                    <Button variant="ghost" size="icon" className="ml-auto h-8 w-8 text-danger" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} disabled={rows.length === 1} aria-label="Remove row">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setRows((rs) => [...rs, { target: '', reward: '', weeks: '2' }])}>
                  <Plus className="h-3.5 w-3.5" /> Add milestone
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
