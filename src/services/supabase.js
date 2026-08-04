import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ndcrlkehwgcqfligrxim.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kY3Jsa2Vod2djcWZsaWdyeGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NzEzNTgsImV4cCI6MjEwMTM0NzM1OH0.ah2LUpV_WP8ZOUDe7PhgSZnScz1p00b12H4oj_MsovA'

export const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
        auth: {
            storageKey: 'meraki_supabase_auth_token',
            storage: typeof window !== 'undefined' ? window.localStorage : undefined,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            lock: async (name, acquireTimeout, fn) => await fn()
        }
    }
)

