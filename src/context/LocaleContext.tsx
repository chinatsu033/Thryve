import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  DEFAULT_LANGUAGE,
  DEFAULT_REGION,
  getLocaleSetupDone,
  getStoredLanguage,
  getStoredRegion,
  regionLabel,
  setLocaleSetupDone as persistSetupDone,
  setStoredLanguage,
  setStoredRegion,
  htmlLangFor,
  type LanguageId,
  type RegionId,
} from '../lib/locale'
import { translate, type MessageKey } from '../locales/messages'

interface LocaleContextValue {
  region: RegionId
  language: LanguageId
  setupDone: boolean
  setRegion: (region: RegionId) => void
  setLanguage: (language: LanguageId) => void
  markSetupDone: () => void
  t: (key: MessageKey | string, vars?: Record<string, string>) => string
  regionDisplayName: (id?: RegionId) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [region, setRegionState] = useState<RegionId>(() => {
    try {
      return getStoredRegion()
    } catch {
      return DEFAULT_REGION
    }
  })
  const [language, setLanguageState] = useState<LanguageId>(() => {
    try {
      return getStoredLanguage()
    } catch {
      return DEFAULT_LANGUAGE
    }
  })
  const [setupDone, setSetupDone] = useState(() => {
    try {
      return getLocaleSetupDone()
    } catch {
      return false
    }
  })

  const setRegion = useCallback((r: RegionId) => {
    setStoredRegion(r)
    setRegionState(r)
  }, [])

  const setLanguage = useCallback((l: LanguageId) => {
    setStoredLanguage(l)
    setLanguageState(l)
  }, [])

  const markSetupDone = useCallback(() => {
    persistSetupDone(true)
    setSetupDone(true)
  }, [])

  const t = useCallback(
    (key: MessageKey | string, vars?: Record<string, string>) =>
      translate(language, key, vars),
    [language],
  )

  useEffect(() => {
    document.documentElement.lang = htmlLangFor(language)
  }, [language])

  const regionDisplayName = useCallback(
    (id?: RegionId) => regionLabel(id ?? region, language),
    [region, language],
  )

  const value = useMemo(
    () => ({
      region,
      language,
      setupDone,
      setRegion,
      setLanguage,
      markSetupDone,
      t,
      regionDisplayName,
    }),
    [region, language, setupDone, setRegion, setLanguage, markSetupDone, t, regionDisplayName],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
