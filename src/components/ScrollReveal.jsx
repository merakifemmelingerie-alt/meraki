import { motion, useReducedMotion } from 'framer-motion'

const variants = {
    'fade-up': { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0 } },
    'fade-in': { hidden: { opacity: 0 }, visible: { opacity: 1 } },
    'fade-left': { hidden: { opacity: 0, x: -28 }, visible: { opacity: 1, x: 0 } },
    'fade-right': { hidden: { opacity: 0, x: 28 }, visible: { opacity: 1, x: 0 } },
    'scale-up': { hidden: { opacity: 0, scale: 0.93 }, visible: { opacity: 1, scale: 1 } },
}

/**
 * ScrollReveal — animates children as they scroll into view.
 * Backed by framer-motion's whileInView (IntersectionObserver under the
 * hood), so it reliably animates on first paint, after route changes, and
 * on scroll — without the manual event-timing edge cases a hand-rolled
 * scroll listener runs into (e.g. the scroll-to-top reset on navigation
 * firing a native 'scroll' event that reveals content instantly).
 * Variants: 'fade-up' | 'fade-in' | 'fade-left' | 'fade-right' | 'scale-up'
 */
export default function ScrollReveal({
    children,
    variant = 'fade-up',
    delay = 0,
    className = '',
    as = 'div',
    ...props
}) {
    const prefersReducedMotion = useReducedMotion()
    const MotionTag = motion[as] || motion.div

    return (
        <MotionTag
            initial="hidden"
            whileInView="visible"
            // Positive bottom margin starts the animation while the element
            // is still below the visible viewport, so fast scrolling (flick
            // of a wheel/trackpad) still gets to see it play instead of the
            // transition finishing off-screen before it's ever looked at.
            viewport={{ once: true, margin: '0px 0px 300px 0px', amount: 0 }}
            variants={variants[variant] || variants['fade-up']}
            transition={
                prefersReducedMotion
                    ? { duration: 0 }
                    : { duration: 0.45, delay: delay / 1000, ease: [0.22, 1, 0.36, 1] }
            }
            className={className}
            {...props}
        >
            {children}
        </MotionTag>
    )
}
