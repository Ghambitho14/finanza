import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { AuthError, AuthLayout, PasswordInput } from '@/components/AuthLayout'
import { MIN_PASSWORD_LENGTH, authErrorMessage, useAuth } from '@/lib/auth'

export function Registro() {
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return setError('Escribe tu email')
    if (password.length < MIN_PASSWORD_LENGTH) {
      return setError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`)
    }
    if (password !== confirm) return setError('Las contraseñas no coinciden')

    setBusy(true)
    setError('')
    try {
      const needsConfirmation = await signUp(email.trim(), password)
      // Sin confirmación pendiente, la sesión ya está activa y la app cambia sola
      if (needsConfirmation) setSentTo(email.trim())
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (sentTo) {
    return (
      <AuthLayout
        title="Revisa tu correo"
        footer={<Link to="/entrar" className="font-medium text-accent hover:underline">Volver a entrar</Link>}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <MailCheck size={28} className="text-status-good" aria-hidden />
          <p className="text-sm text-ink-secondary">
            Te enviamos un enlace a <span className="font-medium text-ink">{sentTo}</span>.
            Ábrelo para activar tu cuenta y luego entra con tu contraseña.
          </p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Crear cuenta"
      subtitle="Empieza con categorías listas para usar."
      footer={<>¿Ya tienes cuenta? <Link to="/entrar" className="font-medium text-accent hover:underline">Entrar</Link></>}
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
          <label htmlFor="password" className="label">Contraseña</label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
          />
        </div>
        <div>
          <label htmlFor="confirm" className="label">Repite la contraseña</label>
          <PasswordInput
            id="confirm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <AuthError message={error} />
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>
    </AuthLayout>
  )
}
