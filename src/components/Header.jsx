import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { smoothScrollToTop } from '../utils/scroll.js'
import { getAssetUrl } from '../utils/assets.js'

const defaultTopBarMessages = [
    "🚚 TAXA DE ENTREGA PARA BONFINÓPOLIS-GO A PARTIR DE R$ 29,99",
    "✨ Frete Grátis acima de R$ 299 • Parcele em até 12x",
    "Ganhe 5% de desconto pagando no PIX!"
]

const slugifyCategory = (name) => (name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/[\s-]+/g, '-')

const categoryImages = {
    'conjuntos': '/assets/categories/cat-conjuntos.webp',
    'calcinhas': '/assets/categories/cat-sexy.webp',
    'tanga': '/assets/categories/cat-sexy.webp',
    'body': '/assets/categories/cat-sexy.webp',
    'camisola': '/assets/categories/cat-noite.webp',
    'baby-doll': '/assets/categories/cat-noite.webp',
    'camisolas-babydolls': '/assets/categories/cat-noite.webp',
    'plus-size': '/assets/categories/cat-plus.webp',
    'personalizados': '/assets/categories/cat-conjuntos.webp',
    'fantasias': '/assets/categories/cat-sexy.webp',
    'sex-shop': '/assets/categories/cat-sexy.webp',
    'acessorios': '/assets/categories/cat-conjuntos.webp',
    'linha-sexy': '/assets/categories/cat-sexy.webp',
    'moda-praia': '/assets/categories/cat-conjuntos.webp'
}

