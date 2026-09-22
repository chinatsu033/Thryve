import { useNavigate } from 'react-router-dom'
import { Button, Card, Page } from '../components/ui'
import { useLocale } from '../context/LocaleContext'
import { CRISIS_BY_REGION, type CrisisLine } from '../lib/crisisResources'

function TelLink({
  href,
  label,
  hint,
  urgent,
}: {
  href: string
  label: string
  hint: string
  urgent?: boolean
}) {
  return (
    <a
      href={href}
      className={`crisis-tel ${urgent ? 'crisis-tel-urgent' : 'crisis-tel-calm'}`}
    >
      <span className="crisis-tel-label">{label}</span>
      {hint ? <span className="crisis-tel-hint">{hint}</span> : null}
    </a>
  )
}

function lineLabel(
  line: CrisisLine,
  t: (key: string, vars?: Record<string, string>) => string,
) {
  return t(line.labelKey) !== line.labelKey ? t(line.labelKey) : line.labelFallback
}

function lineHint(
  line: CrisisLine,
  t: (key: string, vars?: Record<string, string>) => string,
) {
  if (!line.hintKey) return line.hintFallback ?? ''
  const translated = t(line.hintKey)
  return translated !== line.hintKey ? translated : (line.hintFallback ?? '')
}

export function CrisisHelpPage() {
  const { region, t, regionDisplayName } = useLocale()
  const navigate = useNavigate()
  const bundle = CRISIS_BY_REGION[region]
  const regionName = regionDisplayName(region)

  const psychLead =
    region === 'cn' ? t('crisis.cn.psychLead') : t('crisis.psychLead')

  return (
    <Page title={t('crisis.title')} sub={t('crisis.sub', { region: regionName })}>
      <Card className="crisis-region-switch">
        <p style={{ margin: '0 0 10px' }}>{t('crisis.currentRegion', { region: regionName })}</p>
        <Button
          variant="ghost"
          block
          onClick={() => navigate('/onboarding/region?from=crisis')}
        >
          {t('crisis.changeRegion')}
        </Button>
      </Card>

      <Card className="crisis-urgent-card">
        <h3 className="card-title" style={{ color: 'var(--color-danger)' }}>
          {t('crisis.urgentTitle')}
        </h3>
        <p className="crisis-lead">{t('crisis.urgentLead')}</p>
        <div className="crisis-tel-stack">
          {bundle.emergency.map((line) => (
            <TelLink
              key={line.href + line.labelKey}
              href={line.href}
              label={lineLabel(line, t)}
              hint={lineHint(line, t)}
              urgent
            />
          ))}
        </div>
      </Card>

      <Card title={t('crisis.psychTitle')}>
        <p className="crisis-lead">{psychLead}</p>
        <div className="crisis-tel-stack">
          {bundle.psych.map((line) => (
            <TelLink
              key={line.href + line.labelKey}
              href={line.href}
              label={lineLabel(line, t)}
              hint={lineHint(line, t)}
            />
          ))}
        </div>
        {bundle.noteKeys.length > 0 ? (
          <ul className="crisis-notes">
            {bundle.noteKeys.map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ul>
        ) : null}
      </Card>

      <Card title={t('crisis.tipsTitle')}>
        <ul className="crisis-tips">
          <li>{t('crisis.tip1')}</li>
          <li>{t('crisis.tip2')}</li>
          <li>{t('crisis.tip3')}</li>
          <li>{t('crisis.tip4')}</li>
        </ul>
      </Card>

      <div className="disclaimer crisis-disclaimer" role="note">
        <p style={{ margin: 0 }}>{t('crisis.disclaimer')}</p>
        {bundle.refUrl ? (
          <p style={{ margin: '10px 0 0' }}>
            <a href={bundle.refUrl} target="_blank" rel="noopener noreferrer">
              {t(bundle.refLabelKey ?? 'crisis.cn.ref')}
            </a>
          </p>
        ) : null}
      </div>
    </Page>
  )
}
