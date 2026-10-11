import { createApi } from '@shared/api'
import { supabase } from './supabase'

export { ApiError, errorMessage } from '@shared/api'

export const api = createApi(supabase)
