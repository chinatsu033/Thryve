import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Disclaimer, Field, Page } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'
import { LANGUAGE_LABELS } from '../lib/locale'
import { deleteAllUserData, exportProfile, importIntoCurrentUser } from '../lib/db'
import {
  createInviteCode,
  listMyInviteCodes,
  setInviteCodeEnabled,
  type InviteCodeRow,
} from '../lib/invite'
import {
  currentNotificationPermission,
  requestNotificationPermission,
} from '../lib/medReminders'
import { APP_CHANGELOG, APP_VERSION_LABEL } from '../lib/version'
import {
  DEFAULT_THEME,
  THEME_PRESETS,
  type ProfileExport,
  type ThemeConfig,
} from '../types'

export function SettingsPage() {
  const { profile, setTheme, logout, updateProfile } = useAuth()
  const navigate = useNavigate()
  const { region, language, t: tr, regionDisplayName, t } = useLocale()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  const [custom, setCustom] = useState<ThemeConfig>(profile?.theme ?? DEFAULT_THEME)
  const [displayName, setDisplayName] = useState(profile?.name ?? '')
  const [inviteCodes, setInviteCodes] = useState<InviteCodeRow[]>([])
  const [inviteBusy, setInviteBusy] = useState(false)
  const [notifPerm, setNotifPerm] = useState(() => currentNotificationPermission())

  const refreshInviteCodes = useCallback(async () => {
    if (!profile) return
    try {
      const rows = await listMyInviteCodes(profile.id)
      setInviteCodes(rows)
    } catch (e) {
      console.error(e)
      setMsg(`加载邀请码失败：${e instanceof Error ? e.message : t('common.unknownError')}`)
    }
  }, [profile])

  useEffect(() => {
    if (profile) void refreshInviteCodes()
  }, [profile, refreshInviteCodes])

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
    setMsg(t('settings.msg.themeSaved'))
  }

  const saveDisplayName = async () => {
    const name = displayName.trim()
    if (!name) {
      setMsg(t('settings.msg.nameEmpty'))
      return
    }
    await updateProfile({ name })
    setMsg(t('settings.msg.nameSaved'))
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
    setMsg(t('settings.msg.exported'))
  }

  const doImport = async (file: File) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text) as ProfileExport
      if (data.version !== 1) throw new Error(t('settings.msg.importBadVersion'))
      const stats = await importIntoCurrentUser(profile.id, data)
      setMsg(
        `已导入到当前账户：情绪 ${stats.emotions}、睡眠 ${stats.sleeps}、饮食 ${stats.eatings} 条`,
      )
    } catch (e) {
      setMsg(`导入失败：${e instanceof Error ? e.message : t('common.unknownError')}`)
    }
  }

  const doLogout = async () => {
    await logout()
    navigate('/auth', { replace: true })
  }

  const doClearCloud = async () => {
    if (!confirm(t('settings.msg.clearConfirm1'))) return
    if (!confirm(t('settings.msg.clearConfirm2'))) return
    await deleteAllUserData(profile.id)
    setMsg(t('settings.msg.cleared'))
  }

  const doGenerateInvite = async () => {
    setInviteBusy(true)
    try {
      const row = await createInviteCode({ userId: profile.id, maxUses: 10 })
      setInviteCodes((prev) => [row, ...prev])
      setMsg(`已生成邀请码 ${row.code}（最多 10 次）`)
    } catch (e) {
      setMsg(`生成失败：${e instanceof Error ? e.message : t('common.unknownError')}`)
    } finally {
      setInviteBusy(false)
    }
  }

  const doToggleInvite = async (row: InviteCodeRow) => {
    setInviteBusy(true)
    try {
      const next = !row.enabled
      await setInviteCodeEnabled(row.id, next)
      setInviteCodes((prev) => prev.map((r) => (r.id === row.id ? { ...r, enabled: next } : r)))
      setMsg(next ? `已启用 ${row.code}` : `已停用 ${row.code}`)
    } catch (e) {
      setMsg(`更新失败：${e instanceof Error ? e.message : t('common.unknownError')}`)
    } finally {
      setInviteBusy(false)
    }
  }


  const doRequestNotif = async () => {
    const p = await requestNotificationPermission()
    setNotifPerm(p)
    if (p === 'granted') setMsg(t('settings.msg.notifGranted'))
    else if (p === 'denied') setMsg(t('settings.msg.notifDenied'))
    else if (p === 'unsupported') setMsg(t('settings.msg.notifUnsupported'))
    else setMsg(t('settings.msg.notifDefault'))
  }

  const formatUses = (row: InviteCodeRow) => {
    const max = row.max_uses == null ? '∞' : String(row.max_uses)
    return `${row.use_count} / ${max}`
  }

  return (
    <Page title={t('brand.settings')} sub={t('settings.sub')}>
      <Disclaimer />
      {msg ? (
        <Card>
          <p style={{ margin: 0 }}>{msg}</p>
        </Card>
      ) : null}

      <Card className="crisis-settings-card" title={tr('crisis.title')}>
        <p style={{ marginTop: 0 }}>{tr('settings.crisis.blurb')}</p>
        <Button
          variant="danger"
          block
          onClick={() => navigate('/help/crisis')}
        >
          {tr('settings.crisis.open')}
        </Button>
      </Card>

      <Card title={tr('settings.locale.title')}>
        <p style={{ margin: '0 0 8px' }}>
          {tr('settings.locale.region')}：<strong>{regionDisplayName(region)}</strong>
        </p>
        <Button
          block
          variant="ghost"
          onClick={() => navigate('/onboarding/region?from=settings')}
        >
          {tr('settings.locale.changeRegion')}
        </Button>
        <div style={{ height: 12 }} />
        <p style={{ margin: '0 0 8px' }}>
          {tr('settings.locale.language')}：<strong>{LANGUAGE_LABELS[language]}</strong>
        </p>
        <Button
          block
          variant="ghost"
          onClick={() => navigate('/onboarding/language?from=settings')}
        >
          {tr('settings.locale.changeLanguage')}
        </Button>
      </Card>

      <Card title={t('settings.profile')}>
        <Field label="邮箱">
          <input value={profile.email} disabled readOnly />
        </Field>
        <Field label="显示名称">
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </Field>
        <Button onClick={() => void saveDisplayName()}>保存名称</Button>
      </Card>

      <Card title={t('settings.theme')}>
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
          <Field label={t('settings.theme.primary')}>
            <input
              type="color"
              value={custom.primary}
              onChange={(e) => setCustom({ ...custom, primary: e.target.value })}
            />
          </Field>
          <Field label={t('settings.theme.accent')}>
            <input
              type="color"
              value={custom.accent}
              onChange={(e) => setCustom({ ...custom, accent: e.target.value })}
            />
          </Field>
          <Field label={t('settings.theme.surface')}>
            <input
              type="color"
              value={custom.surface}
              onChange={(e) => setCustom({ ...custom, surface: e.target.value })}
            />
          </Field>
        </div>
        <Button onClick={() => void saveCustomTheme()}>保存自定义主题</Button>
      </Card>

      <Card title={t('settings.data')}>
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


      <Card title={t('settings.notif')}>
        <p className="hint">
          开启后，在本标签页保持打开（或添加到主屏幕）时，会对今日未打卡的服药时间弹出提醒。标签关闭后可能不准；无服务器推送（MVP）。
        </p>
        <p style={{ margin: '0 0 12px' }}>
          当前权限：
          <strong>
            {notifPerm === 'granted'
              ? t('settings.notif.granted')
              : notifPerm === 'denied'
                ? t('settings.notif.denied')
                : notifPerm === 'unsupported'
                  ? t('settings.notif.unsupported')
                  : t('settings.notif.default')}
          </strong>
        </p>
        <Button onClick={() => void doRequestNotif()}>请求通知权限</Button>
      </Card>

      <Card title="邀请码">
        <p className="hint">生成邀请码分享给朋友注册。每人仅能看到自己创建的码。</p>
        <Button disabled={inviteBusy} onClick={() => void doGenerateInvite()}>
          {inviteBusy ? t('common.processing') : t('settings.invite.generate')}
        </Button>
        <div style={{ height: 12 }} />
        {inviteCodes.length === 0 ? (
          <p className="hint" style={{ margin: 0 }}>
            暂无自建邀请码
          </p>
        ) : (
          <ul className="summary-bullets" style={{ margin: 0 }}>
            {inviteCodes.map((row) => (
              <li key={row.id} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <strong style={{ fontFamily: 'ui-monospace, monospace', letterSpacing: '0.04em' }}>
                  {row.code}
                </strong>
                <span className="hint">使用 {formatUses(row)}</span>
                <span className="hint">{row.enabled ? t('common.enabled') : '已停用'}</span>
                <Button
                  variant="ghost"
                  disabled={inviteBusy}
                  onClick={() => void doToggleInvite(row)}
                >
                  {row.enabled ? t('common.disable') : t('common.enable')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title={t('settings.account')}>
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

      <Card title={t('settings.about')}>
        <div className="settings-version">
          <div className="settings-version-badge">{APP_VERSION_LABEL}</div>
          <p className="hint" style={{ margin: '8px 0 12px' }}>
            更新说明
          </p>
          <ul className="summary-bullets settings-changelog">
            {(APP_CHANGELOG[0]?.notes ?? []).map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </Card>

      <Card title={t('settings.privacy')}>
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
