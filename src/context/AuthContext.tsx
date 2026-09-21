import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { generateSalt, hashPassword, uid, verifyPassword } from '../lib/crypto'
import {
  getProfile,
  getProfileByName,
  getSessionProfileId,
  listProfiles,
  saveProfile,
  setSessionProfileId,
} from '../lib/db'
import { applyTheme } from '../lib/theme'
import {
  DEFAULT_THEME,
  type MedicalHistory,
  type Profile,
  type ThemeConfig,
} from '../types'

interface AuthContextValue {
  ready: boolean
  profile: Profile | null
  profiles: Profile[]
  refreshProfiles: () => Promise<void>
  register: (name: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>
  login: (name: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>
  logout: () => Promise<void>
  updateProfile: (patch: Partial<Profile>) => Promise<void>
  setTheme: (theme: ThemeConfig) => Promise<void>
  setMedicalHistory: (mh: MedicalHistory) => Promise<void>
  completeOnboarding: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])

  const refreshProfiles = useCallback(async () => {
    setProfiles(await listProfiles())
  }, [])

  useEffect(() => {
    ;(async () => {
      await refreshProfiles()
      const sid = await getSessionProfileId()
      if (sid) {
        const p = await getProfile(sid)
        if (p) {
          setProfile(p)
          applyTheme(p.theme)
        } else {
          await setSessionProfileId(null)
          applyTheme(DEFAULT_THEME)
        }
      } else {
        applyTheme(DEFAULT_THEME)
      }
      setReady(true)
    })()
  }, [refreshProfiles])

  const register = useCallback(
    async (name: string, password: string) => {
      const trimmed = name.trim()
      if (!trimmed) return { ok: false as const, error: '请输入档案名称' }
      if (password.length < 4) return { ok: false as const, error: '密码至少 4 位' }
      if (await getProfileByName(trimmed)) {
        return { ok: false as const, error: '该名称已被使用' }
      }
      const salt = await generateSalt()
      const passwordHash = await hashPassword(password, salt)
      const p: Profile = {
        id: uid(),
        name: trimmed,
        passwordHash,
        salt,
        createdAt: new Date().toISOString(),
        medicalHistory: {
          diagnoses: '',
          medications: '',
          allergies: '',
          notes: '',
          skipped: true,
        },
        theme: DEFAULT_THEME,
        onboardingDone: true,
      }
      await saveProfile(p)
      await setSessionProfileId(p.id)
      applyTheme(p.theme)
      setProfile(p)
      await refreshProfiles()
      return { ok: true as const }
    },
    [refreshProfiles],
  )

  const login = useCallback(
    async (name: string, password: string) => {
      const p = await getProfileByName(name.trim())
      if (!p) return { ok: false as const, error: '档案不存在' }
      const ok = await verifyPassword(password, p.salt, p.passwordHash)
      if (!ok) return { ok: false as const, error: '密码错误' }
      await setSessionProfileId(p.id)
      applyTheme(p.theme)
      setProfile(p)
      return { ok: true as const }
    },
    [],
  )

  const logout = useCallback(async () => {
    await setSessionProfileId(null)
    setProfile(null)
    applyTheme(DEFAULT_THEME)
  }, [])

  const updateProfile = useCallback(
    async (patch: Partial<Profile>) => {
      if (!profile) return
      const next = { ...profile, ...patch, id: profile.id }
      await saveProfile(next)
      setProfile(next)
      await refreshProfiles()
    },
    [profile, refreshProfiles],
  )

  const setTheme = useCallback(
    async (theme: ThemeConfig) => {
      applyTheme(theme)
      await updateProfile({ theme })
    },
    [updateProfile],
  )

  const setMedicalHistory = useCallback(
    async (mh: MedicalHistory) => {
      await updateProfile({ medicalHistory: mh })
    },
    [updateProfile],
  )

  const completeOnboarding = useCallback(async () => {
    await updateProfile({ onboardingDone: true })
  }, [updateProfile])

  const value = useMemo(
    () => ({
      ready,
      profile,
      profiles,
      refreshProfiles,
      register,
      login,
      logout,
      updateProfile,
      setTheme,
      setMedicalHistory,
      completeOnboarding,
    }),
    [
      ready,
      profile,
      profiles,
      refreshProfiles,
      register,
      login,
      logout,
      updateProfile,
      setTheme,
      setMedicalHistory,
      completeOnboarding,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
