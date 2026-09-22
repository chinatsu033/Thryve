import { format } from 'date-fns'
import { useEffect, useRef, useState } from 'react'
import { formatHm, parseHm } from '../lib/sleep'
import { uid } from '../lib/crypto'
import { putMedication } from '../lib/db'
import {
  COMMON_MED_NAMES,
  FREQUENCY_OPTIONS,
  defaultTimesForCount,
  normalizeReminderTime,
} from '../lib/meds'
import {
  currentNotificationPermission,
  requestNotificationPermission,
} from '../lib/medReminders'
import type { Medication } from '../types'
import { AnalogClockPicker } from './AnalogClockPicker'
import { WheelPicker } from './WheelPicker'
import { Button, Field, Modal } from './ui'
import { useLocale } from '../context/LocaleContext'
import { getStoredLanguage } from '../lib/locale'
import { translate } from '../locales/messages'

const tt = (k: string, vars?: Record<string, string>) => translate(getStoredLanguage(), k, vars)

export type MedEditTarget = Medication | 'new' | null

type MedForm = {
  name: string
  dosage: string
  reminderTimes: string[]
  intervalDays: number
  freqLabel: string
  anchorDate: string
  enabled: boolean
  notes: string
  color: string
}

type ClockMode = 'hour' | 'minute'

const MAX_DOSES = 99

function emptyForm(): MedForm {
  const today = format(new Date(), 'yyyy-MM-dd')
  return {
    name: '',
    dosage: '',
    reminderTimes: defaultTimesForCount(1),
    intervalDays: 1,
    freqLabel: tt('med.freq.daily'),
    anchorDate: today,
    enabled: true,
    notes: '',
    color: '#FF8A65',
  }
}

function labelForInterval(n: number): string {
  if (n === 1) return tt('med.freq.daily')
  if (n === 2) return tt('med.freq.everyOther')
  if (n === 3) return tt('med.freq.every2')
  if (n === 4) return tt('med.freq.every3')
  if (n === 5) return tt('med.freq.every4')
  if (n === 6) return tt('med.freq.every5')
  if (n === 7) return tt('med.freq.weekly')
  return tt('med.freq.everyN', { n: String(n) })
}

function formFromMed(m: Medication): MedForm {
  const intervalDays = Math.max(1, m.intervalDays ?? 1)
  return {
    name: m.name,
    dosage: m.dosage,
    reminderTimes: m.reminderTimes.length
      ? [...m.reminderTimes].slice(0, MAX_DOSES)
      : defaultTimesForCount(1),
    intervalDays,
    freqLabel: labelForInterval(intervalDays),
    anchorDate: m.anchorDate || m.createdAt.slice(0, 10),
    enabled: m.enabled,
    notes: m.notes,
    color: m.color || '#FF8A65',
  }
}

function resizeTimes(current: string[], count: number): string[] {
  const n = Math.min(MAX_DOSES, Math.max(1, count))
  const kept = current.filter(Boolean)
  if (kept.length === n) return kept
  if (kept.length > n) return kept.slice(0, n)
  const defaults = defaultTimesForCount(n)
  const next = [...kept]
  while (next.length < n) next.push(defaults[next.length] ?? '08:00')
  return next
}

