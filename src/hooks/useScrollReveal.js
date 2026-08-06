import { useEffect, useRef, useState } from 'react'

/**
 * useScrollReveal - Triggers when element enters viewport.
 * Uses Intersection Observer for zero-jank, GPU-accelerated reveal.
 */
export function useScrollReveal(options = {}) {
    const ref = useRef(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const el = ref.current
        if (!el) return

        // Skip on reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setIsVisible(true)
            return
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                    observer.unobserve(entry.target) // Reveal once, then stop observing
                }
            },
            {
                threshold: options.threshold ?? 0.1,
                rootMargin: options.rootMargin ?? '0px 0px -60px 0px'
            }
        )

        observer.observe(el)
        return () => observer.disconnect()
    }, [options.threshold, options.rootMargin])

    return { ref, isVisible }
}
