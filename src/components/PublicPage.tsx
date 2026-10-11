import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Wallet } from 'lucide-react'

interface Props {
  title: string
  updated?: string
  children: ReactNode
}

/** Páginas de texto abiertas a todos (privacidad, borrar datos). */
export function PublicPage({ title, updated, children }: Props) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-page" aria-hidden>
              <Wallet size={16} strokeWidth={2.25} />
            </span>
            <span className="text-base font-semibold tracking-tight">Finanzas</span>
          </Link>
          <Link to="/" className="btn-ghost">
            <ChevronLeft size={15} aria-hidden />
            Volver
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {updated && <p className="mt-1 text-sm text-ink-muted">Última actualización: {updated}</p>}
        <div className="mt-6 space-y-6 text-sm leading-relaxed text-ink-secondary [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-ink [&_a]:text-accent [&_a]:underline [&_li]:ml-5 [&_li]:list-disc [&_ol>li]:list-decimal">
          {children}
        </div>
      </main>
    </div>
  )
}