export default function Header({ cartCount = 0, wishlistCount = 0, onSearchOpen }) {
    const { session, user, profile } = useAuth()
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false)
    const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false)
    const [hoveredCategory, setHoveredCategory] = useState(null)
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
    const [messages, setMessages] = useState(() => {
        const stored = localStorage.getItem('meraki_topbar_messages')
        return stored ? JSON.parse(stored) : defaultTopBarMessages
    })

    const [topbarStyle, setTopbarStyle] = useState(() => {
        try {
            const stored = localStorage.getItem('meraki_topbar_style')
            return stored ? JSON.parse(stored) : { bgColor: '#5B6E57', textColor: '#FFFFFF' }
        } catch { return { bgColor: '#5B6E57', textColor: '#FFFFFF' } }
    })

    const [defaultCategoryImage, setDefaultCategoryImage] = useState(() => {
        try {
            const stored = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
            return stored?.default_category_image || '/assets/categories/cat-sexy.webp'
        } catch {
            return '/assets/categories/cat-sexy.webp'
        }
    })

    const [categories, setCategories] = useState(() => {
        const stored = localStorage.getItem('meraki_categories')
        if (stored) {
            try {
                const parsed = JSON.parse(stored)
                return parsed
                    .map(c => typeof c === 'string' ? { name: c, description: 'Coleção Meraki', image: '/placeholder.jpg', group: 'Lingerie' } : c)
                    .filter(c => c && c.name)
            } catch (e) { console.error(e) }
        }
        return []
    })

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [butterflySrc, setButterflySrc] = useState(getAssetUrl('/assets/borboleta-v2.webp'))

    useEffect(() => {
        const updateDefaultImage = () => {
            try {
                const stored = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
                if (stored?.default_category_image) {
                    setDefaultCategoryImage(stored.default_category_image)
                }
            } catch {}
        }
        window.addEventListener('storeConfigUpdated', updateDefaultImage)
        return () => window.removeEventListener('storeConfigUpdated', updateDefaultImage)
    }, [])
    
    useEffect(() => {
        const updateCats = () => {
            const stored = localStorage.getItem('meraki_categories')
            if (stored) {
                try {
                    const parsed = JSON.parse(stored)
                    setCategories(
                        parsed
                            .map(c => typeof c === 'string' ? { name: c, description: 'Coleção Meraki', image: '/placeholder.jpg', group: 'Lingerie' } : c)
                            .filter(c => c && c.name)
                    )
                } catch (e) { console.error(e) }
            }
        }
        window.addEventListener('storage', updateCats)
        window.addEventListener('categoriesUpdated', updateCats)
        window.addEventListener('storeConfigUpdated', updateCats)
        return () => {
            window.removeEventListener('storage', updateCats)
            window.removeEventListener('categoriesUpdated', updateCats)
            window.removeEventListener('storeConfigUpdated', updateCats)
        }
    }, [])

    const getGroupForCategory = (cat) => {
        const group = cat.group
        if (group === 'Lingerie' || group === 'Noite & Especiais' || group === 'Destaques' || group === 'Sensual') {
            return group
        }
        // Fallback for "Geral" or unassigned groups so no category is ever hidden in Mega Menu
        const name = (cat.name || '').toLowerCase()
        if (name.includes('noite') || name.includes('camisola') || name.includes('pijama') || name.includes('baby')) {
            return 'Noite & Especiais'
        }
        if (name.includes('sensual') || name.includes('sexy') || name.includes('fantasia') || name.includes('tanga')) {
            return 'Sensual'
        }
        if (name.includes('chá') || name.includes('plus') || name.includes('acessór') || name.includes('personaliz')) {
            return 'Destaques'
        }
        return 'Lingerie'
    }

    const groupedCategories = {
        'Lingerie': categories.filter(c => getGroupForCategory(c) === 'Lingerie'),
        'Noite & Especiais': categories.filter(c => getGroupForCategory(c) === 'Noite & Especiais'),
        'Destaques': categories.filter(c => getGroupForCategory(c) === 'Destaques'),
        'Sensual': categories.filter(c => getGroupForCategory(c) === 'Sensual')
    }

    useEffect(() => {
        const updateMessages = () => {
            const stored = localStorage.getItem('meraki_topbar_messages')
            setMessages(stored ? JSON.parse(stored) : defaultTopBarMessages)
            setCurrentMessageIndex(0)
        }
        const updateStyle = () => {
            try {
                const stored = localStorage.getItem('meraki_topbar_style')
                if (stored) setTopbarStyle(JSON.parse(stored))
            } catch {}
        }
        window.addEventListener('topbarMessagesUpdated', updateMessages)
        window.addEventListener('topbarStyleUpdated', updateStyle)
        window.addEventListener('storeConfigUpdated', updateStyle)
        window.addEventListener('storage', updateStyle)
        return () => {
            window.removeEventListener('topbarMessagesUpdated', updateMessages)
            window.removeEventListener('topbarStyleUpdated', updateStyle)
            window.removeEventListener('storeConfigUpdated', updateStyle)
            window.removeEventListener('storage', updateStyle)
        }
    }, [])

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY
            if (currentScrollY > 120) {
                setIsScrolled(true)
            } else if (currentScrollY < 40) {
                setIsScrolled(false)
            }
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        if (messages.length === 0) return
        const interval = setInterval(() => {
            setCurrentMessageIndex((prev) => (prev + 1) % messages.length)
        }, 7500)
        return () => clearInterval(interval)
    }, [messages])

    useEffect(() => {
        const img = new Image()
        img.src = getAssetUrl('/assets/borboleta-v2.webp')
        img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext('2d')
            if (ctx) {
                ctx.drawImage(img, 0, 0)
                try {
                    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                    const data = imgData.data
                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i]
                        const g = data[i+1]
                        const b = data[i+2]
                        if (r > 185 && g > 185 && b > 185) {
                            data[i+3] = 0
                        }
                    }
                    ctx.putImageData(imgData, 0, 0)
                    setButterflySrc(canvas.toDataURL())
                } catch (e) {
                    console.error("Erro ao remover fundo:", e)
                    setButterflySrc(getAssetUrl('/assets/borboleta-v2.webp'))
                }
            }
        }
        img.onerror = () => {
            setButterflySrc(getAssetUrl('/assets/borboleta-v2.webp'))
        }
    }, [])

    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [mobileMenuOpen])

    const userName = profile?.full_name || user?.user_metadata?.full_name || ''
    const initials = userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : ''

    return (
        <header
            className={`sticky top-0 border-0 border-transparent ${
                mobileMenuOpen ? 'z-[9999] bg-white' : 'transition-all duration-500 z-50'
            } ${isScrolled && !mobileMenuOpen ? 'glass shadow-premium' : 'bg-white'}`}
            style={{ borderBottom: 'none', border: 'none', outline: 'none' }}
        >
            {/* Top Bar - Hidden on scroll or if empty */}
            <div
                className={`text-center text-[11px] uppercase tracking-[0.15em] py-2 px-4 font-bold antialiased transition-all duration-500 overflow-hidden ${
                    isScrolled || messages.length === 0 ? 'max-h-0 opacity-0 py-0' : 'max-h-10 opacity-100'
                }`}
                style={{ background: topbarStyle.bgColor, color: topbarStyle.textColor }}
            >
                {/* Mobile: Marquee horizontal pass + automatic change */}
                <div className="md:hidden relative h-4 flex items-center overflow-hidden w-full">
                    {messages.length > 0 && (
                        <span
                            key={`mobile-${currentMessageIndex}`}
                            className="inline-block whitespace-nowrap animate-topbar-marquee text-[11px] font-bold"
                        >
                            {messages[currentMessageIndex]}
                        </span>
                    )}
                </div>

                {/* Desktop: Standard centered transition */}
                <div className="hidden md:flex relative h-4 items-center justify-center overflow-hidden">
                    {messages.length > 0 && (
                        <span
                            key={`desktop-${currentMessageIndex}`}
                            className="absolute whitespace-nowrap animate-[fadeInUp_400ms_ease-out]"
                        >
                            {messages[currentMessageIndex]}
                        </span>
                    )}
                </div>
            </div>

            {/* Main Header Container */}
            <div className="max-w-7xl mx-auto px-4 relative">
                {/* Row 1: Logo, Navigation (Desktop) and Icons */}
                <div className={`flex items-center justify-between transition-all duration-500 ${isScrolled ? 'py-3' : 'py-5'}`}>
                    
                    {/* Hamburger Button (Mobile Only) */}
                    <button 
                        onClick={() => setMobileMenuOpen(true)} 
                        className="md:hidden p-2 -ml-2 text-[#1A1A1A] hover:text-[#7A3E4A] transition-colors cursor-pointer"
                        aria-label="Abrir Menu"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    {/* Logo (Centered on mobile, left on desktop) */}
                    <div className="flex-grow md:flex-grow-0 text-center md:text-left">
                        <Link 
                            to="/" 
                            onClick={() => { smoothScrollToTop(1200); setMobileMenuOpen(false); }}
                            className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1A1A1A] hover:text-[#7A3E4A] transition-all duration-500 inline-flex items-center gap-2.5 animate-logo-breath"
                        >
                            <img 
                                src={butterflySrc} 
                                alt="Borboleta Meraki" 
                                className="w-11 h-11 md:w-14 md:h-14 object-contain animate-butterfly-flight transition-opacity duration-200 opacity-100"
                            />
                            <div className="flex flex-col items-center leading-none text-center">
                                <span className="font-heading tracking-[0.25em] text-[20px] md:text-[25px] lg:text-[28px] font-black uppercase antialiased">MERAKI</span>
                                <span className="text-[9px] md:text-[10px] lg:text-[11px] uppercase tracking-[0.48em] text-[#7A3E4A] font-extrabold mt-1 ml-[0.48em] antialiased">---- FEMME ----</span>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Navigation Menu (Center on desktop, hidden on mobile) */}
                    <nav className="hidden md:block">
                        <ul className="flex items-center gap-6 lg:gap-8">
                            <li>
                                <Link to="/" onClick={() => smoothScrollToTop(1200)} className="relative text-[10px] lg:text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1A1A1A] hover:text-[#7A3E4A] transition-all duration-300 group inline-block">
                                    Home
                                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-[1.5px] bg-[#C6A76A] transition-all duration-500 group-hover:w-full"></span>
                                </Link>
                            </li>
                            <li 
                                onMouseEnter={() => setIsMegaMenuOpen(true)}
                                onMouseLeave={() => setIsMegaMenuOpen(false)}
                                className="relative py-2"
                            >
                                <button
                                    type="button"
                                    className="relative text-[10px] lg:text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1A1A1A] hover:text-[#7A3E4A] transition-all duration-300 group inline-flex items-center gap-1 cursor-pointer"
                                >
                                    Categorias
                                    <svg className={`w-3 h-3 transition-transform duration-300 ${isMegaMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-[1.5px] bg-[#C6A76A] transition-all duration-500 group-hover:w-full"></span>
                                </button>

                                {/* Mega Menu Dropdown */}
                                {isMegaMenuOpen && (
                                    <div
                                        className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-white border border-[#E8E0D8]/65 shadow-2xl rounded-2xl p-6 z-50 flex gap-6 w-[650px] pointer-events-auto animate-[fadeIn_200ms_ease-out] before:content-[''] before:absolute before:-top-3 before:left-0 before:w-full before:h-3"
                                    >
                                        <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-5 text-left">
                                            {/* Group 1: Lingerie */}
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 border-b border-gray-150 pb-1">
                                                    <svg className="w-4 h-4 text-[#C6A76A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 10c1.5 0 3 .5 3 2.5s-1.5 2.5-3 2.5-3-.5-3-2.5 1.5-2.5 3-2.5zM18 10c1.5 0 3 .5 3 2.5s-1.5 2.5-3 2.5-3-.5-3-2.5 1.5-2.5 3-2.5z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 13.5h6M4.5 7.5L6 10M19.5 7.5L18 10M7 17.5h10M5.5 16l2.5 4.5h8l2.5-4.5" />
                                                    </svg>
                                                    <h4 className="text-[10px] font-bold text-[#7A3E4A] uppercase tracking-[0.2em]">Lingerie</h4>
                                                </div>
                                                <ul className="space-y-1.5">
                                                    {groupedCategories['Lingerie'].map(item => (
                                                        <li key={item.name}>
                                                            <Link 
                                                                to={`/category/${slugifyCategory(item.name)}`} 
                                                                onClick={() => setIsMegaMenuOpen(false)} 
                                                                onMouseEnter={() => setHoveredCategory(item)}
                                                                onMouseLeave={() => setHoveredCategory(null)}
                                                                className="text-[11px] text-gray-500 hover:text-[#C6A76A] transition-colors font-semibold"
                                                            >
                                                                {item.name}
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* Group 2: Noite & Especiais */}
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 border-b border-gray-150 pb-1">
                                                    <svg className="w-4 h-4 text-[#C6A76A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5l1 3h6l1-3M6 8l2 11h8l2-11H6z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v11" />
                                                    </svg>
                                                    <h4 className="text-[10px] font-bold text-[#7A3E4A] uppercase tracking-[0.2em]">Noite & Especiais</h4>
                                                </div>
                                                <ul className="space-y-1.5">
                                                    {groupedCategories['Noite & Especiais'].map(item => (
                                                        <li key={item.name}>
                                                            <Link 
                                                                to={`/category/${slugifyCategory(item.name)}`} 
                                                                onClick={() => setIsMegaMenuOpen(false)} 
                                                                onMouseEnter={() => setHoveredCategory(item)}
                                                                onMouseLeave={() => setHoveredCategory(null)}
                                                                className="text-[11px] text-gray-500 hover:text-[#C6A76A] transition-colors font-semibold"
                                                            >
                                                                {item.name}
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* Group 3: Destaques */}
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 border-b border-gray-150 pb-1">
                                                    <svg className="w-4 h-4 text-[#C6A76A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.24 11.54a3 3 0 00-4.24 0l-.5.5-.5-.5a3 3 0 10-4.24 4.24l5.24 5.24 5.24-5.24a3 3 0 000-4.24z" />
                                                    </svg>
                                                    <h4 className="text-[10px] font-bold text-[#7A3E4A] uppercase tracking-[0.2em]">Destaques</h4>
                                                </div>
                                                <ul className="space-y-1.5">
                                                    {groupedCategories['Destaques'].map(item => (
                                                        <li key={item.name}>
                                                            <Link 
                                                                to={`/category/${slugifyCategory(item.name)}`} 
                                                                onClick={() => setIsMegaMenuOpen(false)} 
                                                                onMouseEnter={() => setHoveredCategory(item)}
                                                                onMouseLeave={() => setHoveredCategory(null)}
                                                                className="text-[11px] text-gray-500 hover:text-[#C6A76A] transition-colors font-semibold"
                                                            >
                                                                {item.name}
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* Group 4: Sensual */}
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 border-b border-gray-150 pb-1">
                                                    <svg className="w-4 h-4 text-[#C6A76A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-.813-5.096L3 15l5.187-.813L9 9l.813 5.187L15 15l-5.187.813zM19.071 4.929l-.353 2.122-.354-2.122L16.242 4.5l2.122-.354.354-2.122.353 2.122 2.122.354-2.122.354z" />
                                                    </svg>
                                                    <h4 className="text-[10px] font-bold text-[#7A3E4A] uppercase tracking-[0.2em]">Sensual</h4>
                                                </div>
                                                <ul className="space-y-1.5">
                                                    {groupedCategories['Sensual'].map(item => (
                                                        <li key={item.name}>
                                                            <Link 
                                                                to={`/category/${slugifyCategory(item.name)}`} 
                                                                onClick={() => setIsMegaMenuOpen(false)} 
                                                                onMouseEnter={() => setHoveredCategory(item)}
                                                                onMouseLeave={() => setHoveredCategory(null)}
                                                                className="text-[11px] text-gray-500 hover:text-[#C6A76A] transition-colors font-semibold"
                                                            >
                                                                {item.name}
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        {/* Promo Banner Column */}
                                        <div className="w-48 bg-[#FAF9F5] border border-[#E8E0D8] rounded-xl p-4 flex flex-col justify-between relative overflow-hidden shrink-0 text-left min-h-[220px]">
                                            {/* Imagem de Fundo - usa a da categoria ou uma imagem padrão premium para não ficar em branco */}
                                            <div className="absolute inset-0 z-0 animate-[fadeIn_200ms_ease-out]">
                                                <img 
                                                    src={getAssetUrl(hoveredCategory && hoveredCategory.image ? hoveredCategory.image : defaultCategoryImage)} 
                                                    alt={hoveredCategory ? hoveredCategory.name : 'Default'} 
                                                    className="w-full h-full object-cover brightness-[0.65]" 
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                                            </div>

                                            <div className="relative z-10 space-y-1.5 mt-auto">
                                                <span className={`text-[8px] font-bold uppercase tracking-widest ${hoveredCategory ? 'text-white/80' : 'text-[#C6A76A]'}`}>
                                                    {hoveredCategory ? hoveredCategory.group : 'Meraki'}
                                                </span>
                                                <h4 className={`text-xs font-bold leading-tight font-heading ${hoveredCategory ? 'text-white' : 'text-[#7A3E4A]'}`}>
                                                    {hoveredCategory ? hoveredCategory.name : 'Lingerie de Luxo e Conforto'}
                                                </h4>
                                                <p className={`text-[9px] font-medium leading-relaxed ${hoveredCategory ? 'text-white/85' : 'text-gray-400'}`}>
                                                    {hoveredCategory ? hoveredCategory.description : 'Sofisticação e sensualidade feitas para você.'}
                                                </p>
                                            </div>
                                            <Link 
                                                to={hoveredCategory ? `/category/${slugifyCategory(hoveredCategory.name)}` : "/category/plus-size"} 
                                                onClick={() => setIsMegaMenuOpen(false)}
                                                className={`relative z-10 w-full py-2 bg-gradient-to-r ${hoveredCategory ? 'from-[#C6A76A] to-[#A88940] hover:shadow-[#C6A76A]/20' : 'from-[#7A3E4A] to-[#9A5060] hover:shadow-[#7A3E4A]/20'} text-white text-[9px] font-bold uppercase tracking-wider text-center rounded-lg hover:shadow-md transition-all duration-300 block`}
                                            >
                                                {hoveredCategory ? 'Ver Categoria' : 'Ver Destaque →'}
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </li>
                            <li>
                                <Link to="/returns" onClick={() => smoothScrollToTop(1200)} className="relative text-[10px] lg:text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1A1A1A] hover:text-[#7A3E4A] transition-all duration-300 group inline-block">
                                    Política de Troca
                                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-[1.5px] bg-[#C6A76A] transition-all duration-500 group-hover:w-full"></span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/category/ofertas" onClick={() => smoothScrollToTop(1200)} className="relative text-[10px] lg:text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7A3E4A] hover:text-[#7A3E4A] transition-all duration-300 group inline-block">
                                    Ofertas
                                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-[1.5px] bg-[#C6A76A] transition-all duration-500 group-hover:w-full"></span>
                                </Link>
                            </li>
                        </ul>
                    </nav>

                    {/* Icons (Right) */}
                    <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
                        {/* Search */}
                        <button 
                            onClick={() => {
                                if (onSearchOpen) onSearchOpen()
                                window.dispatchEvent(new Event('open-search'))
                            }} 
                            className="group relative p-2 transition-all hover:-translate-y-0.5 cursor-pointer" 
                            aria-label="Buscar"
                        >
                            <svg className="w-5 h-5 text-[#1A1A1A] group-hover:text-[#7A3E4A] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>

                        {/* User / Logged-in indicator (Hidden on mobile) */}
                        <div className="hidden md:block">
                            {session && initials ? (
                                <Link to="/profile" className="group flex items-center gap-3 transition-all hover:-translate-y-0.5" aria-label="Minha Conta">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1A1A1A] to-[#4A4A4A] flex items-center justify-center text-white text-[10px] font-bold shadow-premium ring-1 ring-black/5 group-hover:scale-110 transition-all duration-500">
                                        {initials}
                                    </div>
                                    <span className="hidden lg:block text-[11px] font-semibold uppercase tracking-widest text-[#1A1A1A] group-hover:text-[#7A3E4A] transition-colors">
                                        {userName.split(' ')[0]}
                                    </span>
                                </Link>
                            ) : (
                                <Link to="/auth" className="group relative p-2 transition-all hover:-translate-y-0.5" aria-label="Conta">
                                    <svg className="w-5 h-5 text-[#1A1A1A] group-hover:text-[#7A3E4A] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </Link>
                            )}
                        </div>

                        {/* Wishlist (Hidden on mobile) */}
                        <div className="hidden md:block">
                            <Link to="/wishlist" className="group relative p-2 transition-all hover:-translate-y-0.5 cursor-pointer inline-block" aria-label="Favoritos">
                                <svg className="w-5 h-5 text-[#1A1A1A] group-hover:text-[#7A3E4A] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                {wishlistCount > 0 && (
                                    <span className="absolute top-1 right-1 bg-[#7A3E4A] text-white text-[8px] min-w-[14px] h-[14px] rounded-full flex items-center justify-center font-bold">
                                        {wishlistCount}
                                    </span>
                                )}
                            </Link>
                        </div>

                        {/* Cart */}
                        <button 
                            onClick={() => window.dispatchEvent(new CustomEvent('toggle-cart', { detail: { open: true } }))}
                            className="group relative p-2 transition-all hover:-translate-y-0.5 cursor-pointer" 
                            aria-label="Carrinho"
                        >
                            <svg className="w-5 h-5 text-[#1A1A1A] group-hover:text-[#7A3E4A] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {cartCount > 0 && (
                                <span className="absolute top-1 right-1 bg-[#7A3E4A] text-white text-[8px] min-w-[14px] h-[14px] rounded-full flex items-center justify-center font-bold">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Drawer (Mobile Only) */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-[9999] md:hidden">
                    {/* Backdrop */}
                    <div 
                        onClick={() => setMobileMenuOpen(false)} 
                        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
                    ></div>
                    
                    {/* Menu Content Drawer */}
                    <div className="fixed top-0 left-0 bottom-0 w-4/5 max-w-sm bg-white shadow-2xl flex flex-col justify-between p-6 z-[9999] animate-slide-right">
                        <div>
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                                <Link 
                                    to="/" 
                                    onClick={() => { smoothScrollToTop(1200); setMobileMenuOpen(false); }}
                                    className="font-bold text-[#1A1A1A] hover:text-[#7A3E4A] transition-all duration-300 inline-flex items-center gap-2"
                                >
                                    <img 
                                        src={butterflySrc} 
                                        alt="Borboleta Meraki" 
                                        className="w-8 h-8 object-contain animate-butterfly-flight transition-opacity duration-200 opacity-100"
                                    />
                                    <div className="flex flex-col items-center leading-none text-center">
                                        <span className="font-heading tracking-[0.25em] text-[17px] font-black uppercase antialiased">MERAKI</span>
                                        <span className="text-[7.5px] uppercase tracking-[0.45em] text-[#7A3E4A] font-extrabold mt-0.5 ml-[0.45em] antialiased">---- FEMME ----</span>
                                    </div>
                                </Link>
                                <button 
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="p-2 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            {/* Mobile Search Button */}
                            <button
                                type="button"
                                onClick={() => {
                                    setMobileMenuOpen(false)
                                    if (onSearchOpen) onSearchOpen()
                                    window.dispatchEvent(new Event('open-search'))
                                }}
                                className="w-full flex items-center gap-3 p-3 bg-[#FAF9F5] border border-[#EEEEEE] rounded-xl text-gray-400 hover:text-[#7A3E4A] transition-colors mb-6 cursor-pointer"
                            >
                                <svg className="w-4 h-4 text-[#7A3E4A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <span className="text-xs font-semibold">O que você procura?</span>
                            </button>

                            {/* Menu Links */}
                            <ul className="space-y-4">
                                <li className="border-b border-gray-50 pb-3">
                                    <Link to="/" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold uppercase tracking-wider text-gray-800 hover:text-[#7A3E4A] block transition-colors">Home</Link>
                                </li>
                                <li className="border-b border-gray-50 pb-3">
                                    <button 
                                        type="button"
                                        onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)} 
                                        className="w-full text-left text-sm font-semibold uppercase tracking-wider text-gray-800 hover:text-[#7A3E4A] flex items-center justify-between transition-colors cursor-pointer"
                                    >
                                        Categorias
                                        <svg className={`w-4 h-4 transition-transform duration-300 ${mobileCategoriesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {mobileCategoriesOpen && (
                                        <ul className="mt-3 pl-4 space-y-2.5 border-l border-gray-100 animate-[fadeIn_200ms_ease-out]">
                                            {categories.filter(sub => sub && sub.name).map(sub => (
                                                <li key={sub.name}>
                                                    <Link 
                                                        to={`/category/${slugifyCategory(sub.name)}`} 
                                                        onClick={() => { smoothScrollToTop(1200); setMobileMenuOpen(false); }}
                                                        className="text-xs font-medium text-gray-500 hover:text-[#7A3E4A] block transition-colors py-1"
                                                    >
                                                        {sub.name}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                                <li className="border-b border-gray-50 pb-3">
                                    <Link to="/returns" onClick={() => { smoothScrollToTop(1200); setMobileMenuOpen(false); }} className="text-sm font-semibold uppercase tracking-wider text-gray-800 hover:text-[#7A3E4A] block transition-colors">Política de Troca</Link>
                                </li>
                                <li className="border-b border-gray-50 pb-3">
                                    <Link to="/category/ofertas" onClick={() => { smoothScrollToTop(1200); setMobileMenuOpen(false); }} className="text-sm font-semibold uppercase tracking-wider text-[#7A3E4A] hover:text-[#7A3E4A] block transition-colors">Ofertas</Link>
                                </li>
                            </ul>
                        </div>

                        {/* Drawer Footer Actions */}
                        <div className="pt-6 border-t border-gray-100 space-y-4">
                            {session ? (
                                <Link 
                                    to="/profile" 
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1A1A1A] to-[#4A4A4A] flex items-center justify-center text-white text-[10px] font-bold shadow-xs">
                                        {initials}
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-700">Minha Conta ({userName.split(' ')[0]})</span>
                                </Link>
                            ) : (
                                <Link 
                                    to="/auth" 
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                                >
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-700">Entrar / Criar Conta</span>
                                </Link>
                            )}

                            <Link 
                                to="/wishlist"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-700">Meus Favoritos</span>
                                </div>
                                {wishlistCount > 0 && (
                                    <span className="bg-[#7A3E4A] text-white text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-bold">{wishlistCount}</span>
                                )}
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </header>
    )
}
