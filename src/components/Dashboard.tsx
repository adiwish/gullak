import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { useStore } from '@/store/StoreContext'
import { Header } from '@/components/Header'
import { SectionLabel } from '@/components/Section'
import { HallOfFameShame } from '@/components/HallOfFameShame'
import { RewardCard } from '@/components/RewardCard'
import { GraphWidgetCard } from '@/components/GraphWidgetCard'
import { ActiveMilestones } from '@/components/ActiveMilestones'
import { UpcomingList } from '@/components/UpcomingList'
import { HistoryList } from '@/components/HistoryList'
import { CategoryDialog } from '@/components/CategoryDialog'
import { WidgetDialog } from '@/components/WidgetDialog'
import { DailyLogModal } from '@/components/DailyLogModal'
import { FocusView } from '@/components/FocusView'
import { Button } from '@/components/ui/button'
import type { ProductMode } from '@/App'

export function Dashboard({
  productMode,
  onProductModeChange,
}: {
  productMode: ProductMode
  onProductModeChange: (mode: ProductMode) => void
}) {
  const { data } = useStore()
  const pid = data.currentProfileId!
  const widgets = data.widgets
    .filter((w) => w.profileId === pid)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  const weightWidget = widgets.find((w) => w.title.toLowerCase() === 'weight') ?? widgets[0]
  const otherWidgets = widgets.filter((w) => w.id !== weightWidget?.id)

  const [categoryDialog, setCategoryDialog] = useState<{ open: boolean; metricId?: string }>({ open: false })
  const [widgetDialog, setWidgetDialog] = useState<{ open: boolean; widgetId?: string }>({ open: false })
  const [logOpen, setLogOpen] = useState(false)
  const [focusMode, setFocusMode] = useState(() => localStorage.getItem('gullak.view') === 'focus')

  useEffect(() => {
    localStorage.setItem('gullak.view', focusMode ? 'focus' : 'dashboard')
  }, [focusMode])

  const editMetric = (metricId: string) => setCategoryDialog({ open: true, metricId })
  const editWidget = (widgetId: string) => setWidgetDialog({ open: true, widgetId })

  if (focusMode) {
    return (
      <div className="mx-auto max-w-5xl px-4">
        <Header
          productMode={productMode}
          onProductModeChange={onProductModeChange}
          focusMode
          onToggleFocus={() => setFocusMode(false)}
        />
        <FocusView />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-20">
      <Header
        productMode={productMode}
        onProductModeChange={onProductModeChange}
        onOpenLog={() => setLogOpen(true)}
        onToggleFocus={() => setFocusMode(true)}
      />

      {/* Hall of Fame | Shame */}
      <div className="grid gap-4 md:grid-cols-2">
        <HallOfFameShame />
      </div>

      {/* Weight | Reward */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {weightWidget ? <GraphWidgetCard widget={weightWidget} onEdit={editWidget} /> : <div />}
        <RewardCard />
      </div>

      {/* Progress (full width) */}
      <div className="mt-4 space-y-4">
        {otherWidgets.map((w) => (
          <GraphWidgetCard key={w.id} widget={w} onEdit={editWidget} />
        ))}
        <Button variant="outline" size="sm" onClick={() => setWidgetDialog({ open: true })}>
          <Plus className="h-3.5 w-3.5" /> New graph
        </Button>
      </div>

      <hr className="my-8 border-border" />

      <SectionLabel>Active</SectionLabel>
      <ActiveMilestones onEditMetric={editMetric} onNewGoal={() => setCategoryDialog({ open: true })} />

      <div className="mt-8">
        <SectionLabel>Upcoming</SectionLabel>
        <UpcomingList />
      </div>

      <hr className="my-8 border-border" />

      <SectionLabel>History</SectionLabel>
      <HistoryList />

      <CategoryDialog
        open={categoryDialog.open}
        metricId={categoryDialog.metricId}
        onClose={() => setCategoryDialog({ open: false })}
      />
      <WidgetDialog
        open={widgetDialog.open}
        widgetId={widgetDialog.widgetId}
        onClose={() => setWidgetDialog({ open: false })}
      />
      <DailyLogModal open={logOpen} onClose={() => setLogOpen(false)} />
    </div>
  )
}
