import { useState, type FormEvent } from 'react'
import { AuthError, AuthLayout, PasswordInput } from '@/components/AuthLayout'
import { useToast } from '@/components/Toaster'
import { MIN_PASSWORD_LENGTH, authErrorMessage, useAuth } from '@/lib/auth'

/** Se muestra al volver desde el correo de recuperación. */
export function NuevaClave() {
  const { updatePassword } = useAuth()
  const toast = useToast()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (password.length < MIN_PASSWORD_LENGTH) {
      return setError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`)
    }
    if (password !== confirm) return setError('Las contraseñas no coinciden')

    setBusy(true)
    setError('')
    try {
      await updatePassword(password)
      toast({ text: 'Contraseña actualizada' })
    } catch (err) {
      setError(authErrorMessage(err))
      setBusy(false)
    }
  }

  return (
    <AuthLayout title="Elige una nueva contraseña">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="password" className="label">Nueva contraseña</label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
            autoFocus
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
          {busy ? 'Guardando…' : 'Guardar contraseña'}
        </button>
      </form>
    </AuthLayout>
  )
}
