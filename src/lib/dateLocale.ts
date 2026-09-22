import { enUS, ja, ko, zhCN, zhHK, zhTW } from 'date-fns/locale'
import type { Locale } from 'date-fns'
import { dateFnsLocaleId, type LanguageId } from './locale'

const MAP = {
  zhCN,
  zhHK,
  zhTW,
  enUS,
  ja,
  ko,
} as const satisfies Record<string, Locale>

export function dateFnsLocale(language: LanguageId): Locale {
  return MAP[dateFnsLocaleId(language)]
}

/** Prefer numeric formats that work across locales; Chinese locales keep 月/日. */
export function datePattern(
  language: LanguageId,
  kind: 'monthDayTime' | 'fullDateTime' | 'monthDay' | 'yearMonth' | 'chartDay',
): string {
  const cjk = language === 'zh-Hans' || language.startsWith('zh-Hant')
  if (kind === 'monthDayTime') return cjk ? 'M月d日 HH:mm' : language === 'ja' ? 'M月d日 HH:mm' : language === 'ko' ? 'M월d일 HH:mm' : 'MMM d, HH:mm'
  if (kind === 'fullDateTime') return cjk ? 'yyyy年M月d日 HH:mm' : language === 'ja' ? 'yyyy年M月d日 HH:mm' : language === 'ko' ? 'yyyy년M월d일 HH:mm' : 'MMM d, yyyy HH:mm'
  if (kind === 'monthDay') return cjk ? 'M月d日' : language === 'ja' ? 'M月d日' : language === 'ko' ? 'M월d일' : 'MMM d'
  if (kind === 'yearMonth') return cjk ? 'yyyy年M月' : language === 'ja' ? 'yyyy年M月' : language === 'ko' ? 'yyyy년M월' : 'MMM yyyy'
  return cjk || language === 'ja' ? 'M/d' : 'M/d'
}
