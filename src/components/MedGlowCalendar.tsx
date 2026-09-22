import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { MedEditCard, type MedEditTarget } from './MedEditCard'
import { Button, Empty, Modal } from './ui'
import {
  deleteMedication,
  listMedications,
  listMedLogs,
  putMedLog,
  deleteMedLog,
} from '../lib/db'
import { uid } from '../lib/crypto'
import {
  dayMedMark,
  frequencyLabelKey,
  listDayDoses,
  stripAdherenceFromMark,
  type DayDose,
  type StripAdherence,
} from '../lib/meds'
import { rescheduleMedReminders } from '../lib/medReminders'
import { easeOutSoft } from '../lib/motion'
import type { MedLog, Medication } from '../types'
import { useLocale } from '../context/LocaleContext'
import { dateFnsLocale, datePattern } from '../lib/dateLocale'
import { getStoredLanguage } from '../lib/locale'
import { translate } from '../locales/messages'

function adhereLabel(kind: StripAdherence): string {
  const tr = (k: string) => translate(getStoredLanguage(), k)
  const map: Record<StripAdherence, string> = {
    taken: tr('med.status.taken'),
    partial: tr('med.status.partial'),
    missed: tr('med.status.missed'),
    planned: tr('med.status.planned'),
    none: '',
  }
  return map[kind]
}

function ChevronV({ up }: { up?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path
        d={up ? 'M5 15 L12 8 L19 15' : 'M5 9 L12 16 L19 9'}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DotsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <circle cx="5" cy="12" r="1.8" fill="currentColor" />
      <circle cx="12" cy="12" r="1.8" fill="currentColor" />
      <circle cx="19" cy="12" r="1.8" fill="currentColor" />
    </svg>
  )
}

