import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthError, AuthLayout, PasswordInput } from '@/components/AuthLayout'
import { authErrorMessage, useAuth } from '@/lib/auth'

export function Entrar() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return setError('Escribe tu email y contraseña')
    setBusy(true)
    setError('')
    try {
      // Al entrar, el cambio de sesión lleva solo al resumen
      await signIn(email.trim(), password)
    } catch (err) {
      setError(authErrorMessage(err))
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="Entrar a Finanzas"
      subtitle="Tus ingresos, gastos y ahorro, mes a mes."
      footer={<>¿No tienes cuenta? <Link to="/registro" className="font-medium text-accent hover:underline">Crear cuenta</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
            className="field w-full"
          />
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="password" className="label">Contraseña</label>
            <Link to="/recuperar" className="text-xs text-accent hover:underline">¿La olvidaste?</Link>
          </div>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <AuthError message={error} />
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </AuthLayout>
  )
}
