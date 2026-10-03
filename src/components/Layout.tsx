import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { LogOut, Plus, Wallet } from 'lucide-react'
import { useToast } from '@/components/Toaster'
import { useTransactionEditor } from '@/components/TransactionEditor'
import { authErrorMessage, useAuth } from '@/lib/auth'
import { useFinance } from '@/lib/finance-store'

const NAV = [
  { to: '/', label: 'Resumen' },
  { to: '/movimientos', label: 'Movimientos' },
  { to: '/historico', label: 'Histórico' },
  { to: '/categorias', label: 'Categorías' },
]

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))
}

export function Layout() {
  const { openNew } = useTransactionEditor()
  const { status, loadError, reload } = useFinance()
  const { pathname } = useLocation()

  // Cada sección empieza arriba (el router conserva el scroll entre páginas)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  // Atajo: "n" abre un movimiento nuevo desde cualquier página
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'n' || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return
      if (document.querySelector('dialog[open]')) return
      e.preventDefault()
      openNew()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openNew])

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 sm:px-6">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-line-muted py-4">
        <NavLink to="/" className="flex items-center gap-2.5 rounded-md">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-page" aria-hidden>
            <Wallet size={16} strokeWidth={2.25} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">Finanzas</span>
        </NavLink>

        <nav aria-label="Secciones" className="order-last grid w-full grid-cols-4 gap-1 sm:order-none sm:flex sm:w-auto">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-md px-1 py-1.5 text-center text-[13px] transition-colors sm:px-3 sm:text-sm ${
                  isActive ? 'bg-surface-raised font-medium text-ink' : 'text-ink-secondary hover:text-ink'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => openNew()}
            className="btn-primary"
            title="Nuevo movimiento (tecla N)"
          >
            <Plus size={16} aria-hidden />
            <span className="hidden sm:inline">Nuevo movimiento</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
          <UserMenu />
        </div>
      </header>

      <main className="flex-1 py-6">
        {status === 'loading' ? (
          <p className="py-20 text-center text-ink-muted">Cargando…</p>
        ) : status === 'error' ? (
          <div className="mx-auto max-w-md py-20 text-center">
            <p className="font-medium">No se pudieron cargar tus datos</p>
            <p className="mt-1 text-ink-secondary">{loadError}</p>
            <button onClick={reload} className="btn-secondary mt-4">Reintentar</button>
          </div>
        ) : (
          <Outlet />
        )}
      </main>

      <footer className="border-t border-line-muted py-6 text-center text-xs text-ink-muted">
        Finanzas · hecho por Belandria Jhon
      </footer>
    </div>
  )
}

function UserMenu() {
  const { session, signOut } = useAuth()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const email = session?.user.email ?? ''

  // Se cierra al hacer clic fuera o con Escape
  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (err) {
      toast({ kind: 'error', text: authErrorMessage(err) })
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Cuenta"
        title={email}
        className="grid h-9 w-9 place-items-center rounded-full border border-line bg-surface-raised text-sm font-semibold uppercase text-ink transition-colors hover:bg-surface-hover"
      >
        {email.charAt(0) || '?'}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-11 z-30 w-64 rounded-lg border border-line bg-surface-raised p-1 shadow-xl shadow-black/40">
          <p className="truncate px-3 py-2 text-xs text-ink-muted">{email}</p>
          <button
            role="menuitem"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-ink hover:bg-surface-hover"
          >
            <LogOut size={15} aria-hidden />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
