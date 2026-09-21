import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { formatHm, parseHm } from '../lib/sleep'
import { AnalogClockPicker } from './AnalogClockPicker'
import { Button, Empty, Field, Modal } from './ui'
import { uid } from '../lib/crypto'
import {
  deleteMedication,
  deleteMedLog,
  listMedications,
  listMedLogs,
  putMedication,
  putMedLog,
} from '../lib/db'
import {
  dayMedMark,
  listDayDoses,
  normalizeReminderTime,
  type DayDose,
} from '../lib/meds'
import {
  currentNotificationPermission,
  requestNotificationPermission,
  rescheduleMedReminders,
} from '../lib/medReminders'
import type { MedLog, Medication } from '../types'

const DOW_CHIPS: { v: number; label: string }[] = [
  { v: 0, label: '日' },
  { v: 1, label: '一' },
  { v: 2, label: '二' },
  { v: 3, label: '三' },
  { v: 4, label: '四' },
  { v: 5, label: '五' },
  { v: 6, label: '六' },
]

type MedForm = {
  name: string
  dosage: string
  notes: string
  reminderTimes: string[]
  daysOfWeek: number[] | null
  intervalDays: number
  anchorDate: string
  color: string
  enabled: boolean
}

const emptyForm = (): MedForm => ({
  name: '',
  dosage: '',
  notes: '',
  reminderTimes: ['08:00'],
  daysOfWeek: null,
  intervalDays: 1,
  anchorDate: new Date().toISOString().slice(0, 10),
  color: '#FF8A65',
  enabled: true,
})

function formFromMed(m: Medication): MedForm {
  return {
    name: m.name,
    dosage: m.dosage,
    notes: m.notes,
    reminderTimes: m.reminderTimes.length ? [...m.reminderTimes] : ['08:00'],
    daysOfWeek: m.daysOfWeek == null || m.daysOfWeek.length === 0 ? null : [...m.daysOfWeek],
    intervalDays: Math.max(1, m.intervalDays ?? 1),
    anchorDate: m.anchorDate || m.createdAt.slice(0, 10),
    color: m.color || '#FF8A65',
    enabled: m.enabled,
  }
}

