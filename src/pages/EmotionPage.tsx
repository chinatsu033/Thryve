import { AnimatePresence, motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LakeMoodScene } from '../components/LakeMoodScene'
import { Button, Empty, Field, Page } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { uid } from '../lib/crypto'
import { deleteEmotion, listEmotions, putEmotion } from '../lib/db'
import {
  backdropFade,
  listItemMotion,
  sheetEnter,
  stepFade,
} from '../lib/motion'
import {
  EMOTION_SOURCE_WORDS,
  emotionWordsForMood,
  moodSoftLabel,
  normalizeMood,
} from '../lib/mood'
import type { EmotionEntry } from '../types'

type Step = 'mood' | 'words' | 'source'

export function EmotionPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState<EmotionEntry[]>([])
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('mood')
  const [mood, setMood] = useState(50)
  const [tags, setTags] = useState<string[]>([])
  const [customWord, setCustomWord] = useState('')
  const [sources, setSources] = useState<string[]>([])
  const [customSource, setCustomSource] = useState('')
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

  const wordChoices = useMemo(() => emotionWordsForMood(mood), [mood])

  if (!profile) return null

  const resetFlow = () => {
    setStep('mood')
    setMood(50)
    setTags([])
    setCustomWord('')
    setSources([])
    setCustomSource('')
    setNotes('')
  }

  const closeFlow = () => {
    setOpen(false)
    resetFlow()
  }

  const openFlow = () => {
    resetFlow()
    setOpen(true)
  }

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter((x) => x !== value) : [...list, value])
  }

  const addCustomWord = () => {
    const w = customWord.trim()
    if (!w) return
    if (!tags.includes(w)) setTags([...tags, w])
    setCustomWord('')
  }

  const addCustomSource = () => {
    const w = customSource.trim()
    if (!w) return
    if (!sources.includes(w)) setSources([...sources, w])
    setCustomSource('')
  }

  const save = async () => {
    setBusy(true)
    try {
      const finalTags = [...tags]
      const cw = customWord.trim()
      if (cw && !finalTags.includes(cw)) finalTags.push(cw)
      const finalSources = [...sources]
      const cs = customSource.trim()
      if (cs && !finalSources.includes(cs)) finalSources.push(cs)

      const entry: EmotionEntry = {
        id: uid(),
        profileId: profile.id,
        mode: 'current',
        mood,
        tags: finalTags,
        sources: finalSources,
        notes: notes.trim(),
        recordedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }
      await putEmotion(entry)
      closeFlow()
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
        <Button className="btn-sm no-print" onClick={openFlow}>
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

      <AnimatePresence>
        {open ? (
          <motion.div
            className="flow-backdrop"
            {...backdropFade}
            role="presentation"
          >
            <motion.div
              className={`flow-sheet${step === 'mood' ? ' flow-sheet-lake' : ''}`}
              role="dialog"
              aria-modal="true"
              aria-label="记录情绪"
              {...sheetEnter}
            >
              <button type="button" className="flow-close" onClick={closeFlow} aria-label="关闭">
                ✕
              </button>

              <AnimatePresence mode="wait">
                {step === 'mood' ? (
                  <motion.div
                    key="mood"
                    className="flow-body flow-body-lake"
                    {...stepFade}
                  >
                    <LakeMoodScene mood={mood} className="lake-scene-card-fill" />
                    <div className="lake-overlay-controls">
                      <p className="sleep-feel-label" aria-live="polite">
                        {moodSoftLabel(mood)}
                      </p>
                      <div className="lake-slider-wrap">
                        <input
                          type="range"
                          min={1}
                          max={100}
                          step={1}
                          value={mood}
                          onChange={(e) => setMood(Number(e.target.value))}
                          aria-valuemin={1}
                          aria-valuemax={100}
                          aria-valuenow={mood}
                          aria-valuetext={moodSoftLabel(mood)}
                          aria-label="情绪：低谷到盛放"
                          className="lake-range"
                        />
                        <div className="lake-slider-labels">
                          <span>低谷</span>
                          <span>盛放</span>
                        </div>
                      </div>
                      <Button block onClick={() => setStep('words')}>
                        确定
                      </Button>
                    </div>
                  </motion.div>
                ) : null}

                {step === 'words' ? (
                  <motion.div
                    key="words"
                    className="flow-body"
                    {...stepFade}
                  >
                    <h2 className="flow-title">用词语形容</h2>
                    <p className="flow-sub">可多选，也可写下自己的词。</p>
                    <div className="tag-grid" style={{ marginBottom: 14 }}>
                      {wordChoices.map((t) => (
                        <button
                          key={t}
                          type="button"
                          className={`tag ${tags.includes(t) ? 'active' : ''}`}
                          onClick={() => toggle(tags, setTags, t)}
                        >
                          {t}
                        </button>
                      ))}
                      {tags
                        .filter((t) => !wordChoices.includes(t))
                        .map((t) => (
                          <button
                            key={t}
                            type="button"
                            className="tag active"
                            onClick={() => toggle(tags, setTags, t)}
                          >
                            {t}
                          </button>
                        ))}
                    </div>
                    <Field label="自定义词语">
                      <div className="row" style={{ alignItems: 'stretch' }}>
                        <input
                          value={customWord}
                          onChange={(e) => setCustomWord(e.target.value)}
                          placeholder="输入后点添加"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addCustomWord()
                            }
                          }}
                          style={{ flex: 1, minWidth: 0 }}
                        />
                        <Button variant="ghost" className="btn-sm" onClick={addCustomWord}>
                          添加
                        </Button>
                      </div>
                    </Field>
                    <div className="row">
                      <Button variant="ghost" onClick={() => setStep('mood')}>
                        上一步
                      </Button>
                      <Button onClick={() => setStep('source')}>继续</Button>
                    </div>
                  </motion.div>
                ) : null}

                {step === 'source' ? (
                  <motion.div
                    key="source"
                    className="flow-body"
                    {...stepFade}
                  >
                    <h2 className="flow-title">它从哪里来</h2>
                    <p className="flow-sub">选择或写下感受的来源。</p>
                    <div className="tag-grid" style={{ marginBottom: 14 }}>
                      {EMOTION_SOURCE_WORDS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          className={`tag ${sources.includes(t) ? 'active' : ''}`}
                          onClick={() => toggle(sources, setSources, t)}
                        >
                          {t}
                        </button>
                      ))}
                      {sources
                        .filter((t) => !(EMOTION_SOURCE_WORDS as readonly string[]).includes(t))
                        .map((t) => (
                          <button
                            key={t}
                            type="button"
                            className="tag active"
                            onClick={() => toggle(sources, setSources, t)}
                          >
                            {t}
                          </button>
                        ))}
                    </div>
                    <Field label="自定义来源">
                      <div className="row" style={{ alignItems: 'stretch' }}>
                        <input
                          value={customSource}
                          onChange={(e) => setCustomSource(e.target.value)}
                          placeholder="输入后点添加"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addCustomSource()
                            }
                          }}
                          style={{ flex: 1, minWidth: 0 }}
                        />
                        <Button variant="ghost" className="btn-sm" onClick={addCustomSource}>
                          添加
                        </Button>
                      </div>
                    </Field>
                    <Field label="备注（可选）">
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="想补充的一点细节…"
                        rows={3}
                      />
                    </Field>
                    <div className="row">
                      <Button variant="ghost" onClick={() => setStep('words')}>
                        上一步
                      </Button>
                      <Button disabled={busy} onClick={() => void save()}>
                        {busy ? '保存中…' : '保存'}
                      </Button>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Page>
  )
}
