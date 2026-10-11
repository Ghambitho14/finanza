import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { TransactionEditorProvider } from '@/components/TransactionEditor'
import { PageSkeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/lib/auth'
import { FinanceProvider } from '@/lib/finance-store'
import { Categorias } from '@/pages/Categorias'
import { EliminarCuenta } from '@/pages/EliminarCuenta'
import { Entrar } from '@/pages/Entrar'
import { Movimientos } from '@/pages/Movimientos'
import { NuevaClave } from '@/pages/NuevaClave'
import { Privacidad } from '@/pages/Privacidad'
import { RecuperarClave } from '@/pages/RecuperarClave'
import { Registro } from '@/pages/Registro'
import { Resumen } from '@/pages/Resumen'
import { DELETION_PATH, PRIVACY_PATH } from '@shared/legal'

// Recharts pesa más que el resto de la app: solo se descarga al abrir el histórico
const Historico = lazy(() => import('@/pages/Historico').then((m) => ({ default: m.Historico })))

const loadingScreen = (
  <div className="grid min-h-[60vh] place-items-center" role="status" aria-label="Cargando">
    <span className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-ink" />
  </div>
)

// Páginas públicas: Google Play enlaza a ellas, con o sin sesión
const publicRoutes = [
  <Route key="privacidad" path={PRIVACY_PATH} element={<Privacidad />} />,
  <Route key="eliminar-cuenta" path={DELETION_PATH} element={<EliminarCuenta />} />,
]

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
        {publicRoutes}
        <Route path="*" element={<Navigate to="/entrar" replace />} />
      </Routes>
    )
  }

  // `key`: al cambiar de usuario, los datos del anterior no quedan en memoria
  return (
    <FinanceProvider key={session.user.id}>
      <TransactionEditorProvider>
        <Routes>
          {publicRoutes}
          <Route element={<Layout />}>
            <Route index element={<Resumen />} />
            <Route path="movimientos" element={<Movimientos />} />
            <Route path="historico" element={<Suspense fallback={<PageSkeleton />}><Historico /></Suspense>} />
            <Route path="categorias" element={<Categorias />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </TransactionEditorProvider>
    </FinanceProvider>
  )
}
