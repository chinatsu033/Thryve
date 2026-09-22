import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Button, Card, Disclaimer, Field, Page } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'

export function AuthPage() {
  const { t } = useLocale()
  const { profile, login, register, ready, configured } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  if (!ready) return <div className="loading">加载中…</div>
  if (profile) {
    return <Navigate to="/" replace />
  }

  const submit = async () => {
    setError('')
    setInfo('')
    setBusy(true)
    try {
      const res =
        mode === 'login'
          ? await login(email, password)
          : await register(email, password, displayName, inviteCode)
      if (!res.ok) {
        // Registration may succeed pending email confirm — show as info if message hints
        if (res.error.includes('注册成功') || res.error.includes('邮箱验证')) {
          setInfo(res.error)
        } else {
          setError(res.error)
        }
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
            尚未配置云端环境变量（VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY）。部署后请在 Cloudflare
            Pages 中设置。
          </p>
        </Card>
      ) : null}
      <Card>
        <div className="chip-row">
          <button
            type="button"
            className={`chip ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            登录
          </button>
          <button
            type="button"
            className={`chip ${mode === 'register' ? 'active' : ''}`}
            onClick={() => setMode('register')}
          >
            注册
          </button>
        </div>

        {mode === 'register' ? (
          <>
            <Field label="显示名称" hint={t('auth.displayName.hint')}>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="nickname"
                placeholder={t('auth.displayName.ph')}
              />
            </Field>
            <Field label="邀请码" hint={t('auth.invite.hint')}>
              <input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                autoComplete="off"
                placeholder={t('auth.invite.ph')}
                spellCheck={false}
              />
            </Field>
          </>
        ) : null}

        <Field label="邮箱">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
          />
        </Field>

        <Field label={t('auth.password')} hint={mode === 'register' ? '至少 6 位' : undefined}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            placeholder="至少 6 位"
            onKeyDown={(e) => {
              if (e.key === 'Enter') void submit()
            }}
          />
        </Field>

        {error ? <p className="error-text">{error}</p> : null}
        {info ? <p className="hint">{info}</p> : null}

        <Button block disabled={busy || !configured} onClick={() => void submit()}>
          {busy ? t('common.pleaseWait') : mode === 'login' ? t('auth.login') : t('auth.registerEnter')}
        </Button>
      </Card>
      <p className="hint" style={{ marginTop: 16, textAlign: 'center' }}>
        登录后数据同步至云端（按账户隔离）。换设备用同一邮箱即可继续记录。
      </p>
      <p className="crisis-auth-link">
        <Link to="/help/crisis">遇到紧急情况？获取心理援助</Link>
      </p>
    </Page>
  )
}
