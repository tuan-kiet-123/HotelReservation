import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './lib/auth'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#0f172a',
          color: '#f1f5f9',
          border: '1px solid #334155',
          borderRadius: '0.75rem',
          fontSize: '0.875rem',
        },
        success: { iconTheme: { primary: '#10b981', secondary: '#0f172a' } },
        error:   { iconTheme: { primary: '#ef4444', secondary: '#0f172a' } },
      }}
    />
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)

