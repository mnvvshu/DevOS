import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xetmcyxbihverytlsvuv.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhldG1jeXhiaWh2ZXJ5dGxzdnV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5Njg5NDEsImV4cCI6MjEwNDU0NDk0MX0.6Gfj-VpDOxYN6OXEhtl8SAnbptXwmKj9v3KayBmY2ZE'

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)
