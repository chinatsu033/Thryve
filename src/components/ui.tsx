import { AnimatePresence, motion } from 'framer-motion'
import {
  type CSSProperties,
  type FormEvent,
  type ReactNode,
  useEffect,
} from 'react'
import { useNavigate } from 'react-router-dom'
import {
  backdropFade,
  cardMotion,
  pageMotion,
  sheetEnter,
  tapSpring,
} from '../lib/motion'
import { useLocale } from '../context/LocaleContext'

export function Card({
  children,
  className = '',
  title,
}: {
  children: ReactNode
  className?: string
  title?: string
}) {
  return (
    <motion.div
      className={`card ${className}`}
      {...cardMotion}
    >
      {title ? <h3 className="card-title">{title}</h3> : null}
      {children}
    </motion.div>
  )
}

export function Button({
  children,
  variant = 'primary',
  block,
  className = '',
  type = 'button',
  disabled,
  onClick,
  style,
}: {
  children: ReactNode
  variant?: 'primary' | 'accent' | 'ghost' | 'danger'
  block?: boolean
  className?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  onClick?: () => void
  style?: CSSProperties
}) {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={style}
      className={`btn btn-${variant} ${block ? 'btn-block' : ''} ${className}`}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.02 }}
      transition={tapSpring}
    >
      {children}
    </motion.button>
  )
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: ReactNode
  hint?: string
}) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {hint ? <span className="hint">{hint}</span> : null}
    </div>
  )
}

export function Disclaimer() {
  const { t } = useLocale()
  return (
    <div className="disclaimer" role="note">
      {t('common.disclaimer')}
    </div>
  )
}

export function MoodSlider({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (v: number) => void
  label?: string
}) {
  const { t } = useLocale()
  const resolvedLabel = label ?? t('ui.moodSlider')
  return (
    <div className="mood-slider field">
      <label>{resolvedLabel}</label>
      <div className="mood-value" aria-live="polite">
        {value}
      </div>
      <input
        type="range"
        min={1}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuemin={1}
        aria-valuemax={10}
        aria-valuenow={value}
        aria-label={resolvedLabel}
      />
      <div
        className="row"
        style={{
          justifyContent: 'space-between',
          fontSize: '0.8rem',
          color: 'var(--color-text-muted)',
        }}
      >
        <span>{t('ui.moodLow')}</span>
        <span>{t('ui.moodHigh')}</span>
      </div>
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="modal-backdrop"
          {...backdropFade}
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            className="modal-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            {...sheetEnter}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sheet-handle" aria-hidden />
            <h2 style={{ marginBottom: 14 }}>{title}</h2>
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export function Empty({ text }: { text: string }) {
  return <div className="empty">{text}</div>
}

function goBackOrHome(navigate: ReturnType<typeof useNavigate>) {
  // Prefer SPA history idx when present; only fall back to home if no prior entry.
  const idx = (window.history.state as { idx?: number } | null)?.idx
  if (typeof idx === 'number') {
    if (idx > 0) navigate(-1)
    else navigate('/')
    return
  }
  if (window.history.length > 1) navigate(-1)
  else navigate('/')
}

function BackChevronIcon() {
  return (
    <svg className="page-back-icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      {/* Geometric left chevron ⟨ — no stem */}
      <path
        d="M15 5 L8 12 L15 19"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Page({
  title,
  sub,
  children,
  actions,
  back = true,
}: {
  title?: string
  sub?: string
  children: ReactNode
  actions?: ReactNode
  /** Show top-left chevron back. Default true; set false on home / auth.
   *  Pass a function to override destination (e.g. dashboard). */
  back?: boolean | (() => void)
}) {
  const navigate = useNavigate()
  const { t } = useLocale()
  const showBack = back !== false
  const handleBack = () => {
    if (typeof back === 'function') back()
    else goBackOrHome(navigate)
  }
  const showHeader = Boolean(title || sub || actions || showBack)
  return (
    <motion.div
      className="page"
      {...pageMotion}
    >
      {showBack ? (
        <button
          type="button"
          className="page-back"
          onClick={handleBack}
          aria-label={t('common.back')}
        >
          <BackChevronIcon />
        </button>
      ) : null}
      {showHeader && (title || sub || actions) ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <div>
            {title ? <h1 className="page-title">{title}</h1> : null}
            {sub ? <p className="page-sub">{sub}</p> : title ? <div style={{ height: 12 }} /> : null}
          </div>
          {actions}
        </div>
      ) : null}
      {children}
    </motion.div>
  )
}

export function preventSubmit(e: FormEvent) {
  e.preventDefault()
}
