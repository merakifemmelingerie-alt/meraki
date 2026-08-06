import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getAssetUrl } from '../utils/assets.js'
import MediaDisplay from './MediaDisplay.jsx'

const DEFAULT_SLIDES = [
    { image: getAssetUrl('/assets/banners/banner-1.webp'), alt: 'Nova Coleção Meraki - Transforme-se', link: '/shop' },
    { image: getAssetUrl('/assets/banners/banner-2.webp'), alt: 'Estilo e Elegância - Meraki Store', link: '/shop' },
    { image: getAssetUrl('/assets/banners/banner-3.webp'), alt: 'Sua melhor versão com Meraki', link: '/shop' },
]

// ─── Transition definitions ─────────────────────────────────────────────────
export const BANNER_TRANSITIONS = {
    shatter: {
        id: 'shatter',
        label: 'Estilhaçar',
        emoji: '💥',
        description: 'Pedaços voam para fora'
    },
    fade: {
        id: 'fade',
        label: 'Fade Suave',
        emoji: '🌫️',
        description: 'Dissolve suavemente'
    },
    slide: {
        id: 'slide',
        label: 'Deslizar',
        emoji: '➡️',
        description: 'Desliza lateralmente'
    },
    zoom: {
        id: 'zoom',
        label: 'Zoom Elegante',
        emoji: '🔍',
        description: 'Aproximação suave'
    },
    flip: {
        id: 'flip',
        label: 'Giro 3D',
        emoji: '🔄',
        description: 'Efeito 3D flip'
    }
}

