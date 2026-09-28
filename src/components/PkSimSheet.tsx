import { format } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import { Button, Empty, Modal } from './ui'
import { listMedLogs, putMedication } from '../lib/db'
import { useLocale } from '../context/LocaleContext'
import { dateFnsLocale, datePattern } from '../lib/dateLocale'
import type { LanguageId } from '../lib/locale'
import {
  PK_DRUGS,
  matchPkDrug,
  pkDrugName,
  resolvePk,
  type PkDrug,
  type PkRange,
  type ResolvedPk,
} from '../lib/pkDrugs'
import { DAY_MS, timeToSteadyStateH } from '../lib/pk'
import {
  buildPkSimulation,
  defaultSourceMode,
  logLookbackDays,
  type PkSimulation,
  type PkSourceMode,
} from '../lib/pkSim'
import type { MedLog, MedPkParams, Medication } from '../types'

type Tr = (key: string, vars?: Record<string, string>) => string

const FALLBACK_COLOR = '#FF8A65'

function fmtNum(n: number): string {
  if (n >= 10) return String(Math.round(n * 10) / 10).replace(/\.0$/, '')
  return String(Math.round(n * 100) / 100)
}

function fmtDuration(h: number, tr: Tr): string {
  if (h >= 48) {
    const d = h / 24
    return tr('pk.unit.days', { n: d >= 10 ? String(Math.round(d)) : fmtNum(Math.round(d * 10) / 10) })
  }
  return tr('pk.unit.hours', { n: fmtNum(Math.round(h * 10) / 10) })
}

function fmtRange(r: PkRange, tr: Tr): string {
  const base = tr('pk.unit.hours', { n: fmtNum(r.typ) })
  if (r.min != null && r.max != null) return `${base} · ${tr('pk.range', { min: fmtNum(r.min), max: fmtNum(r.max) })}`
  return base
}

function isSameLocalDay(a: number, b: number) {
  const x = new Date(a)
  const y = new Date(b)
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate()
}

/* ——— Chart ——— */

const W = 340
const H = 214
const PAD_L = 34
const PAD_R = 10
const PAD_T = 26
const PAD_B = 44
const PLOT_W = W - PAD_L - PAD_R
const PLOT_H = H - PAD_T - PAD_B

