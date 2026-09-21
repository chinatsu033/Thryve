import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button, Card, Disclaimer, Field, Page } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import type { MedicalHistory } from '../types'

export function OnboardingPage() {
  const { profile, setMedicalHistory, completeOnboarding } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<MedicalHistory>({
    diagnoses: '',
    medications: '',
    allergies: '',
    notes: '',
    skipped: false,
  })
  const [busy, setBusy] = useState(false)

  if (!profile) return <Navigate to="/auth" replace />
  if (profile.onboardingDone) return <Navigate to="/" replace />

  const save = async (skipped: boolean) => {
    setBusy(true)
    try {
      await setMedicalHistory({ ...form, skipped })
      await completeOnboarding()
      navigate('/', { replace: true })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Page back={false} title="欢迎使用" sub={`你好，${profile.name}。可选择性填写病史，便于日后就医沟通。`}>
      <Disclaimer />
      <Card title="可选病史（仅保存在本机）">
        <Field label="既往诊断">
          <textarea
            value={form.diagnoses}
            onChange={(e) => setForm({ ...form, diagnoses: e.target.value })}
            placeholder="如有诊断可填写，没有可留空"
          />
        </Field>
        <Field label="当前用药">
          <textarea
            value={form.medications}
            onChange={(e) => setForm({ ...form, medications: e.target.value })}
            placeholder="药名、剂量等"
          />
        </Field>
        <Field label="过敏史">
          <input
            value={form.allergies}
            onChange={(e) => setForm({ ...form, allergies: e.target.value })}
            placeholder="药物或食物过敏"
          />
        </Field>
        <Field label="其他备注">
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="家庭史、重要生活事件等"
          />
        </Field>
        <div className="row">
          <Button block disabled={busy} onClick={() => void save(false)}>
            保存并继续
          </Button>
        </div>
        <div style={{ height: 10 }} />
        <Button
          block
          variant="ghost"
          disabled={busy}
          onClick={() => void save(true)}
        >
          我不愿意向其他人透露
        </Button>
      </Card>
    </Page>
  )
}