export function MedsPanel({ userId }: { userId: string }) {
  const [meds, setMeds] = useState<Medication[]>([])
  const [logs, setLogs] = useState<MedLog[]>([])
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [editMed, setEditMed] = useState<Medication | null | 'new'>(null)
  const [form, setForm] = useState<MedForm>(emptyForm())
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [pickingIndex, setPickingIndex] = useState<number | null>(null)
  const [clockMode, setClockMode] = useState<'hour' | 'minute'>('hour')
  const [pickH, setPickH] = useState(8)
  const [pickM, setPickM] = useState(0)

  const openTimePicker = (i: number) => {
    const raw = form.reminderTimes[i] || '08:00'
    const { hour, minute } = parseHm(raw)
    setPickH(hour)
    setPickM(minute)
    setClockMode('hour')
    setPickingIndex(i)
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

  const monthFrom = format(startOfMonth(month), 'yyyy-MM-dd')
  const monthTo = format(endOfMonth(month), 'yyyy-MM-dd')

  const reload = useCallback(async () => {
    const [m, l] = await Promise.all([
      listMedications(userId),
      listMedLogs(userId, { from: monthFrom, to: monthTo }),
    ])
    setMeds(m)
    setLogs(l)
    rescheduleMedReminders(m, l)
  }, [userId, monthFrom, monthTo])

  useEffect(() => {
    if (editMed === null) setPickingIndex(null)
  }, [editMed])

  useEffect(() => {
    void reload().catch((e) => {
      console.error(e)
      setMsg(e instanceof Error ? e.message : '加载失败')
    })
  }, [reload])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') rescheduleMedReminders(meds, logs)
    }
    window.addEventListener('focus', onVis)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('focus', onVis)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [meds, logs])

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [month])

  const openNew = async () => {
    const perm = currentNotificationPermission()
    if (perm === 'default') {
      await requestNotificationPermission()
    }
    setForm(emptyForm())
    setEditMed('new')
  }

  const openEdit = (m: Medication) => {
    setForm(formFromMed(m))
    setEditMed(m)
  }

  const saveMed = async () => {
    const name = form.name.trim()
    if (!name) {
      setMsg('请填写药品名称')
      return
    }
    const times = form.reminderTimes
      .map((t) => normalizeReminderTime(t))
      .filter((t): t is string => Boolean(t))
    if (!times.length) {
      setMsg('请至少添加一个有效提醒时间（HH:mm）')
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
        editMed && editMed !== 'new'
          ? {
              ...editMed,
              name,
              dosage: form.dosage.trim(),
              notes: form.notes.trim(),
              reminderTimes: times,
              daysOfWeek: form.daysOfWeek,
              intervalDays: form.intervalDays,
              anchorDate: form.anchorDate,
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
              daysOfWeek: form.daysOfWeek,
              intervalDays: form.intervalDays,
              anchorDate: form.anchorDate,
              color: form.color || null,
              enabled: form.enabled,
              createdAt: nowIso,
              updatedAt: nowIso,
            }
      await putMedication(base)
      setEditMed(null)
      setMsg('')
      await reload()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '保存失败')
    } finally {
      setBusy(false)
    }
  }

  const removeMed = async (m: Medication) => {
    if (!confirm(`删除「${m.name}」及其打卡记录？`)) return
    setBusy(true)
    try {
      await deleteMedication(m.id)
      await reload()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '删除失败')
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
      setMsg(e instanceof Error ? e.message : '打卡失败')
    } finally {
      setBusy(false)
    }
  }

  const dayDoses = selectedDay ? listDayDoses(meds, logs, selectedDay) : []

  const everyDay = form.daysOfWeek == null || form.daysOfWeek.length === 0

  return (
    <div className="meds-panel">
      <p className="hint meds-disclaimer">
        网页提醒在标签关闭时可能不准；建议保留标签或「添加到主屏幕」。本功能不能替代医嘱。
      </p>
      {msg ? <p className="hint" style={{ color: 'var(--color-danger, #c62828)' }}>{msg}</p> : null}

      <div className="med-cal">
        <div className="med-cal-header">
          <Button variant="ghost" className="btn-sm" onClick={() => setMonth((m) => subMonths(m, 1))}>
            ‹
          </Button>
          <strong>{format(month, 'yyyy年M月', { locale: zhCN })}</strong>
          <Button variant="ghost" className="btn-sm" onClick={() => setMonth((m) => addMonths(m, 1))}>
            ›
          </Button>
        </div>
        <div className="med-cal-dow">
          {DOW_CHIPS.map((d) => (
            <span key={d.v}>{d.label}</span>
          ))}
        </div>
        <div className="med-cal-grid">
          {calendarDays.map((day) => {
            const key = format(day, 'yyyy-MM-dd')
            const inMonth = isSameMonth(day, month)
            const mark = inMonth ? dayMedMark(meds, logs, key) : 'none'
            return (
              <button
                key={key}
                type="button"
                className={`med-cal-cell mark-${mark} ${inMonth ? '' : 'out'} ${
                  selectedDay === key ? 'selected' : ''
                }`}
                onClick={() => inMonth && setSelectedDay(key)}
                disabled={!inMonth}
              >
                <span className="med-cal-num">{format(day, 'd')}</span>
                {mark !== 'none' ? <span className={`med-cal-dot mark-${mark}`} /> : null}
              </button>
            )
          })}
        </div>
        <div className="med-cal-legend hint">
          <span><i className="med-cal-dot mark-scheduled" /> 计划</span>
          <span><i className="med-cal-dot mark-partial" /> 部分</span>
          <span><i className="med-cal-dot mark-done" /> 已服/跳过</span>
          <span><i className="med-cal-dot mark-missed" /> 漏服</span>
        </div>
      </div>

      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
        <h3 className="card-title" style={{ margin: 0 }}>我的药品</h3>
        <Button className="btn-sm" onClick={() => void openNew()}>
          + 添加
        </Button>
      </div>

      {meds.length === 0 ? (
        <Empty text="暂无药品，点击「添加」开始" />
      ) : (
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
                  {m.dosage || '剂量未填'}
                  {m.reminderTimes.length
                    ? ` · ${m.reminderTimes.join('、')}`
                    : ''}
                  {m.daysOfWeek == null || m.daysOfWeek.length === 0
                    ? ' · 每天'
                    : ` · 周${m.daysOfWeek.map((d) => DOW_CHIPS.find((c) => c.v === d)?.label ?? d).join('')}`}
                </div>
                {m.notes ? <p style={{ margin: '6px 0 0' }}>{m.notes}</p> : null}
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
      )}

      <Modal
        open={Boolean(selectedDay)}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? `${selectedDay} 用药` : '用药'}
      >
        {dayDoses.length === 0 ? (
          <Empty text="这一天没有计划用药" />
        ) : (
          <div className="list">
            {dayDoses.map((d) => (
              <div key={`${d.medication.id}-${d.time}`} className="list-item med-dose-row">
                <div style={{ flex: 1 }}>
                  <strong>{d.medication.name}</strong>
                  <div className="hint">
                    {d.time || '全天'}
                    {d.medication.dosage ? ` · ${d.medication.dosage}` : ''}
                    {' · '}
                    {d.status === 'taken'
                      ? '已服'
                      : d.status === 'skipped'
                        ? '已跳过'
                        : d.status === 'missed'
                          ? '漏服'
                          : '待服'}
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

      <Modal
        open={editMed !== null}
        onClose={() => setEditMed(null)}
        title={editMed === 'new' ? '添加药品' : '编辑药品'}
      >
        <Field label="名称">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="如：舍曲林"
          />
        </Field>
        <Field label="剂量">
          <input
            value={form.dosage}
            onChange={(e) => setForm({ ...form, dosage: e.target.value })}
            placeholder="如：50mg"
          />
        </Field>
        <Field label="提醒时间" hint="点击时间用表盘选择，可添加多个">
          <div className="med-times">
            {form.reminderTimes.map((t, i) => (
              <div key={i} className="row" style={{ gap: 8, alignItems: 'center' }}>
                <button
                  type="button"
                  className="chip med-time-chip"
                  onClick={() => openTimePicker(i)}
                  aria-label={`提醒时间 ${t || '未设置'}`}
                >
                  {normalizeReminderTime(t) || t || '选择时间'}
                </button>
                <Button
                  variant="ghost"
                  className="btn-sm"
                  onClick={() =>
                    setForm({
                      ...form,
                      reminderTimes: form.reminderTimes.filter((_, j) => j !== i),
                    })
                  }
                >
                  移除
                </Button>
              </div>
            ))}
            <Button
              variant="ghost"
              className="btn-sm"
              onClick={() => setForm({ ...form, reminderTimes: [...form.reminderTimes, '20:00'] })}
            >
              + 时间
            </Button>
          </div>
          {pickingIndex != null ? (
            <div className="med-clock-panel" role="dialog" aria-label="选择提醒时间">
              <AnalogClockPicker
                hour={pickH}
                minute={pickM}
                mode={clockMode}
                chip={`时间 ${pickingIndex + 1}`}
                onHourChange={setPickH}
                onMinuteChange={setPickM}
                onHourCommit={() => setClockMode('minute')}
                onMinuteCommit={commitPickedTime}
              />
              <div className="row" style={{ marginTop: 10, justifyContent: 'center', gap: 8 }}>
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
        </Field>
        <Field label="服药日" hint="不选则每天">
          <div className="chip-row">
            <button
              type="button"
              className={`chip ${everyDay ? 'active' : ''}`}
              onClick={() => setForm({ ...form, daysOfWeek: null })}
            >
              每天
            </button>
            {DOW_CHIPS.map((d) => {
              const active = !everyDay && (form.daysOfWeek ?? []).includes(d.v)
              return (
                <button
                  key={d.v}
                  type="button"
                  className={`chip ${active ? 'active' : ''}`}
                  onClick={() => {
                    const cur = new Set(form.daysOfWeek ?? [])
                    if (everyDay) {
                      setForm({ ...form, daysOfWeek: [d.v] })
                      return
                    }
                    if (cur.has(d.v)) cur.delete(d.v)
                    else cur.add(d.v)
                    const arr = [...cur].sort()
                    setForm({ ...form, daysOfWeek: arr.length ? arr : null })
                  }}
                >
                  周{d.label}
                </button>
              )
            })}
          </div>
        </Field>
        <Field label="颜色">
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
          />
        </Field>
        <Field label="备注">
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </Field>
        <label className="med-enable-row">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
          />
          启用提醒与日历计划
        </label>
        <div className="row" style={{ marginTop: 12 }}>
          <Button disabled={busy} onClick={() => void saveMed()}>
            {busy ? '保存中…' : '保存'}
          </Button>
          <Button variant="ghost" onClick={() => setEditMed(null)}>
            取消
          </Button>
        </div>
      </Modal>
    </div>
  )
}
