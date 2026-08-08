import { useAuth } from '@/auth/AuthProvider'
import { Dashboard } from '@/components/Dashboard'
import { LoginScreen } from '@/components/LoginScreen'

export default function App() {
  const { authProfileId } = useAuth()
  return (
    <div className="min-h-screen bg-background">
      {authProfileId ? <Dashboard /> : <LoginScreen />}
    </div>
  )
}
