import { NavLink } from 'react-router-dom'
import { ArrowLeftRight, ChartColumn, LayoutDashboard, Tags, Wallet, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

export const NAV: NavItem[] = [
  { to: '/', label: 'Resumen', icon: LayoutDashboard },
  { to: '/movimientos', label: 'Movimientos', icon: ArrowLeftRight },
  { to: '/historico', label: 'Histórico', icon: ChartColumn },
  { to: '/categorias', label: 'Categorías', icon: Tags },
]

/** Logo y nombre de la app; lleva al resumen. */
export function Brand() {
  return (
    <NavLink to="/" className="flex items-center gap-2.5 rounded-md">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-page" aria-hidden>
        <Wallet size={16} strokeWidth={2.25} />
      </span>
      <span className="text-[15px] font-semibold tracking-tight">Finanzas</span>
    </NavLink>
  )
}
