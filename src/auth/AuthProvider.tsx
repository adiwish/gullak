import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useStore } from '@/store/StoreContext'

interface AuthValue {
  authProfileId?: string
  login: (profileId: string, passcode: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthValue | undefined>(undefined)
const KEY = 'gullak.auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, setCurrentProfile } = useStore()
  const [authProfileId, setAuthProfileId] = useState<string | undefined>(
    () => localStorage.getItem(KEY) || undefined,
  )

  // Restore remembered profile on load.
  useEffect(() => {
    if (authProfileId && data.profiles.some((p) => p.id === authProfileId)) {
      setCurrentProfile(authProfileId)
    } else if (authProfileId) {
      // Remembered profile no longer exists.
      localStorage.removeItem(KEY)
      setAuthProfileId(undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = (profileId: string, passcode: string) => {
    const profile = data.profiles.find((p) => p.id === profileId)
    if (!profile) return false
    if (profile.passcode && profile.passcode !== passcode) return false
    localStorage.setItem(KEY, profileId)
    setAuthProfileId(profileId)
    setCurrentProfile(profileId)
    return true
  }

  const logout = () => {
    localStorage.removeItem(KEY)
    setAuthProfileId(undefined)
  }

  return <AuthContext.Provider value={{ authProfileId, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
