import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://viwqlxtndngwbrjddnpc.supabase.co'
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_Gt3T079sn11GfpPYyq4iWw_2zoWII6h'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
