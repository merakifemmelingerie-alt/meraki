import { useEffect, useRef, useState } from 'react'

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

        // Check immediately (elements already in view on page load)
        reveal()

        if (!revealed.current) {
            window.addEventListener('scroll', reveal)
            window.addEventListener('resize', reveal)
        }

        return () => {
            window.removeEventListener('scroll', reveal)
            window.removeEventListener('resize', reveal)
        }
    }, [])

    return { ref, isVisible }
}
