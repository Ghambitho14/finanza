import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { AuthError, type Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export const MIN_PASSWORD_LENGTH = 8

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

const AUTH_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Email o contraseña incorrectos',
  email_not_confirmed: 'Aún no confirmas tu email. Revisa tu correo y abre el enlace.',
  user_already_exists: 'Ese email ya tiene una cuenta',
  email_exists: 'Ese email ya tiene una cuenta',
  weak_password: `La contraseña es muy débil: usa al menos ${MIN_PASSWORD_LENGTH} caracteres`,
  same_password: 'La nueva contraseña debe ser distinta a la anterior',
  email_address_invalid: 'El email no es válido',
  validation_failed: 'Revisa el email y la contraseña',
  over_email_send_rate_limit: 'Se enviaron demasiados correos. Espera unos minutos.',
  over_request_rate_limit: 'Demasiados intentos. Espera unos minutos.',
}

export function authErrorMessage(err: unknown): string {
  if (err instanceof AuthError) {
    if (err.code && AUTH_MESSAGES[err.code]) return AUTH_MESSAGES[err.code]
    if (err.name === 'AuthRetryableFetchError') return 'No hay conexión con el servidor'
  }
  return 'No se pudo completar. Intenta de nuevo.'
}

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
