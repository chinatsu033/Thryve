import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { EMOTION_SOURCE_WORDS,
  emotionWordsForMood,  moodSoftLabelKey } from '../lib/mood'
import { backdropFade, sheetEnter, stepFade } from '../lib/motion'
import type { EmotionEntry } from '../types'
import { LakeMoodScene } from './LakeMoodScene'
import { Button, Field } from './ui'
import { useLocale } from '../context/LocaleContext'

type Step = 'mood' | 'words' | 'source'

export type EmotionFlowSave = Omit<EmotionEntry, 'id' | 'profileId' | 'createdAt'>

type Props = {
  open: boolean
  onClose: () => void
  onSave: (entry: EmotionFlowSave) => Promise<void>
  /** Skip outer backdrop + sheet chrome; parent owns the morphing shell. */
  embedded?: boolean
  /** Prefer matching the scenic landing's current lake mood. */
  initialMood?: number
  /**
   * sheet — default slide-up (EmotionPage).
   * morph — expand/shrink handled by parent; no sheetEnter.
   */
  presentation?: 'sheet' | 'morph'
}

export function EmotionFlowSheet({
  open,
  onClose,
  onSave,
  embedded = false,
  initialMood = 50,
  presentation = 'sheet',
}: Props) {
  const { t } = useLocale()
  const [step, setStep] = useState<Step>('mood')
  const [mood, setMood] = useState(initialMood)
  const [tags, setTags] = useState<string[]>([])
  const [customWord, setCustomWord] = useState('')
  const [sources, setSources] = useState<string[]>([])
  const [customSource, setCustomSource] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)

  const resetFlow = () => {
    setStep('mood')
    setMood(initialMood)
    setTags([])
    setCustomWord('')
    setSources([])
    setCustomSource('')
    setNotes('')
    setBusy(false)
  }

  useEffect(() => {
    if (!open) return
    resetFlow()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset once per open
  }, [open, initialMood])

  const wordChoices = useMemo(() => emotionWordsForMood(mood), [mood])

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

      await onSave({
        mode: 'current',
        mood,
        tags: finalTags,
        sources: finalSources,
        notes: notes.trim(),
        recordedAt: new Date().toISOString(),
      })
      onClose()
    } finally {
      setBusy(false)
    }
  }

  const body = (
    <>
      <button type="button" className="flow-close" onClick={onClose} aria-label={t('common.close')}>
        ✕
      </button>

      <AnimatePresence mode="wait">
        {step === 'mood' ? (
          <motion.div key="mood" className="flow-body flow-body-lake" {...stepFade}>
            <LakeMoodScene mood={mood} className="lake-scene-card-fill" />
            <div className="lake-overlay-controls">
              <p className="sleep-feel-label" aria-live="polite">
                {t(moodSoftLabelKey(mood))}
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
                  aria-valuetext={t(moodSoftLabelKey(mood))}
                  aria-label={t('emotion.flow.sliderAria')}
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
          <motion.div key="words" className="flow-body" {...stepFade}>
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
            <Field label={t('emotion.flow.customWord')}>
              <div className="row" style={{ alignItems: 'stretch' }}>
                <input
                  value={customWord}
                  onChange={(e) => setCustomWord(e.target.value)}
                  placeholder={t('emotion.flow.customPlaceholder')}
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
          <motion.div key="source" className="flow-body" {...stepFade}>
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
            <Field label={t('emotion.flow.customSource')}>
              <div className="row" style={{ alignItems: 'stretch' }}>
                <input
                  value={customSource}
                  onChange={(e) => setCustomSource(e.target.value)}
                  placeholder={t('emotion.flow.customPlaceholder')}
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
            <Field label={t('common.notesOptional')}>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('emotion.flow.notesPlaceholder')}
                rows={3}
              />
            </Field>
            <div className="row">
              <Button variant="ghost" onClick={() => setStep('words')}>
                上一步
              </Button>
              <Button disabled={busy} onClick={() => void save()}>
                {busy ? t('common.saving') : t('common.save')}
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )

  if (embedded) {
    if (!open) return null
    return (
      <div
        className={`flow-sheet emotion-flow-embedded${step === 'mood' ? ' flow-sheet-lake' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={t('emotion.flow.aria')}
      >
        {body}
      </div>
    )
  }

  if (!open) return null

  const sheetMotion = presentation === 'morph' ? undefined : sheetEnter

  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="flow-backdrop" {...backdropFade} role="presentation">
          <motion.div
            className={`flow-sheet${step === 'mood' ? ' flow-sheet-lake' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label={t('emotion.flow.aria')}
            {...(sheetMotion ?? {
              initial: false,
              animate: { opacity: 1 },
              exit: { opacity: 0 },
            })}
          >
            {body}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
