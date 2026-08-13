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

        // Calling reveal() synchronously on mount never animates: React
        // commits the "hidden" DOM and the "visible" state update in the
        // same tick, so the browser paints straight to the final state
        // with nothing to transition from. Deferring by two animation
        // frames guarantees the browser paints the hidden style first
        // (this matters both for the very first load — where the splash
        // loading screen covers the mount — and for later route changes,
        // where every page mounts fresh and would otherwise snap into
        // view instantly).
        const revealNextFrame = () => requestAnimationFrame(() => requestAnimationFrame(reveal))

        if (isInitialSyncComplete) {
            revealNextFrame()
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
