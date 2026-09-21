import { format, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState, type TouchEvent as ReactTouchEvent } from 'react'
import { Link } from 'react-router-dom'
import { LakeMoodScene } from '../components/LakeMoodScene'
import { Button, Card, Disclaimer, Empty, Page } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { listDepressives, listEmotions, listSleeps } from '../lib/db'
import { moodSoftLabel, normalizeMood } from '../lib/mood'
import type { DepressiveEntry, EmotionEntry, SleepEntry } from '../types'

type Layer = 'landing' | 'dashboard'

const SWIPE_THRESHOLD = 56

export function HomePage() {
  const { profile } = useAuth()
  const [emotions, setEmotions] = useState<EmotionEntry[]>([])
  const [sleeps, setSleeps] = useState<SleepEntry[]>([])
  const [deps, setDeps] = useState<DepressiveEntry[]>([])
  const [layer, setLayer] = useState<Layer>('landing')
  const touchStartY = useRef<number | null>(null)

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

  // Hide bottom nav while scenic landing is up (body class — survives Layout re-renders)
  useEffect(() => {
    if (layer === 'landing') {
      document.body.classList.add('home-landing-active')
    } else {
      document.body.classList.remove('home-landing-active')
    }
    return () => {
      document.body.classList.remove('home-landing-active')
    }
  }, [layer])

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
            className="home-chevron-box"
            onClick={goDashboard}
            aria-label="进入首页"
          >
            <svg
              className="home-chevron-icon"
              viewBox="0 0 24 24"
              width="22"
              height="22"
              aria-hidden
            >
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
          </button>
        </motion.div>
      ) : (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 32 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEndDashboard}
        >
          <Page
            title={`你好，${profile.name}`}
            sub="今天也请温柔对待自己。"
            actions={
              <button
                type="button"
                className="home-back-scene"
                onClick={goLanding}
                aria-label="返回风景页"
              >
                风景
              </button>
            }
          >
            <Disclaimer />

            <div className="row home-cta-row" style={{ marginBottom: 14 }}>
              <Link to="/emotion" style={{ flex: 1 }}>
                <Button block className="home-cta-btn">
                  记录情绪
                </Button>
              </Link>
              <Link to="/body" style={{ flex: 1 }}>
                <Button block variant="accent" className="home-cta-btn">
                  身心打卡
                </Button>
              </Link>
            </div>

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
                  最近睡眠质量：<strong>{latestSleep.quality}/10</strong>
                  <span className="hint"> · {latestSleep.date}</span>
                </p>
              ) : null}
              {openEp ? (
                <p style={{ marginTop: 10, color: 'var(--color-danger)' }}>
                  有进行中的抑郁发作记录（严重度 {openEp.severity}/10），可在「身心」页更新。
                </p>
              ) : null}
            </Card>

            <Card title="快捷入口">
              <div className="chip-row">
                <Link to="/summary" className="chip">
                  就医总结
                </Link>
                <Link to="/settings" className="chip">
                  主题与隐私
                </Link>
                <Link to="/body" className="chip">
                  睡眠 / 饮食
                </Link>
              </div>
            </Card>

            <Card title="最近情绪">
              {emotions.slice(0, 5).length === 0 ? (
                <Empty text="暂无记录" />
              ) : (
                <div className="list">
                  {emotions.slice(0, 5).map((e) => (
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
          </Page>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
