import { useEffect, useState } from 'react'
import { useAuth } from '@/auth/AuthProvider'
import { Dashboard } from '@/components/Dashboard'
import { BalancedPage } from '@/components/BalancedPage'
import { LoginScreen } from '@/components/LoginScreen'

export type ProductMode = 'gullak' | 'balanced'

export default function App() {
  const { authProfileId } = useAuth()
  const [productMode, setProductMode] = useState<ProductMode>(() =>
    localStorage.getItem('gullak.product-mode') === 'balanced' ? 'balanced' : 'gullak',
  )

  useEffect(() => {
    localStorage.setItem('gullak.product-mode', productMode)
  }, [productMode])

  return (
    <div className="min-h-screen bg-background">
      {authProfileId ? (
        productMode === 'balanced'
          ? <BalancedPage productMode={productMode} onProductModeChange={setProductMode} />
          : <Dashboard productMode={productMode} onProductModeChange={setProductMode} />
      ) : <LoginScreen />}
    </div>
  )
}
