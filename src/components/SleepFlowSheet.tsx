import { AnimatePresence, motion } from 'framer-motion'
import { backdropFade, sheetEnter, stepFade } from '../lib/motion'
import { useEffect, useState } from 'react'
import { dayPartFromHours,
  formatHm,
  hoursFromHm,
  parseHm,
  sleepBandFromContinuous,  sleepQualityLabelKey } from '../lib/sleep'
import type { SleepEntry } from '../types'
import { AnalogClockPicker } from './AnalogClockPicker'
import { ForestLodgeScene } from './ForestLodgeScene'
import { SeaBoatScene } from './SeaBoatScene'
import { Button } from './ui'
import { useLocale } from '../context/LocaleContext'

type Step = 'date' | 'bed' | 'wake' | 'feel' | 'notes'
type ClockMode = 'hour' | 'minute'

type Props = {
  open: boolean
  onClose: () => void
  onSave: (e: Omit<SleepEntry, 'id' | 'profileId' | 'createdAt'>) => Promise<void>
}

function todayStr() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function SleepFlowSheet({ open, onClose, onSave }: Props) {
  const { t } = useLocale()
  const [step, setStep] = useState<Step>('date')
  const [date, setDate] = useState(todayStr())
  const [bedtime, setBedtime] = useState('23:00')
  const [wakeTime, setWakeTime] = useState('08:00')
  const [feel, setFeel] = useState(4)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)

  const [clockMode, setClockMode] = useState<ClockMode>('hour')
  const [bedH, setBedH] = useState(23)
  const [bedM, setBedM] = useState(0)
  const [wakeH, setWakeH] = useState(8)
  const [wakeM, setWakeM] = useState(0)

  const [nowHours, setNowHours] = useState(() => {
    const d = new Date()
    return d.getHours() + d.getMinutes() / 60
  })
  /** Continuous fractional hours driving lodge sky while clock-dragging. */
  const [liveHours, setLiveHours] = useState(23)

  useEffect(() => {
    if (!open) return
    const tick = () => {
      const d = new Date()
      setNowHours(d.getHours() + d.getMinutes() / 60)
    }
    tick()
    const id = window.setInterval(tick, 60_000)
    return () => window.clearInterval(id)
  }, [open])

  useEffect(() => {
    if (!open) return
    setStep('date')
    setDate(todayStr())
    setBedtime('23:00')
    setWakeTime('08:00')
    setFeel(4)
    setNotes('')
    setClockMode('hour')
    setBedH(23)
    setBedM(0)
    setWakeH(8)
    setWakeM(0)
    setLiveHours(23)
    setBusy(false)
  }, [open])

  const syncBedFromClock = (h: number, m: number) => {
    setBedH(h)
    setBedM(m)
    setBedtime(formatHm(h, m))
  }

  const syncWakeFromClock = (h: number, m: number) => {
    setWakeH(h)
    setWakeM(m)
    setWakeTime(formatHm(h, m))
  }

  const onLiveHours = (hours: number) => {
    setLiveHours(hours)
  }

  const startBed = () => {
    const p = parseHm(bedtime)
    setBedH(p.hour)
    setBedM(p.minute)
    setClockMode('hour')
    setLiveHours(hoursFromHm(bedtime))
    setStep('bed')
  }

  const startWake = () => {
    setWakeH(8)
    setWakeM(0)
    setWakeTime('08:00')
    setClockMode('hour')
    setLiveHours(8)
    setStep('wake')
  }

  const save = async () => {
    setBusy(true)
    try {
      await onSave({
        date,
        bedtime,
        wakeTime,
        quality: sleepBandFromContinuous(feel),
        interruptions: 0,
        notes: notes.trim(),
      })
      onClose()
    } finally {
      setBusy(false)
    }
  }

  const sceneHours = step === 'date' ? nowHours : step === 'bed' || step === 'wake' ? liveHours : nowHours
  const scenePart = dayPartFromHours(sceneHours)

  if (!open) return null

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="flow-backdrop"
          {...backdropFade}
          role="presentation"
        >
          <motion.div
            className="flow-sheet flow-sheet-lake sleep-flow-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={t('sleep.flow.aria')}
            {...sheetEnter}
          >
            <button type="button" className="flow-close" onClick={onClose} aria-label={t('common.close')}>
              ✕
            </button>

            <AnimatePresence mode="wait">
              {step === 'date' ? (
                <motion.div
                  key="date"
                  className="flow-body flow-body-lake"
                  {...stepFade}
                >
                  <ForestLodgeScene
                    dayPart={scenePart}
                    hours={sceneHours}
                    className="lodge-scene-card-fill lodge-scene-date"
                  />
                  <div className="lake-overlay-controls sleep-overlay">
                    <input
                      type="date"
                      className="sleep-date-input"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      aria-label={t('common.date')}
                    />
                    <Button block onClick={startBed}>
                      {t('sleep.confirmDate')}
                    </Button>
                  </div>
                </motion.div>
              ) : null}

              {step === 'bed' ? (
                <motion.div
                  key="bed"
                  className="flow-body flow-body-lake"
                  {...stepFade}
                >
                  <ForestLodgeScene
                    dayPart={scenePart}
                    hours={sceneHours}
                    className="lodge-scene-card-fill"
                  />
                  <div className="sleep-clock-overlay">
                    <AnalogClockPicker
                      hour={bedH}
                      minute={bedM}
                      mode={clockMode}
                      chip={t('sleep.bedtime')}
                      onHourChange={(h) => syncBedFromClock(h, bedM)}
                      onMinuteChange={(m) => syncBedFromClock(bedH, m)}
                      onLiveHoursChange={onLiveHours}
                      onHourCommit={() => setClockMode('minute')}
                      onMinuteCommit={() => startWake()}
                    />
                  </div>
                </motion.div>
              ) : null}

              {step === 'wake' ? (
                <motion.div
                  key="wake"
                  className="flow-body flow-body-lake"
                  {...stepFade}
                >
                  <ForestLodgeScene
                    dayPart={scenePart}
                    hours={sceneHours}
                    className="lodge-scene-card-fill"
                  />
                  <div className="sleep-clock-overlay">
                    <AnalogClockPicker
                      hour={wakeH}
                      minute={wakeM}
                      mode={clockMode}
                      chip={t('sleep.wake')}
                      onHourChange={(h) => syncWakeFromClock(h, wakeM)}
                      onMinuteChange={(m) => syncWakeFromClock(wakeH, m)}
                      onLiveHoursChange={onLiveHours}
                      onHourCommit={() => setClockMode('minute')}
                      onMinuteCommit={() => setStep('feel')}
                    />
                  </div>
                </motion.div>
              ) : null}

              {step === 'feel' ? (
                <motion.div
                  key="feel"
                  className="flow-body flow-body-lake"
                  {...stepFade}
                >
                  <SeaBoatScene quality={feel} className="sea-scene-card-fill" />
                  <div className="sleep-feel-label" aria-live="polite">
                    {t(sleepQualityLabelKey(sleepBandFromContinuous(feel)))}
                  </div>
                  <div className="lake-overlay-controls sleep-overlay">
                    <div className="lake-slider-wrap">
                      <input
                        type="range"
                        min={1}
                        max={7}
                        step={0.01}
                        value={feel}
                        onChange={(e) => setFeel(Number(e.target.value))}
                        aria-valuemin={1}
                        aria-valuemax={7}
                        aria-valuenow={sleepBandFromContinuous(feel)}
                        aria-label={t('sleep.feel')}
                        className="lake-range"
                      />
                    </div>
                    <Button block onClick={() => setStep('notes')}>
                      {t('common.confirm')}
                    </Button>
                  </div>
                </motion.div>
              ) : null}

              {step === 'notes' ? (
                <motion.div
                  key="notes"
                  className="flow-body flow-body-lake"
                  {...stepFade}
                >
                  <SeaBoatScene quality={feel} className="sea-scene-card-fill" />
                  <div className="lake-overlay-controls sleep-overlay sleep-notes-overlay">
                    <textarea
                      className="sleep-notes-input"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={t('sleep.notesPlaceholder')}
                      rows={4}
                      aria-label={t('common.notes')}
                    />
                    <Button block disabled={busy} onClick={() => void save()}>
                      {busy ? t('common.saving') : t('common.save')}
                    </Button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
