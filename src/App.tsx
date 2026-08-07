import { useEffect, type ReactNode } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Dashboard } from '@/pages/Dashboard'
import { Historico } from '@/pages/Historico'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { useAuth } from '@/lib/auth'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true })
    }
  }, [user, loading, navigate])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="font-mono text-sm text-txt-tertiary">cargando…</div>
      </div>
    )
  }

  if (!user) return null

  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/historico" element={<ProtectedRoute><Historico /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
