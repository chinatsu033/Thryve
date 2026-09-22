import { AnimatePresence, motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { dateFnsLocale, datePattern } from '../lib/dateLocale'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmotionFlowSheet } from '../components/EmotionFlowSheet'
import { Button, Empty, Page } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { uid } from '../lib/crypto'
import { deleteEmotion, listEmotions, putEmotion } from '../lib/db'
import { listItemMotion } from '../lib/motion'
import { normalizeMood, moodSoftLabelKey } from '../lib/mood'
import type { EmotionEntry } from '../types'
import { useLocale } from '../context/LocaleContext'

export function EmotionPage() {
  const { t, language } = useLocale()
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
    if (!confirm(t('emotion.deleteConfirm'))) return
    await deleteEmotion(id)
    await reload()
  }

  const displayLabel = (e: EmotionEntry) => {
    const m = normalizeMood(e.mood, e)
    return t(moodSoftLabelKey(m))
  }

  const tagLabel = (w: string) => {
    const k = `tag.${w}`
    const tr = t(k)
    return tr === k ? w : tr
  }
  const srcLabel = (w: string) => {
    const k = `src.${w}`
    const tr = t(k)
    return tr === k ? w : tr
  }

  return (
    <Page
      title={t('nav.attune')}
      sub={t('emotion.sub')}
      back={() => navigate('/', { state: { homeLayer: 'dashboard' } })}
      actions={
        <Button className="btn-sm no-print" onClick={() => setOpen(true)}>
          +
        </Button>
      }
    >
      <AnimatePresence mode="popLayout">
        {items.length === 0 ? (
          <Empty text={t('emotion.empty')} />
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
                    · {e.mode === 'daily' ? t('home.mode.daily') : t('home.mode.current')}
                  </span>
                  {e.tags.length > 0 ? (
                    <div style={{ marginTop: 6 }} className="tag-grid">
                      {e.tags.map((tag) => (
                        <span
                          key={tag}
                          className="tag active"
                          style={{ cursor: 'default', padding: '4px 10px' }}
                        >
                          {tagLabel(tag)}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {(e.sources ?? []).length > 0 ? (
                    <div className="hint" style={{ marginTop: 6 }}>
                      {t('emotion.source')}{(e.sources ?? []).map(srcLabel).join(t('list.sep'))}
                    </div>
                  ) : null}
                  {e.notes ? <p style={{ marginTop: 8, marginBottom: 0 }}>{e.notes}</p> : null}
                  <div className="meta" style={{ marginTop: 6 }}>
                    {format(parseISO(e.recordedAt), datePattern(language, 'fullDateTime'), { locale: dateFnsLocale(language) })}
                  </div>
                </div>
                <Button variant="ghost" className="btn-sm no-print" onClick={() => void remove(e.id)}>
                  {t('common.delete')}
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