export function MedEditCard({
  open,
  target,
  userId,
  onClose,
  onSaved,
}: {
  open: boolean
  target: MedEditTarget
  userId: string
  onClose: () => void
  onSaved: () => void | Promise<void>
}) {
  const { t: tr } = useLocale()
  const [form, setForm] = useState<MedForm>(emptyForm())
  const [customName, setCustomName] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const [scheduleOpen, setScheduleOpen] = useState(false)
  const scheduleBtnRef = useRef<HTMLButtonElement>(null)

  const [pickingIndex, setPickingIndex] = useState<number | null>(null)
  const [clockMode, setClockMode] = useState<ClockMode>('hour')
  const [pickH, setPickH] = useState(8)
  const [pickM, setPickM] = useState(0)

  useEffect(() => {
    if (!open) return
    setMsg('')
    setCustomName('')
    setPickingIndex(null)
    setScheduleOpen(false)
    if (target && target !== 'new') setForm(formFromMed(target))
    else setForm(emptyForm())
  }, [open, target])

  const timesCount = Math.min(MAX_DOSES, Math.max(1, form.reminderTimes.length || 1))
  const isCommon = (COMMON_MED_NAMES as readonly string[]).includes(form.name)

  const setTimesCount = (n: number) => {
    setForm((f) => ({ ...f, reminderTimes: resizeTimes(f.reminderTimes, n) }))
  }

  const openTimePicker = (i: number) => {
    const raw = form.reminderTimes[i] || '08:00'
    const { hour, minute } = parseHm(raw)
    setPickH(hour)
    setPickM(minute)
    setClockMode('hour')
    setPickingIndex(i)
    setScheduleOpen(false)
  }

  const commitPickedTime = () => {
    if (pickingIndex == null) return
    const normalized = normalizeReminderTime(formatHm(pickH, pickM))
    if (!normalized) return
    const next = [...form.reminderTimes]
    next[pickingIndex] = normalized
    setForm({ ...form, reminderTimes: next })
    setPickingIndex(null)
  }

  const save = async () => {
    const name = (form.name.trim() || customName.trim()).trim()
    if (!name) {
      setMsg(tr('med.edit.needName'))
      return
    }
    const times = form.reminderTimes
      .map((t) => normalizeReminderTime(t))
      .filter((t): t is string => Boolean(t))
    if (!times.length) {
      setMsg(tr('med.edit.needTime'))
      return
    }
    setBusy(true)
    try {
      if (form.enabled) {
        const perm = currentNotificationPermission()
        if (perm === 'default') await requestNotificationPermission()
      }
      const nowIso = new Date().toISOString()
      const base: Medication =
        target && target !== 'new'
          ? {
              ...target,
              name,
              dosage: form.dosage.trim(),
              notes: form.notes.trim(),
              reminderTimes: times,
              daysOfWeek: null,
              intervalDays: Math.max(1, form.intervalDays),
              anchorDate: form.anchorDate || nowIso.slice(0, 10),
              color: form.color || null,
              enabled: form.enabled,
              updatedAt: nowIso,
            }
          : {
              id: uid(),
              profileId: userId,
              name,
              dosage: form.dosage.trim(),
              notes: form.notes.trim(),
              reminderTimes: times,
              daysOfWeek: null,
              intervalDays: Math.max(1, form.intervalDays),
              anchorDate: form.anchorDate || nowIso.slice(0, 10),
              color: form.color || null,
              enabled: form.enabled,
              createdAt: nowIso,
              updatedAt: nowIso,
            }
      await putMedication(base)
      setMsg('')
      await onSaved()
      onClose()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : tr('med.edit.saveFail'))
    } finally {
      setBusy(false)
    }
  }

  const title = target === 'new' || !target ? tr('med.edit.add') : tr('med.edit.edit')
  const scheduleSummary = `${form.freqLabel} · ${timesCount}次`

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="med-edit-card">
        {msg ? (
          <p className="hint" style={{ color: 'var(--color-danger, #c62828)' }}>
            {msg}
          </p>
        ) : null}

        <Field label={tr('med.edit.common')} hint={tr('med.edit.commonHint')}>
          <div className="med-common-grid">
            {COMMON_MED_NAMES.map((n) => (
              <button
                key={n}
                type="button"
                className={`chip med-common-chip ${form.name === n ? 'active' : ''}`}
                onClick={() => {
                  setForm({ ...form, name: n })
                  setCustomName('')
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </Field>

        <Field label={tr('med.edit.custom')}>
          <input
            value={isCommon ? customName : form.name}
            onChange={(e) => {
              const v = e.target.value
              setCustomName(v)
              setForm({ ...form, name: v })
            }}
            placeholder={tr('med.edit.namePh')}
          />
        </Field>

        <Field label={tr('med.edit.dosage')} hint={tr('med.edit.dosageHint')}>
          <input
            value={form.dosage}
            onChange={(e) => setForm({ ...form, dosage: e.target.value })}
            placeholder={tr('med.edit.dosagePh')}
          />
        </Field>

        <Field label={tr('med.edit.times')} hint={tr('med.edit.timesHint')}>
          <div className="med-schedule-trigger-wrap">
            <button
              ref={scheduleBtnRef}
              type="button"
              className={`chip med-schedule-trigger${scheduleOpen ? ' active' : ''}`}
              onClick={() => setScheduleOpen((o) => !o)}
              aria-expanded={scheduleOpen}
              aria-haspopup="dialog"
            >
              {scheduleSummary}
            </button>

            {scheduleOpen ? (
              <div className="med-schedule-popover" role="dialog" aria-label={tr('med.edit.timesAria')}>
                <p className="med-schedule-popover-title">每天几次</p>
                <div className="med-schedule-wheel-row">
                  <WheelPicker
                    min={1}
                    max={MAX_DOSES}
                    value={timesCount}
                    onChange={setTimesCount}
                    formatLabel={(v) => `${v}次`}
                    aria-label={tr('med.edit.timesPerDay')}
                  />
                </div>
                <p className="med-schedule-popover-title" style={{ marginTop: 10 }}>
                  间隔
                </p>
                <div className="med-freq-row med-freq-row--popover">
                  {FREQUENCY_OPTIONS.map((o) => (
                    <button
                      key={o.label}
                      type="button"
                      className={`chip ${form.freqLabel === o.label ? 'active' : ''}`}
                      onClick={() =>
                        setForm({
                          ...form,
                          intervalDays: o.intervalDays,
                          freqLabel: o.label,
                        })
                      }
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                <div className="med-schedule-popover-actions">
                  <Button className="btn-sm" onClick={() => setScheduleOpen(false)}>
                    完成
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </Field>

        <Field label={tr('med.edit.reminders')} hint={tr('med.edit.remindersHint')}>
          <div className="med-times med-times--scroll">
            {form.reminderTimes.map((t, i) => (
              <div key={i} className="med-time-row">
                <span className="hint med-time-label">第{i + 1}次</span>
                <button
                  type="button"
                  className={`chip med-time-chip${pickingIndex === i ? ' active' : ''}`}
                  onClick={() => openTimePicker(i)}
                  aria-label={`第${i + 1}次提醒时间 ${t || tr('common.unset')}`}
                >
                  {normalizeReminderTime(t) || t || tr('common.selectTime')}
                </button>
              </div>
            ))}
          </div>
        </Field>

        {pickingIndex != null ? (
          <div className="med-clock-panel" role="dialog" aria-label={tr('med.edit.pickTimeAria')}>
            <AnalogClockPicker
              variant="surface"
              hour={pickH}
              minute={pickM}
              mode={clockMode}
              chip={`第${pickingIndex + 1}次`}
              onHourChange={setPickH}
              onMinuteChange={setPickM}
              onHourCommit={() => setClockMode('minute')}
              onMinuteCommit={commitPickedTime}
            />
            <div className="med-clock-actions">
              <Button variant="ghost" className="btn-sm" onClick={() => setClockMode('hour')}>
                重选小时
              </Button>
              <Button className="btn-sm" onClick={commitPickedTime}>
                完成
              </Button>
              <Button variant="ghost" className="btn-sm" onClick={() => setPickingIndex(null)}>
                取消
              </Button>
            </div>
          </div>
        ) : null}

        <label className="med-enable-row">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
          />
          启用提醒与日历计划
        </label>

        <div className="med-edit-actions">
          <Button disabled={busy} onClick={() => void save()}>
            {busy ? tr('common.saving') : tr('common.save')}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
        </div>
      </div>
    </Modal>
  )
}
