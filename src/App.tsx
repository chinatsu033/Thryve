import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { MedReminderHost } from './components/MedReminderHost'
import { useAuth } from './context/AuthContext'
import { AuthPage } from './pages/AuthPage'
import { CrisisHelpPage } from './pages/CrisisHelpPage'
import { BodyPage } from './pages/BodyPage'
import { EmotionPage } from './pages/EmotionPage'
import { HomePage } from './pages/HomePage'
import { SettingsPage } from './pages/SettingsPage'
import { SummaryPage } from './pages/SummaryPage'
import type { ReactNode } from 'react'

function RequireAuth({ children }: { children: ReactNode }) {
  const { ready, profile } = useAuth()
  if (!ready) return <div className="loading">加载中…</div>
  if (!profile) return <Navigate to="/auth" replace />
  return children
}

export default function App() {
  const { ready, profile } = useAuth()

  if (!ready) return <div className="loading">加载中…</div>

  return (
    <>
      {profile ? <MedReminderHost /> : null}
      <Routes>
      <Route element={<Layout />}>
        <Route
          path="/auth"
          element={profile ? <Navigate to="/" replace /> : <AuthPage />}
        />
        <Route path="/help/crisis" element={<CrisisHelpPage />} />
        <Route path="/crisis" element={<Navigate to="/help/crisis" replace />} />
        <Route path="/onboarding" element={<Navigate to="/" replace />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <HomePage />
            </RequireAuth>
          }
        />
        <Route
          path="/emotion"
          element={
            <RequireAuth>
              <EmotionPage />
            </RequireAuth>
          }
        />
        <Route
          path="/body"
          element={
            <RequireAuth>
              <BodyPage />
            </RequireAuth>
          }
        />
        <Route
          path="/summary"
          element={
            <RequireAuth>
              <SummaryPage />
            </RequireAuth>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireAuth>
              <SettingsPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to={profile ? '/' : '/auth'} replace />} />
      </Route>
    </Routes>
    </>
  )
}
