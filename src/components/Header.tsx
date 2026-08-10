import { LayoutDashboard, LogOut, Maximize2, Moon, PencilLine, Sun } from 'lucide-react'
import { useTheme } from '@/theme/ThemeProvider'
import { useStore } from '@/store/StoreContext'
import { useAuth } from '@/auth/AuthProvider'
import { Button } from '@/components/ui/button'

export function Header({
  onOpenLog,
  focusMode = false,
  onToggleFocus,
}: {
  onOpenLog?: () => void
  focusMode?: boolean
  onToggleFocus?: () => void
}) {
  const { theme, toggle } = useTheme()
  const { data } = useStore()
  const { logout } = useAuth()
  const profile = data.profiles.find((p) => p.id === data.currentProfileId)

  return (
    <header className="flex items-center justify-between py-5">
      <div className="flex items-baseline gap-2">
        <span className="font-serif text-2xl font-semibold tracking-tight">gullak</span>
        <span className="hidden text-xs uppercase tracking-widest text-muted-foreground sm:inline">
          milestone tracker
        </span>
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
