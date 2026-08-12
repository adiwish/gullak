import { LayoutDashboard, LogOut, Maximize2, Moon, PencilLine, Sun } from 'lucide-react'
import { useTheme } from '@/theme/ThemeProvider'
import { useStore } from '@/store/StoreContext'
import { useAuth } from '@/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import type { ProductMode } from '@/App'

export function Header({
  onOpenLog,
  focusMode = false,
  onToggleFocus,
  productMode = 'gullak',
  onProductModeChange,
}: {
  onOpenLog?: () => void
  focusMode?: boolean
  onToggleFocus?: () => void
  productMode?: ProductMode
  onProductModeChange?: (mode: ProductMode) => void
}) {
  const { theme, toggle } = useTheme()
  const { data } = useStore()
  const { logout } = useAuth()
  const profile = data.profiles.find((p) => p.id === data.currentProfileId)

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 py-5">
      <div className="flex items-center gap-3">
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-2xl font-semibold tracking-tight">gullak</span>
          <span className="hidden text-xs uppercase tracking-widest text-muted-foreground lg:inline">
            milestone tracker
          </span>
        </div>
        {onProductModeChange && (
          <div className="flex rounded-md border border-border bg-card p-0.5" aria-label="Product mode">
            {(['gullak', 'balanced'] as ProductMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={productMode === mode}
                onClick={() => onProductModeChange(mode)}
                className={
                  'rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors ' +
                  (productMode === mode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')
                }
              >
                {mode}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {onToggleFocus && (
          <Button variant={focusMode ? 'default' : 'outline'} size="sm" onClick={onToggleFocus}>
            {focusMode ? <LayoutDashboard className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            {focusMode ? 'Dashboard' : 'Focus'}
          </Button>
        )}
        {onOpenLog && (
          <Button variant="outline" size="sm" onClick={onOpenLog}>
            <PencilLine className="h-3.5 w-3.5" /> Log today
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <span className="hidden text-sm text-muted-foreground sm:inline">{profile?.name}</span>
        <Button variant="ghost" size="icon" onClick={logout} aria-label="Log out" title="Log out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
