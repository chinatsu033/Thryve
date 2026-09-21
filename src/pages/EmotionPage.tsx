import { AnimatePresence, motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmotionFlowSheet } from '../components/EmotionFlowSheet'
import { Button, Empty, Page } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { uid } from '../lib/crypto'
import { deleteEmotion, listEmotions, putEmotion } from '../lib/db'
import { listItemMotion } from '../lib/motion'
import { moodSoftLabel, normalizeMood } from '../lib/mood'
import type { EmotionEntry } from '../types'

export function EmotionPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState<EmotionEntry[]>([])
  const [open, setOpen] = useState(false)

  const reload = useCallback(async () => {
    if (!profile) return
    const list = await listEmotions(profile.id)
    setItems(list.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)))
  }, [profile])

  useEffect(() => {
    void reload()
  }, [reload])

  if (!profile) return null

  const remove = async (id: string) => {
    if (!confirm('确定删除这条情绪记录？')) return
    await deleteEmotion(id)
    await reload()
  }

  const displayLabel = (e: EmotionEntry) => {
    const m = normalizeMood(e.mood, e)
    return moodSoftLabel(m)
  }

  return (
    <Page
      title="倾听"
      sub="用湖面风景感受当下，再轻轻写下词语与来源。"
      back={() => navigate('/', { state: { homeLayer: 'dashboard' } })}
      actions={
        <Button className="btn-sm no-print" onClick={() => setOpen(true)}>
          +
        </Button>
      }
    >
      <AnimatePresence mode="popLayout">
        {items.length === 0 ? (
          <Empty text="还没有情绪记录。点右上角开始写第一条。" />
        ) : (
          <div className="list">
            {items.map((e) => (
              <motion.div
                key={e.id}
                className="list-item"
                layout
                {...listItemMotion}
              >
                <div>
                  <strong style={{ color: 'var(--color-primary)' }}>{displayLabel(e)}</strong>
                  <span className="hint">
                    {' '}
                    · {e.mode === 'daily' ? '全天总结' : '当下感受'}
                  </span>
                  {e.tags.length > 0 ? (
                    <div style={{ marginTop: 6 }} className="tag-grid">
                      {e.tags.map((t) => (
                        <span
                          key={t}
                          className="tag active"
                          style={{ cursor: 'default', padding: '4px 10px' }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {(e.sources ?? []).length > 0 ? (
                    <div className="hint" style={{ marginTop: 6 }}>
                      来源：{(e.sources ?? []).join('、')}
                    </div>
                  ) : null}
                  {e.notes ? <p style={{ marginTop: 8, marginBottom: 0 }}>{e.notes}</p> : null}
                  <div className="meta" style={{ marginTop: 6 }}>
                    {format(parseISO(e.recordedAt), 'yyyy年M月d日 HH:mm', { locale: zhCN })}
                  </div>
                </div>
                <Button variant="ghost" className="btn-sm no-print" onClick={() => void remove(e.id)}>
                  删除
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <EmotionFlowSheet
        open={open}
        onClose={() => setOpen(false)}
        onSave={async (entry) => {
          await putEmotion({
            ...entry,
            id: uid(),
            profileId: profile.id,
            createdAt: new Date().toISOString(),
          })
          await reload()
        }}
      />
    </Page>
  )
}
