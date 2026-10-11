import { useEffect, useRef, useState } from 'react'
import { ChevronsUpDown, LogOut, Monitor, Moon, Sun } from 'lucide-react'
import { InstallAppButton } from '@/components/InstallApp'
import { useToast } from '@/components/Toaster'
import { authErrorMessage, useAuth } from '@/lib/auth'
import { useTheme, type ThemePreference } from '@/lib/theme-mode'

const THEMES: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'system', label: 'Sistema', icon: Monitor },
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
]

interface Props {
  /** `sidebar`: fila ancha al pie de la barra lateral, abre hacia arriba. `compact`: solo el avatar. */
  variant: 'sidebar' | 'compact'
}

export function UserMenu({ variant }: Props) {
  const { session, signOut } = useAuth()
  const { preference, setPreference } = useTheme()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const email = session?.user.email ?? ''
  const initial = email.charAt(0) || '?'

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

  const avatar = (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent/15 text-sm font-semibold uppercase text-accent" aria-hidden>
      {initial}
    </span>
  )

  return (
    <div ref={ref} className="relative">
      {variant === 'sidebar' ? (
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="menu"
          className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface-hover"
        >
          {avatar}
          <span className="min-w-0 flex-1">
            <span className="block text-xs text-ink-muted">Tu cuenta</span>
            <span className="block truncate text-sm text-ink">{email}</span>
          </span>
          <ChevronsUpDown size={15} className="shrink-0 text-ink-muted" aria-hidden />
        </button>
      ) : (
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="Cuenta"
          title={email}
          className="rounded-full transition-opacity hover:opacity-80"
        >
          {avatar}
        </button>
      )}

      {open && (
        <div
          role="menu"
          className={`absolute z-40 w-64 animate-pop-in rounded-xl border border-line bg-surface-raised p-1.5 shadow-xl shadow-black/20 ${
            variant === 'sidebar' ? 'bottom-full left-0 mb-2' : 'right-0 top-11'
          }`}
        >
          <p className="truncate px-2.5 py-2 text-xs text-ink-muted">{email}</p>

          <div className="px-2.5 pb-2 pt-1">
            <p className="mb-1.5 text-xs font-medium text-ink-secondary">Tema</p>
            <div className="grid grid-cols-3 gap-1 rounded-lg border border-line bg-surface p-0.5" role="group" aria-label="Tema">
              {THEMES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setPreference(value)}
                  aria-pressed={preference === value}
                  className={`flex flex-col items-center gap-0.5 rounded-md py-1.5 text-[11px] transition-colors ${
                    preference === value ? 'bg-surface-hover font-medium text-ink' : 'text-ink-secondary hover:text-ink'
                  }`}
                >
                  <Icon size={14} aria-hidden />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="my-1 border-t border-line" />
          <InstallAppButton variant="menu" onDone={() => setOpen(false)} />
          <button
            role="menuitem"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-ink hover:bg-surface-hover"
          >
            <LogOut size={15} aria-hidden />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