export function PkChart({
  sim,
  color,
  language,
  tr,
}: {
  sim: PkSimulation
  color: string
  language: LanguageId
  tr: Tr
}) {
  // Small overshoots (irregular logged times) just stretch the axis; larger ones get an extra tick.
  const bigOvershoot = sim.maxPct > 105
  const yMax = bigOvershoot ? Math.ceil(sim.maxPct / 25) * 25 : Math.max(100, sim.maxPct)
  const x = (t: number) => PAD_L + ((t - sim.fromMs) / (sim.toMs - sim.fromMs)) * PLOT_W
  const y = (c: number) => PAD_T + PLOT_H - (Math.min(c, yMax) / yMax) * PLOT_H
  const base = PAD_T + PLOT_H

  const past = sim.points.filter((p) => p.t <= sim.nowMs)
  const future = sim.points.filter((p) => p.t >= sim.nowMs)
  const nowY = y(sim.nowPct)
  const nowX = x(sim.nowMs)
  if (past.length && past[past.length - 1].t < sim.nowMs) past.push({ t: sim.nowMs, c: sim.nowPct })
  if (future.length && future[0].t > sim.nowMs) future.unshift({ t: sim.nowMs, c: sim.nowPct })

  const line = (pts: Array<{ t: number; c: number }>) =>
    pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.c).toFixed(1)}`).join('')
  const area = (pts: Array<{ t: number; c: number }>) =>
    pts.length ? `${line(pts)}L${x(pts[pts.length - 1].t).toFixed(1)},${base}L${x(pts[0].t).toFixed(1)},${base}Z` : ''

  const midnights: number[] = []
  const d0 = new Date(sim.fromMs)
  d0.setHours(0, 0, 0, 0)
  for (const d = new Date(d0); d.getTime() <= sim.toMs; d.setDate(d.getDate() + 1)) {
    if (d.getTime() > sim.fromMs) midnights.push(d.getTime())
  }
  const dayStarts = [sim.fromMs, ...midnights]
  const dayLabels = dayStarts.map((start, i) => {
    const end = i + 1 < dayStarts.length ? dayStarts[i + 1] : sim.toMs
    const mid = (start + end) / 2
    const wide = end - start > 0.45 * DAY_MS
    return { mid, date: new Date(mid), wide }
  })

  const yTicks = bigOvershoot ? [0, 50, 100, yMax] : [0, 50, 100]
  const gradId = `pk-grad-${color.replace(/[^a-z0-9]/gi, '')}`
  const doses = sim.doses.length > 60 ? [] : sim.doses
  const extrema = sim.extrema.filter((e) => Math.abs(e.t - sim.nowMs) > 45 * 60_000)

  return (
    <svg
      className="pk-chart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={tr('pk.chart.aria')}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.32 }} />
          <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.02 }} />
        </linearGradient>
      </defs>

      {/* future band */}
      <rect x={nowX} y={PAD_T} width={Math.max(0, PAD_L + PLOT_W - nowX)} height={PLOT_H} className="pk-chart-future-band" rx={6} />

      {yTicks.map((v) => (
        <g key={v}>
          <line x1={PAD_L} x2={PAD_L + PLOT_W} y1={y(v)} y2={y(v)} className={v === 0 ? 'pk-chart-axis' : 'pk-chart-grid'} />
          <text x={PAD_L - 6} y={y(v) + 3} textAnchor="end" className="pk-chart-ylabel">
            {v === 0 ? '0' : `${v}%`}
          </text>
        </g>
      ))}

      {midnights.map((t) => (
        <line key={t} x1={x(t)} x2={x(t)} y1={PAD_T} y2={base} className="pk-chart-grid" />
      ))}

      <path d={area(past)} fill={`url(#${gradId})`} />
      <path d={area(future)} fill={`url(#${gradId})`} opacity={0.45} />
      <path d={line(past)} className="pk-chart-line" style={{ stroke: color }} />
      <path d={line(future)} className="pk-chart-line is-future" style={{ stroke: color }} />

      {extrema.map((e) =>
        e.kind === 'peak' ? (
          <circle key={`p${e.t}`} cx={x(e.t)} cy={y(e.c)} r={2.8} style={{ fill: color }} />
        ) : (
          <circle key={`t${e.t}`} cx={x(e.t)} cy={y(e.c)} r={2.8} className="pk-chart-trough" style={{ stroke: color }} />
        ),
      )}

      {/* now marker */}
      <line x1={nowX} x2={nowX} y1={PAD_T - 6} y2={base} className="pk-chart-now" />
      <g transform={`translate(${nowX}, ${PAD_T - 14})`}>
        <rect x={-19} y={-8} width={38} height={15} rx={7.5} className="pk-chart-now-pill" />
        <text x={0} y={3} textAnchor="middle" className="pk-chart-now-text">
          {tr('pk.chart.now')}
        </text>
      </g>
      <circle cx={nowX} cy={nowY} r={8} style={{ fill: color, opacity: 0.18 }} />
      <circle cx={nowX} cy={nowY} r={4.2} style={{ fill: color }} className="pk-chart-now-dot" />

      {/* dose markers */}
      {doses.map((d) =>
        d.kind === 'taken' ? (
          <circle key={`d${d.t}`} cx={x(d.t)} cy={base + 7} r={2.6} style={{ fill: color }} />
        ) : (
          <circle key={`d${d.t}`} cx={x(d.t)} cy={base + 7} r={2.6} className="pk-chart-planned" style={{ stroke: color }} />
        ),
      )}

      {dayLabels.map((l) =>
        l.wide ? (
          <g key={l.mid}>
            <text x={x(l.mid)} y={base + 24} textAnchor="middle" className="pk-chart-xlabel">
              {format(l.date, 'M/d', { locale: dateFnsLocale(language) })}
            </text>
            <text x={x(l.mid)} y={base + 36} textAnchor="middle" className="pk-chart-xlabel is-dow">
              {format(l.date, language === 'en' ? 'EEE' : 'EEEEEE', { locale: dateFnsLocale(language) })}
            </text>
          </g>
        ) : null,
      )}
    </svg>
  )
}

/* ——— Settings ——— */

type SettingsMode = 'auto' | 'builtin' | 'custom'

