import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import {
  dayPartFromDate,
  dayPartFromHours,
  formatHm,
  hoursFromHm,
  parseHm,
  sleepBandFromContinuous,
  sleepQualityLabel,
  type DayPart,
} from '../lib/sleep'
import type { SleepEntry } from '../types'
import { AnalogClockPicker } from './AnalogClockPicker'
import { ForestLodgeScene } from './ForestLodgeScene'
import { SeaBoatScene } from './SeaBoatScene'
import { Button } from './ui'

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

  const [nowPart, setNowPart] = useState<DayPart>(() => dayPartFromDate())
  const [clockPart, setClockPart] = useState<DayPart>(() => dayPartFromHours(23))

  useEffect(() => {
    if (!open) return
    const tick = () => setNowPart(dayPartFromDate())
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
    setClockPart(dayPartFromHours(23))
    setBusy(false)
  }, [open])

  const syncBedFromClock = (h: number, m: number) => {
    setBedH(h)
    setBedM(m)
    setBedtime(formatHm(h, m))
    setClockPart(dayPartFromHours(h + m / 60))
  }

  const syncWakeFromClock = (h: number, m: number) => {
    setWakeH(h)
    setWakeM(m)
    setWakeTime(formatHm(h, m))
    setClockPart(dayPartFromHours(h + m / 60))
  }

  const startBed = () => {
    const p = parseHm(bedtime)
    setBedH(p.hour)
    setBedM(p.minute)
    setClockMode('hour')
    setClockPart(dayPartFromHours(hoursFromHm(bedtime)))
    setStep('bed')
  }

  const startWake = () => {
    setWakeH(8)
    setWakeM(0)
    setWakeTime('08:00')
    setClockMode('hour')
    setClockPart(dayPartFromHours(8))
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

  const scenePart = step === 'date' ? nowPart : step === 'bed' || step === 'wake' ? clockPart : nowPart

  if (!open) return null

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="flow-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="presentation"
        >
          <motion.div
            className="flow-sheet flow-sheet-lake sleep-flow-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="睡眠记录"
            initial={{ y: '100%', opacity: 0.85 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '40%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          >
            <button type="button" className="flow-close" onClick={onClose} aria-label="关闭">
              ✕
            </button>

            <AnimatePresence mode="wait">
              {step === 'date' ? (
                <motion.div
                  key="date"
                  className="flow-body flow-body-lake"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <ForestLodgeScene dayPart={scenePart} className="lodge-scene-card-fill" />
                  <div className="lake-overlay-controls sleep-overlay">
                    <input
                      type="date"
                      className="sleep-date-input"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      aria-label="日期"
                    />
                    <Button block onClick={startBed}>
                      确定日期
                    </Button>
                  </div>
                </motion.div>
              ) : null}

              {step === 'bed' ? (
                <motion.div
                  key="bed"
                  className="flow-body flow-body-lake"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <ForestLodgeScene dayPart={scenePart} className="lodge-scene-card-fill" />
                  <div className="sleep-clock-overlay">
                    <AnalogClockPicker
                      hour={bedH}
                      minute={bedM}
                      mode={clockMode}
                      chip="入睡"
                      onHourChange={(h) => syncBedFromClock(h, bedM)}
                      onMinuteChange={(m) => syncBedFromClock(bedH, m)}
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
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <ForestLodgeScene dayPart={scenePart} className="lodge-scene-card-fill" />
                  <div className="sleep-clock-overlay">
                    <AnalogClockPicker
                      hour={wakeH}
                      minute={wakeM}
                      mode={clockMode}
                      chip="起床"
                      onHourChange={(h) => syncWakeFromClock(h, wakeM)}
                      onMinuteChange={(m) => syncWakeFromClock(wakeH, m)}
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
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <SeaBoatScene quality={feel} className="sea-scene-card-fill" />
                  <div className="sleep-feel-label" aria-live="polite">
                    {sleepQualityLabel(sleepBandFromContinuous(feel))}
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
                        aria-label="睡眠感受"
                        className="lake-range"
                      />
                    </div>
                    <Button block onClick={() => setStep('notes')}>
                      确定
                    </Button>
                  </div>
                </motion.div>
              ) : null}

              {step === 'notes' ? (
                <motion.div
                  key="notes"
                  className="flow-body flow-body-lake"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <SeaBoatScene quality={feel} className="sea-scene-card-fill" />
                  <div className="lake-overlay-controls sleep-overlay sleep-notes-overlay">
                    <textarea
                      className="sleep-notes-input"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="写点什么吧..."
                      rows={4}
                      aria-label="备注"
                    />
                    <Button block disabled={busy} onClick={() => void save()}>
                      {busy ? '保存中…' : '保存'}
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
