import { useScrollReveal } from '../hooks/useScrollReveal.js'

/**
 * ScrollReveal — animates children as they scroll into view.
 * Uses CSS data-attributes for transitions (immune to Tailwind overrides).
 * Variants: 'fade-up' | 'fade-in' | 'fade-left' | 'fade-right' | 'scale-up'
 */
export default function ScrollReveal({
    children,
    variant = 'fade-up',
    delay = 0,
    className = '',
    as: Tag = 'div',
    ...props
}) {
    const { ref, isVisible } = useScrollReveal()

    return (
        <Tag
            ref={ref}
            data-sr={variant}
            data-visible={isVisible ? 'true' : 'false'}
            style={delay > 0 ? { transitionDelay: `${delay}ms` } : undefined}
            className={className}
            {...props}
        >
            {children}
        </Tag>
    )
}