export default function HeroBanner() {
    const [slides, setSlides] = useState(() => {
        const stored = localStorage.getItem('meraki_banners')
        return stored ? JSON.parse(stored) : DEFAULT_SLIDES
    })
    const [current, setCurrent] = useState(0)
    const [previous, setPrevious] = useState(null)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const [direction, setDirection] = useState(1)

    const [transition, setTransition] = useState(() => {
        try {
            const config = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
            return config.bannerTransition || 'shatter'
        } catch { return 'shatter' }
    })

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        const handleStorage = () => {
            const stored = localStorage.getItem('meraki_banners')
            if (stored) {
                setSlides(JSON.parse(stored))
                setCurrent(0); setPrevious(null); setIsTransitioning(false)
            }
        }
        const handleConfig = () => {
            try {
                const config = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
                if (config.bannerTransition) setTransition(config.bannerTransition)
            } catch {}
        }
        window.addEventListener('storage', handleStorage)
        window.addEventListener('bannersUpdated', handleStorage)
        window.addEventListener('meraki_db_synced', handleStorage)
        window.addEventListener('storeConfigUpdated', handleConfig)
        window.addEventListener('storage', handleConfig)
        return () => {
            window.removeEventListener('storage', handleStorage)
            window.removeEventListener('bannersUpdated', handleStorage)
            window.removeEventListener('meraki_db_synced', handleStorage)
            window.removeEventListener('storeConfigUpdated', handleConfig)
            window.removeEventListener('storage', handleConfig)
        }
    }, [])

    const visibleSlides = useMemo(() => {
        if (!Array.isArray(slides)) return []
        return slides.filter(s => {
            if (!s) return false
            const hasDesk = Boolean(s.image && String(s.image).trim() !== '')
            const hasMob = Boolean(s.mobile_image && String(s.mobile_image).trim() !== '')
            if (isMobile) {
                return hasMob || hasDesk
            } else {
                return hasDesk
            }
        })
    }, [slides, isMobile])

    useEffect(() => {
        if (current >= visibleSlides.length && visibleSlides.length > 0) {
            setCurrent(0)
            setPrevious(null)
            setIsTransitioning(false)
        }
    }, [visibleSlides.length, current])

    const navigate = useCallback((nextIndex, dir = 1) => {
        if (isTransitioning || visibleSlides.length <= 1) return
        setDirection(dir)
        setPrevious(current)
        setIsTransitioning(true)
        setCurrent(nextIndex)
    }, [current, visibleSlides.length, isTransitioning])

    const next = useCallback(() => {
        if (visibleSlides.length <= 1) return
        navigate((current + 1) % visibleSlides.length, 1)
    }, [navigate, current, visibleSlides.length])

    const prev = useCallback(() => {
        if (visibleSlides.length <= 1) return
        navigate((current - 1 + visibleSlides.length) % visibleSlides.length, -1)
    }, [navigate, current, visibleSlides.length])

    const goTo = useCallback((index) => {
        if (index !== current && index >= 0 && index < visibleSlides.length) {
            navigate(index, index > current ? 1 : -1)
        }
    }, [navigate, current, visibleSlides.length])

    useEffect(() => {
        if (visibleSlides.length <= 1) return
        const interval = setInterval(next, 6000)
        return () => clearInterval(interval)
    }, [next, visibleSlides.length])

    useEffect(() => {
        if (previous !== null) {
            const timer = setTimeout(() => { setIsTransitioning(false); setPrevious(null) }, 950)
            return () => clearTimeout(timer)
        }
    }, [current, previous])

    const COLS = 7, ROWS = 4
    const cells = useMemo(() => {
        return Array.from({ length: COLS * ROWS }).map((_, idx) => {
            const col = idx % COLS, row = Math.floor(idx / COLS)
            const distFromCenter = Math.sqrt(Math.pow(col - COLS/2, 2) + Math.pow(row - ROWS/2, 2))
            return { id: idx, col, row, angle: Math.random() * 360, distance: 120 + Math.random() * 180, rotateSpeed: -360 + Math.random() * 720, delay: distFromCenter * 0.04 + Math.random() * 0.04 }
        })
    }, [current])

    if (!visibleSlides || visibleSlides.length === 0) {
        return <section className="relative w-full overflow-hidden bg-[#F5EDE3] transition-all duration-300 max-h-[800px] aspect-[1920/800] animate-pulse" />
    }

    const safeIndex = Math.min(current, visibleSlides.length - 1)
    const currentSlide = visibleSlides[safeIndex]
    const hasMobileImage = !!currentSlide?.mobile_image
    const aspectClass = isMobile && hasMobileImage ? 'aspect-[4/5]' : 'aspect-[1920/800]'
    const isShatter = transition === 'shatter'

    return (
        <section className={`relative w-full overflow-hidden bg-[#F5EDE3] transition-all duration-300 max-h-[800px] ${aspectClass}`} style={{ perspective: '1200px' }}>

            {/* ── Slide images with native CSS transitions ── */}
            {visibleSlides.map((slide, idx) => {
                const isActive = idx === safeIndex
                const isPrev = idx === previous && isTransitioning
                const imageSrc = isMobile ? (slide.mobile_image || slide.image) : slide.image
                
                return (
                    <div
                        key={slide.id || idx}
                        className={`absolute inset-0 z-0 transition-all duration-700 ease-in-out ${
                            isActive ? 'opacity-100 scale-100 z-10 pointer-events-auto' : isPrev ? 'opacity-0 scale-95 z-0 pointer-events-none' : 'opacity-0 scale-95 z-0 pointer-events-none'
                        }`}
                    >
                        <Link to={slide.link || '/shop'} className="block w-full h-full">
                            <MediaDisplay
                                src={imageSrc}
                                alt={slide.alt || 'Banner Meraki'}
                                className="w-full h-full object-cover object-center"
                            />
                        </Link>
                    </div>
                )
            })}

            {/* Pagination Dots */}
            <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20">
                <div className="flex gap-2.5 bg-black/20 backdrop-blur-sm rounded-full px-4 py-2">
                    {visibleSlides.map((_, i) => (
                        <button key={i} onClick={() => goTo(i)} aria-label={`Ir para banner ${i + 1}`} className="group relative p-1 cursor-pointer">
                            <div className={`rounded-full transition-all duration-500 ease-out ${i === safeIndex ? 'bg-white w-7 h-2.5' : 'bg-white/40 hover:bg-white/70 w-2.5 h-2.5'}`} />
                        </button>
                    ))}
                </div>
            </div>

            {/* Arrows */}
            <button onClick={prev} className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-black/40 hover:text-white transition-all duration-300 cursor-pointer" aria-label="Banner anterior">
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={next} className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-black/40 hover:text-white transition-all duration-300 cursor-pointer" aria-label="Próximo banner">
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
        </section>
    )
}
