import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ndcrlkehwgcqfligrxim.supabase.co'
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kY3Jsa2Vod2djcWZsaWdyeGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NzEzNTgsImV4cCI6MjEwMTM0NzM1OH0.ah2LUpV_WP8ZOUDe7PhgSZnScz1p00b12H4oj_MsovA'

// Clear expired or corrupt auth tokens from localStorage before initializing Supabase client
if (typeof window !== 'undefined') {
    try {
        const rawToken = localStorage.getItem('meraki_supabase_auth_token')
        if (rawToken) {
            const parsed = JSON.parse(rawToken)
            if (parsed && parsed.expires_at && (parsed.expires_at * 1000) < (Date.now() - 60000)) {
                console.warn('⚠️ Token do Supabase expirado encontrado no localStorage. Limpando para evitar erros 401...')
                localStorage.removeItem('meraki_supabase_auth_token')
            }
        }
    } catch (e) {
        localStorage.removeItem('meraki_supabase_auth_token')
    }
}

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


