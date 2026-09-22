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
  type ThemePresetId,
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
      setMsg(t('settings.msg.inviteLoadFail', { error: e instanceof Error ? e.message : t('common.unknownError') }))
    }
  }, [profile])

  useEffect(() => {
    if (profile) void refreshInviteCodes()
  }, [profile, refreshInviteCodes])

  if (!profile) return null

  const applyPreset = async (id: ThemePresetId) => {
    const theme = THEME_PRESETS[id]
    if (!theme) return
    setCustom(theme)
    await setTheme(theme)
    setMsg(t('settings.msg.themeApplied', { name: t(`theme.${id}`) }))
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
        t('settings.msg.imported', {
          emotions: String(stats.emotions),
          sleeps: String(stats.sleeps),
          eatings: String(stats.eatings),
        }),
      )
    } catch (e) {
      setMsg(t('settings.msg.importFail', { error: e instanceof Error ? e.message : t('common.unknownError') }))
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
      setMsg(t('settings.msg.inviteCreated', { code: row.code }))
    } catch (e) {
      setMsg(t('settings.msg.inviteFail', { error: e instanceof Error ? e.message : t('common.unknownError') }))
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
      setMsg(next ? t('settings.msg.inviteEnabled', { code: row.code }) : t('settings.msg.inviteDisabled', { code: row.code }))
    } catch (e) {
      setMsg(t('settings.msg.updateFail', { error: e instanceof Error ? e.message : t('common.unknownError') }))
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
        <Field label={t('settings.email')}>
          <input value={profile.email} disabled readOnly />
        </Field>
        <Field label={t('settings.displayName')}>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </Field>
        <Button onClick={() => void saveDisplayName()}>{t('settings.saveName')}</Button>
      </Card>

      <Card title={t('settings.theme')}>
        <div className="preset-grid">
          {Object.entries(THEME_PRESETS).map(([id, theme]) => {
            const active =
              profile.theme.primary === theme.primary &&
              profile.theme.accent === theme.accent &&
              profile.theme.surface === theme.surface
            return (
              <button
                key={id}
                type="button"
                className={`preset-card ${active ? 'active' : ''}`}
                onClick={() => void applyPreset(id as ThemePresetId)}
              >
                <div className="swatches">
                  <span style={{ background: theme.primary }} />
                  <span style={{ background: theme.accent }} />
                  <span style={{ background: theme.surface }} />
                </div>
                {t(`theme.${id}`)}
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
        <Button onClick={() => void saveCustomTheme()}>{t('settings.theme.saveCustom')}</Button>
      </Card>

      <Card title={t('settings.data')}>
        <p className="hint">{t('settings.data.hint')}</p>
        <Button onClick={() => void doExport()}>{t('settings.data.export')}</Button>
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
          {t('settings.data.import')}
        </Button>
      </Card>


      <Card title={t('settings.notif')}>
        <p className="hint">
          {t('settings.notif.hint')}
        </p>
        <p style={{ margin: '0 0 12px' }}>
          {t('settings.notif.perm')}
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
        <Button onClick={() => void doRequestNotif()}>{t('settings.notif.request')}</Button>
      </Card>

      <Card title={t('settings.invite')}>
        <p className="hint">{t('settings.invite.hint')}</p>
        <Button disabled={inviteBusy} onClick={() => void doGenerateInvite()}>
          {inviteBusy ? t('common.processing') : t('settings.invite.generate')}
        </Button>
        <div style={{ height: 12 }} />
        {inviteCodes.length === 0 ? (
          <p className="hint" style={{ margin: 0 }}>
            {t('settings.invite.empty')}
          </p>
        ) : (
          <ul className="summary-bullets" style={{ margin: 0 }}>
            {inviteCodes.map((row) => (
              <li key={row.id} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <strong style={{ fontFamily: 'ui-monospace, monospace', letterSpacing: '0.04em' }}>
                  {row.code}
                </strong>
                <span className="hint">{t('settings.invite.uses', { uses: formatUses(row) })}</span>
                <span className="hint">{row.enabled ? t('common.enabled') : t('common.disabled')}</span>
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
          {t('settings.account.user')}<strong>{profile.name}</strong>
          {profile.email ? (
            <>
              {' '}
              <span className="hint">({profile.email})</span>
            </>
          ) : null}
        </p>
        <div className="row">
          <Button variant="ghost" onClick={() => void doLogout()}>
            {t('settings.logout')}
          </Button>
          <Button variant="danger" onClick={() => void doClearCloud()}>
            {t('settings.clearCloud')}
          </Button>
        </div>
      </Card>

      <Card title={t('settings.about')}>
        <div className="settings-version">
          <div className="settings-version-badge">{APP_VERSION_LABEL}</div>
          <p className="hint" style={{ margin: '8px 0 12px' }}>
            {t('settings.changelog')}
          </p>
          <ul className="summary-bullets settings-changelog">
            {(APP_CHANGELOG[0]?.notes ?? []).map((note) => (
              <li key={note}>{note.startsWith('changelog.') ? t(note) : note}</li>
            ))}
          </ul>
        </div>
      </Card>

      <Card title={t('settings.privacy')}>
        <ul className="summary-bullets">
          <li>{t('settings.privacy.1')}</li>
          <li>{t('settings.privacy.2')}</li>
          <li>{t('settings.privacy.3')}</li>
          <li>{t('settings.privacy.4')}</li>
        </ul>
      </Card>
    </Page>
  )
}
