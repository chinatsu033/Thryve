import { format, parseISO } from 'date-fns'
import { dateFnsLocale, datePattern } from '../lib/dateLocale'
import { useCallback, useEffect, useState } from 'react'
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
import {
  getLatestContrastResult,
  listContrastResultsByScale,
  saveContrastResult,
} from '../lib/contrastStore'
import type { ContrastResult, ContrastScaleId } from '../types'
import type { MessageKey } from '../locales/messages'

type View = 'hub' | 'form' | 'result' | 'history'

function bandKey(band: ContrastBandKey): MessageKey {
  return `contrast.band.${band}` as MessageKey
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
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick((n) => n + 1), [])

  useEffect(() => {
    void tick
  }, [tick])

  const scale = scaleId ? CONTRAST_SCALES[scaleId] : null

  const startScale = (id: ContrastScaleId) => {
    const def = CONTRAST_SCALES[id]
    setScaleId(id)
    setAnswers(Array.from({ length: def.items.length }, () => null))
    setStep(0)
    setScoreResult(null)
    setSavedAt(null)
    setView('form')
  }

  const openHistory = (id: ContrastScaleId) => {
    setScaleId(id)
    setView('history')
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

  const goNext = () => {
    if (!scale) return
    if (step < scale.items.length - 1) {
      setStep((s) => s + 1)
      return
    }
    if (!canSubmit || !scaleId || !profile) return
    const numeric = answers.map((a) => a as number)
    const scored = scoreContrastScale(scaleId, numeric)
    const completedAt = new Date().toISOString()
    const result: ContrastResult = {
      id: uid(),
      profileId: profile.id,
      scaleId,
      answers: numeric,
      scores: scored.scores,
      completedAt,
    }
    saveContrastResult(result)
    setScoreResult(scored)
    setSavedAt(completedAt)
    setView('result')
    refresh()
  }

  const goPrev = () => {
    if (step > 0) setStep((s) => s - 1)
  }

  const backHub = () => {
    setView('hub')
    setScaleId(null)
    setScoreResult(null)
    refresh()
  }

  const historyItems =
    profile && scaleId ? listContrastResultsByScale(profile.id, scaleId) : ([] as ContrastResult[])
  void tick

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
          <div className="row" style={{ marginTop: 16, gap: 10 }}>
            <Button variant="ghost" disabled={step === 0} onClick={goPrev}>
              {t('contrast.prev')}
            </Button>
            <Button
              block
              disabled={currentAnswer == null}
              onClick={goNext}
            >
              {step < scale.items.length - 1 ? t('contrast.next') : t('contrast.submit')}
            </Button>
          </div>
        </Card>
        <Disclaimer />
      </Page>
    )
  }

  if (view === 'result' && scale && scaleId && scoreResult) {
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
          {savedAt ? (
            <p className="meta hint" style={{ marginTop: 12 }}>
              {t('contrast.saveOk')} ·{' '}
              {format(parseISO(savedAt), datePattern(language, 'monthDayTime'), {
                locale: dateFnsLocale(language),
              })}
            </p>
          ) : null}
          <Button block style={{ marginTop: 16 }} onClick={backHub}>
            {t('contrast.backHub')}
          </Button>
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
        {historyItems.length === 0 ? (
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
      <div className="list" style={{ gap: 10 }}>
        {CONTRAST_SCALE_IDS.map((id) => {
          const def = CONTRAST_SCALES[id]
          const latest = getLatestContrastResult(profile.id, id)
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
                <Button variant="ghost" onClick={() => openHistory(id)}>
                  {t('contrast.history')}
                </Button>
              </div>
            </Card>
          )
        })}
      </div>
      <Disclaimer />
    </Page>
  )
}

function formatScoresBrief(r: ContrastResult): string {
  if (r.scaleId === 'dass21') {
    return `D ${r.scores.depression ?? 0} · A ${r.scores.anxiety ?? 0} · S ${r.scores.stress ?? 0}`
  }
  if (r.scaleId === 'who5') {
    return `${r.scores.total ?? 0} (${r.scores.percent ?? 0}%)`
  }
  return String(r.scores.total ?? Object.values(r.scores)[0] ?? '—')
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

  if (scaleId === 'phq2' || scaleId === 'gad2') {
    return (
      <div className="contrast-score-blocks">
        <div className="contrast-score-row">
          <span>{t('contrast.total')}</span>
          <strong>{scored.scores.total ?? 0}</strong>
          <span className="hint">{t(bandKey(scored.bands.total!))}</span>
        </div>
        <p className="hint">
          {t(scaleId === 'phq2' ? 'contrast.cutoff.phq2' : 'contrast.cutoff.gad2')}
        </p>
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
