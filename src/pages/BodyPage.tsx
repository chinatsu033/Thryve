import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EatingFlowSheet } from '../components/EatingFlowSheet'
import { SleepFlowSheet } from '../components/SleepFlowSheet'
import { Button, Empty, Page } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { uid } from '../lib/crypto'
import { normalizeAppetite, appetiteLabelKey } from '../lib/eating'
import { tabSwapMotion } from '../lib/motion'
import { sleepQualityLabelKey } from '../lib/sleep'
import {
  deleteEating,
  deleteSleep,
  listEatings,
  listSleeps,
  putEating,
  putSleep,
} from '../lib/db'
import type { EatingEntry, SleepEntry } from '../types'
import { useLocale } from '../context/LocaleContext'

type Tab = 'sleep' | 'eating' | 'meds'

export function BodyPage() {
  const { t } = useLocale()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('sleep')
  const [sleeps, setSleeps] = useState<SleepEntry[]>([])
  const [eatings, setEatings] = useState<EatingEntry[]>([])
  const [modal, setModal] = useState<'sleep' | 'eating' | null>(null)

  const reload = useCallback(async () => {
    if (!profile) return
    const [s, e] = await Promise.all([listSleeps(profile.id), listEatings(profile.id)])
    setSleeps(s.sort((a, b) => b.date.localeCompare(a.date)))
    setEatings(e.sort((a, b) => b.date.localeCompare(a.date)))
  }, [profile])

  useEffect(() => {
    void reload()
  }, [reload])

  if (!profile) return null

  return (
    <Page
      title={t('nav.cornerstone')}
      sub={t('body.sub')}
      back={() => navigate('/', { state: { homeLayer: 'dashboard' } })}
      actions={
        tab === 'meds' ? null : (
          <Button className="btn-sm no-print" onClick={() => setModal(tab)}>
            +
          </Button>
        )
      }
    >
      <div className="chip-row">
        {(
          [
            ['sleep', t('brand.rest')],
            ['eating', t('brand.nourish')],
            ['meds', t('brand.remedy')],
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
        <motion.div key={tab} {...tabSwapMotion}>
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
          {tab === 'meds' ? (
            <p className="hint" style={{ marginBottom: 10 }}>
              {t('body.medsHint')}
            </p>
          ) : null}
        </motion.div>
      </AnimatePresence>

      <SleepFlowSheet
        open={modal === 'sleep'}
        onClose={() => setModal(null)}
        onSave={async (entry) => {
          await putSleep({ ...entry, id: uid(), profileId: profile.id, createdAt: new Date().toISOString() })
          setModal(null)
          await reload()
        }}
      />
      <EatingFlowSheet
        open={modal === 'eating'}
        onClose={() => setModal(null)}
        onSave={async (entry) => {
          await putEating({ ...entry, id: uid(), profileId: profile.id, createdAt: new Date().toISOString() })
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
  const { t } = useLocale()
  if (!items.length) return <Empty text={t('body.emptySleep')} />
  return (
    <div className="list">
      {items.map((s) => (
        <div key={s.id} className="list-item">
          <div>
            <strong>{s.date}</strong> · {t(sleepQualityLabelKey(s.quality))}
            <div className="hint">
              {s.bedtime || '—'} → {s.wakeTime || '—'}
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
  const { t } = useLocale()
  if (!items.length) return <Empty text={t('body.emptyEating')} />
  return (
    <div className="list">
      {items.map((e) => (
        <div key={e.id} className="list-item">
          <div>
            <strong>{e.date}</strong> · {t(appetiteLabelKey(e.appetite))}
            <div className="hint">约 {e.meals} 餐 · 食欲 {normalizeAppetite(e.appetite)}/5</div>
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
