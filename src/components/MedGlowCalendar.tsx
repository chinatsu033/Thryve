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
import { zhCN } from 'date-fns/locale'
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
  frequencyLabel,
  listDayDoses,
  stripAdherenceFromMark,
  type DayDose,
  type StripAdherence,
} from '../lib/meds'
import { rescheduleMedReminders } from '../lib/medReminders'
import { easeOutSoft } from '../lib/motion'
import type { MedLog, Medication } from '../types'
import { useLocale } from '../context/LocaleContext'
import { getStoredLanguage } from '../lib/locale'
import { translate } from '../locales/messages'

const DOW = ['日', '一', '二', '三', '四', '五', '六'] as const

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
  const { t: tr } = useLocale()
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
    if (!confirm(`删除「${m.name}」及其打卡记录？`)) return
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
          aria-label={`${format(day, 'M月d日', { locale: zhCN })} ${adhereLabel(adhere) || tr('med.status.none')}`}
        >
          <span className="med-strip-dow">{DOW[day.getDay()]}</span>
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
          <span className="med-glow-empty-caption">点击添加用药提醒</span>
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
                  <h3 className="med-glow-title">微光日历</h3>
                  <button
                    type="button"
                    className="med-glow-dots"
                    aria-label="用药设置"
                    onClick={() => setManageOpen(true)}
                  >
                    <DotsIcon />
                  </button>
                </div>
                <div className="med-cal-dow">
                  {DOW.map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
                <div className="med-cal-grid">{calendarDays.map((d) => renderDayCell(d))}</div>
                <div className="med-cal-legend hint">
                  <span>
                    <i className="med-cal-dot mark-scheduled" /> 计划
                  </span>
                  <span>
                    <i className="med-cal-dot mark-partial" /> 部分
                  </span>
                  <span>
                    <i className="med-cal-dot mark-done" /> 已服
                  </span>
                  <span>
                    <i className="med-cal-dot mark-missed" /> 漏服
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
              我的药品
            </h3>
            <Button className="btn-sm" onClick={openNew}>
              + 添加
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
                    {!m.enabled ? <span className="hint"> · 已停用</span> : null}
                  </strong>
                  <div className="hint">
                    {m.dosage || tr('med.cal.noDosage')}
                    {m.reminderTimes.length ? ` · ${m.reminderTimes.join('、')}` : ''}
                    {` · ${frequencyLabel(m.intervalDays)}`}
                  </div>
                </div>
                <Button variant="ghost" className="btn-sm" onClick={() => openEdit(m)}>
                  编辑
                </Button>
                <Button variant="ghost" className="btn-sm" onClick={() => void removeMed(m)}>
                  删除
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <Modal
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        title="用药设置"
      >
        <p className="hint" style={{ marginTop: 0 }}>
          在首页管理提醒；也可在「基石 · 用药」查看详情。
        </p>
        <Button block onClick={() => { setManageOpen(false); openNew() }}>
          + 添加用药提醒
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
                    {m.dosage || tr('med.cal.noDosage')} · {frequencyLabel(m.intervalDays)}
                    {!m.enabled ? ' · 已停用' : ''}
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
                  编辑
                </Button>
                <Button variant="ghost" className="btn-sm" disabled={busy} onClick={() => void removeMed(m)}>
                  删除
                </Button>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(selectedDay)}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? `${selectedDay} 用药` : tr('brand.remedy')}
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
                  已服
                </Button>
                <Button
                  variant={d.status === 'skipped' ? 'accent' : 'ghost'}
                  className="btn-sm"
                  disabled={busy}
                  onClick={() => void markDose(d, true)}
                >
                  跳过
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
