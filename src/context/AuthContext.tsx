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
    turnstileToken?: string,
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
    async (email: string, password: string, displayName?: string, turnstileToken?: string) => {
      if (!isSupabaseConfigured) {
        return { ok: false as const, error: translate(getStoredLanguage(), 'auth.err.noCloud') }
      }
      const trimmed = email.trim()
      if (!trimmed.includes('@')) return { ok: false as const, error: translate(getStoredLanguage(), 'auth.err.badEmail') }
      if (password.length < 6) return { ok: false as const, error: translate(getStoredLanguage(), 'auth.err.shortPassword') }
      if (!turnstileToken) {
        return { ok: false as const, error: translate(getStoredLanguage(), 'auth.turnstile.required') }
      }

      const name =
        displayName?.trim() || trimmed.split('@')[0] || translate(getStoredLanguage(), 'auth.defaultUser')

      // Server path: Turnstile verify + Admin createUser (no client anon signUp).
      // When ready, disable open signups in Supabase Dashboard → Authentication.
      let apiRes: Response
      try {
        apiRes = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: trimmed,
            password,
            displayName: name,
            turnstileToken,
          }),
        })
      } catch {
        return { ok: false as const, error: translate(getStoredLanguage(), 'auth.err.network') }
      }

      let apiJson: { ok?: boolean; error?: string } = {}
      try {
        apiJson = (await apiRes.json()) as { ok?: boolean; error?: string }
      } catch {
        /* ignore parse errors */
      }

      if (!apiRes.ok || !apiJson.ok) {
        if (apiRes.status === 409 || apiJson.error === 'already_registered') {
          return { ok: false as const, error: translate(getStoredLanguage(), 'auth.err.alreadyRegistered') }
        }
        if (apiJson.error === 'turnstile') {
          return { ok: false as const, error: translate(getStoredLanguage(), 'auth.turnstile.failed') }
        }
        return { ok: false as const, error: translate(getStoredLanguage(), 'auth.err.registerFailed') }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmed,
        password,
      })
      if (error) return { ok: false as const, error: mapAuthError(error.message) }

      if (data.user) {
        try {
          await ensureProfile(data.user.id, trimmed, name)
        } catch (e) {
          console.error(e)
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

      try {
        const lockRes = await fetch('/api/auth/check-lock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmed }),
        })
        const lockJson = (await lockRes.json().catch(() => ({}))) as {
          locked?: boolean
          error?: string
        }
        if (lockRes.status === 429 || lockJson.locked || lockJson.error === 'locked') {
          return { ok: false as const, error: translate(getStoredLanguage(), 'auth.err.locked') }
        }
      } catch {
        // Fail open if lock API unreachable
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmed,
        password,
      })
      if (error) {
        try {
          const failRes = await fetch('/api/auth/record-failure', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: trimmed }),
          })
          const failJson = (await failRes.json().catch(() => ({}))) as {
            locked?: boolean
            error?: string
          }
          if (failRes.status === 429 || failJson.locked || failJson.error === 'locked') {
            return { ok: false as const, error: translate(getStoredLanguage(), 'auth.err.locked') }
          }
        } catch {
          /* ignore */
        }
        return { ok: false as const, error: mapAuthError(error.message) }
      }

      try {
        await fetch('/api/auth/record-success', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmed }),
        })
      } catch {
        /* ignore */
      }

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
