import { NavLink } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useTransactionEditor } from '@/components/TransactionEditor'
import { Brand, NAV, type NavItem } from '@/components/shell/nav'
import { UserMenu } from '@/components/shell/UserMenu'

/** Barra superior del teléfono: logo y cuenta. */
export function MobileTopBar() {
  return (
    <header className="sticky top-0 z-20 border-b border-line-muted bg-page/85 pt-[env(safe-area-inset-top)] backdrop-blur-md lg:hidden">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        <Brand />
        <UserMenu variant="compact" />
      </div>
    </header>
  )
}

/** Barra inferior del teléfono: secciones y botón central para registrar. */
export function BottomNav() {
  const { openNew } = useTransactionEditor()
  const [first, second, ...rest] = NAV

  return (
    <nav
      aria-label="Secciones"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-center px-2">
        <BottomLink item={first} />
        <BottomLink item={second} />
        <div className="flex justify-center">
          <button
            onClick={() => openNew()}
            aria-label="Nuevo movimiento"
            className="-mt-6 grid h-14 w-14 place-items-center rounded-full bg-ink text-page shadow-lg shadow-black/25 ring-4 ring-page transition-transform active:scale-95"
          >
            <Plus size={24} strokeWidth={2.25} aria-hidden />
          </button>
        </div>
        {rest.map((item) => <BottomLink key={item.to} item={item} />)}
      </div>
    </nav>
  )
}

function BottomLink({ item: { to, label, icon: Icon } }: { item: NavItem }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 rounded-lg py-1.5 text-[11px] transition-colors ${
          isActive ? 'font-medium text-ink' : 'text-ink-muted hover:text-ink'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={20} strokeWidth={isActive ? 2.25 : 1.75} className={isActive ? 'text-accent' : ''} aria-hidden />
          {label}
        </>
      )}
    </NavLink>
  )
}
