import { useState, useEffect } from 'react'
import { getSession, getUser, getUserProfile, onAuthStateChange } from '../services/auth.js'

export function useAuth() {
    const [session, setSession] = useState(null)
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [admin, setAdmin] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadAuth() {
            const { session: currentSession } = await getSession()
            setSession(currentSession)

            if (currentSession) {
                const { user: currentUser } = await getUser()
                setUser(currentUser)

                if (currentUser) {
                    const { profile: userProfile } = await getUserProfile(currentUser.id)
                    setProfile(userProfile)
                    setAdmin(userProfile?.tipo_user === 'admin')
                }
            }

            setLoading(false)
        }

        loadAuth()

        const { data: { subscription } } = onAuthStateChange(async (event, newSession) => {
            try {
                setSession(newSession)

                if (newSession) {
                    const { user: newUser } = await getUser()
                    setUser(newUser)

                    if (newUser) {
                        const { profile: userProfile } = await getUserProfile(newUser.id)
                        setProfile(userProfile)
                        setAdmin(userProfile?.tipo_user === 'admin')
                    }
                } else {
                    setUser(null)
                    setProfile(null)
                    setAdmin(false)
                }
            } catch (e) {
                console.error('Erro em useAuth onAuthStateChange:', e)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    return { session, user, profile, admin, loading }
}
