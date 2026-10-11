import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { AuthError, Session } from '@supabase/supabase-js'
import { WEB_URL } from './env'
import { supabase } from './supabase'

export { MIN_PASSWORD_LENGTH, authErrorMessage } from '@shared/auth'

interface AuthState {
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  /** Devuelve true si hay que confirmar el email antes de entrar. */
  signUp: (email: string, password: string) => Promise<boolean>
  sendPasswordReset: (email: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

const throwIfError = ({ error }: { error: AuthError | null }) => {
  if (error) throw error
}

/**
 * Igual que en la web, pero los enlaces de los correos (confirmar cuenta y
 * nueva contraseña) abren la web: ahí se completan y luego se entra en la app.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // INITIAL_SESSION llega al suscribirse: resuelve la carga inicial
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setLoading(false)
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
      options: { emailRedirectTo: WEB_URL },
    })
    if (error) throw error
    return data.session === null
  }, [])

  const sendPasswordReset = useCallback(async (email: string) => {
    throwIfError(await supabase.auth.resetPasswordForEmail(email, { redirectTo: WEB_URL }))
  }, [])

  const signOut = useCallback(async () => {
    throwIfError(await supabase.auth.signOut())
  }, [])

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signUp, sendPasswordReset, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
