import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Turnstile } from '../components/Turnstile'
import { Button, Card, Disclaimer, Field, Page } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'

const TURNSTILE_SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined)?.trim() || ''

export function AuthPage() {
  const { t } = useLocale()
  const { profile, login, register, ready, configured } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileReset, setTurnstileReset] = useState(0)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  if (!ready) return <div className="loading">{t('common.loading')}</div>
  if (profile) {
    return <Navigate to="/" replace />
  }

  const switchMode = (next: 'login' | 'register') => {
    setMode(next)
    setError('')
    setInfo('')
    setTurnstileToken(null)
    if (next === 'register') setTurnstileReset((n) => n + 1)
  }

  const submit = async () => {
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

        <Field label={t('auth.password')} hint={mode === 'register' ? t('auth.password.hint') : undefined}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            placeholder={t('auth.password.ph')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void submit()
            }}
          />
        </Field>

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

        {error ? <p className="error-text">{error}</p> : null}
        {info ? <p className="hint">{info}</p> : null}

        <Button block disabled={busy || !configured} onClick={() => void submit()}>
          {busy ? t('common.pleaseWait') : mode === 'login' ? t('auth.login') : t('auth.registerEnter')}
        </Button>
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
