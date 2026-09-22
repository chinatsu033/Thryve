/** Appetite: new entries store 1–5 (闭塞→饱满). Legacy rows may still be 1–10. */

export const APPETITE_LABELS = ['闭塞', '微唤', '温和', '苏醒', '饱满'] as const

export type AppetiteLabel = (typeof APPETITE_LABELS)[number]

/** Map stored appetite to 1–5 band (legacy 1–10 → proportional). */
export function normalizeAppetite(appetite: number): number {
  if (appetite > 5) {
    return Math.min(5, Math.max(1, Math.round((appetite / 10) * 5)))
  }
  return Math.min(5, Math.max(1, Math.round(appetite)))
}

export function appetiteLabel(appetite: number): AppetiteLabel {
  return APPETITE_LABELS[normalizeAppetite(appetite) - 1]
}

/** Continuous slider 1–5 → discrete band for label / save. */
export function appetiteBandFromContinuous(v: number): number {
  return Math.min(5, Math.max(1, Math.round(v)))
}

/** Derive meals count from appetite band (1→0 … 5→4). */
export function mealsFromAppetite(appetite: number): number {
  return normalizeAppetite(appetite) - 1
}

/** i18n key for appetite (eating.0 … eating.4). */
export function appetiteLabelKey(appetite: number): `eating.${number}` {
  return `eating.${normalizeAppetite(appetite) - 1}`
}
