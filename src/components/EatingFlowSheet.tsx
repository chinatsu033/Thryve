import { AnimatePresence, motion } from 'framer-motion'
import { backdropFade, sheetEnter } from '../lib/motion'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import {
  appetiteBandFromContinuous,
  appetiteLabel,
  mealsFromAppetite,
} from '../lib/eating'
import type { EatingEntry } from '../types'
import { DiningTableScene } from './DiningTableScene'
import { Button } from './ui'

type Props = {
  open: boolean
  onClose: () => void
  onSave: (e: Omit<EatingEntry, 'id' | 'profileId' | 'createdAt'>) => Promise<void>
}

export function EatingFlowSheet({ open, onClose, onSave }: Props) {
  const [appetite, setAppetite] = useState(3)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setAppetite(3)
    setBusy(false)
  }, [open])

  const band = appetiteBandFromContinuous(appetite)

  const save = async () => {
    setBusy(true)
    try {
      const date = format(new Date(), 'yyyy-MM-dd')
      await onSave({
        date,
        meals: mealsFromAppetite(band),
        appetite: band,
        notes: '',
      })
      onClose()
    } finally {
      setBusy(false)
    }
  }

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
            className="flow-sheet flow-sheet-lake eating-flow-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="饮食记录"
            {...sheetEnter}
          >
            <button type="button" className="flow-close" onClick={onClose} aria-label="关闭">
              ✕
            </button>

            <div className="flow-body flow-body-lake">
              <DiningTableScene appetite={appetite} className="dining-scene-card-fill" />
              <div className="sleep-feel-label eating-feel-label" aria-live="polite">
                {appetiteLabel(band)}
              </div>
              <div className="lake-overlay-controls sleep-overlay">
                <div className="lake-slider-wrap">
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={0.01}
                    value={appetite}
                    onChange={(e) => setAppetite(Number(e.target.value))}
                    aria-valuemin={1}
                    aria-valuemax={5}
                    aria-valuenow={band}
                    aria-valuetext={appetiteLabel(band)}
                    aria-label="食欲"
                    className="lake-range"
                  />
                </div>
                <Button block disabled={busy} onClick={() => void save()}>
                  {busy ? '保存中…' : '保存'}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
