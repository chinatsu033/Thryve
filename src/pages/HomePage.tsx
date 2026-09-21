import { format, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState, type TouchEvent as ReactTouchEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LakeMoodScene } from '../components/LakeMoodScene'
import { Button, Card, Disclaimer, Empty, Page } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { listDepressives, listEmotions, listSleeps } from '../lib/db'
import { moodSoftLabel, normalizeMood } from '../lib/mood'
import { sleepQualityLabel } from '../lib/sleep'
import type { DepressiveEntry, EmotionEntry, SleepEntry } from '../types'

type Layer = 'landing' | 'dashboard'

type HomeLocationState = { homeLayer?: Layer }

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
  { to: '/body', label: '基石', hint: '身心打卡', variant: 'accent' },
]

function ChevronUpIcon() {
  return (
    <svg className="home-chevron-icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      {/* Pure geometric ∧ — no vertical stem */}
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
      {/* Pure geometric ∨ — no vertical stem */}
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
  const [emotions, setEmotions] = useState<EmotionEntry[]>([])
  const [sleeps, setSleeps] = useState<SleepEntry[]>([])
  const [deps, setDeps] = useState<DepressiveEntry[]>([])
  const [layer, setLayer] = useState<Layer>(() =>
    layerFromLocation(location.search, location.state),
  )
  const touchStartY = useRef<number | null>(null)

  useEffect(() => {
    const next = layerFromLocation(location.search, location.state)
    if (next === 'dashboard') setLayer('dashboard')
  }, [location.search, location.state])

  useEffect(() => {
    if (!profile) return
    void (async () => {
      const [e, s, d] = await Promise.all([
        listEmotions(profile.id),
        listSleeps(profile.id),
        listDepressives(profile.id),
      ])
      setEmotions(e.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)))
      setSleeps(s.sort((a, b) => b.date.localeCompare(a.date)))
      setDeps(d.sort((a, b) => b.startedAt.localeCompare(a.startedAt)))
    })()
  }, [profile])

  const goDashboard = useCallback(() => setLayer('dashboard'), [])
  const goLanding = useCallback(() => setLayer('landing'), [])

  const onTouchStart = (e: ReactTouchEvent) => {
    touchStartY.current = e.touches[0]?.clientY ?? null
  }

  const onTouchEndLanding = (e: ReactTouchEvent) => {
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
  const openEp = deps.find((d) => !d.endedAt)
  const sceneMood = latestMood ? normalizeMood(latestMood.mood, latestMood) : 50

  const labelFor = (e: EmotionEntry) => moodSoftLabel(normalizeMood(e.mood, e))

  return (
    <AnimatePresence mode="wait">
      {layer === 'landing' ? (
        <motion.div
          key="landing"
          className="home-landing-layer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEndLanding}
        >
          <LakeMoodScene mood={sceneMood} className="lake-scene-fill" />

          <div className="home-landing-content">
            <motion.div
              className="home-landing-greet-wrap"
              initial={{ opacity: 0, y: 72 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
            >
              <h1 className="home-landing-greet">你好，{profile.name}</h1>
              <p className="home-landing-sub">
                <span className="home-landing-sub-box">今天也请温柔对待自己</span>
              </p>
            </motion.div>

          </div>

          <button
            type="button"
            className="home-chevron-float home-chevron-up"
            onClick={goDashboard}
            aria-label="进入首页"
          >
            <ChevronUpIcon />
          </button>
        </motion.div>
      ) : (
        <motion.div
          key="dashboard"
          className="home-dashboard-layer"
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 32 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
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
              {openEp ? (
                <p style={{ marginTop: 10, color: 'var(--color-danger)' }}>
                  有进行中的情绪低谷记录（严重度 {openEp.severity}/10），可在「基石」页更新。
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
