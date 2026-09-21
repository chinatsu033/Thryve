import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import './index.css'

const redirect = sessionStorage.getItem('ghpages-redirect')
if (redirect) {
  sessionStorage.removeItem('ghpages-redirect')
  const url = new URL(redirect)
  if (url.pathname.startsWith('/psych-state-journal')) {
    history.replaceState(null, '', url.pathname + url.search + url.hash)
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/psych-state-journal">
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
