import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Disclaimer, Field, Page } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { deleteAllUserData, exportProfile, importIntoCurrentUser } from '../lib/db'
import {
  DEFAULT_THEME,
  THEME_PRESETS,
  type ProfileExport,
  type ThemeConfig,
} from '../types'

export function SettingsPage() {
  const { profile, setTheme, logout, updateProfile } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  const [custom, setCustom] = useState<ThemeConfig>(profile?.theme ?? DEFAULT_THEME)
  const [displayName, setDisplayName] = useState(profile?.name ?? '')

  if (!profile) return null

  const applyPreset = async (name: string) => {
    const t = THEME_PRESETS[name]
    if (!t) return
    setCustom(t)
    await setTheme(t)
    setMsg(`已应用主题「${name}」`)
  }

  const saveCustomTheme = async () => {
    await setTheme(custom)
    setMsg('自定义主题已保存')
  }

  const saveDisplayName = async () => {
    const name = displayName.trim()
    if (!name) {
      setMsg('显示名称不能为空')
      return
    }
    await updateProfile({ name })
    setMsg('显示名称已更新')
  }

  const doExport = async () => {
    const data = await exportProfile(profile.id, profile.email)
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `thryve-${profile.name}-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMsg('已从云端导出 JSON 备份')
  }

  const doImport = async (file: File) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text) as ProfileExport
      if (data.version !== 1) throw new Error('不支持的导出版本')
      const stats = await importIntoCurrentUser(profile.id, data)
      setMsg(
        `已导入到当前账户：情绪 ${stats.emotions}、睡眠 ${stats.sleeps}、饮食 ${stats.eatings} 条`,
      )
    } catch (e) {
      setMsg(`导入失败：${e instanceof Error ? e.message : '未知错误'}`)
    }
  }

  const doLogout = async () => {
    await logout()
    navigate('/auth', { replace: true })
  }

  const doClearCloud = async () => {
    if (!confirm('确定清空当前账户的云端情绪 / 睡眠 / 饮食记录？此操作不可恢复。')) return
    if (!confirm('再次确认：将删除云端打卡数据（不会删除登录账号）。')) return
    await deleteAllUserData(profile.id)
    setMsg('云端打卡数据已清空')
  }

  return (
    <Page title="设置" sub="主题、导出与账户。">
      <Disclaimer />
      {msg ? (
        <Card>
          <p style={{ margin: 0 }}>{msg}</p>
        </Card>
      ) : null}

      <Card title="个人资料">
        <Field label="邮箱">
          <input value={profile.email} disabled readOnly />
        </Field>
        <Field label="显示名称">
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </Field>
        <Button onClick={() => void saveDisplayName()}>保存名称</Button>
      </Card>

      <Card title="主题（按账户保存）">
        <div className="preset-grid">
          {Object.entries(THEME_PRESETS).map(([name, t]) => {
            const active =
              profile.theme.primary === t.primary &&
              profile.theme.accent === t.accent &&
              profile.theme.surface === t.surface
            return (
              <button
                key={name}
                type="button"
                className={`preset-card ${active ? 'active' : ''}`}
                onClick={() => void applyPreset(name)}
              >
                <div className="swatches">
                  <span style={{ background: t.primary }} />
                  <span style={{ background: t.accent }} />
                  <span style={{ background: t.surface }} />
                </div>
                {name}
              </button>
            )
          })}
        </div>
        <div style={{ height: 14 }} />
        <div className="row">
          <Field label="主色 primary">
            <input
              type="color"
              value={custom.primary}
              onChange={(e) => setCustom({ ...custom, primary: e.target.value })}
            />
          </Field>
          <Field label="强调色 accent">
            <input
              type="color"
              value={custom.accent}
              onChange={(e) => setCustom({ ...custom, accent: e.target.value })}
            />
          </Field>
          <Field label="背景 surface">
            <input
              type="color"
              value={custom.surface}
              onChange={(e) => setCustom({ ...custom, surface: e.target.value })}
            />
          </Field>
        </div>
        <Button onClick={() => void saveCustomTheme()}>保存自定义主题</Button>
      </Card>

      <Card title="数据导出 / 导入">
        <p className="hint">从云端导出 JSON 备份；导入会合并到当前登录账户。</p>
        <Button onClick={() => void doExport()}>导出云端数据</Button>
        <div style={{ height: 16 }} />
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void doImport(f)
            e.target.value = ''
          }}
        />
        <Button variant="accent" onClick={() => fileRef.current?.click()}>
          选择 JSON 导入到本账户
        </Button>
      </Card>

      <Card title="账户">
        <p>
          当前用户：<strong>{profile.name}</strong>
          {profile.email ? (
            <>
              {' '}
              <span className="hint">({profile.email})</span>
            </>
          ) : null}
        </p>
        <div className="row">
          <Button variant="ghost" onClick={() => void doLogout()}>
            退出登录
          </Button>
          <Button variant="danger" onClick={() => void doClearCloud()}>
            清空云端打卡
          </Button>
        </div>
      </Card>

      <Card title="隐私说明">
        <ul className="summary-bullets">
          <li>登录后数据保存在 Supabase 云端，按账户（auth.uid）隔离，启用 RLS。</li>
          <li>请使用自己的邮箱与密码；不要在公共电脑保存登录态。</li>
          <li>附件上传（PDF/图片）云端存储尚未开放（MVP）。</li>
          <li>本工具不能替代专业医疗诊断或治疗。</li>
        </ul>
      </Card>
    </Page>
  )
}
