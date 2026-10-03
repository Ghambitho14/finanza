import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, UNAUTHORIZED_EVENT, getToken } from '@/lib/api'
import { loginRequest, logoutRequest, meRequest, registerRequest } from '@/lib/db-service'
import type { AppUser } from '@/types/finance'

interface AuthContextType {
  user: AppUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<string | null>
  register: (name: string, email: string, password: string) => Promise<string | null>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      if (!getToken()) {
        setLoading(false)
        return
      }
      try {
        const me = await meRequest()
        setUser(me)
      } catch {
        logoutRequest()
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    const onUnauthorized = () => setUser(null)
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    try {
      const { user: logged } = await loginRequest(email, password)
      setUser(logged)
      return null
    } catch (err) {
      if (err instanceof ApiError) return err.message
      return 'No se pudo iniciar sesión'
    }
  }, [])

  const register = useCallback(async (name: string, email: string, password: string): Promise<string | null> => {
    try {
      const { user: created } = await registerRequest(name, email, password)
      setUser(created)
      return null
    } catch (err) {
      if (err instanceof ApiError) return err.message
      return 'No se pudo registrar'
    }
  }, [])

  const logout = useCallback(() => {
    logoutRequest()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}

export function useRequireAuth(): AppUser {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true })
    }
  }, [user, loading, navigate])

  return user!
}
