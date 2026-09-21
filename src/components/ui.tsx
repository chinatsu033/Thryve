import { AnimatePresence, motion } from 'framer-motion'
import {
  type CSSProperties,
  type FormEvent,
  type ReactNode,
  useEffect,
} from 'react'

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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
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
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
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
  return (
    <div className="disclaimer" role="note">
      本工具仅用于个人状态记录与就医沟通，不能替代专业医疗诊断或治疗。如有紧急情况，请立即联系当地急救或专业医疗机构。
    </div>
  )
}

export function MoodSlider({
  value,
  onChange,
  label = '情绪评分（1–10）',
}: {
  value: number
  onChange: (v: number) => void
  label?: string
}) {
  return (
    <div className="mood-slider field">
      <label>{label}</label>
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
        aria-label={label}
      />
      <div
        className="row"
        style={{
          justifyContent: 'space-between',
          fontSize: '0.8rem',
          color: 'var(--color-text-muted)',
        }}
      >
        <span>很低落</span>
        <span>很平稳 / 积极</span>
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            className="modal-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: '100%', opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '40%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
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

export function Page({
  title,
  sub,
  children,
  actions,
}: {
  title: string
  sub?: string
  children: ReactNode
  actions?: ReactNode
}) {
  return (
    <motion.div
      className="page"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.25 }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <div>
          <h1 className="page-title">{title}</h1>
          {sub ? <p className="page-sub">{sub}</p> : <div style={{ height: 12 }} />}
        </div>
        {actions}
      </div>
      {children}
    </motion.div>
  )
}

export function preventSubmit(e: FormEvent) {
  e.preventDefault()
}
