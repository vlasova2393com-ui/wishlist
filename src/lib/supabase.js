import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://viwqlxtndngwbrjddnpc.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpd3FseHRuZG5nd2JyamRkbnBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzODc4NDYsImV4cCI6MjEwNDk2Mzg0Nn0.rzQ56AXtWu2qOquT1pEXAI89gFRyhqNHjHTcKkE70f0'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