export function MedGlowCalendar({
  userId,
  defaultExpanded = false,
  showManageList = false,
  onInteractionChange,
}: {
  userId: string
  defaultExpanded?: boolean
  /** When true (Body tab), always show med list under calendar. */
  showManageList?: boolean
  /** True while calendar expanded or any med sheet/modal is open — parent can lock home swipe. */
  onInteractionChange?: (active: boolean) => void
}) {
  const { t: tr, language } = useLocale()
  const dowLabels = [0, 1, 2, 3, 4, 5, 6].map((d) => tr(`med.dow.${d}`))
  const freqLabel = (n: number) => {
    const key = frequencyLabelKey(n)
    return key === 'med.freq.everyN' ? tr(key, { n: String(Math.max(1, n || 1)) }) : tr(key)
  }
  const reduceMotion = useReducedMotion()
  const [meds, setMeds] = useState<Medication[]>([])
  const [logs, setLogs] = useState<MedLog[]>([])
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [month] = useState(() => startOfMonth(new Date()))
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState<MedEditTarget>(null)
  const [manageOpen, setManageOpen] = useState(false)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const today = useMemo(() => new Date(), [])

  useEffect(() => {
    const active =
      expanded || editTarget !== null || selectedDay !== null || manageOpen
    onInteractionChange?.(active)
    return () => onInteractionChange?.(false)
  }, [expanded, editTarget, selectedDay, manageOpen, onInteractionChange])

  const rangeFrom = format(addDays(startOfMonth(month), -7), 'yyyy-MM-dd')
  const rangeTo = format(addDays(endOfMonth(month), 7), 'yyyy-MM-dd')

  const reload = useCallback(async () => {
    const [m, l] = await Promise.all([
      listMedications(userId),
      listMedLogs(userId, { from: rangeFrom, to: rangeTo }),
    ])
    setMeds(m)
    setLogs(l)
    rescheduleMedReminders(m, l)
  }, [userId, rangeFrom, rangeTo])

  useEffect(() => {
    void reload().catch((e) => {
      console.error(e)
      setMsg(e instanceof Error ? e.message : tr('med.edit.loadFail'))
    })
  }, [reload])

  const enabledMeds = useMemo(() => meds.filter((m) => m.enabled), [meds])
  const stripDays = useMemo(() => {
    return [-2, -1, 0, 1, 2].map((offset) => addDays(today, offset))
  }, [today])

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [month])

  const openNew = () => setEditTarget('new')
  const openEdit = (m: Medication) => setEditTarget(m)

  const removeMed = async (m: Medication) => {
    if (!confirm(tr('med.edit.deleteConfirm', { name: m.name }))) return
    setBusy(true)
    try {
      await deleteMedication(m.id)
      await reload()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : tr('med.edit.deleteFail'))
    } finally {
      setBusy(false)
    }
  }

  const markDose = async (dose: DayDose, skipped: boolean) => {
    if (!selectedDay) return
    setBusy(true)
    try {
      const existing = dose.log
      if (existing && existing.skipped === skipped) {
        await deleteMedLog(existing.id)
      } else {
        const log: MedLog = {
          id: existing?.id ?? uid(),
          profileId: userId,
          medicationId: dose.medication.id,
          takenDate: selectedDay,
          takenTime: dose.time || null,
          takenAt: new Date().toISOString(),
          skipped,
          note: existing?.note ?? '',
        }
        await putMedLog(log)
      }
      await reload()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : tr('med.edit.logFail'))
    } finally {
      setBusy(false)
    }
  }

  const dayDoses = selectedDay ? listDayDoses(meds, logs, selectedDay) : []
  const hasMeds = meds.length > 0

  const renderDayCell = (day: Date, compact?: boolean) => {
    const key = format(day, 'yyyy-MM-dd')
    const mark = dayMedMark(enabledMeds, logs, key)
    const adhere = stripAdherenceFromMark(mark)
    const isToday = isSameDay(day, today)
    if (compact) {
      return (
        <button
          key={key}
          type="button"
          className={`med-strip-day mark-${adhere} ${isToday ? 'is-today' : ''}`}
          onClick={() => setSelectedDay(key)}
          aria-label={`${format(day, datePattern(language, 'monthDay'), { locale: dateFnsLocale(language) })} ${adhereLabel(adhere) || tr('med.status.none')}`}
        >
          <span className="med-strip-dow">{dowLabels[day.getDay()]}</span>
          <span className="med-strip-num">{format(day, 'd')}</span>
          <span className={`med-strip-dot mark-${adhere}`} />
          <span className="med-strip-status">{adhereLabel(adhere) || '—'}</span>
        </button>
      )
    }
    const inMonth = isSameMonth(day, month)
    return (
      <button
        key={key}
        type="button"
        className={`med-cal-cell mark-${mark} ${inMonth ? '' : 'out'} ${
          selectedDay === key ? 'selected' : ''
        } ${isToday ? 'is-today' : ''}`}
        onClick={() => inMonth && setSelectedDay(key)}
        disabled={!inMonth}
      >
        <span className="med-cal-num">{format(day, 'd')}</span>
        {mark !== 'none' ? <span className={`med-cal-dot mark-${mark}`} /> : null}
      </button>
    )
  }

  return (
    <div className={`med-glow ${expanded ? 'is-expanded' : 'is-compact'}`}>
      {msg ? (
        <p className="hint" style={{ color: 'var(--color-danger, #c62828)' }}>
          {msg}
        </p>
      ) : null}

      {!hasMeds ? (
        <button type="button" className="med-glow-empty-card" onClick={openNew}>
          <span className="med-glow-empty-plus">+</span>
          <span className="med-glow-empty-caption">{tr('med.glow.emptyAdd')}</span>
        </button>
      ) : (
        <div className="med-glow-card">
          <AnimatePresence initial={false} mode="wait">
            {expanded ? (
              <motion.div
                key="expanded"
                initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                transition={{ duration: reduceMotion ? 0.01 : 0.28, ease: easeOutSoft }}
              >
                <div className="med-glow-header">
                  <h3 className="med-glow-title">{tr('brand.glimmerCal')}</h3>
                  <button
                    type="button"
                    className="med-glow-dots"
                    aria-label={tr('med.cal.settingsAria')}
                    onClick={() => setManageOpen(true)}
                  >
                    <DotsIcon />
                  </button>
                </div>
                <div className="med-cal-dow">
                  {dowLabels.map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
                <div className="med-cal-grid">{calendarDays.map((d) => renderDayCell(d))}</div>
                <div className="med-cal-legend hint">
                  <span>
                    <i className="med-cal-dot mark-scheduled" /> {tr('med.status.planned')}
                  </span>
                  <span>
                    <i className="med-cal-dot mark-partial" /> {tr('med.status.partial')}
                  </span>
                  <span>
                    <i className="med-cal-dot mark-done" /> {tr('med.status.taken')}
                  </span>
                  <span>
                    <i className="med-cal-dot mark-missed" /> {tr('med.status.missed')}
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="compact"
                className="med-strip"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                transition={{ duration: reduceMotion ? 0.01 : 0.2, ease: easeOutSoft }}
              >
                <div className="med-strip-row">{stripDays.map((d) => renderDayCell(d, true))}</div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            className="med-glow-chevron"
            aria-label={expanded ? tr('med.cal.collapse') : tr('med.cal.expand')}
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
          >
            <ChevronV up={expanded} />
          </button>
        </div>
      )}

      {showManageList && hasMeds ? (
        <div className="med-glow-list">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title" style={{ margin: 0 }}>
              {tr('med.myMeds')}
            </h3>
            <Button className="btn-sm" onClick={openNew}>
              + {tr('common.add')}
            </Button>
          </div>
          <div className="list">
            {meds.map((m) => (
              <div key={m.id} className="list-item">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong>
                    <span
                      className="med-color-swatch"
                      style={{ background: m.color || 'var(--color-primary)' }}
                      aria-hidden
                    />
                    {m.name}
                    {!m.enabled ? <span className="hint"> · {tr('common.disabled')}</span> : null}
                  </strong>
                  <div className="hint">
                    {m.dosage || tr('med.cal.noDosage')}
                    {m.reminderTimes.length ? ` · ${m.reminderTimes.join('、')}` : ''}
                    {` · ${freqLabel(m.intervalDays)}`}
                  </div>
                </div>
                <Button variant="ghost" className="btn-sm" onClick={() => openEdit(m)}>
                  {tr('common.edit')}
                </Button>
                <Button variant="ghost" className="btn-sm" onClick={() => void removeMed(m)}>
                  {tr('common.delete')}
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <Modal
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        title={tr('med.cal.settings')}
      >
        <p className="hint" style={{ marginTop: 0 }}>
          {tr('med.glow.settingsHint')}
        </p>
        <Button block onClick={() => { setManageOpen(false); openNew() }}>
          + {tr('med.edit.add')}
        </Button>
        {meds.length === 0 ? (
          <Empty text={tr('med.cal.empty')} />
        ) : (
          <div className="list" style={{ marginTop: 12 }}>
            {meds.map((m) => (
              <div key={m.id} className="list-item">
                <div style={{ flex: 1 }}>
                  <strong>{m.name}</strong>
                  <div className="hint">
                    {m.dosage || tr('med.cal.noDosage')} · {freqLabel(m.intervalDays)}
                    {!m.enabled ? ` · ${tr('common.disabled')}` : ''}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="btn-sm"
                  onClick={() => {
                    setManageOpen(false)
                    openEdit(m)
                  }}
                >
                  {tr('common.edit')}
                </Button>
                <Button variant="ghost" className="btn-sm" disabled={busy} onClick={() => void removeMed(m)}>
                  {tr('common.delete')}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(selectedDay)}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? tr('med.cal.dayTitle', { date: selectedDay }) : tr('brand.remedy')}
      >
        {dayDoses.length === 0 ? (
          <Empty text={tr('med.cal.noPlan')} />
        ) : (
          <div className="list">
            {dayDoses.map((d) => (
              <div key={`${d.medication.id}-${d.time}`} className="list-item med-dose-row">
                <div style={{ flex: 1 }}>
                  <strong>{d.medication.name}</strong>
                  <div className="hint">
                    {d.time || tr('common.allDay')}
                    {d.medication.dosage ? ` · ${d.medication.dosage}` : ''}
                    {' · '}
                    {d.status === 'taken'
                      ? tr('med.status.taken')
                      : d.status === 'skipped'
                        ? tr('med.status.skipped')
                        : d.status === 'missed'
                          ? tr('med.status.missed')
                          : tr('med.status.pending')}
                  </div>
                </div>
                <Button
                  variant={d.status === 'taken' ? 'primary' : 'ghost'}
                  className="btn-sm"
                  disabled={busy}
                  onClick={() => void markDose(d, false)}
                >
                  {tr('med.status.taken')}
                </Button>
                <Button
                  variant={d.status === 'skipped' ? 'accent' : 'ghost'}
                  className="btn-sm"
                  disabled={busy}
                  onClick={() => void markDose(d, true)}
                >
                  {tr('med.status.skipped')}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <MedEditCard
        open={editTarget !== null}
        target={editTarget}
        userId={userId}
        onClose={() => setEditTarget(null)}
        onSaved={reload}
      />
    </div>
  )
}
