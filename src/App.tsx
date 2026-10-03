import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { TransactionEditorProvider } from '@/components/TransactionEditor'
import { useAuth } from '@/lib/auth'
import { FinanceProvider } from '@/lib/finance-store'
import { Categorias } from '@/pages/Categorias'
import { Entrar } from '@/pages/Entrar'
import { Movimientos } from '@/pages/Movimientos'
import { NuevaClave } from '@/pages/NuevaClave'
import { RecuperarClave } from '@/pages/RecuperarClave'
import { Registro } from '@/pages/Registro'
import { Resumen } from '@/pages/Resumen'

// Recharts pesa más que el resto de la app: solo se descarga al abrir el histórico
const Historico = lazy(() => import('@/pages/Historico').then((m) => ({ default: m.Historico })))

const loadingScreen = <p className="py-20 text-center text-ink-muted">Cargando…</p>

export default function App() {
  const { session, loading, recovering } = useAuth()

  if (loading) return loadingScreen
  if (recovering) return <NuevaClave />

  if (!session) {
    return (
      <Routes>
        <Route path="entrar" element={<Entrar />} />
        <Route path="registro" element={<Registro />} />
        <Route path="recuperar" element={<RecuperarClave />} />
        <Route path="*" element={<Navigate to="/entrar" replace />} />
      </Routes>
    )
  }

  // `key`: al cambiar de usuario, los datos del anterior no quedan en memoria
  return (
    <FinanceProvider key={session.user.id}>
      <TransactionEditorProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Resumen />} />
            <Route path="movimientos" element={<Movimientos />} />
            <Route path="historico" element={<Suspense fallback={loadingScreen}><Historico /></Suspense>} />
            <Route path="categorias" element={<Categorias />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </TransactionEditorProvider>
    </FinanceProvider>
  )
}
