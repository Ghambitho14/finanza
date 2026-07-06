import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { createUser, findUserByEmail, getUserById } from '@/lib/db-service'
import type { AppUser } from '@/types/finance'

const SESSION_KEY = 'finanzas_session'

interface Session {
  userId: string
  email: string
}

interface AuthContextType {
  user: AppUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<string | null>
  register: (name: string, email: string, password: string) => Promise<string | null>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function getStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

function storeSession(session: Session): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const session = getStoredSession()
      if (session) {
        const existing = await getUserById(session.userId)
        if (existing) {
          setUser(existing)
        } else {
          clearSession()
        }
      }
      setLoading(false)
    }
    init()
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    const found = await findUserByEmail(email)
    if (!found) return 'Usuario no encontrado'

    const hash = await hashPassword(password)
    if (hash !== found.passwordHash) return 'Contraseña incorrecta'

    setUser(found)
    storeSession({ userId: found.id, email: found.email })
    return null
  }, [])

  const register = useCallback(async (name: string, email: string, password: string): Promise<string | null> => {
    const existing = await findUserByEmail(email)
    if (existing) return 'El email ya está registrado'

    const passwordHash = await hashPassword(password)
    const newUser = await createUser(name, email, passwordHash)

    setUser(newUser)
    storeSession({ userId: newUser.id, email: newUser.email })
    return null
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    clearSession()
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
