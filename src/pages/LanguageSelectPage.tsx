import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Card, Page } from '../components/ui'
import { useLocale } from '../context/LocaleContext'
import { LANGUAGE_IDS, LANGUAGE_LABELS, type LanguageId } from '../lib/locale'

export function LanguageSelectPage() {
  const { language, setLanguage, markSetupDone, t, setupDone } = useLocale()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const fromSettings = params.get('from') === 'settings'

  const [selected, setSelected] = useState<LanguageId>(language)

  const onFinish = () => {
    setLanguage(selected)
    if (!setupDone || !fromSettings) {
      markSetupDone()
    }
    if (fromSettings) {
      navigate('/settings', { replace: true })
      return
    }
    navigate('/auth', { replace: true })
  }

  return (
    <Page title={t('onboarding.language.title')} sub={t('onboarding.language.sub')}>
      <Card className="onboarding-card language-select-card">
        <div className="language-option-list">
          {LANGUAGE_IDS.map((id) => {
            const active = id === selected
            return (
              <button
                key={id}
                type="button"
                className={`language-option${active ? ' is-selected' : ''}`}
                onClick={() => setSelected(id)}
                aria-pressed={active}
              >
                {LANGUAGE_LABELS[id]}
              </button>
            )
          })}
        </div>
        <div style={{ height: 16 }} />
        <Button block onClick={onFinish}>
          {t('onboarding.language.finish')}
        </Button>
      </Card>
    </Page>
  )
}
