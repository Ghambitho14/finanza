import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { AuthError, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export { MIN_PASSWORD_LENGTH, authErrorMessage } from '@shared/auth'

interface AuthState {
  session: Session | null
  loading: boolean
  /** Llegó desde el enlace de "olvidé mi contraseña": debe elegir una nueva. */
  recovering: boolean
  signIn: (email: string, password: string) => Promise<void>
  /** Devuelve true si hay que confirmar el email antes de entrar. */
  signUp: (email: string, password: string) => Promise<boolean>
  sendPasswordReset: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

const throwIfError = ({ error }: { error: AuthError | null }) => {
  if (error) throw error
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [recovering, setRecovering] = useState(false)

  useEffect(() => {
    // INITIAL_SESSION llega al suscribirse: resuelve la carga inicial
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next)
      setLoading(false)
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
      if (event === 'SIGNED_OUT') setRecovering(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    throwIfError(await supabase.auth.signInWithPassword({ email, password }))
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) throw error
    return data.session === null
  }, [])

  const sendPasswordReset = useCallback(async (email: string) => {
    throwIfError(await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin }))
  }, [])

  const updatePassword = useCallback(async (password: string) => {
    throwIfError(await supabase.auth.updateUser({ password }))
    setRecovering(false)
  }, [])

  const signOut = useCallback(async () => {
    throwIfError(await supabase.auth.signOut())
  }, [])

  return (
    <AuthContext.Provider value={{ session, loading, recovering, signIn, signUp, sendPasswordReset, updatePassword, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
