import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Disclaimer, Field, Page } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { generateSalt, hashPassword, uid } from '../lib/crypto'
import { deleteProfileData, exportProfile, importProfile } from '../lib/db'
import {
  DEFAULT_THEME,
  THEME_PRESETS,
  type MedicalHistory,
  type ProfileExport,
  type ThemeConfig,
} from '../types'

export function SettingsPage() {
  const { profile, setTheme, setMedicalHistory, logout, refreshProfiles } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  const [mh, setMh] = useState<MedicalHistory>(
    profile?.medicalHistory ?? {
      diagnoses: '',
      medications: '',
      allergies: '',
      notes: '',
      skipped: false,
    },
  )
  const [custom, setCustom] = useState<ThemeConfig>(profile?.theme ?? DEFAULT_THEME)
  const [importName, setImportName] = useState('')
  const [importPass, setImportPass] = useState('')

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

  const saveMh = async () => {
    await setMedicalHistory({ ...mh, skipped: false })
    setMsg('病史已更新')
  }

  const skipMh = async () => {
    await setMedicalHistory({ ...mh, skipped: true })
    setMsg('已标记为不愿透露病史')
  }

  const doExport = async () => {
    const data = await exportProfile(profile.id, false)
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `psych-journal-${profile.name}-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMsg('导出完成（不含密码哈希）')
  }

  const doImport = async (file: File) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text) as ProfileExport
      if (data.version !== 1) throw new Error('不支持的导出版本')
      const name = importName.trim() || `${data.profile.name || '导入'}-${Date.now().toString(36).slice(-4)}`
      const pass = importPass || uid().slice(0, 8)
      const salt = await generateSalt()
      const passwordHash = await hashPassword(pass, salt)
      await importProfile(data, { newId: uid(), name, passwordHash, salt })
      await refreshProfiles()
      setMsg(`导入成功：档案「${name}」，密码为你设置的导入密码（若未填则为随机）。请退出后用新档案登录。`)
      setImportName('')
      setImportPass('')
    } catch (e) {
      setMsg(`导入失败：${e instanceof Error ? e.message : '未知错误'}`)
    }
  }

  const doLogout = async () => {
    await logout()
    navigate('/auth', { replace: true })
  }

  const doDelete = async () => {
    if (!confirm(`确定永久删除档案「${profile.name}」及全部本地数据？此操作不可恢复。`)) return
    if (!confirm('再次确认：将删除情绪、睡眠、饮食、发作与附件数据。')) return
    await deleteProfileData(profile.id)
    await logout()
    await refreshProfiles()
    navigate('/auth', { replace: true })
  }

  return (
    <Page title="设置" sub="主题、病史、导出导入与隐私。">
      <Disclaimer />
      {msg ? (
        <Card>
          <p style={{ margin: 0 }}>{msg}</p>
        </Card>
      ) : null}

      <Card title="主题（按档案保存）">
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

      <Card title="病史（可随时修改）">
        <Field label="既往诊断">
          <textarea
            value={mh.diagnoses}
            onChange={(e) => setMh({ ...mh, diagnoses: e.target.value })}
          />
        </Field>
        <Field label="当前用药">
          <textarea
            value={mh.medications}
            onChange={(e) => setMh({ ...mh, medications: e.target.value })}
          />
        </Field>
        <Field label="过敏史">
          <input value={mh.allergies} onChange={(e) => setMh({ ...mh, allergies: e.target.value })} />
        </Field>
        <Field label="其他备注">
          <textarea value={mh.notes} onChange={(e) => setMh({ ...mh, notes: e.target.value })} />
        </Field>
        <div className="row">
          <Button onClick={() => void saveMh()}>保存病史</Button>
          <Button variant="ghost" onClick={() => void skipMh()}>
            我不愿意向其他人透露
          </Button>
        </div>
        {profile.medicalHistory.skipped ? (
          <p className="hint" style={{ marginTop: 10 }}>
            当前状态：已选择不披露病史。
          </p>
        ) : null}
      </Card>

      <Card title="数据导出 / 导入">
        <p className="hint">导出为 JSON，可备份或迁移到另一台设备的新档案。不含密码。</p>
        <Button onClick={() => void doExport()}>导出当前档案</Button>
        <div style={{ height: 16 }} />
        <Field label="导入为新档案名称">
          <input
            value={importName}
            onChange={(e) => setImportName(e.target.value)}
            placeholder="留空则自动生成"
          />
        </Field>
        <Field label="新档案密码" hint="导入后用此密码登录新档案">
          <input
            type="password"
            value={importPass}
            onChange={(e) => setImportPass(e.target.value)}
            placeholder="至少 4 位，留空则随机"
          />
        </Field>
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
          选择 JSON 导入
        </Button>
      </Card>

      <Card title="账户">
        <p>
          当前档案：<strong>{profile.name}</strong>
        </p>
        <div className="row">
          <Button variant="ghost" onClick={() => void doLogout()}>
            退出登录
          </Button>
          <Button variant="danger" onClick={() => void doDelete()}>
            删除本档案
          </Button>
        </div>
      </Card>

      <Card title="隐私说明">
        <ul className="summary-bullets">
          <li>所有数据仅存储在本浏览器 IndexedDB，不会上传到任何服务器。</li>
          <li>密码使用 Web Crypto PBKDF2 哈希，本地校验。</li>
          <li>清除浏览器数据或更换设备会导致数据丢失，请定期导出备份。</li>
          <li>本工具不能替代专业医疗诊断或治疗。</li>
        </ul>
      </Card>
    </Page>
  )
}
