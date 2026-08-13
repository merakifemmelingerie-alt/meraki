import { useEffect, useRef, useState } from 'react'
import { isInitialSyncComplete } from '../services/database.js'

/**
 * useScrollReveal — Reveals element when it scrolls into view.
 * Uses scroll event + getBoundingClientRect for maximum compatibility.
 * Triggers once; cleans up listeners after reveal.
 */
export function useScrollReveal() {
    const ref = useRef(null)
    const [isVisible, setIsVisible] = useState(false)
    const revealed = useRef(false)

    useEffect(() => {
        const el = ref.current
        if (!el) return

        // Respect reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setIsVisible(true)
            revealed.current = true
            return
        }

        const reveal = () => {
            if (revealed.current || !el) return
            const rect = el.getBoundingClientRect()
            const viewH = window.innerHeight || document.documentElement.clientHeight
            // Trigger when top of element is within the viewport (80px from bottom edge)
            if (rect.top < viewH - 80 && rect.bottom > 0) {
                setIsVisible(true)
                revealed.current = true
                window.removeEventListener('scroll', reveal)
                window.removeEventListener('resize', reveal)
            }
        }

        // The whole page mounts underneath the splash loading screen, so an
        // immediate check here would mark above-the-fold elements as
        // "visible" while they're still hidden behind it — by the time the
        // splash disappears the fade-up animation has already happened
        // unseen. Wait for the splash to actually finish, then reveal on
        // the next paint so the browser has a frame to register the hidden
        // state before transitioning to visible.
        const revealNextFrame = () => requestAnimationFrame(() => requestAnimationFrame(reveal))

        if (isInitialSyncComplete) {
            reveal()
        } else {
            window.addEventListener('meraki_db_synced', revealNextFrame, { once: true })
        }

        window.addEventListener('scroll', reveal)
        window.addEventListener('resize', reveal)

        return () => {
            window.removeEventListener('meraki_db_synced', revealNextFrame)
            window.removeEventListener('scroll', reveal)
            window.removeEventListener('resize', reveal)
        }
    }, [])

    return { ref, isVisible }
}
