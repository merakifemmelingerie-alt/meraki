import { useScrollReveal } from '../hooks/useScrollReveal.js'

/**
 * ScrollReveal — CSS class-driven scroll animation component.
 * Uses data-sr and data-visible attributes controlled by IntersectionObserver.
 * Animations are defined in global.css to avoid inline-style vs Tailwind conflicts.
 *
 * Variants: 'fade-up' | 'fade-in' | 'fade-left' | 'fade-right' | 'scale-up'
 */
export default function ScrollReveal({
    children,
    variant = 'fade-up',
    delay = 0,
    className = '',
    threshold = 0.08,
    rootMargin = '0px 0px -40px 0px',
    as: Tag = 'div',
    ...props
}) {
    const { ref, isVisible } = useScrollReveal({ threshold, rootMargin })

    return (
        <Tag
            ref={ref}
            data-sr={variant}
            data-visible={isVisible ? 'true' : 'false'}
            style={{ '--sr-delay': `${delay}ms` }}
            className={className}
            {...props}
        >
            {children}
        </Tag>
    )
}
