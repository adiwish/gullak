import { useStore } from '@/store/StoreContext'
import { metricsOf, todayValue } from '@/store/selectors'
import { todayISO } from '@/lib/date'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function DailyLogModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, logValue } = useStore()
  const metrics = metricsOf(data, data.currentProfileId!)
  const today = todayISO()

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log today"
      footer={
        <Button variant="outline" onClick={onClose}>
          Done
        </Button>
      }
    >
      <p className="mb-3 text-sm text-muted-foreground">
        Enter today's number for each metric. One value per day — re-entering overwrites it.
      </p>
      <div className="space-y-2">
        {metrics.map((m) => (
          <div key={m.id} className="flex items-center justify-between gap-3">
            <span className="text-sm">
              {m.name} <span className="text-xs text-muted-foreground">{m.unit}</span>
            </span>
            <Input
              type="number"
              inputMode="numeric"
              defaultValue={todayValue(data, m.id, today) ?? ''}
              onBlur={(e) => {
                if (e.target.value.trim() !== '') logValue(m.id, Number(e.target.value))
              }}
              className="w-28"
              aria-label={`Log ${m.name}`}
            />
          </div>
        ))}
        {metrics.length === 0 && <p className="text-sm text-muted-foreground">No metrics yet.</p>}
      </div>
    </Modal>
  )
}
