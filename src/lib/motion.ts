/** Shared Framer Motion tokens — same easing family + similar durations app-wide. */

export const easeOutSoft = [0.22, 1, 0.36, 1] as const

export const duration = {
  fast: 0.2,
  base: 0.28,
  slow: 0.35,
} as const

export const fadeTransition = {
  duration: duration.base,
  ease: easeOutSoft,
}

export const pageMotion = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: duration.slow, ease: easeOutSoft },
}

export const cardMotion = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: duration.base, ease: easeOutSoft },
}

export const listItemMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: duration.fast, ease: easeOutSoft },
}

export const tabSwapMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: duration.fast, ease: easeOutSoft },
}

export const stepFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: duration.fast, ease: easeOutSoft },
}

export const layerTransition = {
  duration: duration.slow,
  ease: easeOutSoft,
}

export const sheetSpring = {
  type: 'spring' as const,
  stiffness: 320,
  damping: 34,
}

export const sheetEnter = {
  initial: { y: '100%' as const, opacity: 0.85 },
  animate: { y: 0, opacity: 1 },
  exit: { y: '40%' as const, opacity: 0 },
  transition: sheetSpring,
}

export const backdropFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: duration.base, ease: easeOutSoft },
}

export const tapSpring = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 25,
}

export const chartEnter = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: duration.slow, ease: easeOutSoft },
}
