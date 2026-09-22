import { format, parseISO, subDays, isWithinInterval, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns'
import { dateFnsLocale } from '../lib/dateLocale'
import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import {
  deleteAttachment,
  getAttachmentBlob,
  listAttachments,
  listEatings,
  listEmotions,
  listMedications,
  listMedLogs,
  listSleeps,
} from '../lib/db'
import { adherenceSummary } from '../lib/meds'
import { chartEnter } from '../lib/motion'
import { normalizeMood, moodSoftLabelKey } from '../lib/mood'
import { normalizeAppetite, appetiteLabelKey } from '../lib/eating'
import { normalizeSleepQuality, sleepQualityLabelKey } from '../lib/sleep'
import type {
  AttachmentMeta,
  EatingEntry,
  EmotionEntry,
  MedLog,
  Medication,
  SleepEntry,
} from '../types'
import { useLocale } from '../context/LocaleContext'

type RangeKey = '7' | '14' | '30' | 'custom'

function moodColor(mood: number | undefined): string {
  if (mood == null) return '#e8eaf0'
  const t = (mood - 1) / 99
  const r = Math.round(120 + (91 - 120) * t)
  const g = Math.round(140 + (108 - 140) * t)
  const b = Math.round(220 + (255 - 220) * t)
  return `rgb(${r},${g},${b})`
}

function mood100(e: EmotionEntry): number {
  return normalizeMood(e.mood, e)
}

export function SummaryPage() {
  const { t, language } = useLocale()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [range, setRange] = useState<RangeKey>('14')
  const [customFrom, setCustomFrom] = useState(format(subDays(new Date(), 14), 'yyyy-MM-dd'))
  const [customTo, setCustomTo] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [emotions, setEmotions] = useState<EmotionEntry[]>([])
  const [sleeps, setSleeps] = useState<SleepEntry[]>([])
  const [eatings, setEatings] = useState<EatingEntry[]>([])
  const [attachments, setAttachments] = useState<AttachmentMeta[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [medLogs, setMedLogs] = useState<MedLog[]>([])
  const [previews, setPreviews] = useState<Record<string, string>>({})
  const [copyOk, setCopyOk] = useState(false)

  const reload = useCallback(async () => {
    if (!profile) return
    const [e, s, ea, a, meds, mlogs] = await Promise.all([
      listEmotions(profile.id),
      listSleeps(profile.id),
      listEatings(profile.id),
      listAttachments(profile.id),
      listMedications(profile.id),
      listMedLogs(profile.id),
    ])
    setEmotions(e)
    setSleeps(s)
    setEatings(ea)
    setMedications(meds)
    setMedLogs(mlogs)
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
  const chartData = useMemo(() => {
    const days = eachDayOfInterval(interval)
    return days.map((day) => {
      const key = format(day, 'yyyy-MM-dd')
      const dayEmotions = filteredEmotions.filter(
        (e) => format(parseISO(e.recordedAt), 'yyyy-MM-dd') === key,
      )
      const avgMood =
        dayEmotions.length > 0
          ? Math.round(
              (dayEmotions.reduce((a, b) => a + mood100(b), 0) / dayEmotions.length) * 10,
            ) / 10
          : null
      const sleep = filteredSleeps.find((s) => s.date === key)
      const eating = filteredEatings.find((e) => e.date === key)
      return {
        date: format(day, 'M/d', { locale: dateFnsLocale(language) }),
        full: key,
        mood: avgMood,
        sleep: sleep ? normalizeSleepQuality(sleep.quality) : null,
        appetite: eating ? normalizeAppetite(eating.appetite) : null,
      }
    })
  }, [interval, filteredEmotions, filteredSleeps, filteredEatings])

  const bullets = useMemo(() => {
    const lines: string[] = []
    const moods = filteredEmotions.map((e) => mood100(e))
    if (moods.length) {
      const avg = moods.reduce((a, b) => a + b, 0) / moods.length
      const min = Math.min(...moods)
      const max = Math.max(...moods)
      lines.push(
        `情绪记录 ${moods.length} 条，平均约「${t(moodSoftLabelKey(avg))}」（相对量表 0–100：均 ${avg.toFixed(0)}，最低 ${min.toFixed(0)}，最高 ${max.toFixed(0)}）。`,
      )
      const tagCount = new Map<string, number>()
      filteredEmotions.forEach((e) => e.tags.forEach((t) => tagCount.set(t, (tagCount.get(t) ?? 0) + 1)))
      const top = [...tagCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
      if (top.length) lines.push(`常见情绪标签：${top.map(([t, n]) => `${t}(${n})`).join('、')}。`)
    } else {
      lines.push(t('summary.line.noMood'))
    }
    if (filteredSleeps.length) {
      const avgQ =
        filteredSleeps.reduce((a, b) => a + normalizeSleepQuality(b.quality), 0) /
        filteredSleeps.length
      lines.push(
        `睡眠记录 ${filteredSleeps.length} 天，平均约「${t(sleepQualityLabelKey(avgQ))}」（1–7 均 ${avgQ.toFixed(1)}）。`,
      )
    }
    if (filteredEatings.length) {
      const avgA =
        filteredEatings.reduce((a, b) => a + normalizeAppetite(b.appetite), 0) /
        filteredEatings.length
      lines.push(
        `饮食记录 ${filteredEatings.length} 天，平均约「${t(appetiteLabelKey(avgA))}」（1–5 均 ${avgA.toFixed(1)}）。`,
      )
    }
    if (medications.length === 0) {
      lines.push(t('summary.line.noMedFlag'))
    } else {
      const from = format(interval.start, 'yyyy-MM-dd')
      const to = format(interval.end, 'yyyy-MM-dd')
      const names = medications.map((m) => m.name).filter(Boolean)
      const namePart = names.length
        ? `已添加用药提醒：${names.slice(0, 8).join('、')}${names.length > 8 ? '等' : ''}。`
        : t('summary.line.medRemindersPlain')
      lines.push(namePart)
      const ad = adherenceSummary(medications, medLogs, from, to)
      if (ad.due > 0) {
        lines.push(
          `本区间用药打卡：应服 ${ad.due} 次，已服 ${ad.taken}、跳过 ${ad.skipped}、漏服 ${ad.missed}` +
            (ad.rate != null ? `（依从约 ${ad.rate}%）` : '') +
            '。',
        )
      } else if (medLogs.length > 0) {
        const inRange = medLogs.filter((l) => l.takenDate >= from && l.takenDate <= to)
        if (inRange.length) {
          const taken = inRange.filter((l) => !l.skipped).length
          const skipped = inRange.filter((l) => l.skipped).length
          lines.push(`本区间有用药打卡 ${inRange.length} 条（已服 ${taken}、跳过 ${skipped}）。`)
        } else {
          lines.push(t('summary.line.noMedPlan'))
        }
      } else {
        lines.push(t('summary.line.noMedPlan'))
      }
    }
    lines.push(t('summary.line.disclaimer'))
    return lines
  }, [filteredEmotions, filteredSleeps, filteredEatings, medications, medLogs, interval, profile])

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
      t('summary.export.footer'),
    ].join('\n')
  }, [interval, profile, bullets])

  const copyText = async () => {
    await navigator.clipboard.writeText(summaryText)
    setCopyOk(true)
    setTimeout(() => setCopyOk(false), 2000)
  }

  const onUpload = async (_files: FileList | null) => {
    alert(t('summary.attachUnavailable'))
  }

  const removeAttach = async (id: string) => {
    if (!confirm(t('summary.deleteAttachment'))) return
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
    <Page
      title={t('nav.heartprint')}
      sub={t('summary.sub')}
      back={() => navigate('/', { state: { homeLayer: 'dashboard' } })}
    >
      <Disclaimer />

      <Card title={t('summary.range')} className="no-print">
        <div className="chip-row">
          {(
            [
              ['7', t('summary.range.7')],
              ['14', t('summary.range.14')],
              ['30', t('summary.range.30')],
              ['custom', t('summary.range.custom')],
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
            <Field label={t('summary.from')}>
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
            </Field>
            <Field label={t('summary.to')}>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
            </Field>
          </div>
        ) : null}
        <div className="row">
          <Button onClick={() => void copyText()}>{copyOk ? '已复制' : t('summary.copy')}</Button>
          <Button variant="ghost" onClick={() => window.print()}>
            打印 / 另存 PDF
          </Button>
        </div>
      </Card>

      <Card title={t('summary.bullets')}>
        <ul className="summary-bullets">
          {bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </Card>

      <Card title={t('summary.chart')}>
        {chartData.every((d) => d.mood == null && d.sleep == null && d.appetite == null) ? (
          <Empty text={t('summary.chartEmpty')} />
        ) : (
          <motion.div
            {...chartEnter}
            style={{ width: '100%', height: 280 }}
          >
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,26,46,0.08)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis
                  yAxisId="mood"
                  domain={[0, 100]}
                  tick={{ fontSize: 11 }}
                  width={36}
                />
                <YAxis
                  yAxisId="body"
                  orientation="right"
                  domain={[0, 10]}
                  tick={{ fontSize: 11 }}
                  width={28}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (value == null) return ['—', String(name)]
                    if (name === t('summary.series.mood')) return [Number(value).toFixed(0), t('summary.series.moodScale')]
                    if (name === t('summary.series.sleep')) return [t(sleepQualityLabelKey(Number(value))), t('brand.rest')]
                    if (name === t('summary.series.appetite')) return [t(appetiteLabelKey(Number(value))), t('summary.series.appetite')]
                    return [String(value), String(name)]
                  }}
                />
                <Legend />
                <Line
                  yAxisId="mood"
                  type="monotone"
                  dataKey="mood"
                  name={t('summary.series.mood')}
                  stroke="var(--color-primary)"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  connectNulls
                />
                <Line
                  yAxisId="body"
                  type="monotone"
                  dataKey="sleep"
                  name={t('summary.series.sleep')}
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
                <Line
                  yAxisId="body"
                  type="monotone"
                  dataKey="appetite"
                  name={t('summary.series.appetite')}
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

      <Card title={t('summary.heatmap')}>
        <div className="hint" style={{ marginBottom: 8 }}>
          按日平均情绪着色（越蓝越高；量表 0–100）
        </div>
        <div className="heatmap" aria-label={t('summary.heatmapAria')}>
          {chartData.map((d) => (
            <div
              key={d.full}
              className="heatmap-cell"
              style={{
                background: moodColor(d.mood ?? undefined),
                color: d.mood != null && d.mood >= 55 ? '#fff' : 'var(--color-text-muted)',
              }}
              title={d.mood != null ? `${d.full}: ${t(moodSoftLabelKey(d.mood))}` : `${d.full}: 无数据`}
            >
              {d.date.split('/')[1]}
            </div>
          ))}
        </div>
      </Card>

      <Card title={t('summary.attachments')} className="no-print">
        <p className="hint">云端附件（Storage）暂未开放；MVP 请用文字总结或 JSON 导出。</p>
        <Field label={t('summary.uploadDisabled')}>
          <input
            type="file"
            accept="image/*,application/pdf"
            multiple
            onChange={(e) => void onUpload(e.target.files)}
          />
        </Field>
        {attachments.length === 0 ? (
          <Empty text={t('summary.noAttachments')} />
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
                      borderRadius: 'var(--radius-sm)',
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
                    {format(parseISO(a.createdAt), 'yyyy-MM-dd HH:mm', { locale: dateFnsLocale(language) })}
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
