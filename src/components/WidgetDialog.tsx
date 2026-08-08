import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useStore } from '@/store/StoreContext'
import { metricsOf } from '@/store/selectors'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function WidgetDialog({
  open,
  onClose,
  widgetId,
}: {
  open: boolean
  onClose: () => void
  widgetId?: string
}) {
  const { data, addWidget, updateWidget, deleteWidget, addLine, removeLine } = useStore()
  const editing = !!widgetId
  const widget = widgetId ? data.widgets.find((w) => w.id === widgetId) : undefined
  const metrics = metricsOf(data, data.currentProfileId!)

  const [title, setTitle] = useState('')
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    if (!open) return
    setTitle(widget?.title ?? '')
    setSelected([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, widgetId])

  function handleCreate() {
    const id = addWidget(title.trim() || 'New graph')
    selected.forEach((mId) => addLine(id, mId))
    onClose()
  }

  function lineFor(metricId: string) {
    return widget?.lines.find((l) => l.metricId === metricId)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit graph' : 'New graph'}
      footer={
        <>
          {editing && (
            <Button
              variant="ghost"
              className="mr-auto text-danger"
              onClick={() => {
                if (window.confirm('Delete this graph?')) {
                  deleteWidget(widgetId!)
                  onClose()
                }
              }}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            {editing ? 'Done' : 'Cancel'}
          </Button>
          {!editing && <Button onClick={handleCreate}>Create</Button>}
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="w-title">Title</Label>
          <Input
            id="w-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => editing && updateWidget(widgetId!, { title: title.trim() || 'Graph' })}
            placeholder="Weight, Progress…"
          />
        </div>

        <div className="space-y-2">
          <Label>Lines (pick metrics to plot)</Label>
          <div className="space-y-1.5">
            {metrics.map((m) => {
              const on = editing ? !!lineFor(m.id) : selected.includes(m.id)
              return (
                <label
                  key={m.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => {
                      if (editing) {
                        const line = lineFor(m.id)
                        if (line) removeLine(widgetId!, line.id)
                        else addLine(widgetId!, m.id)
                      } else {
                        setSelected((s) => (s.includes(m.id) ? s.filter((x) => x !== m.id) : [...s, m.id]))
                      }
                    }}
                  />
                  {m.name}
                  <span className="text-xs text-muted-foreground">{m.unit}</span>
                </label>
              )
            })}
            {metrics.length === 0 && (
              <p className="text-sm text-muted-foreground">Create a metric first.</p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
