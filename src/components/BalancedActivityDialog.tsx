import { useEffect, useState } from 'react'
import type { BalancedActivity } from '@/types'
import { useStore, type BalancedActivityInput } from '@/store/StoreContext'
import { validDailyLimit, validMinimum } from '@/lib/balanced'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const UNIT_OPTIONS = [
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'pages', label: 'Pages' },
  { value: 'repetitions', label: 'Reps' },
  { value: 'steps', label: 'Steps' },
] as const

export function BalancedActivityDialog({
  open,
  activity,
  onClose,
}: {
  open: boolean
  activity?: BalancedActivity
  onClose: () => void
}) {
  const { addBalancedActivity, updateBalancedActivity } = useStore()
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('minutes')
  const [customUnit, setCustomUnit] = useState(false)
  const [minimum, setMinimum] = useState('')
  const [dailyLimit, setDailyLimit] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setName(activity?.name ?? '')
    const nextUnit = activity?.unit ?? 'minutes'
    setUnit(nextUnit)
    setCustomUnit(!UNIT_OPTIONS.some((option) => option.value === nextUnit))
    setMinimum(activity?.minimum === undefined ? '' : String(activity.minimum))
    setDailyLimit(activity ? String(activity.dailyLimit) : '')
    setError('')
  }, [activity, open])

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const parsedLimit = Number(dailyLimit)
    const parsedMinimum = minimum.trim() === '' ? undefined : Number(minimum)
    if (!name.trim() || !unit.trim()) {
      setError('Name and unit are required.')
      return
    }
    if (!validDailyLimit(parsedLimit)) {
      setError('Daily limit must be greater than zero.')
      return
    }
    if (!validMinimum(parsedMinimum, parsedLimit)) {
      setError('Minimum must be between zero and the daily limit, or left blank.')
      return
    }
    const normalizedUnit = unit.trim().toLowerCase()
    const input: BalancedActivityInput = {
      name: name.trim(),
      unit: unit.trim(),
      timerUnit: normalizedUnit === 'minutes' || normalizedUnit === 'hours' ? normalizedUnit : undefined,
      minimum: parsedMinimum,
      dailyLimit: parsedLimit,
    }
    if (activity) updateBalancedActivity(activity.id, input)
    else addBalancedActivity(input)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={activity ? 'Edit activity' : 'New activity'}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button form="balanced-activity-form" type="submit">Save</Button></>}
    >
      <form id="balanced-activity-form" onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="balanced-name">Activity</Label>
          <Input id="balanced-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Coding" />
        </div>
        <div className="space-y-2">
          <Label>Unit</Label>
          <div className="flex flex-wrap gap-2" aria-label="Choose unit">
            {UNIT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={!customUnit && unit === option.value}
                onClick={() => { setUnit(option.value); setCustomUnit(false) }}
                className={
                  'rounded-md border px-3 py-1.5 text-sm transition-colors ' +
                  (!customUnit && unit === option.value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:bg-secondary')
                }
              >
                {option.label}
              </button>
            ))}
            <button
              type="button"
              aria-pressed={customUnit}
              onClick={() => { setCustomUnit(true); if (UNIT_OPTIONS.some((option) => option.value === unit)) setUnit('') }}
              className={
                'rounded-md border px-3 py-1.5 text-sm transition-colors ' +
                (customUnit ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-secondary')
              }
            >
              Custom
            </button>
          </div>
          {customUnit && (
            <Input id="balanced-unit" aria-label="Custom unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. glasses" />
          )}
          <p className="text-xs text-muted-foreground">Timer is available for minutes and hours.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="balanced-minimum">Minimum (optional)</Label>
            <Input id="balanced-minimum" type="number" min="0" step="any" value={minimum} onChange={(e) => setMinimum(e.target.value)} placeholder="20" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="balanced-daily-limit">Daily limit (100%)</Label>
            <Input id="balanced-daily-limit" type="number" min="0" step="any" value={dailyLimit} onChange={(e) => setDailyLimit(e.target.value)} placeholder="120" />
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">50% is good, 80–100% is excellent, and crossing 100% shows an overwork warning.</p>
        </div>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      </form>
    </Modal>
  )
}
