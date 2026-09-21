import { format, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState, type TouchEvent as ReactTouchEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { EmotionFlowSheet } from '../components/EmotionFlowSheet'
import { MedGlowCalendar } from '../components/MedGlowCalendar'
import { LakeMoodScene } from '../components/LakeMoodScene'
import { Button, Card, Disclaimer, Empty, Page } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { uid } from '../lib/crypto'
import { listEatings, listEmotions, listSleeps, putEmotion } from '../lib/db'
import { moodSoftLabel, normalizeMood } from '../lib/mood'
import { appetiteLabel } from '../lib/eating'
import { easeOutSoft, layerTransition } from '../lib/motion'
import { sleepQualityLabel } from '../lib/sleep'
import type { EatingEntry, EmotionEntry, SleepEntry } from '../types'

type Layer = 'landing' | 'dashboard'

type HomeLocationState = { homeLayer?: Layer }

type ShellRect = { top: number; left: number; width: number; height: number; radius: number }

function layerFromLocation(search: string, state: unknown): Layer {
  const st = state as HomeLocationState | null
  if (st?.homeLayer === 'dashboard') return 'dashboard'
  const q = new URLSearchParams(search)
  if (q.get('view') === 'dashboard') return 'dashboard'
  return 'landing'
}

const SWIPE_THRESHOLD = 56

const DASHBOARD_MODULES: Array<{
  to: string
  label: string
  hint: string
  variant: 'primary' | 'accent' | 'ghost'
}> = [
  { to: '/summary', label: '心迹', hint: '就医总结', variant: 'ghost' },
  { to: '/emotion', label: '倾听', hint: '情绪记录', variant: 'primary' },
  { to: '/body', label: '基石', hint: '睡眠·饮食·用药', variant: 'accent' },
]

function fullShellRect(): ShellRect {
  return {
    top: 0,
    left: 0,
    width: typeof window !== 'undefined' ? window.innerWidth : 390,
    height: typeof window !== 'undefined' ? window.innerHeight : 844,
    radius: 0,
  }
}

/** Match `.flow-sheet` / `.flow-sheet-lake` visual footprint. */
function cardShellRect(): ShellRect {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const padX = 14
  const padTop = 18
  const padBottom = 18
  const width = Math.min(vw - padX * 2, 420)
  const height = Math.min(vh * 0.78, 620)
  return {
    top: padTop + (vh - padTop - padBottom - height) / 2,
    left: (vw - width) / 2,
    width,
    height,
    radius: 36,
  }
}

function ChevronUpIcon() {
  return (
    <svg className="home-chevron-icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <path
        d="M5 15 L12 8 L19 15"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg className="home-chevron-icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <path
        d="M5 9 L12 16 L19 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SettingsGearIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <path
        fill="currentColor"
        d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84a.48.48 0 0 0-.48.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87a.48.48 0 0 0 .12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.86 14.52a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.22.24.41.48.41h3.84c.24 0 .44-.19.48-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z"
      />
    </svg>
  )
}

export function HomePage() {
  const { profile } = useAuth()
  const location = useLocation()
  const reduceMotion = useReducedMotion()
  const [emotions, setEmotions] = useState<EmotionEntry[]>([])
  const [sleeps, setSleeps] = useState<SleepEntry[]>([])
  const [eatings, setEatings] = useState<EatingEntry[]>([])
  const [layer, setLayer] = useState<Layer>(() =>
    layerFromLocation(location.search, location.state),
  )
  /** Scenic full vs emotion card morph on Layer 1. */
  const [shellMode, setShellMode] = useState<'full' | 'card'>('full')
  const [emotionFlowOpen, setEmotionFlowOpen] = useState(false)
  const [shellRect, setShellRect] = useState<ShellRect>(() => fullShellRect())
  const touchStartY = useRef<number | null>(null)
  const pendingCloseRef = useRef(false)

  useEffect(() => {
    const next = layerFromLocation(location.search, location.state)
    if (next === 'dashboard') setLayer('dashboard')
  }, [location.search, location.state])

  useEffect(() => {
    if (!profile) return
    void (async () => {
      const [e, s, ea] = await Promise.all([
        listEmotions(profile.id),
        listSleeps(profile.id),
        listEatings(profile.id),
      ])
      setEmotions(e.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)))
      setSleeps(s.sort((a, b) => b.date.localeCompare(a.date)))
      setEatings(ea.sort((a, b) => b.date.localeCompare(a.date)))
    })()
  }, [profile])

  useEffect(() => {
    if (layer !== 'landing') {
      setShellMode('full')
      setEmotionFlowOpen(false)
      pendingCloseRef.current = false
      setShellRect(fullShellRect())
    }
  }, [layer])

  useEffect(() => {
    const sync = () => {
      setShellRect(shellMode === 'card' ? cardShellRect() : fullShellRect())
    }
    sync()
    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
  }, [shellMode])

  const goDashboard = useCallback(() => {
    if (shellMode === 'card') return
    setLayer('dashboard')
  }, [shellMode])
  const goLanding = useCallback(() => setLayer('landing'), [])

  const openEmotionFromLanding = useCallback(() => {
    pendingCloseRef.current = false
    setShellRect(cardShellRect())
    setShellMode('card')
    if (reduceMotion) {
      setEmotionFlowOpen(true)
    }
  }, [reduceMotion])

  const closeEmotionToLanding = useCallback(() => {
    pendingCloseRef.current = true
    setEmotionFlowOpen(false)
    setShellRect(fullShellRect())
    setShellMode('full')
  }, [])

  const onShellAnimationComplete = useCallback(() => {
    if (shellMode === 'card' && !emotionFlowOpen) {
      setEmotionFlowOpen(true)
    }
    if (shellMode === 'full' && pendingCloseRef.current) {
      pendingCloseRef.current = false
    }
  }, [shellMode, emotionFlowOpen])

  const onTouchStart = (e: ReactTouchEvent) => {
    touchStartY.current = e.touches[0]?.clientY ?? null
  }

  const onTouchEndLanding = (e: ReactTouchEvent) => {
    if (shellMode === 'card') return
    const start = touchStartY.current
    touchStartY.current = null
    if (start == null) return
    const end = e.changedTouches[0]?.clientY
    if (end == null) return
    if (start - end > SWIPE_THRESHOLD) goDashboard()
  }

  const onTouchEndDashboard = (e: ReactTouchEvent) => {
    const start = touchStartY.current
    touchStartY.current = null
    if (start == null) return
    const end = e.changedTouches[0]?.clientY
    if (end == null) return
    const target = e.currentTarget as HTMLElement
    if (target.scrollTop > 8) return
    if (end - start > SWIPE_THRESHOLD) goLanding()
  }

  if (!profile) return null

  const latestMood = emotions[0]
  const latestSleep = sleeps[0]
  const latestEating = eatings[0]
  const sceneMood = latestMood ? normalizeMood(latestMood.mood, latestMood) : 50

  const labelFor = (e: EmotionEntry) => moodSoftLabel(normalizeMood(e.mood, e))
  const showScenicChrome = !emotionFlowOpen
  const morphDuration = reduceMotion ? 0.01 : 0.48

  return (
    <AnimatePresence mode="wait">
      {layer === 'landing' ? (
        <motion.div
          key="landing-root"
          className="home-landing-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -40 }}
          transition={layerTransition}
        >
          <AnimatePresence>
            {shellMode === 'card' ? (
              <motion.div
                key="landing-morph-backdrop"
                className="flow-backdrop home-landing-morph-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0.01 : 0.28, ease: easeOutSoft }}
                role="presentation"
              />
            ) : null}
          </AnimatePresence>

          <motion.div
            className={`home-landing-layer${shellMode === 'card' ? ' home-landing-shell-card' : ''}`}
            initial={false}
            animate={{
              top: shellRect.top,
              left: shellRect.left,
              width: shellRect.width,
              height: shellRect.height,
              borderRadius: shellRect.radius,
            }}
            transition={{ duration: morphDuration, ease: easeOutSoft }}
            onAnimationComplete={onShellAnimationComplete}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEndLanding}
          >
            <AnimatePresence initial={false}>
              {showScenicChrome ? (
                <motion.div
                  key="scenic"
                  className="home-landing-scenic"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0.01 : 0.2, ease: easeOutSoft }}
                >
                  <LakeMoodScene mood={sceneMood} className="lake-scene-fill" />

                  <div className="home-landing-content">
                    <motion.div
                      className="home-landing-greet-wrap"
                      initial={{ opacity: 0, y: 72 }}
                      animate={{
                        opacity: shellMode === 'card' ? 0 : 1,
                        y: shellMode === 'card' ? -12 : 0,
                      }}
                      transition={{ duration: morphDuration, ease: easeOutSoft }}
                    >
                      <h1 className="home-landing-greet">你好，{profile.name}</h1>
                      <p className="home-landing-sub">
                        <span className="home-landing-sub-box">今天也请温柔对待自己</span>
                      </p>
                      <div className="home-landing-cta-wrap">
                        <button
                          type="button"
                          className="home-landing-listen-btn"
                          onClick={openEmotionFromLanding}
                        >
                          倾听心痕
                        </button>
                      </div>
                    </motion.div>
                  </div>

                  <motion.button
                    type="button"
                    className="home-chevron-float home-chevron-up"
                    onClick={goDashboard}
                    aria-label="进入首页"
                    animate={{ opacity: shellMode === 'card' ? 0 : 1 }}
                    transition={{ duration: morphDuration, ease: easeOutSoft }}
                    style={{ pointerEvents: shellMode === 'card' ? 'none' : 'auto' }}
                  >
                    <ChevronUpIcon />
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="emotion-flow"
                  className="home-landing-flow-host"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: reduceMotion ? 0.01 : 0.22,
                    ease: easeOutSoft,
                    delay: emotionFlowOpen ? 0 : 0.12,
                  }}
                >
                  <EmotionFlowSheet
                    embedded
                    open={emotionFlowOpen}
                    presentation="morph"
                    initialMood={sceneMood}
                    onClose={closeEmotionToLanding}
                    onSave={async (entry) => {
                      await putEmotion({
                        ...entry,
                        id: uid(),
                        profileId: profile.id,
                        createdAt: new Date().toISOString(),
                      })
                      const list = await listEmotions(profile.id)
                      setEmotions(list.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)))
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          key="dashboard"
          className="home-dashboard-layer"
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 32 }}
          transition={layerTransition}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEndDashboard}
        >
          <Page back={false}>
            <div className="home-dash-chevron-wrap">
              <button
                type="button"
                className="home-chevron-box home-chevron-down"
                onClick={goLanding}
                aria-label="返回风景页"
              >
                <ChevronDownIcon />
              </button>
            </div>

            <nav className="row home-cta-row" aria-label="入口模块" style={{ marginBottom: 14 }}>
              {DASHBOARD_MODULES.map((m) => (
                <Link key={m.to} to={m.to} className="home-cta-link">
                  <Button block variant={m.variant} className="home-cta-btn">
                    <span className="home-cta-label">{m.label}</span>
                    <span className="home-cta-hint">{m.hint}</span>
                  </Button>
                </Link>
              ))}
            </nav>

            <MedGlowCalendar userId={profile.id} />

            <Card title="今日速览">
              {latestMood ? (
                <p>
                  最近情绪：<strong>{labelFor(latestMood)}</strong>
                  {latestMood.tags.length ? ` · ${latestMood.tags.join('、')}` : ''}
                  <br />
                  <span className="meta hint">
                    {format(parseISO(latestMood.recordedAt), 'M月d日 HH:mm', { locale: zhCN })}
                    {latestMood.mode === 'daily' ? ' · 全天总结' : ' · 当下感受'}
                  </span>
                </p>
              ) : (
                <Empty text="还没有情绪记录，去写一条吧。" />
              )}
              {latestSleep ? (
                <p style={{ marginTop: 10 }}>
                  最近睡眠：<strong>{sleepQualityLabel(latestSleep.quality)}</strong>
                  <span className="hint"> · {latestSleep.date}</span>
                </p>
              ) : null}
              {latestEating ? (
                <p style={{ marginTop: 10 }}>
                  最近饮食：<strong>{appetiteLabel(latestEating.appetite)}</strong>
                  <span className="hint"> · {latestEating.date}</span>
                </p>
              ) : null}
            </Card>

            <Card title="最近情绪">
              {emotions.slice(0, 3).length === 0 ? (
                <Empty text="暂无记录" />
              ) : (
                <div className="list">
                  {emotions.slice(0, 3).map((e) => (
                    <div key={e.id} className="list-item">
                      <div>
                        <strong>{labelFor(e)}</strong>
                        {e.tags.length ? ` · ${e.tags.join('、')}` : ''}
                        {e.notes ? <div className="hint">{e.notes.slice(0, 80)}</div> : null}
                        <div className="meta">
                          {format(parseISO(e.recordedAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Disclaimer />

            <Link to="/settings" className="home-settings-fab" aria-label="设置">
              <SettingsGearIcon />
            </Link>
          </Page>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
