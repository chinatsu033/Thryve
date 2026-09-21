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
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>
  logout: () => Promise<void>
  updateProfile: (patch: Partial<Profile>) => Promise<void>
  setTheme: (theme: ThemeConfig) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function mapAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login')) return '邮箱或密码错误'
  if (m.includes('email not confirmed')) return '请先到邮箱完成验证后再登录'
  if (m.includes('user already registered')) return '该邮箱已注册，请直接登录'
  if (m.includes('password')) return '密码不符合要求（至少 6 位）'
  if (m.includes('rate limit') || m.includes('too many')) return '尝试过于频繁，请稍后再试'
  if (m.includes('network') || m.includes('fetch')) return '网络异常，请检查连接'
  return message || '操作失败'
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
      '用户'
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
    async (email: string, password: string, displayName?: string) => {
      if (!isSupabaseConfigured) {
        return { ok: false as const, error: '未配置云端服务，请联系管理员设置环境变量' }
      }
      const trimmed = email.trim()
      if (!trimmed.includes('@')) return { ok: false as const, error: '请输入有效邮箱' }
      if (password.length < 6) return { ok: false as const, error: '密码至少 6 位' }

      const name = displayName?.trim() || trimmed.split('@')[0] || '用户'
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
          error: '注册成功。若开启了邮箱验证，请查收邮件后再登录；否则请直接登录。',
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
        return { ok: false as const, error: '未配置云端服务，请联系管理员设置环境变量' }
      }
      const trimmed = email.trim()
      if (!trimmed) return { ok: false as const, error: '请输入邮箱' }
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
