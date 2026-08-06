import { useScrollReveal } from '../hooks/useScrollReveal.js'

/**
 * Variants:
 * - 'fade-up'    → fades in and rises from below (default)
 * - 'fade-in'    → simple opacity fade
 * - 'fade-left'  → slides from left
 * - 'fade-right' → slides from right
 * - 'scale-up'   → scales from 0.95 to 1
 * - 'stagger'    → parent for staggered children
 */
const variants = {
    'fade-up': {
        hidden: { opacity: 0, transform: 'translateY(36px)' },
        visible: { opacity: 1, transform: 'translateY(0)' }
    },
    'fade-in': {
        hidden: { opacity: 0, transform: 'none' },
        visible: { opacity: 1, transform: 'none' }
    },
    'fade-left': {
        hidden: { opacity: 0, transform: 'translateX(-36px)' },
        visible: { opacity: 1, transform: 'translateX(0)' }
    },
    'fade-right': {
        hidden: { opacity: 0, transform: 'translateX(36px)' },
        visible: { opacity: 1, transform: 'translateX(0)' }
    },
    'scale-up': {
        hidden: { opacity: 0, transform: 'scale(0.96)' },
        visible: { opacity: 1, transform: 'scale(1)' }
    }
}

export default function ScrollReveal({
    children,
    variant = 'fade-up',
    delay = 0,
    duration = 700,
    className = '',
    threshold = 0.1,
    rootMargin = '0px 0px -60px 0px',
    as: Tag = 'div',
    ...props
}) {
    const { ref, isVisible } = useScrollReveal({ threshold, rootMargin })
    const v = variants[variant] || variants['fade-up']

    const style = {
        ...(isVisible ? v.visible : v.hidden),
        transition: `opacity ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
        willChange: 'opacity, transform'
    }

    return (
        <Tag ref={ref} style={style} className={className} {...props}>
            {children}
        </Tag>
    )
}
