import { useState } from 'react'
import { ArrowRight, UserPlus } from 'lucide-react'
import { useStore } from '@/store/StoreContext'
import { useAuth } from '@/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

export function LoginScreen() {
  const { data, addProfile } = useStore()
  const { login } = useAuth()
  const [mode, setMode] = useState<'select' | 'create'>(data.profiles.length ? 'select' : 'create')
  const [selectedId, setSelectedId] = useState<string | undefined>(data.profiles[0]?.id)
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')

  // Create form
  const [name, setName] = useState('')
  const [newPass, setNewPass] = useState('')

  function submitLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedId) return
    if (login(selectedId, passcode)) {
      setError('')
      setPasscode('')
    } else {
      setError('Wrong passcode.')
    }
  }

  function submitCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const id = addProfile(name.trim(), newPass.trim() || undefined)
    login(id, newPass.trim())
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="font-serif text-4xl font-semibold tracking-tight">gullak</div>
          <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
            milestone tracker
          </div>
        </div>

        <Card className="p-6">
          {mode === 'select' ? (
            <form onSubmit={submitLogin} className="space-y-4">
              <div className="space-y-2">
                <Label>Who's this?</Label>
                <div className="grid grid-cols-2 gap-2">
                  {data.profiles.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(p.id)
                        setError('')
                      }}
                      className={
                        'rounded-md border px-3 py-2 text-sm transition-colors ' +
                        (selectedId === p.id
                          ? 'border-accent bg-accent/10 text-foreground'
                          : 'border-border hover:bg-secondary')
                      }
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="passcode">Passcode</Label>
                <Input
                  id="passcode"
                  type="password"
                  inputMode="numeric"
                  autoFocus
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="••••"
                />
                {error && <p className="text-xs text-danger">{error}</p>}
              </div>

              <Button type="submit" className="w-full">
                Enter <ArrowRight className="h-4 w-4" />
              </Button>

              <button
                type="button"
                onClick={() => setMode('create')}
                className="flex w-full items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <UserPlus className="h-3.5 w-3.5" /> Create a new profile
              </button>
            </form>
          ) : (
            <form onSubmit={submitCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newpass">Passcode</Label>
                <Input
                  id="newpass"
                  type="password"
                  inputMode="numeric"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Choose a passcode"
                />
              </div>
              <Button type="submit" className="w-full">
                Create & enter <ArrowRight className="h-4 w-4" />
              </Button>
              {data.profiles.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMode('select')}
                  className="w-full text-xs text-muted-foreground hover:text-foreground"
                >
                  Back to sign in
                </button>
              )}
            </form>
          )}
        </Card>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Passcode is a light gate, not strong security.
        </p>
      </div>
    </div>
  )
}