function PkSettings({
  med,
  resolved,
  tr,
  language,
  onSave,
  forceOpen,
}: {
  med: Medication
  resolved: ResolvedPk
  tr: Tr
  language: LanguageId
  onSave: (p: MedPkParams | null) => Promise<void>
  forceOpen?: boolean
}) {
  const auto = useMemo(() => matchPkDrug(med.name), [med.name])
  const initialMode: SettingsMode = med.pkParams?.mode ?? (forceOpen ? 'custom' : 'auto')
  const [open, setOpen] = useState(Boolean(forceOpen))
  const [mode, setMode] = useState<SettingsMode>(initialMode)
  const [drugId, setDrugId] = useState<string>(
    med.pkParams?.mode === 'builtin' ? med.pkParams.drugId : (auto?.id ?? PK_DRUGS[0].id),
  )
  const [hl, setHl] = useState(med.pkParams?.mode === 'custom' ? String(med.pkParams.halfLifeH) : '')
  const [tmax, setTmax] = useState(
    med.pkParams?.mode === 'custom' && med.pkParams.tmaxH ? String(med.pkParams.tmaxH) : '',
  )
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const save = async () => {
    let next: MedPkParams | null = null
    if (mode === 'builtin') next = { mode: 'builtin', drugId }
    if (mode === 'custom') {
      const h = Number(hl.replace(',', '.'))
      const t = tmax.trim() ? Number(tmax.replace(',', '.')) : null
      if (!(h > 0 && h <= 24 * 60)) {
        setMsg(tr('pk.settings.invalid'))
        return
      }
      next = { mode: 'custom', halfLifeH: h, tmaxH: t != null && t > 0 && t <= 72 ? t : null }
    }
    setBusy(true)
    try {
      await onSave(next)
      setMsg(tr('pk.settings.saved'))
    } catch (e) {
      setMsg(e instanceof Error ? e.message : tr('med.edit.saveFail'))
    } finally {
      setBusy(false)
    }
  }

  const sortedDrugs = useMemo(
    () => [...PK_DRUGS].sort((a, b) => pkDrugName(a, language).localeCompare(pkDrugName(b, language), language)),
    [language],
  )

  return (
    <div className="pk-settings">
      <button type="button" className="pk-settings-toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span>{tr('pk.settings')}</span>
        <span className="pk-settings-current">
          {resolved.kind === 'builtin'
            ? pkDrugName(resolved.drug, language)
            : resolved.kind === 'custom'
              ? tr('pk.settings.custom')
              : tr('pk.settings.autoNone')}
        </span>
        <span aria-hidden className={`pk-settings-caret ${open ? 'is-open' : ''}`}>›</span>
      </button>
      {open ? (
        <div className="pk-settings-body">
          <div className="chip-row">
            {(['auto', 'builtin', 'custom'] as const).map((m) => (
              <button key={m} type="button" className={`chip ${mode === m ? 'active' : ''}`} onClick={() => setMode(m)}>
                {tr(`pk.settings.${m}`)}
              </button>
            ))}
          </div>
          {mode === 'auto' ? (
            <p className="hint pk-settings-hint">
              {auto ? tr('pk.matchedAs', { name: pkDrugName(auto, language) }) : tr('pk.notFound', { name: med.name })}
            </p>
          ) : null}
          {mode === 'builtin' ? (
            <select className="pk-select" value={drugId} onChange={(e) => setDrugId(e.target.value)}>
              {sortedDrugs.map((d) => (
                <option key={d.id} value={d.id}>
                  {pkDrugName(d, language)} · {fmtNum(d.halfLifeH.typ)} h
                </option>
              ))}
            </select>
          ) : null}
          {mode === 'custom' ? (
            <div className="pk-custom">
              <p className="hint pk-settings-hint">{tr('pk.settings.halfLifeExplain')}</p>
              <div className="pk-custom-row">
                <label>
                  <span>{tr('pk.settings.halfLife')}</span>
                  <input inputMode="decimal" value={hl} onChange={(e) => setHl(e.target.value)} placeholder="24" />
                </label>
                <label>
                  <span>{tr('pk.settings.tmax')}</span>
                  <input inputMode="decimal" value={tmax} onChange={(e) => setTmax(e.target.value)} placeholder="2" />
                </label>
              </div>
              <p className="hint pk-settings-hint">{tr('pk.settings.tmaxExplain')}</p>
            </div>
          ) : null}
          {msg ? <p className="hint pk-settings-msg">{msg}</p> : null}
          <Button className="btn-sm" disabled={busy} onClick={() => void save()}>
            {busy ? tr('common.saving') : tr('common.save')}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

/* ——— Sheet ——— */

function SourceLine({ drug, tr, language }: { drug: PkDrug; tr: Tr; language: LanguageId }) {
  const cjkPunct = language !== 'en' && language !== 'ko'
  return (
    <p className="pk-source">
      {tr('pk.source')}
      {cjkPunct ? '：' : ': '}
      {drug.sources.map((s, i) => (
        <span key={s.url + i}>
          {i ? (cjkPunct ? '；' : '; ') : ''}
          <a href={s.url} target="_blank" rel="noreferrer noopener">
            {s.label}
          </a>
        </span>
      ))}
    </p>
  )
}

export function PkSimSheet({
  open,
  onClose,
  userId,
  meds,
  onSaved,
  initialNowMs,
}: {
  open: boolean
  onClose: () => void
  userId: string
  meds: Medication[]
  onSaved: () => void | Promise<void>
  /** Test/screenshot hook; defaults to Date.now() when the sheet opens. */
  initialNowMs?: number
}) {
  const { t: tr, language } = useLocale()
  const list = useMemo(() => [...meds].sort((a, b) => Number(b.enabled) - Number(a.enabled)), [meds])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [logs, setLogs] = useState<MedLog[]>([])
  const [modeOverride, setModeOverride] = useState<Record<string, PkSourceMode>>({})
  const [nowMs, setNowMs] = useState(() => initialNowMs ?? Date.now())
  const [loadErr, setLoadErr] = useState('')

  const med = list.find((m) => m.id === selectedId) ?? list[0] ?? null
  const resolved: ResolvedPk = med ? resolvePk(med.name, med.pkParams) : { kind: 'none' }

  const lookbackDays = useMemo(() => {
    let days = 4
    for (const m of meds) {
      const r = resolvePk(m.name, m.pkParams)
      if (r.kind !== 'none') days = Math.max(days, logLookbackDays(r.halfLifeH))
    }
    return days
  }, [meds])

  useEffect(() => {
    if (!open) return
    const now = initialNowMs ?? Date.now()
    setNowMs(now)
    setLoadErr('')
    const from = format(new Date(now - lookbackDays * DAY_MS), 'yyyy-MM-dd')
    let alive = true
    listMedLogs(userId, { from })
      .then((l) => alive && setLogs(l))
      .catch((e) => alive && setLoadErr(e instanceof Error ? e.message : tr('med.edit.loadFail')))
    return () => {
      alive = false
    }
  }, [open, userId, lookbackDays, initialNowMs, tr])

  const mode: PkSourceMode = med ? (modeOverride[med.id] ?? defaultSourceMode(med, logs, nowMs)) : 'plan'

  const hlH = resolved.kind !== 'none' ? resolved.halfLifeH : 0
  const tmaxH = resolved.kind !== 'none' ? resolved.tmaxH : 0
  const sim = useMemo(() => {
    if (!med || !(hlH > 0) || !(tmaxH > 0)) return null
    return buildPkSimulation({ med, logs, params: { halfLifeH: hlH, tmaxH }, nowMs, mode })
  }, [med, logs, nowMs, mode, hlH, tmaxH])

  const color = med?.color || FALLBACK_COLOR

  const savePk = async (p: MedPkParams | null) => {
    if (!med) return
    await putMedication({ ...med, pkParams: p, updatedAt: new Date().toISOString() })
    await onSaved()
  }

  const fmtTime = (t: number) =>
    isSameLocalDay(t, nowMs)
      ? format(t, 'HH:mm')
      : format(t, datePattern(language, 'monthDayTime'), { locale: dateFnsLocale(language) })

  return (
    <Modal open={open} onClose={onClose} title={tr('pk.title')}>
      <div className="pk-sheet">
        <div className="pk-disclaimer" role="note">
          <span className="pk-disclaimer-icon" aria-hidden>
            i
          </span>
          <p>{tr('pk.disclaimer')}</p>
        </div>

        {loadErr ? <p className="hint" style={{ color: 'var(--color-danger, #c62828)' }}>{loadErr}</p> : null}

        {!med ? (
          <Empty text={tr('pk.noMeds')} />
        ) : (
          <>
            {list.length > 1 ? (
              <div className="pk-med-chips" role="tablist" aria-label={tr('pk.selectMed')}>
                {list.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    role="tab"
                    aria-selected={m.id === med.id}
                    className={`chip pk-med-chip ${m.id === med.id ? 'active' : ''}`}
                    onClick={() => setSelectedId(m.id)}
                  >
                    <span className="med-color-swatch" style={{ background: m.color || FALLBACK_COLOR }} aria-hidden />
                    {m.name}
                  </button>
                ))}
              </div>
            ) : null}

            {resolved.kind === 'none' || !sim ? (
              <div className="pk-card">
                <p className="pk-notfound">{tr('pk.notFound', { name: med.name })}</p>
              </div>
            ) : (
              <>
                <div className="pk-mode" role="radiogroup">
                  {(['logs', 'plan'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      role="radio"
                      aria-checked={mode === m}
                      className={`pk-mode-btn ${mode === m ? 'is-active' : ''}`}
                      onClick={() => setModeOverride((o) => ({ ...o, [med.id]: m }))}
                    >
                      {tr(`pk.mode.${m}`)}
                    </button>
                  ))}
                </div>
                <p className="hint pk-mode-hint">{tr(`pk.mode.${mode}Hint`)}</p>

                <div className="pk-card">
                  <div className="pk-status">
                    <span className={`pk-phase-dot phase-${sim.phase}`} style={{ background: color }} aria-hidden />
                    <div>
                      <strong className="pk-status-phase">{tr(`pk.phase.${sim.phase}`)}</strong>
                      <div className="pk-status-sub">
                        {sim.phase !== 'none' ? tr('pk.nowPct', { pct: String(Math.round(sim.nowPct)) }) : null}
                        {sim.nextPeak && sim.phase !== 'steady' ? (
                          <>
                            {' · '}
                            {tr('pk.nextPeak', { time: fmtTime(sim.nextPeak.t) })}
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <PkChart sim={sim} color={color} language={language} tr={tr} />

                  <div className="pk-legend">
                    <span><i className="pk-lg-line" style={{ background: color }} />{tr('pk.legend.est')}</span>
                    <span><i className="pk-lg-line is-dashed" style={{ color }} />{tr('pk.legend.future')}</span>
                    {sim.doses.some((d) => d.kind === 'taken') && (
                      <span><i className="pk-lg-dot" style={{ background: color }} />{tr('pk.legend.taken')}</span>
                    )}
                    <span><i className="pk-lg-dot is-hollow" style={{ borderColor: color }} />{tr('pk.legend.planned')}</span>
                  </div>
                  <p className="hint pk-yhint">{tr('pk.yAxisHint')}</p>
                </div>

                <div className="pk-info">
                  <div className="pk-info-row">
                    <span className="pk-info-k">{tr('pk.info.halfLife')}</span>
                    <span className="pk-info-v">
                      {resolved.kind === 'builtin' ? fmtRange(resolved.drug.halfLifeH, tr) : tr('pk.unit.hours', { n: fmtNum(resolved.halfLifeH) })}
                      {resolved.halfLifeH >= 48 ? ` · ≈${fmtDuration(resolved.halfLifeH, tr)}` : ''}
                    </span>
                  </div>
                  <div className="pk-info-row">
                    <span className="pk-info-k">{tr('pk.info.tmax')}</span>
                    <span className="pk-info-v">
                      {resolved.kind === 'builtin' ? fmtRange(resolved.drug.tmaxH, tr) : tr('pk.unit.hours', { n: fmtNum(resolved.tmaxH) })}
                    </span>
                  </div>
                  <div className="pk-info-row is-block">
                    <span className="pk-info-k">{tr('pk.info.steady')}</span>
                    <span className="pk-info-v">
                      {tr('pk.info.steadyText', { time: fmtDuration(timeToSteadyStateH(resolved.halfLifeH), tr) })}
                    </span>
                  </div>
                  {resolved.kind === 'builtin' ? (
                    <>
                      <p className="pk-meta">
                        {tr('pk.matchedAs', { name: pkDrugName(resolved.drug, language) })}
                        {resolved.drug.halfLifeH.midpoint || resolved.drug.tmaxH.midpoint ? ` · ${tr('pk.midpoint')}` : ''}
                      </p>
                      {resolved.drug.noteKey ? <p className="pk-note">{tr(resolved.drug.noteKey)}</p> : null}
                      <SourceLine drug={resolved.drug} tr={tr} language={language} />
                    </>
                  ) : (
                    <p className="pk-meta">
                      {tr('pk.customUsed')}
                      {resolved.kind === 'custom' && resolved.tmaxDefaulted ? ` · ${tr('pk.tmaxDefaulted')}` : ''}
                    </p>
                  )}
                </div>

                <p className="hint pk-why">{tr('pk.whyRelative')}</p>
              </>
            )}

            <PkSettings
              key={`${med.id}:${JSON.stringify(med.pkParams ?? null)}:${resolved.kind}`}
              med={med}
              resolved={resolved}
              tr={tr}
              language={language}
              onSave={savePk}
              forceOpen={resolved.kind === 'none'}
            />
          </>
        )}
      </div>
    </Modal>
  )
}
