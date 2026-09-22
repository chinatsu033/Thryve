import { format, parseISO } from 'date-fns'
import { dateFnsLocale, datePattern } from '../lib/dateLocale'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, Disclaimer, Empty, Page } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'
import { uid } from '../lib/crypto'
import {
  CONTRAST_SCALE_IDS,
  CONTRAST_SCALES,
  getScaleOptions,
  scoreContrastScale,
  type ContrastBandKey,
  type ContrastScoreResult,
} from '../lib/contrastScales'
import { downloadContrastPdf, formatScoresBrief } from '../lib/contrastPdf'
import {
  listContrastResults,
  listContrastResultsByScale,
  migrateLocalContrastResults,
  saveContrastResult,
} from '../lib/contrastStore'
import type { ContrastResult, ContrastScaleId } from '../types'
import type { MessageKey } from '../locales/messages'
import type { LanguageId } from '../lib/locale'

type View = 'hub' | 'form' | 'result' | 'history'

function bandKey(band: ContrastBandKey): MessageKey {
  return `contrast.band.${band}` as MessageKey
}

function formatDelta(n: number): string {
  if (n > 0) return `+${n}`
  return String(n)
}

export function ContrastPage() {
  const { t, language } = useLocale()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [view, setView] = useState<View>('hub')
  const [scaleId, setScaleId] = useState<ContrastScaleId | null>(null)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [scoreResult, setScoreResult] = useState<ContrastScoreResult | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [savedResult, setSavedResult] = useState<ContrastResult | null>(null)
  const [previousResult, setPreviousResult] = useState<ContrastResult | null>(null)
  const [allResults, setAllResults] = useState<ContrastResult[]>([])
  const [historyItems, setHistoryItems] = useState<ContrastResult[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const reloadAll = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    setLoadError(null)
    try {
      await migrateLocalContrastResults(profile.id)
      const list = await listContrastResults(profile.id)
      setAllResults(list)
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : t('common.unknownError'))
    } finally {
      setLoading(false)
    }
  }, [profile, t])

  useEffect(() => {
    void reloadAll()
  }, [reloadAll])

  const latestByScale = useMemo(() => {
    const map = new Map<ContrastScaleId, ContrastResult>()
    for (const r of allResults) {
      if (!map.has(r.scaleId)) map.set(r.scaleId, r)
    }
    return map
  }, [allResults])

  const scale = scaleId ? CONTRAST_SCALES[scaleId] : null

  const startScale = (id: ContrastScaleId) => {
    const def = CONTRAST_SCALES[id]
    setScaleId(id)
    setAnswers(Array.from({ length: def.items.length }, () => null))
    setStep(0)
    setScoreResult(null)
    setSavedAt(null)
    setSavedResult(null)
    setPreviousResult(null)
    setView('form')
  }

  const openHistory = async (id: ContrastScaleId) => {
    if (!profile) return
    setScaleId(id)
    setView('history')
    setLoading(true)
    try {
      const items = await listContrastResultsByScale(profile.id, id)
      setHistoryItems(items)
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : t('common.unknownError'))
      setHistoryItems([])
    } finally {
      setLoading(false)
    }
  }

  const currentAnswer = answers[step] ?? null
  const opts = scale ? getScaleOptions(scale, step) : []

  const selectAnswer = (value: number) => {
    setAnswers((prev) => {
      const next = [...prev]
      next[step] = value
      return next
    })
  }

  const canSubmit =
    scale != null && answers.every((a) => a != null && Number.isFinite(a))

  const goNext = async () => {
    if (!scale) return
    if (step < scale.items.length - 1) {
      setStep((s) => s + 1)
      return
    }
    if (!canSubmit || !scaleId || !profile || saving) return
    setSaving(true)
    setLoadError(null)
    try {
      const numeric = answers.map((a) => a as number)
      const scored = scoreContrastScale(scaleId, numeric)
      const prior = await listContrastResultsByScale(profile.id, scaleId)
      const previous = prior[0] ?? null
      const completedAt = new Date().toISOString()
      const result: ContrastResult = {
        id: uid(),
        profileId: profile.id,
        scaleId,
        answers: numeric,
        scores: scored.scores,
        completedAt,
      }
      await saveContrastResult(result)
      setScoreResult(scored)
      setSavedAt(completedAt)
      setSavedResult(result)
      setPreviousResult(previous)
      setView('result')
      await reloadAll()
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : t('common.unknownError'))
    } finally {
      setSaving(false)
    }
  }

  const goPrev = () => {
    if (step > 0) setStep((s) => s - 1)
  }

  const backHub = () => {
    setView('hub')
    setScaleId(null)
    setScoreResult(null)
    setSavedResult(null)
    setPreviousResult(null)
    void reloadAll()
  }

  if (!profile) return null

  if (view === 'form' && scale && scaleId) {
    const item = scale.items[step]!
    const progress = `${step + 1} / ${scale.items.length}`
    return (
      <Page
        title={scale.name[language]}
        sub={t('contrast.progress', { current: String(step + 1), total: String(scale.items.length) })}
        back={() => {
          if (step > 0) goPrev()
          else backHub()
        }}
      >
        <p className="hint" style={{ marginBottom: 12 }}>
          {scale.intro[language]}
        </p>
        <Card>
          <div className="contrast-progress-bar" aria-hidden>
            <div
              className="contrast-progress-fill"
              style={{ width: `${((step + 1) / scale.items.length) * 100}%` }}
            />
          </div>
          <p className="meta hint" style={{ marginBottom: 8 }}>
            {progress}
          </p>
          <h3 className="contrast-item-text">{item.text[language]}</h3>
          <div className="contrast-options">
            {opts.map((o) => (
              <button
                key={o.value}
                type="button"
                className={`contrast-option${currentAnswer === o.value ? ' is-selected' : ''}`}
                onClick={() => selectAnswer(o.value)}
              >
                <span className="contrast-option-value">{o.value}</span>
                <span className="contrast-option-label">{o.label[language]}</span>
              </button>
            ))}
          </div>
          {loadError ? <p className="hint" style={{ color: 'var(--color-danger, #c44)', marginTop: 8 }}>{loadError}</p> : null}
          <div className="row" style={{ marginTop: 16, gap: 10 }}>
            <Button variant="ghost" disabled={step === 0 || saving} onClick={goPrev}>
              {t('contrast.prev')}
            </Button>
            <Button
              block
              disabled={currentAnswer == null || saving}
              onClick={() => void goNext()}
            >
              {saving
                ? t('contrast.saving')
                : step < scale.items.length - 1
                  ? t('contrast.next')
                  : t('contrast.submit')}
            </Button>
          </div>
        </Card>
        <Disclaimer />
      </Page>
    )
  }

  if (view === 'result' && scale && scaleId && scoreResult && savedResult) {
    return (
      <Page title={t('contrast.score')} sub={scale.name[language]} back={backHub}>
        <Card>
          <ScoreBlocks
            scaleId={scaleId}
            scored={scoreResult}
            t={t}
            language={language}
          />
          {scoreResult.crisisFlag ? (
            <div className="contrast-crisis" role="note">
              <p>{t('contrast.crisisNote')}</p>
              <Link to="/help/crisis" className="contrast-crisis-link">
                {t('contrast.crisisLink')}
              </Link>
            </div>
          ) : null}
          {previousResult ? (
            <CompareBlock
              scaleId={scaleId}
              current={savedResult}
              previous={previousResult}
              currentScored={scoreResult}
              t={t}
              language={language}
            />
          ) : null}
          {savedAt ? (
            <p className="meta hint" style={{ marginTop: 12 }}>
              {t('contrast.saveOk')} ·{' '}
              {format(parseISO(savedAt), datePattern(language, 'monthDayTime'), {
                locale: dateFnsLocale(language),
              })}
            </p>
          ) : null}
          <div className="row" style={{ marginTop: 16, gap: 10, flexWrap: 'wrap' }}>
            <Button
              block
              variant="ghost"
              onClick={() =>
                downloadContrastPdf({
                  result: savedResult,
                  previous: previousResult,
                  language,
                  t,
                })
              }
            >
              {t('contrast.pdf.download')}
            </Button>
            <Button block onClick={backHub}>
              {t('contrast.backHub')}
            </Button>
          </div>
        </Card>
        <Disclaimer />
      </Page>
    )
  }

  if (view === 'history' && scale && scaleId) {
    return (
      <Page
        title={t('contrast.history')}
        sub={scale.name[language]}
        back={backHub}
      >
        {loading ? (
          <Empty text={t('contrast.loading')} />
        ) : historyItems.length === 0 ? (
          <Empty text={t('contrast.noHistory')} />
        ) : (
          <div className="list">
            {historyItems.map((r) => (
              <div key={r.id} className="list-item">
                <div>
                  <strong>{formatScoresBrief(r)}</strong>
                  <div className="meta">
                    {format(parseISO(r.completedAt), datePattern(language, 'monthDayTime'), {
                      locale: dateFnsLocale(language),
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Page>
    )
  }

  return (
    <Page
      title={t('nav.contrast')}
      sub={t('contrast.sub')}
      back={() => navigate('/', { state: { homeLayer: 'dashboard' } })}
    >
      <p className="contrast-disclaimer">{t('contrast.disclaimer')}</p>
      {loadError ? <p className="hint" style={{ color: 'var(--color-danger, #c44)' }}>{loadError}</p> : null}
      {loading ? (
        <Empty text={t('contrast.loading')} />
      ) : (
        <div className="list" style={{ gap: 10 }}>
          {CONTRAST_SCALE_IDS.map((id) => {
            const def = CONTRAST_SCALES[id]
            const latest = latestByScale.get(id)
            return (
              <Card key={id} className="contrast-scale-card">
                <div className="contrast-scale-head">
                  <div>
                    <strong className="contrast-scale-name">{def.name[language]}</strong>
                    <div className="hint">{def.short[language]}</div>
                  </div>
                  {latest ? (
                    <div className="contrast-scale-last meta">
                      <div>{t('contrast.lastScore')}</div>
                      <strong>{formatScoresBrief(latest)}</strong>
                      <div className="hint">
                        {format(parseISO(latest.completedAt), datePattern(language, 'monthDay'), {
                          locale: dateFnsLocale(language),
                        })}
                      </div>
                    </div>
                  ) : (
                    <span className="hint">{t('contrast.noHistory')}</span>
                  )}
                </div>
                <div className="row" style={{ marginTop: 12, gap: 8 }}>
                  <Button block onClick={() => startScale(id)}>
                    {t('contrast.start')}
                  </Button>
                  <Button variant="ghost" onClick={() => void openHistory(id)}>
                    {t('contrast.history')}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
      <Disclaimer />
    </Page>
  )
}

function CompareBlock({
  scaleId,
  previous,
  currentScored,
  t,
  language,
}: {
  scaleId: ContrastScaleId
  current: ContrastResult
  previous: ContrastResult
  currentScored: ContrastScoreResult
  t: (key: MessageKey | string, vars?: Record<string, string>) => string
  language: LanguageId
}) {
  const prevScored = scoreContrastScale(previous.scaleId, previous.answers)
  return (
    <div className="contrast-compare" style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--color-border, rgba(0,0,0,0.08))' }}>
      <strong style={{ color: 'var(--color-primary)' }}>{t('contrast.compare.title')}</strong>
      <p className="meta hint" style={{ marginTop: 6 }}>
        {t('contrast.compare.prevDate')}:{' '}
        {format(parseISO(previous.completedAt), datePattern(language, 'monthDayTime'), {
          locale: dateFnsLocale(language),
        })}
      </p>
      {scaleId === 'dass21' ? (
        <div className="contrast-score-blocks" style={{ marginTop: 8 }}>
          {(['depression', 'anxiety', 'stress'] as const).map((key) => {
            const cur = currentScored.scores[key] ?? 0
            const prev = prevScored.scores[key] ?? 0
            return (
              <div key={key} className="contrast-score-row">
                <span>{t(`contrast.dass.${key}`)}</span>
                <span className="hint">{t('contrast.compare.prevLabel')}: {prev}</span>
                <strong>
                  {t('contrast.compare.delta')} {formatDelta(cur - prev)}
                </strong>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="contrast-score-blocks" style={{ marginTop: 8 }}>
          <div className="contrast-score-row">
            <span>{t('contrast.compare.prevLabel')}</span>
            <strong>{prevScored.scores.total ?? 0}</strong>
            {prevScored.bands.total ? (
              <span className="hint">{t(bandKey(prevScored.bands.total))}</span>
            ) : null}
          </div>
          <div className="contrast-score-row">
            <span>{t('contrast.compare.delta')}</span>
            <strong>
              {formatDelta((currentScored.scores.total ?? 0) - (prevScored.scores.total ?? 0))}
            </strong>
          </div>
        </div>
      )}
    </div>
  )
}

function ScoreBlocks({
  scaleId,
  scored,
  t,
  language,
}: {
  scaleId: ContrastScaleId
  scored: ContrastScoreResult
  t: (key: MessageKey | string, vars?: Record<string, string>) => string
  language: string
}) {
  void language
  if (scaleId === 'dass21') {
    const rows: Array<{ key: string; label: string }> = [
      { key: 'depression', label: t('contrast.dass.depression') },
      { key: 'anxiety', label: t('contrast.dass.anxiety') },
      { key: 'stress', label: t('contrast.dass.stress') },
    ]
    return (
      <div className="contrast-score-blocks">
        {rows.map((row) => (
          <div key={row.key} className="contrast-score-row">
            <span>{row.label}</span>
            <strong>{scored.scores[row.key] ?? 0}</strong>
            <span className="hint">{t(bandKey(scored.bands[row.key]!))}</span>
          </div>
        ))}
      </div>
    )
  }

  if (scaleId === 'who5') {
    return (
      <div className="contrast-score-blocks">
        <div className="contrast-score-row">
          <span>{t('contrast.total')}</span>
          <strong>{scored.scores.total ?? 0}</strong>
          <span className="hint">{t(bandKey(scored.bands.total!))}</span>
        </div>
        <p className="hint">{t('contrast.who5.percent', { pct: String(scored.scores.percent ?? 0) })}</p>
        <p className="hint">{t('contrast.who5.note')}</p>
      </div>
    )
  }

  if (scaleId === 'phq2') {
    return (
      <div className="contrast-score-blocks">
        <div className="contrast-score-row">
          <span>{t('contrast.total')}</span>
          <strong>{scored.scores.total ?? 0}</strong>
          <span className="hint">{t(bandKey(scored.bands.total!))}</span>
        </div>
        <p className="hint">{t('contrast.cutoff.phq2')}</p>
      </div>
    )
  }

  if (scaleId === 'ais') {
    return (
      <div className="contrast-score-blocks">
        <div className="contrast-score-row">
          <span>{t('contrast.total')}</span>
          <strong>{scored.scores.total ?? 0}</strong>
          <span className="hint">{t(bandKey(scored.bands.total!))}</span>
        </div>
        <p className="hint">{t('contrast.ais.threshold')}</p>
      </div>
    )
  }

  return (
    <div className="contrast-score-blocks">
      <div className="contrast-score-row">
        <span>{t('contrast.total')}</span>
        <strong>{scored.scores.total ?? 0}</strong>
        <span className="hint">{t(bandKey(scored.bands.total!))}</span>
      </div>
    </div>
  )
}
