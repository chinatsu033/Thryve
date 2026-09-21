import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Button, Card, Disclaimer, Field, Page } from '../components/ui'
import { useAuth } from '../context/AuthContext'

export function AuthPage() {
  const { profile, profiles, login, register, ready } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>(profiles.length ? 'login' : 'register')
  const [name, setName] = useState(profiles[0]?.name ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!ready) return <div className="loading">加载中…</div>
  if (profile) {
    return <Navigate to="/" replace />
  }

  const submit = async () => {
    setError('')
    setBusy(true)
    try {
      const res = mode === 'login' ? await login(name, password) : await register(name, password)
      if (!res.ok) setError(res.error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Page back={false} title="心理状态记录" sub="本地多档案 · 隐私优先 · 就医沟通助手">
      <Disclaimer />
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
            新建档案
          </button>
        </div>

        {mode === 'login' && profiles.length > 0 ? (
          <Field label="选择档案">
            <select value={name} onChange={(e) => setName(e.target.value)} aria-label="选择档案">
              <option value="">请选择…</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <Field label="档案名称" hint="仅保存在本设备，可随意取名">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="username"
              placeholder="例如：小明"
            />
          </Field>
        )}

        <Field label="密码" hint="使用 Web Crypto 本地哈希，不会上传">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            placeholder="至少 4 位"
            onKeyDown={(e) => {
              if (e.key === 'Enter') void submit()
            }}
          />
        </Field>

        {error ? <p className="error-text">{error}</p> : null}

        <Button block disabled={busy} onClick={() => void submit()}>
          {busy ? '请稍候…' : mode === 'login' ? '进入' : '创建并进入'}
        </Button>
      </Card>
      <p className="hint" style={{ marginTop: 16, textAlign: 'center' }}>
        数据仅存于本机浏览器 IndexedDB，换设备需自行导出导入。
      </p>
    </Page>
  )
}
