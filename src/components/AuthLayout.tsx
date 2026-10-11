import { useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Eye, EyeOff, LayoutDashboard, ReceiptText, ShieldCheck, Wallet } from 'lucide-react'
import { InstallAppButton } from '@/components/InstallApp'

interface Props {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

/** Marco común de las pantallas de acceso (entrar, crear cuenta, recuperar). */
const BENEFITS = [
  { icon: LayoutDashboard, title: 'Tu mes de un vistazo', text: 'Cuánto te queda, qué falta por pagar y cómo vas frente al mes anterior.' },
  { icon: ReceiptText, title: 'Cuentas sin olvidos', text: 'Marca tus gastos fijos como pagados y anota los gastos del día en segundos.' },
  { icon: ShieldCheck, title: 'Solo tú ves tus datos', text: 'Cada cuenta queda aislada y protegida en la base de datos.' },
]

export function AuthLayout({ title, subtitle, children, footer }: Props) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* Panel de marca: solo en pantallas grandes */}
      <aside className="relative hidden overflow-hidden border-r border-line bg-surface lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl"
          aria-hidden
        />
        <div className="relative flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-ink text-page" aria-hidden>
            <Wallet size={18} strokeWidth={2.25} />
          </span>
          <span className="text-base font-semibold tracking-tight">Finanzas</span>
        </div>
        <div className="relative max-w-md">
          <p className="text-3xl font-semibold leading-tight tracking-tight">
            Tus ingresos, gastos y ahorro, ordenados mes a mes.
          </p>
          <ul className="mt-10 space-y-6">
            {BENEFITS.map(({ icon: Icon, title: benefit, text }) => (
              <li key={benefit} className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line bg-surface-raised text-accent" aria-hidden>
                  <Icon size={18} />
                </span>
                <span>
                  <span className="block font-medium">{benefit}</span>
                  <span className="mt-0.5 block text-sm text-ink-secondary">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-ink-muted">Finanzas · hecho por Belandria Jhon</p>
      </aside>

      <main className="flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex flex-col items-center text-center lg:items-start lg:text-left">
            <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-ink text-page lg:hidden" aria-hidden>
              <Wallet size={20} strokeWidth={2.25} />
            </span>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-ink-secondary">{subtitle}</p>}
          </div>
          <div className="card p-5 sm:p-6">{children}</div>
          {footer && <div className="mt-5 text-center text-sm text-ink-secondary">{footer}</div>}
          <div className="mt-8 text-center">
            <InstallAppButton variant="link" />
          </div>
        </div>
      </main>
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
