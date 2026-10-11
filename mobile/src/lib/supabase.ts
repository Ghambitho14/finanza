// En Android instala un `localStorage` persistente sobre SQLite (lo que
// recomienda Expo para Supabase); en la vista web no hace nada.
import 'expo-sqlite/localStorage/install'

import { AppState, Platform } from 'react-native'
import { createClient } from '@supabase/supabase-js'
import { env } from './env'

/**
 * La clave publicable puede ir en la app: lo que protege los datos son las
 * políticas RLS (cada usuario solo accede a sus filas).
 *
 * Flujo implícito (el de siempre, sin PKCE): los enlaces de los correos se
 * abren y se completan en la web, que no tendría el verificador PKCE guardado
 * en el teléfono.
 */
export const supabase = createClient(env.supabaseUrl || 'http://localhost', env.supabaseKey || 'missing', {
  auth: {
    storage: globalThis.localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})

// En el teléfono el token se refresca solo mientras la app está abierta
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh()
    else supabase.auth.stopAutoRefresh()
  })
}
