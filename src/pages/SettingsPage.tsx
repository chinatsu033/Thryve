import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Disclaimer, Field, Page } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'
import { LANGUAGE_LABELS } from '../lib/locale'
import { deleteAllUserData, exportProfile, importIntoCurrentUser } from '../lib/db'
import {
  currentNotificationPermission,
  requestNotificationPermission,
} from '../lib/medReminders'
import { SECURITY_QUESTION_IDS, questionLabelKey } from '../lib/securityQuestions'
import { APP_CHANGELOG, APP_VERSION_LABEL } from '../lib/version'
import {
  DEFAULT_THEME,
  THEME_PRESETS,
  type ProfileExport,
  type ThemeConfig,
  type ThemePresetId,
} from '../types'

export function SettingsPage() {
  const { profile, session, setTheme, logout, updateProfile } = useAuth()
  const navigate = useNavigate()
  const { region, language, t: tr, regionDisplayName, t } = useLocale()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  const [custom, setCustom] = useState<ThemeConfig>(profile?.theme ?? DEFAULT_THEME)
  const [displayName, setDisplayName] = useState(profile?.name ?? '')
  const [notifPerm, setNotifPerm] = useState(() => currentNotificationPermission())
  const [securityConfigured, setSecurityConfigured] = useState<boolean | null>(null)
  const [secQs, setSecQs] = useState<[string, string, string]>(['', '', ''])
  const [secAs, setSecAs] = useState<[string, string, string]>(['', '', ''])
  const [secBusy, setSecBusy] = useState(false)
  const securityRef = useRef<HTMLDivElement>(null)


  const refreshSecurityStatus = async () => {
    if (!session?.access_token) {
      setSecurityConfigured(null)
      return
    }
    try {
      const res = await fetch('/api/security-questions/status', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = (await res.json().catch(() => ({}))) as { configured?: boolean }
      if (res.ok) setSecurityConfigured(Boolean(data.configured))
      else setSecurityConfigured(null)
    } catch {
      setSecurityConfigured(null)
    }
  }

  useEffect(() => {
    void refreshSecurityStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token])

  const saveSecurityQuestions = async () => {
    setMsg('')
    if (secQs.some((q) => !q) || secAs.some((a) => !a.trim())) {
      setMsg(t('security.err.incomplete'))
      return
    }
    if (new Set(secQs).size !== 3) {
      setMsg(t('security.err.duplicate'))
      return
    }
    if (!session?.access_token) {
      setMsg(t('security.err.saveFailed'))
      return
    }
    setSecBusy(true)
    try {
      const res = await fetch('/api/security-questions/set', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          questions: secQs.map((id, i) => ({ id, answer: secAs[i] })),
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) {
        if (data.error === 'duplicate_question') setMsg(t('security.err.duplicate'))
        else setMsg(t('security.err.saveFailed'))
        return
      }
      setSecAs(['', '', ''])
      setSecurityConfigured(true)
      setMsg(t('security.saved'))
    } catch {
      setMsg(t('security.err.saveFailed'))
    } finally {
      setSecBusy(false)
    }
  }

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

  const doRequestNotif = async () => {
    const p = await requestNotificationPermission()
    setNotifPerm(p)
    if (p === 'granted') setMsg(t('settings.msg.notifGranted'))
    else if (p === 'denied') setMsg(t('settings.msg.notifDenied'))
    else if (p === 'unsupported') setMsg(t('settings.msg.notifUnsupported'))
    else setMsg(t('settings.msg.notifDefault'))
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


      {securityConfigured === false ? (
        <Card className="security-banner-card">
          <p style={{ marginTop: 0, fontWeight: 700 }}>{t('security.banner.title')}</p>
          <p className="hint" style={{ marginTop: 0 }}>
            {t('security.banner.body')}
          </p>
          <Button
            block
            onClick={() => securityRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          >
            {t('security.banner.cta')}
          </Button>
        </Card>
      ) : null}

      <div ref={securityRef}>
        <Card title={t('security.title')}>
          <p className="hint" style={{ marginTop: 0 }}>
            {t('security.sub')}
          </p>
          {securityConfigured ? (
            <p style={{ margin: '0 0 12px' }}>
              <strong>{t('security.configured')}</strong>
            </p>
          ) : null}
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <Field label={t('security.pick', { n: String(i + 1) })}>
                <select
                  value={secQs[i]}
                  onChange={(e) => {
                    const next: [string, string, string] = [...secQs]
                    next[i] = e.target.value
                    setSecQs(next)
                  }}
                >
                  <option value="">{t('common.unset')}</option>
                  {SECURITY_QUESTION_IDS.map((id) => (
                    <option
                      key={id}
                      value={id}
                      disabled={secQs.includes(id) && secQs[i] !== id}
                    >
                      {t(questionLabelKey(id))}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('security.answer', { n: String(i + 1) })} hint={i === 0 ? t('security.answer.hint') : undefined}>
                <input
                  type="text"
                  value={secAs[i]}
                  onChange={(e) => {
                    const next: [string, string, string] = [...secAs]
                    next[i] = e.target.value
                    setSecAs(next)
                  }}
                  autoComplete="off"
                />
              </Field>
            </div>
          ))}
          <Button disabled={secBusy} onClick={() => void saveSecurityQuestions()}>
            {secBusy ? t('common.pleaseWait') : t('security.save')}
          </Button>
        </Card>
      </div>

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
