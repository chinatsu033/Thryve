import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Card, Page } from '../components/ui'
import { useLocale } from '../context/LocaleContext'
import { LANGUAGE_IDS, LANGUAGE_LABELS, type LanguageId } from '../lib/locale'
import { DANMAKU_LINES } from '../locales/messages'

type Bubble = {
  id: string
  text: string
  top: string
  left: string
  size: number
  duration: number
  delay: number
  opacity: number
}

function buildBubbles(lines: string[], language: LanguageId): Bubble[] {
  return lines.map((text, i) => {
    const col = i % 4
    const row = Math.floor(i / 4)
    return {
      id: `${language}-${i}`,
      text,
      top: `${8 + row * 22 + (i % 3) * 4}%`,
      left: `${4 + col * 24 + (i % 2) * 3}%`,
      size: 0.78 + (i % 5) * 0.12,
      duration: 14 + (i % 6) * 2.5,
      delay: (i % 7) * 0.6,
      opacity: 0.22 + (i % 4) * 0.08,
    }
  })
}

export function LanguageSelectPage() {
  const { language, setLanguage, markSetupDone, t, setupDone } = useLocale()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const fromSettings = params.get('from') === 'settings'

  const [selected, setSelected] = useState<LanguageId>(language)

  const bubbles = useMemo(
    () => buildBubbles(DANMAKU_LINES[selected] ?? DANMAKU_LINES['zh-Hans'], selected),
    [selected],
  )

  const onFinish = () => {
    setLanguage(selected)
    if (!setupDone || !fromSettings) {
      markSetupDone()
    }
    if (fromSettings) {
      navigate('/settings', { replace: true })
      return
    }
    navigate('/auth', { replace: true })
  }

  return (
    <Page title={t('onboarding.language.title')} sub={t('onboarding.language.sub')}>
      <div className="language-select-stage">
        <div className="danmaku-layer" aria-hidden>
          <AnimatePresence mode="wait">
            <motion.div
              key={selected}
              className="danmaku-set"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              {bubbles.map((b) => (
                <motion.span
                  key={b.id}
                  className="danmaku-item"
                  style={{
                    top: b.top,
                    left: b.left,
                    fontSize: `${b.size}rem`,
                    opacity: b.opacity,
                  }}
                  animate={{
                    y: [0, -18, 8, 0],
                    x: [0, 10, -6, 0],
                  }}
                  transition={{
                    duration: b.duration,
                    delay: b.delay,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  {b.text}
                </motion.span>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        <Card className="onboarding-card language-select-card">
          <div className="language-option-list">
            {LANGUAGE_IDS.map((id) => {
              const active = id === selected
              return (
                <button
                  key={id}
                  type="button"
                  className={`language-option${active ? ' is-selected' : ''}`}
                  onClick={() => setSelected(id)}
                  aria-pressed={active}
                >
                  {LANGUAGE_LABELS[id]}
                </button>
              )
            })}
          </div>
          <div style={{ height: 16 }} />
          <Button block onClick={onFinish}>
            {fromSettings || setupDone
              ? t('onboarding.language.finish')
              : t('onboarding.language.finish')}
          </Button>
        </Card>
      </div>
    </Page>
  )
}
