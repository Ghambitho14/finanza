import { Link } from 'react-router-dom'
import { PublicPage } from '@/components/PublicPage'
import { CONTACT_EMAIL, DELETE_DATA_COPY, PRIVACY_PATH } from '@shared/legal'

const MAIL_SUBJECT = encodeURIComponent('Eliminar mi cuenta de Finanzas')

export function EliminarCuenta() {
  return (
    <PublicPage title="Borrar tus datos y tu cuenta">
      <section>
        <h2>Borrar tus datos de Finanzas</h2>
        <p>Lo puedes hacer tú mismo, en la app Android o en la web:</p>
        <ol className="mt-2 space-y-1">
          <li>Entra con tu email y contraseña.</li>
          <li>Abre el menú de tu cuenta (tu inicial, arriba a la derecha o abajo en la barra lateral).</li>
          <li>Toca «{DELETE_DATA_COPY.action}» y confirma.</li>
        </ol>
        <p className="mt-2">
          Se borran al instante y para siempre todos tus movimientos y categorías.
        </p>
      </section>

      <section>
        <h2>Eliminar también tu cuenta de acceso</h2>
        <p>
          Escríbenos a{' '}
          <a href={`mailto:${CONTACT_EMAIL}?subject=${MAIL_SUBJECT}`}>{CONTACT_EMAIL}</a>{' '}
          desde el email de tu cuenta, con el asunto «Eliminar mi cuenta de Finanzas». La eliminamos, junto con
          todos sus datos, en un plazo máximo de 30 días y te avisamos cuando esté hecho.
        </p>
      </section>

      <p>
        Más detalles en la <Link to={PRIVACY_PATH}>política de privacidad</Link>.
      </p>
    </PublicPage>
  )
}
