import { Navigate } from 'react-router-dom'

/** Onboarding skipped in cloud MVP — profiles are created on signup. */
export function OnboardingPage() {
  return <Navigate to="/" replace />
}
