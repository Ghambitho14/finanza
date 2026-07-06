import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'

export function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Completa todos los campos')
      return
    }

    setSubmitting(true)
    const err = await login(email.trim(), password)
    setSubmitting(false)

    if (err) {
      setError(err)
    } else {
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[400px] items-center justify-center px-5">
      <div className="w-full rounded-lg border border-border bg-bg-elevated p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-green to-green-dark font-mono text-lg font-bold text-bg">
            G
          </div>
          <h1 className="font-mono text-lg font-semibold text-txt-primary">
            iniciar sesión
          </h1>
          <p className="mt-1 font-mono text-xs text-txt-tertiary">
            finanzas personales · datos locales
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block font-mono text-xs text-txt-secondary">
              email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
              className="w-full rounded-md border border-border bg-bg-elevated-2 px-3 py-2 font-mono text-sm text-txt-primary placeholder:text-txt-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue focus-visible:outline-offset-1"
            />
          </div>

          <div>
            <label className="mb-1 block font-mono text-xs text-txt-secondary">
              contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="··········"
              autoComplete="current-password"
              className="w-full rounded-md border border-border bg-bg-elevated-2 px-3 py-2 font-mono text-sm text-txt-primary placeholder:text-txt-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue focus-visible:outline-offset-1"
            />
          </div>

          {error && (
            <p className="font-mono text-xs text-red">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md border border-green bg-green-bg px-4 py-2 font-mono text-sm font-semibold text-green transition-colors hover:bg-green-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'entrando…' : 'entrar'}
          </button>
        </form>

        <p className="mt-5 text-center font-mono text-xs text-txt-tertiary">
          ¿no tienes cuenta?{' '}
          <Link
            to="/register"
            className="text-blue transition-colors hover:text-blue/80"
          >
            registrarse
          </Link>
        </p>
      </div>
    </div>
  )
}
