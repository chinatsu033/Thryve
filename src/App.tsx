import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { useAuth } from './context/AuthContext'
import { AuthPage } from './pages/AuthPage'
import { BodyPage } from './pages/BodyPage'
import { EmotionPage } from './pages/EmotionPage'
import { HomePage } from './pages/HomePage'
import { OnboardingPage } from './pages/OnboardingPage'
import { SettingsPage } from './pages/SettingsPage'
import { SummaryPage } from './pages/SummaryPage'
import type { ReactNode } from 'react'

function RequireAuth({ children }: { children: ReactNode }) {
  const { ready, profile } = useAuth()
  if (!ready) return <div className="loading">加载中…</div>
  if (!profile) return <Navigate to="/auth" replace />
  if (!profile.onboardingDone) return <Navigate to="/onboarding" replace />
  return children
}

export default function App() {
  const { ready, profile } = useAuth()

  if (!ready) return <div className="loading">加载中…</div>

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          path="/auth"
          element={profile ? <Navigate to={profile.onboardingDone ? '/' : '/onboarding'} replace /> : <AuthPage />}
        />
        <Route path="/onboarding" element={<OnboardingPage />} />
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
  )
}
