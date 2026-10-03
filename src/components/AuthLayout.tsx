import { useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Eye, EyeOff, Wallet } from 'lucide-react'

interface Props {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

/** Marco común de las pantallas de acceso (entrar, crear cuenta, recuperar). */
export function AuthLayout({ title, subtitle, children, footer }: Props) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-ink text-page" aria-hidden>
            <Wallet size={20} strokeWidth={2.25} />
          </span>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-ink-secondary">{subtitle}</p>}
        </div>
        <div className="card p-5">{children}</div>
        {footer && <div className="mt-5 text-center text-sm text-ink-secondary">{footer}</div>}
      </div>
    </div>
  )
}

export function AuthError({ message }: { message: string }) {
  if (!message) return null
  return <p role="alert" className="text-sm text-negative">{message}</p>
}

/** Contraseña con botón para mostrarla (útil en el teléfono). */
export function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input {...props} type={visible ? 'text' : 'password'} className="field w-full pr-10" />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="icon-btn absolute right-0.5 top-1/2 -translate-y-1/2"
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        {visible ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  )
}
