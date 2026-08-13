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

        const isInView = () => {
            const rect = el.getBoundingClientRect()
            const viewH = window.innerHeight || document.documentElement.clientHeight
            // Trigger when top of element is within the viewport (80px from bottom edge)
            return rect.top < viewH - 80 && rect.bottom > 0
        }

        const commitReveal = () => {
            if (revealed.current) return
            setIsVisible(true)
            revealed.current = true
            window.removeEventListener('scroll', checkAndReveal)
            window.removeEventListener('resize', checkAndReveal)
        }

        // Every path that can reveal an element — the initial mount check,
        // a 'scroll' event, a 'resize' event — must defer the actual state
        // change by two animation frames, or the browser never paints the
        // "hidden" style before switching to "visible" and the CSS
        // transition has nothing to animate from (it just snaps into
        // view). This matters even for scroll: navigating to a new page
        // resets the scroll position to the top, which fires a native
        // 'scroll' event synchronously and would otherwise reveal
        // above-the-fold content instantly.
        const checkAndReveal = () => {
            if (revealed.current || !el || !isInView()) return
            requestAnimationFrame(() => requestAnimationFrame(commitReveal))
        }

        if (isInitialSyncComplete) {
            checkAndReveal()
        } else {
            window.addEventListener('meraki_db_synced', checkAndReveal, { once: true })
        }

        window.addEventListener('scroll', checkAndReveal)
        window.addEventListener('resize', checkAndReveal)

        return () => {
            window.removeEventListener('meraki_db_synced', checkAndReveal)
            window.removeEventListener('scroll', checkAndReveal)
            window.removeEventListener('resize', checkAndReveal)
        }
    }, [])

    return { ref, isVisible }
}
