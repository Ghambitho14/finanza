import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error('Faltan VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY en .env')
}

/**
 * La clave publicable puede ir en el navegador: lo que protege los datos son
 * las políticas RLS (cada usuario solo accede a sus filas).
 */
export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // Procesa los enlaces de confirmación y recuperación de los correos
    detectSessionInUrl: true,
  },
})
