import { AnimatePresence, motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useCallback, useEffect, useState } from 'react'
import { Button, Empty, Field, Modal, MoodSlider, Page } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { uid } from '../lib/crypto'
import {
  deleteDepressive,
  deleteEating,
  deleteSleep,
  listDepressives,
  listEatings,
  listSleeps,
  putDepressive,
  putEating,
  putSleep,
} from '../lib/db'
import {
  CHECKLIST_LABELS,
  DEFAULT_CHECKLIST,
  type DepressiveChecklist,
  type DepressiveEntry,
  type EatingEntry,
  type SleepEntry,
} from '../types'

type Tab = 'sleep' | 'eating' | 'depressive'

function todayStr() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function BodyPage() {
  const { profile } = useAuth()
  const [tab, setTab] = useState<Tab>('sleep')
  const [sleeps, setSleeps] = useState<SleepEntry[]>([])
  const [eatings, setEatings] = useState<EatingEntry[]>([])
  const [deps, setDeps] = useState<DepressiveEntry[]>([])
  const [modal, setModal] = useState<Tab | null>(null)

  const reload = useCallback(async () => {
    if (!profile) return
    const [s, e, d] = await Promise.all([
      listSleeps(profile.id),
      listEatings(profile.id),
      listDepressives(profile.id),
    ])
    setSleeps(s.sort((a, b) => b.date.localeCompare(a.date)))
    setEatings(e.sort((a, b) => b.date.localeCompare(a.date)))
    setDeps(d.sort((a, b) => b.startedAt.localeCompare(a.startedAt)))
  }, [profile])

  useEffect(() => {
    void reload()
  }, [reload])

  if (!profile) return null

  return (
    <Page
      title="身心记录"
      sub="睡眠、饮食与抑郁发作轻量打卡。"
      actions={
        <Button className="btn-sm no-print" onClick={() => setModal(tab)}>
          ＋ 新建
        </Button>
      }
    >
      <div className="chip-row">
        {(
          [
            ['sleep', '睡眠'],
            ['eating', '饮食'],
            ['depressive', '抑郁发作'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            className={`chip ${tab === k ? 'active' : ''}`}
            onClick={() => setTab(k)}
          >
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          {tab === 'sleep' ? (
            <SleepList
              items={sleeps}
              onDelete={async (id) => {
                await deleteSleep(id)
                await reload()
              }}
            />
          ) : null}
          {tab === 'eating' ? (
            <EatingList
              items={eatings}
              onDelete={async (id) => {
                await deleteEating(id)
                await reload()
              }}
            />
          ) : null}
          {tab === 'depressive' ? (
            <DepList
              items={deps}
              onDelete={async (id) => {
                await deleteDepressive(id)
                await reload()
              }}
              onEnd={async (item) => {
                await putDepressive({ ...item, endedAt: new Date().toISOString() })
                await reload()
              }}
            />
          ) : null}
        </motion.div>
      </AnimatePresence>

      <SleepModal
        open={modal === 'sleep'}
        onClose={() => setModal(null)}
        onSave={async (entry) => {
          await putSleep({ ...entry, id: uid(), profileId: profile.id, createdAt: new Date().toISOString() })
          setModal(null)
          await reload()
        }}
      />
      <EatingModal
        open={modal === 'eating'}
        onClose={() => setModal(null)}
        onSave={async (entry) => {
          await putEating({ ...entry, id: uid(), profileId: profile.id, createdAt: new Date().toISOString() })
          setModal(null)
          await reload()
        }}
      />
      <DepModal
        open={modal === 'depressive'}
        onClose={() => setModal(null)}
        onSave={async (entry) => {
          await putDepressive({
            ...entry,
            id: uid(),
            profileId: profile.id,
            createdAt: new Date().toISOString(),
          })
          setModal(null)
          await reload()
        }}
      />
    </Page>
  )
}

function SleepList({
  items,
  onDelete,
}: {
  items: SleepEntry[]
  onDelete: (id: string) => Promise<void>
}) {
  if (!items.length) return <Empty text="暂无睡眠记录" />
  return (
    <div className="list">
      {items.map((s) => (
        <div key={s.id} className="list-item">
          <div>
            <strong>{s.date}</strong> · 质量 {s.quality}/10
            <div className="hint">
              {s.bedtime || '—'} → {s.wakeTime || '—'}
              {s.interruptions ? ` · 中断 ${s.interruptions} 次` : ''}
            </div>
            {s.notes ? <p style={{ margin: '6px 0 0' }}>{s.notes}</p> : null}
          </div>
          <Button variant="ghost" className="btn-sm" onClick={() => void onDelete(s.id)}>
            删除
          </Button>
        </div>
      ))}
    </div>
  )
}

function EatingList({
  items,
  onDelete,
}: {
  items: EatingEntry[]
  onDelete: (id: string) => Promise<void>
}) {
  if (!items.length) return <Empty text="暂无饮食记录" />
  return (
    <div className="list">
      {items.map((e) => (
        <div key={e.id} className="list-item">
          <div>
            <strong>{e.date}</strong> · 约 {e.meals} 餐 · 食欲 {e.appetite}/10
            {e.notes ? <p style={{ margin: '6px 0 0' }}>{e.notes}</p> : null}
          </div>
          <Button variant="ghost" className="btn-sm" onClick={() => void onDelete(e.id)}>
            删除
          </Button>
        </div>
      ))}
    </div>
  )
}

function DepList({
  items,
  onDelete,
  onEnd,
}: {
  items: DepressiveEntry[]
  onDelete: (id: string) => Promise<void>
  onEnd: (item: DepressiveEntry) => Promise<void>
}) {
  if (!items.length) return <Empty text="暂无抑郁发作记录" />
  return (
    <div className="list">
      {items.map((d) => (
        <div key={d.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <div>
              <strong>严重度 {d.severity}/10</strong>
              {!d.endedAt ? (
                <span style={{ color: 'var(--color-danger)', marginLeft: 8 }}>进行中</span>
              ) : null}
              <div className="meta">
                开始 {format(parseISO(d.startedAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                {d.endedAt
                  ? ` · 结束 ${format(parseISO(d.endedAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}`
                  : ''}
              </div>
            </div>
            <Button variant="ghost" className="btn-sm" onClick={() => void onDelete(d.id)}>
              删除
            </Button>
          </div>
          {d.feelings ? <p style={{ margin: '8px 0 0' }}>{d.feelings}</p> : null}
          <div className="hint" style={{ marginTop: 6 }}>
            {Object.entries(d.checklist)
              .filter(([, v]) => v)
              .map(([k]) => CHECKLIST_LABELS[k as keyof DepressiveChecklist])
              .join(' · ') || '未勾选清单项'}
          </div>
          {!d.endedAt ? (
            <Button className="btn-sm" style={{ marginTop: 10 }} onClick={() => void onEnd(d)}>
              标记为已结束
            </Button>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function SleepModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean
  onClose: () => void
  onSave: (e: Omit<SleepEntry, 'id' | 'profileId' | 'createdAt'>) => Promise<void>
}) {
  const [date, setDate] = useState(todayStr())
  const [bedtime, setBedtime] = useState('23:00')
  const [wakeTime, setWakeTime] = useState('07:00')
  const [quality, setQuality] = useState(5)
  const [interruptions, setInterruptions] = useState(0)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)

  return (
    <Modal open={open} onClose={onClose} title="睡眠记录">
      <Field label="日期">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <div className="row">
        <Field label="入睡">
          <input type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)} />
        </Field>
        <Field label="起床">
          <input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} />
        </Field>
      </div>
      <MoodSlider value={quality} onChange={setQuality} label="睡眠质量（1–10）" />
      <Field label="夜间中断次数">
        <input
          type="number"
          min={0}
          value={interruptions}
          onChange={(e) => setInterruptions(Number(e.target.value))}
        />
      </Field>
      <Field label="备注">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <Button
        block
        disabled={busy}
        onClick={() => {
          setBusy(true)
          void onSave({ date, bedtime, wakeTime, quality, interruptions, notes: notes.trim() }).finally(
            () => setBusy(false),
          )
        }}
      >
        保存
      </Button>
    </Modal>
  )
}

function EatingModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean
  onClose: () => void
  onSave: (e: Omit<EatingEntry, 'id' | 'profileId' | 'createdAt'>) => Promise<void>
}) {
  const [date, setDate] = useState(todayStr())
  const [meals, setMeals] = useState(3)
  const [appetite, setAppetite] = useState(5)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)

  return (
    <Modal open={open} onClose={onClose} title="饮食记录">
      <Field label="日期">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <Field label="大致餐次">
        <input type="number" min={0} max={10} value={meals} onChange={(e) => setMeals(Number(e.target.value))} />
      </Field>
      <MoodSlider value={appetite} onChange={setAppetite} label="食欲（1–10）" />
      <Field label="备注">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="进食情况、回避食物等" />
      </Field>
      <Button
        block
        disabled={busy}
        onClick={() => {
          setBusy(true)
          void onSave({ date, meals, appetite, notes: notes.trim() }).finally(() => setBusy(false))
        }}
      >
        保存
      </Button>
    </Modal>
  )
}

function DepModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean
  onClose: () => void
  onSave: (e: Omit<DepressiveEntry, 'id' | 'profileId' | 'createdAt'>) => Promise<void>
}) {
  const [startedAt, setStartedAt] = useState(() => format(new Date(), "yyyy-MM-dd'T'HH:mm"))
  const [feelings, setFeelings] = useState('')
  const [severity, setSeverity] = useState(5)
  const [checklist, setChecklist] = useState<DepressiveChecklist>({ ...DEFAULT_CHECKLIST })
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)

  return (
    <Modal open={open} onClose={onClose} title="抑郁发作记录">
      <Field label="开始时间">
        <input type="datetime-local" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} />
      </Field>
      <MoodSlider value={severity} onChange={setSeverity} label="严重程度（1–10）" />
      <Field label="主观感受">
        <textarea value={feelings} onChange={(e) => setFeelings(e.target.value)} placeholder="情绪、想法、身体感觉…" />
      </Field>
      <Field label="症状清单（参考，非诊断）">
        <div className="checklist">
          {(Object.keys(CHECKLIST_LABELS) as Array<keyof DepressiveChecklist>).map((k) => (
            <label key={k}>
              <input
                type="checkbox"
                checked={checklist[k]}
                onChange={(e) => setChecklist({ ...checklist, [k]: e.target.checked })}
              />
              <span>{CHECKLIST_LABELS[k]}</span>
            </label>
          ))}
        </div>
      </Field>
      <Field label="备注">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <Button
        block
        disabled={busy}
        onClick={() => {
          setBusy(true)
          void onSave({
            startedAt: new Date(startedAt).toISOString(),
            endedAt: null,
            feelings: feelings.trim(),
            severity,
            checklist,
            notes: notes.trim(),
          }).finally(() => setBusy(false))
        }}
      >
        保存
      </Button>
    </Modal>
  )
}
