import { Navigate } from 'react-router-dom'
import { useLocale } from '../context/LocaleContext'

/** Legacy /onboarding → region or home depending on setup. */
export function OnboardingPage() {
  const { setupDone } = useLocale()
  if (setupDone) return <Navigate to="/" replace />
  return <Navigate to="/onboarding/region" replace />
}
