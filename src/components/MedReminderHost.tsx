import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { listMedications, listMedLogs } from '../lib/db'
import { cancelAllMedReminders, rescheduleMedReminders } from '../lib/medReminders'
import { format, startOfDay, endOfDay } from 'date-fns'

/** Keeps today's browser Notification timers fresh while the logged-in app is open. */
export function MedReminderHost() {
  const { profile } = useAuth()

  useEffect(() => {
    if (!profile) {
      cancelAllMedReminders()
      return
    }

    let cancelled = false

    const refresh = async () => {
      try {
        const today = new Date()
        const from = format(startOfDay(today), 'yyyy-MM-dd')
        const to = format(endOfDay(today), 'yyyy-MM-dd')
        const [meds, logs] = await Promise.all([
          listMedications(profile.id),
          listMedLogs(profile.id, { from, to }),
        ])
        if (!cancelled) rescheduleMedReminders(meds, logs, today)
      } catch (e) {
        console.warn('med reminder refresh failed', e)
      }
    }

    void refresh()

    const onVis = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    window.addEventListener('focus', onVis)
    document.addEventListener('visibilitychange', onVis)
    // Midnight rollover + drift correction
    const interval = window.setInterval(() => void refresh(), 60_000)

    return () => {
      cancelled = true
      window.removeEventListener('focus', onVis)
      document.removeEventListener('visibilitychange', onVis)
      window.clearInterval(interval)
      cancelAllMedReminders()
    }
  }, [profile])

  return null
}
