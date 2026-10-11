import { Link } from 'react-router-dom'
import { PublicPage } from '@/components/PublicPage'
import { CONTACT_EMAIL, DELETION_PATH } from '@shared/legal'

export function Privacidad() {
  return (
    <PublicPage title="Política de privacidad" updated="11 de octubre de 2026">
      <section>
        <p>
          Finanzas es una app personal para anotar ingresos, gastos y ahorro, disponible en la web y en Android.
          Esta política explica qué datos guarda, para qué y cómo puedes borrarlos. La responsable es Belandria Jhon
          (contacto: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>).
        </p>
      </section>

      <section>
        <h2>Qué datos guardamos</h2>
        <ul>
          <li>Tu email y tu contraseña (cifrada), para crear tu cuenta y entrar.</li>
          <li>Los movimientos y categorías que tú anotas: descripción, monto, fecha, tipo y presupuesto.</li>
        </ul>
        <p className="mt-2">
          No pedimos tu nombre, ubicación, contactos ni acceso a tus cuentas bancarias. La app no mueve dinero.
        </p>
      </section>

      <section>
        <h2>Para qué los usamos</h2>
        <p>
          Solo para mostrarte tus finanzas y que puedas usarlas desde cualquier dispositivo. No hay publicidad, no se
          venden ni se comparten tus datos con terceros y no usamos herramientas de analítica ni de seguimiento.
        </p>
      </section>

      <section>
        <h2>Dónde se guardan</h2>
        <p>
          Los datos se guardan en Supabase (base de datos y cuentas) y la web se sirve desde Vercel. La conexión va
          cifrada (HTTPS) y cada cuenta solo puede leer y modificar sus propios datos.
        </p>
      </section>

      <section>
        <h2>Cuánto tiempo</h2>
        <p>
          Mientras tengas tu cuenta. Puedes exportar tus movimientos a CSV desde Movimientos cuando quieras.
        </p>
      </section>

      <section>
        <h2>Cómo borrar tus datos</h2>
        <p>
          Desde el menú de tu cuenta, en «Borrar mis datos», se eliminan al instante todos tus movimientos y
          categorías. Si además quieres eliminar tu cuenta de acceso, escríbenos. Los pasos están en{' '}
          <Link to={DELETION_PATH}>Borrar tus datos y tu cuenta</Link>.
        </p>
      </section>

      <section>
        <h2>Menores de edad</h2>
        <p>Finanzas no está dirigida a menores de 18 años.</p>
      </section>

      <section>
        <h2>Cambios</h2>
        <p>Si esta política cambia, actualizaremos esta página y su fecha.</p>
      </section>
    </PublicPage>
  )
}
