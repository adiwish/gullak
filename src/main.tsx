import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import { ThemeProvider } from './theme/ThemeProvider'
import { StoreProvider } from './store/StoreContext'
import { AuthProvider } from './auth/AuthProvider'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <StoreProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </StoreProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
