import { format, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Disclaimer, Empty, Page } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { listDepressives, listEmotions, listSleeps } from '../lib/db'
import type { DepressiveEntry, EmotionEntry, SleepEntry } from '../types'

export function HomePage() {
  const { profile } = useAuth()
  const [emotions, setEmotions] = useState<EmotionEntry[]>([])
  const [sleeps, setSleeps] = useState<SleepEntry[]>([])
  const [deps, setDeps] = useState<DepressiveEntry[]>([])

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

  if (!profile) return null

  const latestMood = emotions[0]
  const latestSleep = sleeps[0]
  const openEp = deps.find((d) => !d.endedAt)

  return (
    <Page title={`你好，${profile.name}`} sub="今天也请温柔对待自己。">
      <Disclaimer />

      <div className="row" style={{ marginBottom: 14 }}>
        <Link to="/emotion" style={{ flex: 1 }}>
          <Button block>记录情绪</Button>
        </Link>
        <Link to="/body" style={{ flex: 1 }}>
          <Button block variant="accent">
            身心打卡
          </Button>
        </Link>
      </div>

      <Card title="今日速览">
        {latestMood ? (
          <p>
            最近情绪：<strong>{latestMood.mood}/10</strong>
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
                  <strong>{e.mood}/10</strong>
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
  )
}
