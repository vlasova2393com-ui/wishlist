import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('Supabase environment variables are missing.')
}

export const supabase = createClient(SUPABASE_URL || 'https://viwqlxtndngwbrjddnpc.supabase.co', SUPABASE_KEY || 'missing-key')
