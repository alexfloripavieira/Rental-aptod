import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { AppProvider } from './contexts/AppContext'
import { InquilinoProvider } from './contexts/InquilinoContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <NotificationProvider>
        <AppProvider>
          <InquilinoProvider>
            <App />
          </InquilinoProvider>
        </AppProvider>
      </NotificationProvider>
    </AuthProvider>
  </StrictMode>,
)
