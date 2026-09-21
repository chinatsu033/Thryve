import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { Button, Field, Modal } from './ui'
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

export type MedEditTarget = Medication | 'new' | null

type MedForm = {
  name: string
  dosage: string
  reminderTimes: string[]
  intervalDays: number
  /** Which frequency chip label is selected (每周 vs 每六天 both use 7). */
  freqLabel: string
  anchorDate: string
  enabled: boolean
  notes: string
  color: string
}

function emptyForm(): MedForm {
  const today = format(new Date(), 'yyyy-MM-dd')
  return {
    name: '',
    dosage: '',
    reminderTimes: defaultTimesForCount(1),
    intervalDays: 1,
    freqLabel: '每天',
    anchorDate: today,
    enabled: true,
    notes: '',
    color: '#FF8A65',
  }
}

function labelForInterval(n: number): string {
  if (n === 1) return '每天'
  if (n === 2) return '隔天'
  if (n === 3) return '每两天'
  if (n === 4) return '每三天'
  if (n === 5) return '每四天'
  if (n === 6) return '每五天'
  if (n === 7) return '每周'
  return `每${n}天`
}

function formFromMed(m: Medication): MedForm {
  const intervalDays = Math.max(1, m.intervalDays ?? 1)
  return {
    name: m.name,
    dosage: m.dosage,
    reminderTimes: m.reminderTimes.length ? [...m.reminderTimes] : defaultTimesForCount(1),
    intervalDays,
    freqLabel: labelForInterval(intervalDays),
    anchorDate: m.anchorDate || m.createdAt.slice(0, 10),
    enabled: m.enabled,
    notes: m.notes,
    color: m.color || '#FF8A65',
  }
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
  const [form, setForm] = useState<MedForm>(emptyForm())
  const [customName, setCustomName] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setMsg('')
    setCustomName('')
    if (target && target !== 'new') setForm(formFromMed(target))
    else setForm(emptyForm())
  }, [open, target])

  const timesCount = Math.min(5, Math.max(1, form.reminderTimes.length || 1))
  const isCommon = (COMMON_MED_NAMES as readonly string[]).includes(form.name)

  const setTimesCount = (n: number) => {
    const count = Math.min(5, Math.max(1, n))
    const current = form.reminderTimes.filter(Boolean)
    if (current.length === count) {
      setForm({ ...form, reminderTimes: current })
      return
    }
    if (current.length > count) {
      setForm({ ...form, reminderTimes: current.slice(0, count) })
      return
    }
    const defaults = defaultTimesForCount(count)
    const next = [...current]
    while (next.length < count) next.push(defaults[next.length] ?? '08:00')
    setForm({ ...form, reminderTimes: next })
  }

  const save = async () => {
    const name = (form.name.trim() || customName.trim()).trim()
    if (!name) {
      setMsg('请选择或填写药品名称')
      return
    }
    const times = form.reminderTimes
      .map((t) => normalizeReminderTime(t))
      .filter((t): t is string => Boolean(t))
    if (!times.length) {
      setMsg('请至少设置一个提醒时间')
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
      setMsg(e instanceof Error ? e.message : '保存失败')
    } finally {
      setBusy(false)
    }
  }

  const title = target === 'new' || !target ? '添加用药提醒' : '编辑用药提醒'

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="med-edit-card">
        {msg ? (
          <p className="hint" style={{ color: 'var(--color-danger, #c62828)' }}>
            {msg}
          </p>
        ) : null}

        <Field label="常用药品" hint="点选填入名称">
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

        <Field label="自定义添加">
          <input
            value={isCommon ? customName : form.name}
            onChange={(e) => {
              const v = e.target.value
              setCustomName(v)
              setForm({ ...form, name: v })
            }}
            placeholder="输入药品名称"
          />
        </Field>

        <Field label="计量" hint="如：1片、50mg">
          <input
            value={form.dosage}
            onChange={(e) => setForm({ ...form, dosage: e.target.value })}
            placeholder="1片 / 50mg"
          />
        </Field>

        <Field label="每天几次">
          <div className="chip-row">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={`chip ${timesCount === n ? 'active' : ''}`}
                onClick={() => setTimesCount(n)}
              >
                {n}次
              </button>
            ))}
          </div>
          <div className="med-times" style={{ marginTop: 10 }}>
            {form.reminderTimes.map((t, i) => (
              <div key={i} className="row" style={{ gap: 8, alignItems: 'center' }}>
                <span className="hint" style={{ minWidth: 48 }}>
                  第{i + 1}次
                </span>
                <input
                  type="time"
                  value={t}
                  onChange={(e) => {
                    const next = [...form.reminderTimes]
                    next[i] = e.target.value
                    setForm({ ...form, reminderTimes: next })
                  }}
                />
              </div>
            ))}
          </div>
        </Field>

        <Field label="使用次数 / 频率" hint="从添加日起按周期计算">
          <div className="chip-row med-freq-row">
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
        </Field>

        <label className="med-enable-row">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
          />
          启用提醒与日历计划
        </label>

        <div className="row" style={{ marginTop: 14 }}>
          <Button disabled={busy} onClick={() => void save()}>
            {busy ? '保存中…' : '保存'}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
        </div>
      </div>
    </Modal>
  )
}
