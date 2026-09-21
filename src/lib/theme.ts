import type { ThemeConfig } from '../types'

export function applyTheme(theme: ThemeConfig): void {
  const root = document.documentElement
  root.style.setProperty('--color-primary', theme.primary)
  root.style.setProperty('--color-accent', theme.accent)
  root.style.setProperty('--color-surface', theme.surface)
  root.style.setProperty('--color-primary-rgb', hexToRgb(theme.primary))
  root.style.setProperty('--color-on-primary', contrastText(theme.primary))
  root.style.setProperty('--color-on-accent', contrastText(theme.accent))
}

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`
}

function contrastText(hex: string): string {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.6 ? '#1A1A2E' : '#FFFFFF'
}
