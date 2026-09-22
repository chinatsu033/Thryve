/** Region / language locale helpers for Thryve onboarding + crisis. */

export const REGION_IDS = [
  'hk',
  'mo',
  'cn',
  'jp',
  'kr',
  'gb',
  'us',
  'sg',
  'my',
  'tw',
] as const

export type RegionId = (typeof REGION_IDS)[number]

export const LANGUAGE_IDS = [
  'zh-Hans',
  'en',
  'zh-Hant-HK',
  'zh-Hant-TW',
  'ja',
  'ko',
] as const

export type LanguageId = (typeof LANGUAGE_IDS)[number]

export type MapFocus = { lat: number; lng: number; zoom: number }

/** Soft geographic focus centers (no borders / flags). */
export const REGION_MAP_FOCUS: Record<RegionId, MapFocus> = {
  hk: { lat: 22.3, lng: 114.2, zoom: 5.2 },
  mo: { lat: 22.2, lng: 113.5, zoom: 5.2 },
  cn: { lat: 35, lng: 105, zoom: 2.4 },
  jp: { lat: 36, lng: 138, zoom: 3.2 },
  kr: { lat: 36.5, lng: 128, zoom: 3.6 },
  gb: { lat: 54, lng: -2, zoom: 3.4 },
  us: { lat: 39, lng: -98, zoom: 2.2 },
  sg: { lat: 1.35, lng: 103.8, zoom: 4.8 },
  my: { lat: 4, lng: 102, zoom: 3.8 },
  tw: { lat: 23.7, lng: 121, zoom: 4.6 },
}

/** Display labels (Chinese chrome default). Never label tw as a country. */
export const REGION_LABELS: Record<RegionId, string> = {
  hk: '香港',
  mo: '澳门',
  cn: '中国大陆',
  jp: '日本',
  kr: '南韩',
  gb: '英国',
  us: '美国',
  sg: '新加坡',
  my: '马来西亚',
  tw: '台湾地区',
}

export const REGION_LABELS_EN: Record<RegionId, string> = {
  hk: 'Hong Kong',
  mo: 'Macao',
  cn: 'Mainland China',
  jp: 'Japan',
  kr: 'South Korea',
  gb: 'United Kingdom',
  us: 'United States',
  sg: 'Singapore',
  my: 'Malaysia',
  tw: 'Taiwan region',
}

export const LANGUAGE_LABELS: Record<LanguageId, string> = {
  'zh-Hans': '简体中文',
  en: 'English',
  'zh-Hant-HK': '繁體中文（香港）',
  'zh-Hant-TW': '繁體中文（台灣）',
  ja: '日本語',
  ko: '한국어',
}

export const DEFAULT_REGION: RegionId = 'hk'
export const DEFAULT_LANGUAGE: LanguageId = 'zh-Hans'

export const STORAGE_KEYS = {
  region: 'thryve.region',
  language: 'thryve.language',
  localeSetupDone: 'thryve.localeSetupDone',
} as const

function isRegionId(v: string): v is RegionId {
  return (REGION_IDS as readonly string[]).includes(v)
}

function isLanguageId(v: string): v is LanguageId {
  return (LANGUAGE_IDS as readonly string[]).includes(v)
}

export function getStoredRegion(): RegionId {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.region)
    if (v && isRegionId(v)) return v
  } catch {
    /* ignore */
  }
  return DEFAULT_REGION
}

export function setStoredRegion(region: RegionId): void {
  try {
    localStorage.setItem(STORAGE_KEYS.region, region)
  } catch {
    /* ignore */
  }
}

export function getStoredLanguage(): LanguageId {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.language)
    if (v && isLanguageId(v)) return v
  } catch {
    /* ignore */
  }
  return DEFAULT_LANGUAGE
}

export function setStoredLanguage(language: LanguageId): void {
  try {
    localStorage.setItem(STORAGE_KEYS.language, language)
  } catch {
    /* ignore */
  }
}

export function getLocaleSetupDone(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.localeSetupDone) === '1'
  } catch {
    return false
  }
}

export function setLocaleSetupDone(done: boolean): void {
  try {
    if (done) localStorage.setItem(STORAGE_KEYS.localeSetupDone, '1')
    else localStorage.removeItem(STORAGE_KEYS.localeSetupDone)
  } catch {
    /* ignore */
  }
}

export function regionLabel(region: RegionId, language: LanguageId): string {
  if (language === 'en') return REGION_LABELS_EN[region]
  return REGION_LABELS[region]
}


/** BCP 47 / HTML lang for <html lang>. */
export function htmlLangFor(language: LanguageId): string {
  switch (language) {
    case 'en':
      return 'en'
    case 'ja':
      return 'ja'
    case 'ko':
      return 'ko'
    case 'zh-Hant-HK':
      return 'zh-HK'
    case 'zh-Hant-TW':
      return 'zh-TW'
    default:
      return 'zh-CN'
  }
}

/** date-fns locale module name hint — import in callers from date-fns/locale. */
export type DateFnsLocaleId = 'zhCN' | 'zhHK' | 'zhTW' | 'enUS' | 'ja' | 'ko'

export function dateFnsLocaleId(language: LanguageId): DateFnsLocaleId {
  switch (language) {
    case 'en':
      return 'enUS'
    case 'ja':
      return 'ja'
    case 'ko':
      return 'ko'
    case 'zh-Hant-HK':
      return 'zhHK'
    case 'zh-Hant-TW':
      return 'zhTW'
    default:
      return 'zhCN'
  }
}
