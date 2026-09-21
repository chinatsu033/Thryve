import { format, parseISO, subDays, isWithinInterval, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Button, Card, Disclaimer, Empty, Field, Page } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { uid } from '../lib/crypto'
import {
  deleteAttachment,
  getAttachmentBlob,
  listAttachments,
  listDepressives,
  listEatings,
  listEmotions,
  listSleeps,
  saveAttachment,
} from '../lib/db'
import type {
  AttachmentMeta,
  DepressiveEntry,
  EatingEntry,
  EmotionEntry,
  SleepEntry,
} from '../types'

type RangeKey = '7' | '14' | '30' | 'custom'

function moodColor(mood: number | undefined): string {
  if (mood == null) return '#e8eaf0'
  const t = (mood - 1) / 9
  const r = Math.round(120 + (91 - 120) * t)
  const g = Math.round(140 + (108 - 140) * t)
  const b = Math.round(220 + (255 - 220) * t)
  return `rgb(${r},${g},${b})`
}

export function SummaryPage() {
  const { profile } = useAuth()
  const [range, setRange] = useState<RangeKey>('14')
  const [customFrom, setCustomFrom] = useState(format(subDays(new Date(), 14), 'yyyy-MM-dd'))
  const [customTo, setCustomTo] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [emotions, setEmotions] = useState<EmotionEntry[]>([])
  const [sleeps, setSleeps] = useState<SleepEntry[]>([])
  const [eatings, setEatings] = useState<EatingEntry[]>([])
  const [deps, setDeps] = useState<DepressiveEntry[]>([])
  const [attachments, setAttachments] = useState<AttachmentMeta[]>([])
  const [previews, setPreviews] = useState<Record<string, string>>({})
  const [copyOk, setCopyOk] = useState(false)

  const reload = useCallback(async () => {
    if (!profile) return
    const [e, s, ea, d, a] = await Promise.all([
      listEmotions(profile.id),
      listSleeps(profile.id),
      listEatings(profile.id),
      listDepressives(profile.id),
      listAttachments(profile.id),
    ])
    setEmotions(e)
    setSleeps(s)
    setEatings(ea)
    setDeps(d)
    setAttachments(a.sort((x, y) => y.createdAt.localeCompare(x.createdAt)))
    const urls: Record<string, string> = {}
    for (const meta of a) {
      if (meta.mimeType.startsWith('image/')) {
        const blob = await getAttachmentBlob(meta.id)
        if (blob) urls[meta.id] = URL.createObjectURL(blob)
      }
    }
    setPreviews(urls)
  }, [profile])

  useEffect(() => {
    void reload()
    return () => {
      Object.values(previews).forEach((u) => URL.revokeObjectURL(u))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload])

  const interval = useMemo(() => {
    const end = endOfDay(range === 'custom' ? parseISO(customTo) : new Date())
    let start: Date
    if (range === '7') start = startOfDay(subDays(end, 6))
    else if (range === '14') start = startOfDay(subDays(end, 13))
    else if (range === '30') start = startOfDay(subDays(end, 29))
    else start = startOfDay(parseISO(customFrom))
    return { start, end }
  }, [range, customFrom, customTo])

  const filteredEmotions = useMemo(
    () =>
      emotions.filter((e) =>
        isWithinInterval(parseISO(e.recordedAt), interval),
      ),
    [emotions, interval],
  )
  const filteredSleeps = useMemo(
    () => sleeps.filter((s) => isWithinInterval(parseISO(s.date), interval)),
    [sleeps, interval],
  )
  const filteredEatings = useMemo(
    () => eatings.filter((e) => isWithinInterval(parseISO(e.date), interval)),
    [eatings, interval],
  )
  const filteredDeps = useMemo(
    () =>
      deps.filter((d) => {
        const start = parseISO(d.startedAt)
        return isWithinInterval(start, interval) || (d.endedAt ? isWithinInterval(parseISO(d.endedAt), interval) : !d.endedAt)
      }),
    [deps, interval],
  )

  const chartData = useMemo(() => {
    const days = eachDayOfInterval(interval)
    return days.map((day) => {
      const key = format(day, 'yyyy-MM-dd')
      const dayEmotions = filteredEmotions.filter(
        (e) => format(parseISO(e.recordedAt), 'yyyy-MM-dd') === key,
      )
      const avgMood =
        dayEmotions.length > 0
          ? Math.round((dayEmotions.reduce((a, b) => a + b.mood, 0) / dayEmotions.length) * 10) / 10
          : null
      const sleep = filteredSleeps.find((s) => s.date === key)
      const eating = filteredEatings.find((e) => e.date === key)
      return {
        date: format(day, 'M/d', { locale: zhCN }),
        full: key,
        mood: avgMood,
        sleep: sleep?.quality ?? null,
        appetite: eating?.appetite ?? null,
      }
    })
  }, [interval, filteredEmotions, filteredSleeps, filteredEatings])

  const bullets = useMemo(() => {
    const lines: string[] = []
    const moods = filteredEmotions.map((e) => e.mood)
    if (moods.length) {
      const avg = moods.reduce((a, b) => a + b, 0) / moods.length
      const min = Math.min(...moods)
      const max = Math.max(...moods)
      lines.push(
        `情绪记录 ${moods.length} 条，平均 ${avg.toFixed(1)}/10（最低 ${min}，最高 ${max}）。`,
      )
      const tagCount = new Map<string, number>()
      filteredEmotions.forEach((e) => e.tags.forEach((t) => tagCount.set(t, (tagCount.get(t) ?? 0) + 1)))
      const top = [...tagCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
      if (top.length) lines.push(`常见情绪标签：${top.map(([t, n]) => `${t}(${n})`).join('、')}。`)
    } else {
      lines.push('本区间暂无情绪记录。')
    }
    if (filteredSleeps.length) {
      const avgQ =
        filteredSleeps.reduce((a, b) => a + b.quality, 0) / filteredSleeps.length
      lines.push(`睡眠记录 ${filteredSleeps.length} 天，平均质量 ${avgQ.toFixed(1)}/10。`)
    }
    if (filteredEatings.length) {
      const avgA =
        filteredEatings.reduce((a, b) => a + b.appetite, 0) / filteredEatings.length
      lines.push(`饮食记录 ${filteredEatings.length} 天，平均食欲 ${avgA.toFixed(1)}/10。`)
    }
    if (filteredDeps.length) {
      const open = filteredDeps.filter((d) => !d.endedAt).length
      const avgSev =
        filteredDeps.reduce((a, b) => a + b.severity, 0) / filteredDeps.length
      lines.push(
        `抑郁发作相关记录 ${filteredDeps.length} 条（进行中 ${open}），平均自报严重度 ${avgSev.toFixed(1)}/10。`,
      )
    }
    if (profile?.medicalHistory && !profile.medicalHistory.skipped) {
      const mh = profile.medicalHistory
      if (mh.diagnoses || mh.medications) {
        lines.push(
          `病史摘要：诊断「${mh.diagnoses || '未填'}」；用药「${mh.medications || '未填'}」。`,
        )
      }
    } else if (profile?.medicalHistory?.skipped) {
      lines.push('用户选择不披露病史详情。')
    }
    lines.push('说明：以上为个人主观记录汇总，不能替代专业诊断。')
    return lines
  }, [filteredEmotions, filteredSleeps, filteredEatings, filteredDeps, profile])

  const summaryText = useMemo(() => {
    const from = format(interval.start, 'yyyy-MM-dd')
    const to = format(interval.end, 'yyyy-MM-dd')
    return [
      `【心理状态就医总结】`,
      `档案：${profile?.name ?? ''}`,
      `区间：${from} 至 ${to}`,
      '',
      ...bullets.map((b) => `· ${b}`),
      '',
      '本工具仅用于个人状态记录与就医沟通，不能替代专业医疗诊断或治疗。',
    ].join('\n')
  }, [interval, profile, bullets])

  const copyText = async () => {
    await navigator.clipboard.writeText(summaryText)
    setCopyOk(true)
    setTimeout(() => setCopyOk(false), 2000)
  }

  const onUpload = async (files: FileList | null) => {
    if (!files || !profile) return
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') continue
      if (file.size > 8 * 1024 * 1024) {
        alert(`${file.name} 超过 8MB，已跳过`)
        continue
      }
      const meta: AttachmentMeta = {
        id: uid(),
        profileId: profile.id,
        name: file.name,
        mimeType: file.type,
        size: file.size,
        createdAt: new Date().toISOString(),
        note: '',
      }
      await saveAttachment(meta, file)
    }
    await reload()
  }

  const removeAttach = async (id: string) => {
    if (!confirm('删除此附件？')) return
    await deleteAttachment(id)
    await reload()
  }

  const downloadAttach = async (meta: AttachmentMeta) => {
    const blob = await getAttachmentBlob(meta.id)
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = meta.name
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!profile) return null

  return (
    <Page title="就医总结" sub="按区间汇总情绪、睡眠与发作记录，便于就诊沟通。">
      <Disclaimer />

      <Card title="时间范围" className="no-print">
        <div className="chip-row">
          {(
            [
              ['7', '近 7 天'],
              ['14', '近 14 天'],
              ['30', '近 30 天'],
              ['custom', '自定义'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              className={`chip ${range === k ? 'active' : ''}`}
              onClick={() => setRange(k)}
            >
              {label}
            </button>
          ))}
        </div>
        {range === 'custom' ? (
          <div className="row">
            <Field label="开始">
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
            </Field>
            <Field label="结束">
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
            </Field>
          </div>
        ) : null}
        <div className="row">
          <Button onClick={() => void copyText()}>{copyOk ? '已复制' : '复制文字总结'}</Button>
          <Button variant="ghost" onClick={() => window.print()}>
            打印 / 另存 PDF
          </Button>
        </div>
      </Card>

      <Card title="自动要点">
        <ul className="summary-bullets">
          {bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </Card>

      <Card title="情绪与身心趋势">
        {chartData.every((d) => d.mood == null && d.sleep == null && d.appetite == null) ? (
          <Empty text="本区间暂无图表数据" />
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            style={{ width: '100%', height: 280 }}
          >
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,26,46,0.08)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="mood"
                  name="情绪"
                  stroke="var(--color-primary)"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="sleep"
                  name="睡眠质量"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="appetite"
                  name="食欲"
                  stroke="#FF8A65"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </Card>

      <Card title="情绪日历热力图">
        <div className="hint" style={{ marginBottom: 8 }}>
          按日平均情绪着色（越蓝越高）
        </div>
        <div className="heatmap" aria-label="情绪热力图">
          {chartData.map((d) => (
            <div
              key={d.full}
              className="heatmap-cell"
              style={{
                background: moodColor(d.mood ?? undefined),
                color: d.mood != null && d.mood >= 6 ? '#fff' : 'var(--color-text-muted)',
              }}
              title={`${d.full}: ${d.mood ?? '无数据'}`}
            >
              {d.date.split('/')[1]}
            </div>
          ))}
        </div>
      </Card>

      <Card title="附件（PDF / 图片）" className="no-print">
        <Field label="上传到本机 IndexedDB（单文件 ≤ 8MB）">
          <input
            type="file"
            accept="image/*,application/pdf"
            multiple
            onChange={(e) => void onUpload(e.target.files)}
          />
        </Field>
        {attachments.length === 0 ? (
          <Empty text="暂无附件" />
        ) : (
          <div className="attach-list">
            {attachments.map((a) => (
              <div key={a.id} className="attach-item">
                {previews[a.id] ? (
                  <img src={previews[a.id]} alt={a.name} />
                ) : (
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 8,
                      background: 'rgba(var(--color-primary-rgb),0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                    }}
                  >
                    PDF
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {a.name}
                  </div>
                  <div className="hint">
                    {(a.size / 1024).toFixed(0)} KB ·{' '}
                    {format(parseISO(a.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                  </div>
                </div>
                <Button variant="ghost" className="btn-sm" onClick={() => void downloadAttach(a)}>
                  下载
                </Button>
                <Button variant="ghost" className="btn-sm" onClick={() => void removeAttach(a.id)}>
                  删除
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Page>
  )
}
