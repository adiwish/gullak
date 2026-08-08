import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useStore } from '@/store/StoreContext'
import { balance } from '@/store/selectors'
import { canWithdraw } from '@/lib/money'
import { formatRupees } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function RewardCard() {
  const { data, withdraw } = useStore()
  const pid = data.currentProfileId!
  const bal = balance(data, pid)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  const amt = Number(amount)
  const valid = canWithdraw(bal, amt)

  function onWithdraw() {
    if (!valid) return
    withdraw(amt, note.trim() || undefined)
    setAmount('')
    setNote('')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="uppercase tracking-wider text-muted-foreground">Reward</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div
            className={cn(
              'font-mono text-4xl font-semibold tabular tracking-tight',
              bal < 0 ? 'text-danger' : 'text-foreground',
            )}
          >
            {formatRupees(bal)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">Your gullak balance</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-28"
          />
          <Input
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-36 flex-1"
          />
          <Button variant="accent" onClick={onWithdraw} disabled={!valid}>
            Withdraw <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        {amount !== '' && !valid && (
          <p className="text-xs text-danger">
            {amt <= 0 ? 'Enter a positive amount.' : "You can't withdraw more than your balance."}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
