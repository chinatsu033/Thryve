import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Turnstile } from '../components/Turnstile'
import { Button, Card, Disclaimer, Field, Page } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'
import { questionLabelKey } from '../lib/securityQuestions'

const TURNSTILE_SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined)?.trim() || ''

type Mode = 'login' | 'register' | 'recover'
type RecoverStep = 'email' | 'questions' | 'password'

export function AuthPage() {
  const { t } = useLocale()
  const { profile, login, register, ready, configured } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileReset, setTurnstileReset] = useState(0)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  const [recoverStep, setRecoverStep] = useState<RecoverStep>('email')
  const [questionIds, setQuestionIds] = useState<string[]>([])
  const [answers, setAnswers] = useState<[string, string, string]>(['', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  if (!ready) return <div className="loading">{t('common.loading')}</div>
  if (profile) return <Navigate to="/" replace />

  const switchMode = (next: Mode) => {
    setMode(next)
    setError('')
    setInfo('')
    setTurnstileToken(null)
    if (next === 'register') setTurnstileReset((n) => n + 1)
    if (next === 'recover') {
      setRecoverStep('email')
      setQuestionIds([])
      setAnswers(['', '', ''])
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  const submitLoginRegister = async () => {
    setError('')
    setInfo('')
    setBusy(true)
    try {
      if (mode === 'login') {
        const res = await login(email, password)
        if (!res.ok) setError(res.error)
        return
      }

      if (!TURNSTILE_SITE_KEY) {
        setError(t('auth.err.registerFailed'))
        return
      }
      if (!turnstileToken) {
        setError(t('auth.turnstile.required'))
        return
      }

      const res = await register(email, password, displayName, turnstileToken)
      if (!res.ok) {
        setError(res.error)
        setTurnstileToken(null)
        setTurnstileReset((n) => n + 1)
      }
    } finally {
      setBusy(false)
    }
  }

  const recoverStart = async () => {
    setError('')
    setInfo('')
    setBusy(true)
    try {
      const trimmed = email.trim()
      if (!trimmed.includes('@')) {
        setError(t('auth.err.badEmail'))
        return
      }
      const res = await fetch('/api/password/recover/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        error?: string
        questionIds?: string[]
      }
      if (res.status === 429 || data.error === 'locked') {
        setError(t('auth.err.locked'))
        return
      }
      if (!res.ok || !data.ok || !data.questionIds || data.questionIds.length !== 3) {
        setError(t('auth.err.recoverGeneric'))
        return
      }
      setQuestionIds(data.questionIds)
      setAnswers(['', '', ''])
      setRecoverStep('questions')
    } catch {
      setError(t('auth.err.network'))
    } finally {
      setBusy(false)
    }
  }

  const recoverGoPassword = () => {
    setError('')
    if (answers.some((a) => !a.trim())) {
      setError(t('auth.err.recoverAnswers'))
      return
    }
    setRecoverStep('password')
  }

  const recoverReset = async () => {
    setError('')
    setInfo('')
    if (newPassword.length < 6) {
      setError(t('auth.err.shortPassword'))
      return
    }
    if (newPassword !== confirmPassword) {
      setError(t('auth.err.passwordMismatch'))
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/password/recover/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          answers: questionIds.map((id, i) => ({ id, answer: answers[i] })),
          newPassword,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (res.status === 429 || data.error === 'locked') {
        setError(t('auth.err.locked'))
        return
      }
      if (data.error === 'bad_answers') {
        setError(t('auth.err.recoverAnswers'))
        setRecoverStep('questions')
        return
      }
      if (!res.ok || !data.ok) {
        setError(t('auth.err.recoverGeneric'))
        return
      }
      setInfo(t('auth.recover.success'))
      setPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMode('login')
      setRecoverStep('email')
    } catch {
      setError(t('auth.err.network'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Page back={false} title="Thryve" sub={t('auth.sub')}>
      <Disclaimer />
      {!configured ? (
        <Card>
          <p className="error-text" style={{ margin: 0 }}>
            {t('auth.unconfigured')}
          </p>
        </Card>
      ) : null}
      <Card>
        {mode !== 'recover' ? (
          <div className="chip-row">
            <button
              type="button"
              className={`chip ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              {t('auth.login')}
            </button>
            <button
              type="button"
              className={`chip ${mode === 'register' ? 'active' : ''}`}
              onClick={() => switchMode('register')}
            >
              {t('auth.register')}
            </button>
          </div>
        ) : (
          <>
            <p style={{ marginTop: 0, fontWeight: 600 }}>{t('auth.recover.title')}</p>
            <p className="hint" style={{ marginTop: 0 }}>
              {t('auth.recover.sub')}
            </p>
          </>
        )}

        {mode === 'recover' ? (
          <>
            {recoverStep === 'email' ? (
              <>
                <Field label={t('auth.email')}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="you@example.com"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void recoverStart()
                    }}
                  />
                </Field>
                <Button block disabled={busy || !configured} onClick={() => void recoverStart()}>
                  {busy ? t('common.pleaseWait') : t('auth.recover.start')}
                </Button>
              </>
            ) : null}

            {recoverStep === 'questions' ? (
              <>
                {questionIds.map((qid, i) => (
                  <Field key={qid} label={t(questionLabelKey(qid))}>
                    <input
                      type="text"
                      value={answers[i]}
                      onChange={(e) => {
                        const next: [string, string, string] = [...answers]
                        next[i] = e.target.value
                        setAnswers(next)
                      }}
                      autoComplete="off"
                      placeholder={t('auth.recover.answerPh')}
                    />
                  </Field>
                ))}
                <div className="row">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setRecoverStep('email')
                      setError('')
                    }}
                  >
                    {t('common.prev')}
                  </Button>
                  <Button onClick={recoverGoPassword}>{t('common.continue')}</Button>
                </div>
              </>
            ) : null}

            {recoverStep === 'password' ? (
              <>
                <Field label={t('auth.recover.newPassword')} hint={t('auth.password.hint')}>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder={t('auth.password.ph')}
                  />
                </Field>
                <Field label={t('auth.recover.confirmPassword')}>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder={t('auth.password.ph')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void recoverReset()
                    }}
                  />
                </Field>
                <div className="row">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setRecoverStep('questions')
                      setError('')
                    }}
                  >
                    {t('common.prev')}
                  </Button>
                  <Button disabled={busy} onClick={() => void recoverReset()}>
                    {busy ? t('common.pleaseWait') : t('auth.recover.reset')}
                  </Button>
                </div>
              </>
            ) : null}

            <p style={{ marginTop: 16, textAlign: 'center' }}>
              <button type="button" className="link-button" onClick={() => switchMode('login')}>
                {t('auth.recover.backToLogin')}
              </button>
            </p>
          </>
        ) : (
          <>
            {mode === 'register' ? (
              <Field label={t('auth.displayName')} hint={t('auth.displayName.hint')}>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoComplete="nickname"
                  placeholder={t('auth.displayName.ph')}
                />
              </Field>
            ) : null}

            <Field label={t('auth.email')}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
              />
            </Field>

            <Field
              label={t('auth.password')}
              hint={mode === 'register' ? t('auth.password.hint') : undefined}
            >
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder={t('auth.password.ph')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void submitLoginRegister()
                }}
              />
            </Field>

            {mode === 'login' ? (
              <p style={{ margin: '0 0 12px', textAlign: 'right' }}>
                <button type="button" className="link-button" onClick={() => switchMode('recover')}>
                  {t('auth.forgotPassword')}
                </button>
              </p>
            ) : null}

            {mode === 'register' ? (
              <Field label={t('auth.turnstile')}>
                {TURNSTILE_SITE_KEY ? (
                  <Turnstile
                    siteKey={TURNSTILE_SITE_KEY}
                    resetKey={turnstileReset}
                    onToken={setTurnstileToken}
                    onExpire={() => setTurnstileToken(null)}
                  />
                ) : (
                  <p className="error-text" style={{ margin: 0 }}>
                    {t('auth.err.registerFailed')}
                  </p>
                )}
              </Field>
            ) : null}

            <Button block disabled={busy || !configured} onClick={() => void submitLoginRegister()}>
              {busy
                ? t('common.pleaseWait')
                : mode === 'login'
                  ? t('auth.login')
                  : t('auth.registerEnter')}
            </Button>
          </>
        )}

        {error ? <p className="error-text">{error}</p> : null}
        {info ? <p className="hint">{info}</p> : null}
      </Card>
      <p className="hint" style={{ marginTop: 16, textAlign: 'center' }}>
        {t('auth.footer')}
      </p>
      <p className="crisis-auth-link">
        <Link to="/help/crisis">{t('auth.crisisLink')}</Link>
      </p>
    </Page>
  )
}
