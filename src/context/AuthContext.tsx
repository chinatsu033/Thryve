import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { ensureProfile, saveProfile } from '../lib/db'
import { consumeInviteCode } from '../lib/invite'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { applyTheme } from '../lib/theme'
import { DEFAULT_THEME, type Profile, type ThemeConfig } from '../types'
import { getStoredLanguage } from '../lib/locale'
import { translate } from '../locales/messages'

interface AuthContextValue {
  ready: boolean
  profile: Profile | null
  user: User | null
  session: Session | null
  configured: boolean
  register: (
    email: string,
    password: string,
    displayName?: string,
    inviteCode?: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>
  logout: () => Promise<void>
  updateProfile: (patch: Partial<Profile>) => Promise<void>
  setTheme: (theme: ThemeConfig) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function mapAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login')) return translate(getStoredLanguage(), 'auth.err.badLogin')
  if (m.includes('email not confirmed')) return translate(getStoredLanguage(), 'auth.err.emailConfirm')
  if (m.includes('user already registered')) return translate(getStoredLanguage(), 'auth.err.alreadyRegistered')
  if (m.includes('password')) return translate(getStoredLanguage(), 'auth.err.password')
  if (m.includes('rate limit') || m.includes('too many')) return translate(getStoredLanguage(), 'auth.err.rateLimit')
  if (m.includes('network') || m.includes('fetch')) return translate(getStoredLanguage(), 'auth.err.network')
  return message || translate(getStoredLanguage(), 'auth.err.failed')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)

  const loadProfileForUser = useCallback(async (u: User) => {
    const email = u.email ?? ''
    const displayName =
      (u.user_metadata?.display_name as string | undefined) ||
      email.split('@')[0] ||
      translate(getStoredLanguage(), 'auth.defaultUser')
    const p = await ensureProfile(u.id, email, displayName)
    applyTheme(p.theme)
    setProfile(p)
  }, [])

  useEffect(() => {
    let unsub: (() => void) | undefined

    ;(async () => {
      if (!isSupabaseConfigured) {
        applyTheme(DEFAULT_THEME)
        setReady(true)
        return
      }

      const { data } = await supabase.auth.getSession()
      const s = data.session
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        try {
          await loadProfileForUser(s.user)
        } catch (e) {
          console.error(e)
          setProfile(null)
        }
      } else {
        applyTheme(DEFAULT_THEME)
      }
      setReady(true)

      const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
        setSession(next)
        setUser(next?.user ?? null)
        if (next?.user) {
          void loadProfileForUser(next.user).catch((err) => {
            console.error(err)
            setProfile(null)
          })
        } else {
          setProfile(null)
          applyTheme(DEFAULT_THEME)
        }
      })
      unsub = () => sub.subscription.unsubscribe()
    })()

    return () => unsub?.()
  }, [loadProfileForUser])

  const register = useCallback(
    async (email: string, password: string, displayName?: string, inviteCode?: string) => {
      if (!isSupabaseConfigured) {
        return { ok: false as const, error: translate(getStoredLanguage(), 'auth.err.noCloud') }
      }
      const trimmed = email.trim()
      if (!trimmed.includes('@')) return { ok: false as const, error: translate(getStoredLanguage(), 'auth.err.badEmail') }
      if (password.length < 6) return { ok: false as const, error: translate(getStoredLanguage(), 'auth.err.shortPassword') }

      // Consume invite FIRST, then signUp. If signUp fails after consume, use is not
      // refunded (MVP leak). Prefer same-transaction consume+signup later if needed.
      const consumed = await consumeInviteCode(inviteCode ?? '')
      if (!consumed.ok) return { ok: false as const, error: consumed.error }

      const name = displayName?.trim() || trimmed.split('@')[0] || translate(getStoredLanguage(), 'auth.defaultUser')
      const { data, error } = await supabase.auth.signUp({
        email: trimmed,
        password,
        options: { data: { display_name: name } },
      })
      if (error) return { ok: false as const, error: mapAuthError(error.message) }

      if (data.user) {
        try {
          await ensureProfile(data.user.id, trimmed, name)
        } catch (e) {
          console.error(e)
        }
      }

      // If email confirmation is required, session may be null
      if (!data.session) {
        return {
          ok: false as const,
          error: translate(getStoredLanguage(), 'auth.registerOk'),
        }
      }

      setSession(data.session)
      setUser(data.user)
      if (data.user) await loadProfileForUser(data.user)
      return { ok: true as const }
    },
    [loadProfileForUser],
  )

  const login = useCallback(
    async (email: string, password: string) => {
      if (!isSupabaseConfigured) {
        return { ok: false as const, error: translate(getStoredLanguage(), 'auth.err.noCloud') }
      }
      const trimmed = email.trim()
      if (!trimmed) return { ok: false as const, error: translate(getStoredLanguage(), 'auth.err.needEmail') }
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmed,
        password,
      })
      if (error) return { ok: false as const, error: mapAuthError(error.message) }
      setSession(data.session)
      setUser(data.user)
      if (data.user) await loadProfileForUser(data.user)
      return { ok: true as const }
    },
    [loadProfileForUser],
  )

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setUser(null)
    setSession(null)
    applyTheme(DEFAULT_THEME)
  }, [])

  const updateProfile = useCallback(
    async (patch: Partial<Profile>) => {
      if (!profile) return
      const next = { ...profile, ...patch, id: profile.id }
      await saveProfile(next)
      setProfile(next)
    },
    [profile],
  )

  const setTheme = useCallback(
    async (theme: ThemeConfig) => {
      applyTheme(theme)
      await updateProfile({ theme })
    },
    [updateProfile],
  )

  const value = useMemo(
    () => ({
      ready,
      profile,
      user,
      session,
      configured: isSupabaseConfigured,
      register,
      login,
      logout,
      updateProfile,
      setTheme,
    }),
    [ready, profile, user, session, register, login, logout, updateProfile, setTheme],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
