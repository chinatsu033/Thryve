import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { RegionFocusMap } from '../components/RegionFocusMap'
import { Button, Card, Page } from '../components/ui'
import { WheelPicker } from '../components/WheelPicker'
import { useLocale } from '../context/LocaleContext'
import { REGION_IDS, regionLabel, type RegionId } from '../lib/locale'

export function RegionSelectPage() {
  const { region, setRegion, language, t, setupDone } = useLocale()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const fromSettings = params.get('from') === 'settings'
  const fromCrisis = params.get('from') === 'crisis'

  const [index, setIndex] = useState(() => {
    const i = REGION_IDS.indexOf(region)
    return i >= 0 ? i : 0
  })

  const selected = REGION_IDS[index] ?? REGION_IDS[0]

  const formatLabel = useMemo(
    () => (v: number) => regionLabel(REGION_IDS[v] as RegionId, language),
    [language],
  )

  const onContinue = () => {
    setRegion(selected)
    if (fromSettings) {
      navigate('/settings', { replace: true })
      return
    }
    if (fromCrisis) {
      navigate('/help/crisis', { replace: true })
      return
    }
    if (setupDone) {
      navigate('/', { replace: true })
      return
    }
    navigate('/onboarding/language')
  }

  return (
    <Page title={t('onboarding.region.title')} sub={t('onboarding.region.sub')}>
      <Card className="onboarding-card region-select-card">
        <RegionFocusMap region={selected} />
        <p className="hint region-map-hint">{t('onboarding.region.mapHint')}</p>
        <div className="region-wheel-wrap">
          <WheelPicker
            min={0}
            max={REGION_IDS.length - 1}
            value={index}
            onChange={setIndex}
            formatLabel={formatLabel}
            visibleCount={5}
            itemHeight={48}
            className="region-wheel"
            aria-label={t('onboarding.region.title')}
          />
        </div>
        <div style={{ height: 16 }} />
        <Button block onClick={onContinue}>
          {fromSettings || fromCrisis || setupDone
            ? t('onboarding.language.finish')
            : t('onboarding.region.continue')}
        </Button>
      </Card>
    </Page>
  )
}
