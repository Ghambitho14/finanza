import { NavLink } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useTransactionEditor } from '@/components/TransactionEditor'
import { Brand, NAV } from '@/components/shell/nav'
import { UserMenu } from '@/components/shell/UserMenu'

/** Navegación fija a la izquierda en pantallas grandes. */
export function Sidebar() {
  const { openNew } = useTransactionEditor()

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-surface lg:flex">
      <div className="flex h-16 shrink-0 items-center px-5">
        <Brand />
      </div>

      <div className="shrink-0 px-3">
        <button onClick={() => openNew()} className="btn-primary w-full" title="Nuevo movimiento (tecla N)">
          <Plus size={16} aria-hidden />
          Nuevo movimiento
          <kbd className="ml-auto rounded border border-page/25 px-1.5 text-[11px] font-medium leading-4 text-page/70">N</kbd>
        </button>
      </div>

      <nav aria-label="Secciones" className="mt-5 min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive ? 'bg-surface-hover font-medium text-ink' : 'text-ink-secondary hover:bg-surface-raised hover:text-ink'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} className={isActive ? 'text-accent' : ''} aria-hidden />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="shrink-0 border-t border-line p-3">
        <UserMenu variant="sidebar" />
        <p className="mt-2 px-2 text-[11px] text-ink-muted">Finanzas · hecho por Belandria Jhon</p>
      </div>
    </aside>
  )
}
