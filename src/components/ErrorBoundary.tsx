import { Component, type ReactNode } from 'react'

interface State {
  error: Error | null
}

/** Si algo falla al renderizar, muestra un aviso en vez de una pantalla en blanco. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('[app] error de interfaz', error)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
        <p className="text-base font-semibold">Algo salió mal</p>
        <p className="mt-1 text-ink-secondary">Tus datos están a salvo. Recarga la página para continuar.</p>
        <button onClick={() => window.location.reload()} className="btn-primary mt-5">Recargar</button>
      </div>
    )
  }
}
