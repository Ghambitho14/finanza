import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { AuthError, AuthLayout } from '@/components/AuthLayout'
import { authErrorMessage, useAuth } from '@/lib/auth'

export function RecuperarClave() {
  const { sendPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return setError('Escribe tu email')
    setBusy(true)
    setError('')
    try {
      await sendPasswordReset(email.trim())
      setSent(true)
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="Recuperar contraseña"
      subtitle={sent ? undefined : 'Te enviaremos un enlace para elegir una nueva.'}
      footer={<Link to="/entrar" className="font-medium text-accent hover:underline">Volver a entrar</Link>}
    >
      {sent ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <MailCheck size={28} className="text-status-good" aria-hidden />
          <p className="text-sm text-ink-secondary">
            Si existe una cuenta con <span className="font-medium text-ink">{email.trim()}</span>, te llegará un
            correo con el enlace para elegir una nueva contraseña.
          </p>
        </div>
      ) : (
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
          <AuthError message={error} />
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? 'Enviando…' : 'Enviar enlace'}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
