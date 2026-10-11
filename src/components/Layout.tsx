import { useEffect } from 'react'
import { Outlet, useLocation, useSearchParams } from 'react-router-dom'
import { CloudOff } from 'lucide-react'
import { useTransactionEditor } from '@/components/TransactionEditor'
import { BottomNav, MobileTopBar } from '@/components/shell/MobileNav'
import { Sidebar } from '@/components/shell/Sidebar'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageSkeleton } from '@/components/ui/Skeleton'
import { useFinance } from '@/lib/finance-store'

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))
}

export function Layout() {
  const { openNew } = useTransactionEditor()
  const { status, loadError, reload } = useFinance()
  const { pathname } = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  // Cada sección empieza arriba (el router conserva el scroll entre páginas)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  // Acceso directo de la app instalada (?nuevo=1): abre un movimiento nuevo
  // cuando los datos ya cargaron, y limpia la URL
  useEffect(() => {
    if (status !== 'ready' || !searchParams.has('nuevo')) return
    setSearchParams((params) => {
      params.delete('nuevo')
      return params
    }, { replace: true })
    openNew()
  }, [status, searchParams, setSearchParams, openNew])

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
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:pl-60">
        <MobileTopBar />
        {/* Abajo deja lugar a la barra inferior del teléfono */}
        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">
          {status === 'loading' ? (
            <PageSkeleton />
          ) : status === 'error' ? (
            <div className="card">
              <EmptyState
                icon={CloudOff}
                title="No se pudieron cargar tus datos"
                action={<button onClick={reload} className="btn-secondary">Reintentar</button>}
              >
                {loadError}
              </EmptyState>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
