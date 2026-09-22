import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { MedReminderHost } from './components/MedReminderHost'
import { useAuth } from './context/AuthContext'
import { useLocale } from './context/LocaleContext'
import { getLocaleSetupDone } from './lib/locale'
import { AuthPage } from './pages/AuthPage'
import { CrisisHelpPage } from './pages/CrisisHelpPage'
import { BodyPage } from './pages/BodyPage'
import { EmotionPage } from './pages/EmotionPage'
import { HomePage } from './pages/HomePage'
import { LanguageSelectPage } from './pages/LanguageSelectPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { RegionSelectPage } from './pages/RegionSelectPage'
import { SettingsPage } from './pages/SettingsPage'
import { ContrastPage } from './pages/ContrastPage'
import { SummaryPage } from './pages/SummaryPage'
import type { ReactNode } from 'react'

function RequireAuth({ children }: { children: ReactNode }) {
  const { ready, profile } = useAuth()
  if (!ready) return <div className="loading">加载中…</div>
  if (!profile) return <Navigate to="/auth" replace />
  return children
}

/** First launch: region → language before auth / app. */
function RequireLocaleSetup({ children }: { children: ReactNode }) {
  const { setupDone } = useLocale()
  const location = useLocation()
  // localStorage is source of truth when state hasn't flushed yet after markSetupDone()
  if (setupDone || getLocaleSetupDone()) return children
  const path = location.pathname
  if (
    path.startsWith('/onboarding') ||
    path.startsWith('/help/crisis') ||
    path === '/crisis'
  ) {
    return children
  }
  return <Navigate to="/onboarding/language" replace />
}

export default function App() {
  const { ready, profile } = useAuth()

  if (!ready) return <div className="loading">加载中…</div>

  return (
    <>
      {profile ? <MedReminderHost /> : null}
      <Routes>
        <Route element={<Layout />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/onboarding/region" element={<RegionSelectPage />} />
          <Route path="/onboarding/language" element={<LanguageSelectPage />} />
          <Route path="/help/crisis" element={<CrisisHelpPage />} />
          <Route path="/crisis" element={<Navigate to="/help/crisis" replace />} />

          <Route
            path="/auth"
            element={
              <RequireLocaleSetup>
                {profile ? <Navigate to="/" replace /> : <AuthPage />}
              </RequireLocaleSetup>
            }
          />
          <Route
            path="/"
            element={
              <RequireLocaleSetup>
                <RequireAuth>
                  <HomePage />
                </RequireAuth>
              </RequireLocaleSetup>
            }
          />
          <Route
            path="/emotion"
            element={
              <RequireLocaleSetup>
                <RequireAuth>
                  <EmotionPage />
                </RequireAuth>
              </RequireLocaleSetup>
            }
          />
          <Route
            path="/body"
            element={
              <RequireLocaleSetup>
                <RequireAuth>
                  <BodyPage />
                </RequireAuth>
              </RequireLocaleSetup>
            }
          />
          <Route
            path="/summary"
            element={
              <RequireLocaleSetup>
                <RequireAuth>
                  <SummaryPage />
                </RequireAuth>
              </RequireLocaleSetup>
            }
          />
          <Route
            path="/contrast"
            element={
              <RequireLocaleSetup>
                <RequireAuth>
                  <ContrastPage />
                </RequireAuth>
              </RequireLocaleSetup>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireLocaleSetup>
                <RequireAuth>
                  <SettingsPage />
                </RequireAuth>
              </RequireLocaleSetup>
            }
          />
          <Route
            path="*"
            element={
              <RequireLocaleSetup>
                <Navigate to={profile ? '/' : '/auth'} replace />
              </RequireLocaleSetup>
            }
          />
        </Route>
      </Routes>
    </>
  )
}
