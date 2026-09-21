import { AnimatePresence, motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useCallback, useEffect, useState } from 'react'
import { Button, Empty, Field, Modal, MoodSlider, Page } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { uid } from '../lib/crypto'
import { deleteEmotion, listEmotions, putEmotion } from '../lib/db'
import { EMOTION_TAGS, type EmotionEntry, type EmotionMode } from '../types'

export function EmotionPage() {
  const { profile } = useAuth()
  const [items, setItems] = useState<EmotionEntry[]>([])
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<EmotionMode>('current')
  const [mood, setMood] = useState(5)
  const [tags, setTags] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)

  const reload = useCallback(async () => {
    if (!profile) return
    const list = await listEmotions(profile.id)
    setItems(list.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)))
  }, [profile])

  useEffect(() => {
    void reload()
  }, [reload])

  if (!profile) return null

  const toggleTag = (t: string) => {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  }

  const resetForm = () => {
    setMode('current')
    setMood(5)
    setTags([])
    setNotes('')
  }

  const save = async () => {
    setBusy(true)
    try {
      const entry: EmotionEntry = {
        id: uid(),
        profileId: profile.id,
        mode,
        mood,
        tags,
        notes: notes.trim(),
        recordedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }
      await putEmotion(entry)
      setOpen(false)
      resetForm()
      await reload()
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('确定删除这条情绪记录？')) return
    await deleteEmotion(id)
    await reload()
  }

  return (
    <Page
      title="情绪记录"
      sub="记录当下感受，或回顾一整天的心情。"
      actions={
        <Button className="btn-sm no-print" onClick={() => setOpen(true)}>
          ＋ 新建
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
              >
                <div>
                  <strong style={{ color: 'var(--color-primary)' }}>{e.mood}/10</strong>
                  <span className="hint">
                    {' '}
                    · {e.mode === 'daily' ? '全天总结' : '当下感受'}
                  </span>
                  {e.tags.length > 0 ? (
                    <div style={{ marginTop: 6 }} className="tag-grid">
                      {e.tags.map((t) => (
                        <span key={t} className="tag active" style={{ cursor: 'default', padding: '4px 10px' }}>
                          {t}
                        </span>
                      ))}
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

      <Modal open={open} onClose={() => setOpen(false)} title="记录情绪">
        <div className="chip-row">
          <button
            type="button"
            className={`chip ${mode === 'current' ? 'active' : ''}`}
            onClick={() => setMode('current')}
          >
            当下感受
          </button>
          <button
            type="button"
            className={`chip ${mode === 'daily' ? 'active' : ''}`}
            onClick={() => setMode('daily')}
          >
            全天总结
          </button>
        </div>
        <MoodSlider value={mood} onChange={setMood} />
        <Field label="情绪标签">
          <div className="tag-grid">
            {EMOTION_TAGS.map((t) => (
              <button
                key={t}
                type="button"
                className={`tag ${tags.includes(t) ? 'active' : ''}`}
                onClick={() => toggleTag(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </Field>
        <Field label="备注">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="发生了什么？身体感觉如何？"
          />
        </Field>
        <Button block disabled={busy} onClick={() => void save()}>
          {busy ? '保存中…' : '保存'}
        </Button>
      </Modal>
    </Page>
  )
}
