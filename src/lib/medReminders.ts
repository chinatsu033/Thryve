/**
 * Client-only medication reminder scheduler (no push / FCM).
 * Schedules Notification for today's upcoming enabled doses while the tab is open.
 */
import { format } from 'date-fns'
import type { Medication, MedLog } from '../types'
import { dosesForDay } from './meds'
import { getStoredLanguage } from './locale'
import { translate } from '../locales/messages'

type TimerHandle = ReturnType<typeof setTimeout>

const timers = new Map<string, TimerHandle>()

function timerKey(medId: string, time: string, dateKey: string): string {
  return `${medId}|${time}|${dateKey}`
}

export function notificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function currentNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!notificationSupported()) return 'unsupported'
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationSupported()) return 'unsupported'
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission
  }
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

export function cancelAllMedReminders(): void {
  for (const t of timers.values()) clearTimeout(t)
  timers.clear()
}

function alreadyLogged(logs: MedLog[], medId: string, dateKey: string, time: string): boolean {
  return logs.some(
    (l) =>
      l.medicationId === medId &&
      l.takenDate === dateKey &&
      (l.takenTime ?? '') === (time || ''),
  )
}

function fireNotification(med: Medication, time: string): void {
  if (!notificationSupported() || Notification.permission !== 'granted') return
  const title = translate(getStoredLanguage(), 'med.reminder.title')
  const body = time
    ? `${med.name}${med.dosage ? `（${med.dosage}）` : ''} · ${time}`
    : `${med.name}${med.dosage ? `（${med.dosage}）` : ''}`
  try {
    const n = new Notification(title, {
      body,
      tag: `thryve-med-${med.id}-${time}`,
      
    })
    n.onclick = () => {
      window.focus()
      n.close()
    }
  } catch (e) {
    console.warn('Notification failed', e)
  }
}

/** Reschedule today's upcoming reminders for enabled meds not yet logged. */
export function rescheduleMedReminders(meds: Medication[], logs: MedLog[], now = new Date()): void {
  cancelAllMedReminders()
  if (!notificationSupported() || Notification.permission !== 'granted') return

  const dateKey = format(now, 'yyyy-MM-dd')
  const enabled = meds.filter((m) => m.enabled)

  for (const med of enabled) {
    for (const time of dosesForDay(med, dateKey)) {
      if (!time) continue
      if (alreadyLogged(logs, med.id, dateKey, time)) continue
      const [hh, mm] = time.split(':').map((x) => Number(x))
      if (!Number.isFinite(hh) || !Number.isFinite(mm)) continue
      const due = new Date(now)
      due.setHours(hh, mm, 0, 0)
      const delay = due.getTime() - now.getTime()
      if (delay <= 0) continue
      // Cap far-future (shouldn't happen for "today")
      if (delay > 36 * 60 * 60 * 1000) continue
      const key = timerKey(med.id, time, dateKey)
      const handle = setTimeout(() => {
        timers.delete(key)
        if (alreadyLogged(logs, med.id, dateKey, time)) return
        fireNotification(med, time)
      }, delay)
      timers.set(key, handle)
    }
  }
}
