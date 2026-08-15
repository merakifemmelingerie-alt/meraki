import { supabase } from './supabase.js'

// Listener store for onAuthStateChange
const authListeners = new Set()

// Setup default listener to sync auth changes from Supabase
supabase.auth.onAuthStateChange((event, session) => {
    for (const listener of authListeners) {
        try {
            const res = listener(event, session)
            if (res && typeof res.catch === 'function') {
                res.catch(e => console.error('Erro assíncrono no ouvinte de autenticação:', e))
            }
        } catch (e) {
            console.error('Erro síncrono no ouvinte de autenticação:', e)
        }
    }
})

export async function signUp(email, password, fullName, phone = '', cpf = '') {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        })
        if (error) throw error

        const user = data?.user
        if (user) {
            // Check if profile exists, if not, create it
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    email,
                    full_name: fullName,
                    phone: phone || null,
                    cpf: cpf || null,
                    tipo_user: (email === 'admin' || email === 'admin@meraki.com' || email === 'admin@merakimodafeminina.com.br') ? 'admin' : 'customer'
                })
            if (profileError) console.error('Error creating profile:', profileError)
        }

        return { data, error: null }
    } catch (e) {
        return { data: null, error: e }
    }
}

export async function signIn(email, password) {
    try {
        // Safe check for quick local dev fallback
        let targetEmail = email
        if (email === 'admin') {
            targetEmail = 'admin@meraki.com'
        }
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: targetEmail,
            password
        })
        if (error) throw error
        return { data, error: null }
    } catch (e) {
        return { data: null, error: e }
    }
}

export async function signOut() {
    try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        return { error: null }
    } catch (e) {
        return { error: e }
    }
}

export async function signInWithProvider(provider) {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: provider.toLowerCase(),
            options: {
                redirectTo: window.location.origin + '/auth'
            }
        })
        if (error) throw error
        return { data, error: null }
    } catch (e) {
        return { data: null, error: e }
    }
}

export async function getSession() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        return { session, error: null }
    } catch (e) {
        return { session: null, error: e }
    }
}

export async function getUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) throw error
        return { user, error: null }
    } catch (e) {
        return { user: null, error: e }
    }
}

export async function getUserProfile(userId) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle()

        if (error) throw error

        if (!data) {
            // Primeiro login desse usuario (ex: via Google/Facebook, que nao passa pelo
            // signUp()) e ainda nao existe uma linha em profiles. Cria agora, pra ele
            // ficar registrado como cliente de verdade no banco.
            const { data: { user } } = await supabase.auth.getUser()
            const newProfile = {
                id: userId,
                email: user?.email || '',
                full_name: user?.user_metadata?.full_name || user?.user_metadata?.name || '',
                tipo_user: 'customer'
            }
            const { data: inserted, error: insertError } = await supabase
                .from('profiles')
                .upsert(newProfile)
                .select()
                .maybeSingle()
            if (insertError) {
                console.error('Erro ao criar perfil de cliente no primeiro login:', insertError)
                return { profile: newProfile, error: null }
            }
            return { profile: inserted || newProfile, error: null }
        }

        return { profile: data, error: null }
    } catch (e) {
        return { profile: null, error: e }
    }
}

export async function updateUserProfile(userId, updates) {
    try {
        const allowedColumns = [
            'id', 'email', 'full_name', 'phone', 'cpf', 'address', 
            'cep', 'number', 'complement', 'neighborhood', 'city', 'state', 
            'addresses', 'tipo_user', 'created_at'
        ]
        const cleanPayload = {}
        Object.keys(updates || {}).forEach(key => {
            if (allowedColumns.includes(key)) {
                cleanPayload[key] = updates[key]
            }
        })

        // 1. Try to update existing profile row in Supabase
        const { data: updatedData, error: updateError } = await supabase
            .from('profiles')
            .update(cleanPayload)
            .eq('id', userId)
            .select()
            .maybeSingle()

        if (!updateError && updatedData) {
            return { profile: updatedData, error: null }
        }

        // 2. If profile row doesn't exist yet, insert it
        const insertPayload = { id: userId, ...cleanPayload }
        const { data: insertedData, error: insertError } = await supabase
            .from('profiles')
            .insert([insertPayload])
            .select()
            .maybeSingle()

        if (insertError) {
            console.error('Error inserting user profile in Supabase:', insertError)
            throw insertError
        }
        return { profile: insertedData, error: null }
    } catch (e) {
        console.error('Error updating user profile in Supabase:', e)
        return { profile: null, error: e }
    }
}

export function onAuthStateChange(callback) {
    authListeners.add(callback)
    return {
        data: {
            subscription: {
                unsubscribe: () => {
                    authListeners.delete(callback)
                }
            }
        }
    }
}

export async function resetPasswordForEmail(email, redirectUrl) {
    try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: redirectUrl || window.location.origin + '/auth?type=recovery'
        })
        if (error) throw error
        return { data, error: null }
    } catch (e) {
        return { data: null, error: e }
    }
}

export async function updatePassword(newPassword) {
    try {
        const { data, error } = await supabase.auth.updateUser({
            password: newPassword
        })
        if (error) throw error
        return { data, error: null }
    } catch (e) {
        return { data: null, error: e }
    }
}
