import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import ProductCard from '../components/ProductCard.jsx'
import SearchOverlay from '../components/SearchOverlay.jsx'
import QuickViewModal from '../components/QuickViewModal.jsx'
import ScrollToTop from '../components/ScrollToTop.jsx'
import WhatsAppButton from '../components/WhatsAppButton.jsx'
import Notification from '../components/Notification.jsx'
import MediaDisplay from '../components/MediaDisplay.jsx'
import { useProducts } from '../hooks/useProducts.js'
import { useCart } from '../hooks/useCart.js'
import { useWishlist } from '../hooks/useWishlist.js'

const slugifyCategory = (name) => name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/[\s-]+/g, '-')

// Mapping of slug to readable names and descriptions
const CATEGORY_META = {
    'body': {
        title: 'Body',
        subtitle: 'Elegância e sensualidade',
        description: 'Bodies sofisticados que modelam o corpo com rendas finas, tule e recortes pensados para destacar sua silhueta.'
    },
    'camisola': {
        title: 'Camisola',
        subtitle: 'Leveza e sensualidade para a noite',
        description: 'Camisolas fluidas e confortáveis em tecidos nobres como cetim, seda e rendas para noites relaxantes e especiais.'
    },
    'baby-doll': {
        title: 'Baby Doll',
        subtitle: 'Delicadeza e frescor',
        description: 'Conjuntos leves de baby doll combinando rendas macias e microfibra para noites charmosas e confortáveis.'
    },
    'calcinhas': {
        title: 'Calcinhas',
        subtitle: 'Conforto e sofisticação no dia a dia',
        description: 'Modelagens diversas que se adaptam perfeitamente ao seu corpo, proporcionando bem-estar com rendas delicadas.'
    },
    'tanga': {
        title: 'Tanga',
        subtitle: 'Cortes sensuais e marcantes',
        description: 'Calcinhas modelo tanga com laterais finas e caimento impecável para valorizar suas curvas com muito charme.'
    },
    'acessorios': {
        title: 'Acessórios',
        subtitle: 'Detalhes que complementam seu estilo',
        description: 'Cintas-liga, perneiras, algemas e acessórios meraki premium para dar o toque final de poder à sua produção.'
    },
    'personalizados': {
        title: 'Personalizados',
        subtitle: 'Peças únicas com a sua essência',
        description: 'Adicione letras, números ou emojis exclusivos em suas peças Meraki e crie algo totalmente único.'
    },
    'sex-shop': {
        title: 'Sex Shop',
        subtitle: 'Momento de bem-estar e prazer',
        description: 'Produtos selecionados com carinho para despertar seus sentidos, explorar novas sensações e celebrar a intimidade.'
    },
    'fantasias': {
        title: 'Fantasias',
        subtitle: 'Realize seus desejos',
        description: 'Curadoria de fantasias temáticas premium com acabamento impecável para viver momentos inesquecíveis.'
    },
    'conjuntos': {
        title: 'Conjuntos',
        subtitle: 'Sutiãs e calcinhas combinando',
        description: 'Sincronia perfeita entre rendas premium, modelagem confortável e design sofisticado para o seu dia a dia ou ocasiões especiais.'
    },
    'camisolas-babydolls': {
        title: 'Camisolas & Babydolls',
        subtitle: 'Camisolas e baby dolls elegantes',
        description: 'Sinta o toque suave da seda e do cetim premium em peças desenhadas para proporcionar noites relaxantes com elegância incomparável.'
    },
    'moda-praia': {
        title: 'Moda Praia',
        subtitle: 'Biquínis e moda praia',
        description: 'Coleção de biquínis e moda praia feminina para arrasar no verão.'
    },
    'linha-sexy': {
        title: 'Linha Sexy',
        subtitle: 'Peças sensuais e sofisticadas',
        description: 'Transparências artísticas, rendas francesas e cortes ousados que realçam suas curvas e celebram sua sensualidade com requinte.'
    },
    'plus-size': {
        title: 'Plus Size',
        subtitle: 'Elegância em todos os tamanhos',
        description: 'Curadoria exclusiva de lingeries estruturadas que abraçam suas curvas com suporte impecável, conforto e beleza de tirar o fôlego.'
    },
    'ofertas': {
        title: 'Ofertas Especiais',
        subtitle: 'Curadoria com preços exclusivos',
        description: 'Peças icônicas da nossa marca com condições especiais por tempo limitado. Garanta a sofisticação da Meraki no seu guarda-roupa.'
    },
    'combos': {
        title: 'Produtos do Combo',
        subtitle: 'Monte seu kit promocional',
        description: 'Selecione e adicione as peças participantes ao carrinho. O desconto correspondente (2 por R$139, 3 por R$169, etc.) será calculado e concedido automaticamente na finalização do pedido!'
    },
    'promo-combo': {
        title: 'Produtos do Combo',
        subtitle: 'Monte seu kit promocional',
        description: 'Selecione e adicione as peças participantes ao carrinho. O desconto correspondente (2 por R$139, 3 por R$169, etc.) será calculado e concedido automaticamente na finalização do pedido!'
    }
}

const CATEGORY_SUBCATEGORIES = {
    'conjuntos': [
        {
            name: 'Cobertura Total',
            id: 'Cobertura Total',
            svg: (
                <svg viewBox="0 0 100 60" className="w-12 h-8 text-[#7A3E4A] fill-none stroke-current stroke-[1.5] opacity-90 transition-all duration-300 group-hover:scale-110">
                    <path d="M25 10 L28 32 M75 10 L72 32" strokeLinecap="round" />
                    <path d="M15 32 C 15 50, 48 50, 48 32" strokeLinecap="round" />
                    <path d="M52 32 C 52 50, 85 50, 85 32" strokeLinecap="round" />
                    <path d="M15 32 C 18 20, 45 22, 48 32 C 45 38, 18 38, 15 32 Z" fill="#FDF8F6" />
                    <path d="M52 32 C 55 22, 82 20, 85 32 C 82 38, 55 38, 52 32 Z" fill="#FDF8F6" />
                    <line x1="48" y1="32" x2="52" y2="32" />
                </svg>
            )
        },
        {
            name: 'Meia Taça',
            id: 'Meia Taça',
            svg: (
                <svg viewBox="0 0 100 60" className="w-12 h-8 text-[#7A3E4A] fill-none stroke-current stroke-[1.5] opacity-90 transition-all duration-300 group-hover:scale-110">
                    <path d="M22 12 L24 34 M78 12 L76 34" strokeLinecap="round" />
                    <path d="M15 34 C 15 52, 48 52, 48 34" strokeLinecap="round" />
                    <path d="M52 34 C 52 52, 85 52, 85 34" strokeLinecap="round" />
                    <path d="M15 34 C 20 28, 43 28, 48 34 C 43 40, 20 40, 15 34 Z" fill="#FDF8F6" />
                    <path d="M52 34 C 57 28, 80 28, 85 34 C 80 40, 57 40, 52 34 Z" fill="#FDF8F6" />
                    <line x1="48" y1="34" x2="52" y2="34" />
                </svg>
            )
        },
        {
            name: 'Triângulo',
            id: 'Triângulo',
            svg: (
                <svg viewBox="0 0 100 60" className="w-12 h-8 text-[#7A3E4A] fill-none stroke-current stroke-[1.5] opacity-90 transition-all duration-300 group-hover:scale-110">
                    <path d="M30 8 L32 26 M70 8 L68 26" strokeLinecap="round" />
                    <path d="M15 42 L32 20 L48 42 Z" fill="#FDF8F6" />
                    <path d="M52 42 L68 20 L85 42 Z" fill="#FDF8F6" />
                    <path d="M15 42 Q 32 30 48 42 M52 42 Q 68 30 85 42" strokeDasharray="2,2" />
                    <line x1="48" y1="42" x2="52" y2="42" />
                </svg>
            )
        },
        {
            name: 'Sem Alça',
            id: 'Sem Alça',
            svg: (
                <svg viewBox="0 0 100 60" className="w-12 h-8 text-[#7A3E4A] fill-none stroke-current stroke-[1.5] opacity-90 transition-all duration-300 group-hover:scale-110">
                    <path d="M15 26 C 25 24, 45 28, 50 32 C 55 28, 75 24, 85 26 C 85 38, 75 42, 50 42 C 25 42, 15 38, 15 26 Z" fill="#FDF8F6" />
                    <path d="M15 26 C 30 36, 45 36, 50 32 C 55 36, 70 36, 85 26" strokeDasharray="3,3" />
                </svg>
            )
        },
        {
            name: 'Top',
            id: 'Top',
            svg: (
                <svg viewBox="0 0 100 60" className="w-12 h-8 text-[#7A3E4A] fill-none stroke-current stroke-[1.5] opacity-90 transition-all duration-300 group-hover:scale-110">
                    <path d="M20 12 L26 24 C 32 24, 45 28, 50 32 C 55 28, 68 24, 74 24 L80 12 L85 45 C 80 47, 20 47, 15 45 Z" fill="#FDF8F6" />
                    <rect x="18" y="42" width="64" height="3" rx="1.5" fill="#7A3E4A" />
                </svg>
            )
        },
        {
            name: 'Balconet',
            id: 'Balconet',
            svg: (
                <svg viewBox="0 0 100 60" className="w-12 h-8 text-[#7A3E4A] fill-none stroke-current stroke-[1.5] opacity-90 transition-all duration-300 group-hover:scale-110">
                    <path d="M18 14 L18 32 M82 14 L82 32" strokeLinecap="round" />
                    <path d="M15 32 C 15 50, 48 50, 48 32" strokeLinecap="round" />
                    <path d="M52 32 C 52 50, 85 50, 85 32" strokeLinecap="round" />
                    <path d="M15 32 L48 32 M52 32 L85 32" strokeWidth="2" />
                    <path d="M15 32 C 15 42, 48 42, 48 32 Z" fill="#FDF8F6" />
                    <path d="M52 32 C 52 42, 85 42, 85 32 Z" fill="#FDF8F6" />
                </svg>
            )
        }
    ],
    'camisolas-babydolls': [
        {
            name: 'Robes',
            id: 'Robes',
            svg: (
                <svg viewBox="0 0 100 60" className="w-12 h-8 text-[#7A3E4A] fill-none stroke-current stroke-[1.5] opacity-90 transition-all duration-300 group-hover:scale-110">
                    <path d="M35 10 L25 50 L75 50 L65 10 Z" fill="#FDF8F6" />
                    <path d="M40 10 L50 35 L60 10" />
                    <line x1="28" y1="35" x2="72" y2="35" strokeWidth="2" />
                </svg>
            )
        },
        {
            name: 'Pijamas',
            id: 'Pijamas',
            svg: (
                <svg viewBox="0 0 100 60" className="w-12 h-8 text-[#7A3E4A] fill-none stroke-current stroke-[1.5] opacity-90 transition-all duration-300 group-hover:scale-110">
                    <path d="M25 15 L45 15 L45 35 L25 35 Z" fill="#FDF8F6" />
                    <path d="M55 15 L75 15 L75 48 L68 48 L68 35 L62 35 L62 48 L55 48 Z" fill="#FDF8F6" />
                    <path d="M30 15 L35 25 L40 15" />
                </svg>
            )
        },
        {
            name: 'Camisolas',
            id: 'Camisolas',
            svg: (
                <svg viewBox="0 0 100 60" className="w-12 h-8 text-[#7A3E4A] fill-none stroke-current stroke-[1.5] opacity-90 transition-all duration-300 group-hover:scale-110">
                    <path d="M35 12 L38 25 L62 25 L65 12" strokeLinecap="round" />
                    <path d="M30 25 L20 52 L80 52 L70 25 Z" fill="#FDF8F6" />
                </svg>
            )
        },
        {
            name: 'Baby Dolls',
            id: 'Baby Dolls',
            svg: (
                <svg viewBox="0 0 100 60" className="w-12 h-8 text-[#7A3E4A] fill-none stroke-current stroke-[1.5] opacity-90 transition-all duration-300 group-hover:scale-110">
                    <path d="M25 15 L30 32 L50 32 L55 15 L47 15 L40 22 L33 15 Z" fill="#FDF8F6" />
                    <path d="M25 38 L55 38 L55 48 L42 48 L40 43 L38 48 L25 48 Z" fill="#FDF8F6" />
                </svg>
            )
        }
    ],
    'linha-sexy': [
        {
            name: 'Bodys',
            id: 'Bodys',
            svg: (
                <svg viewBox="0 0 100 60" className="w-12 h-8 text-[#7A3E4A] fill-none stroke-current stroke-[1.5] opacity-90 transition-all duration-300 group-hover:scale-110">
                    <path d="M35 12 L38 28 C 38 42, 45 48, 50 48 C 55 48, 62 42, 62 28 L65 12 Z" fill="#FDF8F6" />
                    <path d="M38 22 C 45 28, 55 28, 62 22" />
                </svg>
            )
        },
        {
            name: 'Corsets',
            id: 'Corsets',
            svg: (
                <svg viewBox="0 0 100 60" className="w-12 h-8 text-[#7A3E4A] fill-none stroke-current stroke-[1.5] opacity-90 transition-all duration-300 group-hover:scale-110">
                    <path d="M30 15 L25 42 C 35 45, 65 45, 70 42 L65 15 Z" fill="#FDF8F6" />
                    <line x1="42" y1="15" x2="42" y2="43" />
                    <line x1="50" y1="15" x2="50" y2="44" />
                    <line x1="58" y1="15" x2="58" y2="43" />
                </svg>
            )
        },
        {
            name: 'Conjuntos Sexy',
            id: 'Conjuntos Sexy',
            svg: (
                <svg viewBox="0 0 100 60" className="w-12 h-8 text-[#7A3E4A] fill-none stroke-current stroke-[1.5] opacity-90 transition-all duration-300 group-hover:scale-110">
                    <path d="M25 15 C 35 25, 65 25, 75 15" />
                    <path d="M35 30 L65 30 L60 40 L40 40 Z" fill="#FDF8F6" />
                    <line x1="38" y1="40" x2="30" y2="52" />
                    <line x1="62" y1="40" x2="70" y2="52" />
                </svg>
            )
        },
        {
            name: 'Acessórios',
            id: 'Acessórios',
            svg: (
                <svg viewBox="0 0 100 60" className="w-12 h-8 text-[#7A3E4A] fill-none stroke-current stroke-[1.5] opacity-90 transition-all duration-300 group-hover:scale-110">
                    <circle cx="50" cy="20" r="8" />
                    <line x1="50" y1="28" x2="50" y2="48" />
                    <path d="M30 35 L70 35" />
                    <path d="M35 48 L65 48" />
                </svg>
            )
        }
    ],
    'plus-size': [
        {
            name: 'Sustentação',
            id: 'Sustentação',
            svg: (
                <svg viewBox="0 0 100 60" className="w-12 h-8 text-[#7A3E4A] fill-none stroke-current stroke-[1.5] opacity-90 transition-all duration-300 group-hover:scale-110">
                    <path d="M22 8 L26 30 M78 8 L74 30" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M12 30 C 12 50, 48 50, 48 30" strokeWidth="2" strokeLinecap="round" />
                    <path d="M52 30 C 52 50, 88 50, 88 30" strokeWidth="2" strokeLinecap="round" />
                    <path d="M12 30 C 15 18, 45 20, 48 30 Z" fill="#FDF8F6" />
                    <path d="M52 30 C 55 20, 85 18, 88 30 Z" fill="#FDF8F6" />
                </svg>
            )
        },
        {
            name: 'Modeladores',
            id: 'Modeladores',
            svg: (
                <svg viewBox="0 0 100 60" className="w-12 h-8 text-[#7A3E4A] fill-none stroke-current stroke-[1.5] opacity-90 transition-all duration-300 group-hover:scale-110">
                    <path d="M30 15 L70 15 L70 38 C 70 45, 60 48, 50 48 C 40 48, 30 45, 30 38 Z" fill="#FDF8F6" />
                    <path d="M30 25 L70 25 M30 35 L70 35" strokeDasharray="2,2" />
                </svg>
            )
        },
        {
            name: 'Camisolas Plus',
            id: 'Camisolas Plus',
            svg: (
                <svg viewBox="0 0 100 60" className="w-12 h-8 text-[#7A3E4A] fill-none stroke-current stroke-[1.5] opacity-90 transition-all duration-300 group-hover:scale-110">
                    <path d="M35 15 L38 25 L62 25 L65 15" strokeLinecap="round" />
                    <path d="M32 25 L18 52 L82 52 L68 25 Z" fill="#FDF8F6" />
                </svg>
            )
        },
        {
            name: 'Rendas',
            id: 'Rendas',
            svg: (
                <svg viewBox="0 0 100 60" className="w-12 h-8 text-[#7A3E4A] fill-none stroke-current stroke-[1.5] opacity-90 transition-all duration-300 group-hover:scale-110">
                    <path d="M20 20 C 30 10, 40 30, 50 20 C 60 10, 70 30, 80 20" strokeLinecap="round" />
                    <path d="M20 40 C 30 30, 40 50, 50 40 C 60 30, 70 50, 80 40" strokeLinecap="round" />
                </svg>
            )
        }
    ]
}

export default function CategoryPage() {
    const { slug } = useParams()
    const [searchOpen, setSearchOpen] = useState(false)
    const [quickViewProduct, setQuickViewProduct] = useState(null)
    const [notification, setNotification] = useState({ message: '', visible: false })
    
    // Carousel navigation and filters
    const carouselRef = useRef(null)
    const [selectedSubcategory, setSelectedSubcategory] = useState('all')

    const [categoryStylesMap, setCategoryStylesMap] = useState(() => {
        try {
            const stored = localStorage.getItem('meraki_category_styles')
            if (stored) return JSON.parse(stored)
        } catch {}
        return {}
    })

    // Filters & Pagination state
    const [sortBy, setSortBy] = useState('newest') // newest, price-asc, price-desc
    const [selectedSize, setSelectedSize] = useState('all')
    const [viewCols, setViewCols] = useState(4)
    const [currentPage, setCurrentPage] = useState(1)

    const { products: allProducts, loading } = useProducts()
    const { cartCount, addToCart } = useCart()
    const { wishlistCount, toggleWishlist, isWishlisted } = useWishlist()

    useEffect(() => {
        const updateStyles = () => {
            try {
                const stored = localStorage.getItem('meraki_category_styles')
                if (stored) setCategoryStylesMap(JSON.parse(stored))
            } catch {}
        }
        window.addEventListener('categoryStylesUpdated', updateStyles)
        window.addEventListener('storeConfigUpdated', updateStyles)
        return () => {
            window.removeEventListener('categoryStylesUpdated', updateStyles)
            window.removeEventListener('storeConfigUpdated', updateStyles)
        }
    }, [])

    const categorySubcategoriesList = useMemo(() => {
        if (!slug) return []
        const cleanSlug = slugifyCategory(slug)
        if (categoryStylesMap && categoryStylesMap[cleanSlug]) {
            return categoryStylesMap[cleanSlug]
        }
        if (categoryStylesMap && categoryStylesMap[slug]) {
            return categoryStylesMap[slug]
        }
        return CATEGORY_SUBCATEGORIES[slug] || CATEGORY_SUBCATEGORIES[cleanSlug] || []
    }, [categoryStylesMap, slug])

    // Reset subcategory filter when changing categories
    useEffect(() => {
        setSelectedSubcategory('all')
    }, [slug])

    const scrollCarousel = (direction) => {
        if (carouselRef.current) {
            const scrollAmount = direction === 'left' ? -240 : 240
            carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
        }
    }

    const getProductSubcategory = (product) => {
        if (product.subcategory) return product.subcategory
        const name = product.name.toLowerCase()
        
        if (slug === 'conjuntos') {
            if (name.includes('sophie') || name.includes('white') || name.includes('noiva')) return 'Meia Taça'
            if (name.includes('comfort') || name.includes('classic')) return 'Cobertura Total'
            if (name.includes('noir') || name.includes('strappy')) return 'Triângulo'
            if (name.includes('satin') || name.includes('robe') || name.includes('tule')) return 'Sem Alça'
            if (name.includes('baby') || name.includes('doll') || name.includes('romance')) return 'Top'
            return 'Balconet'
        }
        
        if (slug === 'camisolas-babydolls') {
            if (name.includes('robe') || name.includes('satin') || name.includes('royale')) return 'Robes'
            if (name.includes('pijama') || name.includes('calça') || name.includes('manga')) return 'Pijamas'
            if (name.includes('camisola') || name.includes('longa')) return 'Camisolas'
            return 'Baby Dolls'
        }

        if (slug === 'linha-sexy') {
            if (name.includes('body') || name.includes('cavado')) return 'Bodys'
            if (name.includes('corset') || name.includes('classic')) return 'Corsets'
            if (name.includes('conjunto') || name.includes('strappy') || name.includes('noir')) return 'Conjuntos Sexy'
            return 'Acessórios'
        }

        if (slug === 'plus-size') {
            if (name.includes('sutiã') || name.includes('reforçado') || name.includes('comfort')) return 'Sustentação'
            if (name.includes('modelador') || name.includes('body')) return 'Modeladores'
            if (name.includes('camisola') || name.includes('robe')) return 'Camisolas Plus'
            return 'Rendas'
        }

        return 'Geral'
    }

    // Determine target category metadata
    const meta = useMemo(() => {
        return CATEGORY_META[slug] || {
            title: 'Coleção Meraki',
            subtitle: 'Sofisticação e Conforto',
            description: 'Navegue por nossa seleção de peças desenhadas com paixão.'
        }
    }, [slug])

    // Filter and sort products
    const filteredProducts = useMemo(() => {
        if (!allProducts) return []

        let result = [...allProducts]

        // 1. Filter by category slug or offers or promo combo
        if (slug === 'promo-combo' || slug === 'combos') {
            const normalizeText = (str) => (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            let promoCombo = {}
            try {
                promoCombo = JSON.parse(localStorage.getItem('meraki_promo_combo') || '{}')
            } catch (e) {}
            const queryStr = normalizeText(promoCombo.query || promoCombo.keyword || 'sutiã')

            const explicitPromo = result.filter(p => p.inPromoCombo === true || p.in_promo_combo === true)
            const queryMatched = result.filter(p => {
                const nameNorm = normalizeText(p.name)
                const catNorm = normalizeText(p.category)
                const descNorm = normalizeText(p.description)
                return nameNorm.includes(queryStr) || catNorm.includes(queryStr) || descNorm.includes(queryStr)
            })

            if (explicitPromo.length > 0) {
                result = explicitPromo
            } else if (queryMatched.length > 0) {
                result = queryMatched
            }
            // If still empty, result remains allProducts so customer gets product selection!
        } else if (slug === 'ofertas') {
            result = result.filter(p => p.original_price > 0 && p.original_price > p.price)
        } else {
            // Find category name mapping
            const cleanSlug = slug.toLowerCase()
             result = result.filter(p => {
                const catName = p.category ? slugifyCategory(p.category) : ''
                return catName === cleanSlug
            })
        }

        // 2. Filter by subcategory (if active)
        if (selectedSubcategory !== 'all') {
            const selNorm = selectedSubcategory.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            result = result.filter(p => {
                const subNorm = (p.subcategory || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                const nameNorm = (p.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                const descNorm = (p.description || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                const catNorm = (p.category || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                const calculatedSub = getProductSubcategory(p).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                
                return subNorm === selNorm || subNorm.includes(selNorm) || calculatedSub === selNorm || nameNorm.includes(selNorm) || descNorm.includes(selNorm) || catNorm.includes(selNorm)
            })
        }

        // 3. Filter by size
        if (selectedSize !== 'all') {
            result = result.filter(p => {
                if (!p.sizes) return false
                const pSizes = Array.isArray(p.sizes) ? p.sizes : (typeof p.sizes === 'string' ? p.sizes.split(',').map(s => s.trim()) : [])
                return pSizes.includes(selectedSize)
            })
        }

        // 4. Sort products
        if (sortBy === 'price-asc') {
            result.sort((a, b) => a.price - b.price)
        } else if (sortBy === 'price-desc') {
            result.sort((a, b) => b.price - a.price)
        } else {
            // newest/default
            result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        }
        return result
    }, [allProducts, slug, selectedSize, sortBy, selectedSubcategory])

    // Pagination
    const ITEMS_PER_PAGE = 12

    useEffect(() => {
        setCurrentPage(1)
    }, [slug, selectedSize, selectedSubcategory, sortBy])

    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
    
    const paginatedProducts = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE
        return filteredProducts.slice(start, start + ITEMS_PER_PAGE)
    }, [filteredProducts, currentPage])

    const showNotification = useCallback((message) => {
        setNotification({ message, visible: true })
    }, [])

    const handleAddToCart = useCallback((product, size) => {
        addToCart(product, size)
        setQuickViewProduct(null)
        showNotification('Produto adicionado ao carrinho!')
    }, [addToCart, showNotification])

    return (
        <div className="bg-[#FCFAFA] min-h-screen flex flex-col">
            <Header cartCount={cartCount} wishlistCount={wishlistCount} onSearchOpen={() => setSearchOpen(true)} />

            {/* Category Hero Header */}
            <section className="bg-[#FDF8F6] py-16 md:py-24 border-b border-[#EEEEEE]">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <span className="text-[#C6A76A] text-[10px] uppercase font-bold tracking-[0.4em] mb-4 block">
                        {meta.subtitle}
                    </span>
                    <h1 className="font-heading text-4xl md:text-6xl text-[#1A1A1A] mb-6">
                        {meta.title}
                    </h1>
                    <div className="w-12 h-[1px] bg-[#C6A76A] mx-auto mb-6"></div>
                    <p className="text-gray-500 max-w-2xl mx-auto font-light leading-relaxed text-sm md:text-base">
                        {meta.description}
                    </p>
                </div>
            </section>

            {/* Subcategory Slider/Carousel (only for categories with defined styles) */}
            {categorySubcategoriesList && categorySubcategoriesList.length > 0 && (
                <section className="bg-white border-b border-[#EEEEEE] py-10 relative overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 relative">
                        {/* Title */}
                        <div className="text-center mb-6">
                            <h3 className="font-heading text-xs uppercase tracking-[0.25em] text-[#7A3E4A] font-bold">Filtre por Estilo</h3>
                        </div>

                        {/* Navigation Arrows */}
                        <button 
                            onClick={() => scrollCarousel('left')}
                            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-all text-gray-600 focus:outline-none cursor-pointer"
                            aria-label="Anterior"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <button 
                            onClick={() => scrollCarousel('right')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-all text-gray-600 focus:outline-none cursor-pointer"
                            aria-label="Próximo"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        {/* Slider Scrollable Area */}
                        <div 
                            ref={carouselRef}
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            className="flex items-center gap-8 overflow-x-auto py-2 px-12 md:justify-center"
                        >
                            {/* "All" reset item */}
                            <button
                                onClick={() => setSelectedSubcategory('all')}
                                className="flex flex-col items-center gap-2 group focus:outline-none shrink-0 cursor-pointer"
                            >
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${selectedSubcategory === 'all' ? 'bg-[#7A3E4A]/10 ring-2 ring-[#7A3E4A]' : 'bg-[#FDF8F6] hover:bg-[#FDF3F2] hover:shadow-inner'}`}>
                                    <svg viewBox="0 0 100 60" className="w-10 h-6 text-[#7A3E4A] fill-none stroke-current stroke-[1.5] transition-all duration-300 group-hover:scale-110">
                                        <circle cx="35" cy="30" r="15" />
                                        <circle cx="65" cy="30" r="15" />
                                        <line x1="50" y1="30" x2="50" y2="30" />
                                    </svg>
                                </div>
                                <span className={`text-[10px] uppercase font-bold tracking-wider transition-colors duration-300 ${selectedSubcategory === 'all' ? 'text-[#7A3E4A] font-extrabold' : 'text-gray-500 group-hover:text-gray-900'}`}>
                                    Ver Todos
                                </span>
                            </button>

                            {/* Subcategories list */}
                            {categorySubcategoriesList.map((sub) => (
                                <button
                                    key={sub.id || sub.name}
                                    onClick={() => setSelectedSubcategory(selectedSubcategory === sub.name ? 'all' : sub.name)}
                                    className="flex flex-col items-center gap-2 group focus:outline-none shrink-0 cursor-pointer"
                                >
                                    <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 overflow-hidden ${selectedSubcategory === sub.name ? 'bg-[#7A3E4A]/10 ring-2 ring-[#7A3E4A]' : 'bg-[#FDF8F6] hover:bg-[#FDF3F2] hover:shadow-inner'}`}>
                                        {sub.image ? (
                                            <MediaDisplay src={sub.image} alt={sub.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                        ) : sub.svg ? (
                                            sub.svg
                                        ) : (
                                            <span className="text-xs font-black text-[#7A3E4A]">{sub.name.substring(0, 2).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <span className={`text-[10px] uppercase font-bold tracking-wider transition-colors duration-300 ${selectedSubcategory === sub.name ? 'text-[#7A3E4A] font-extrabold' : 'text-gray-500 group-hover:text-gray-900'}`}>
                                        {sub.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Catalog content */}
            <main className="max-w-7xl mx-auto px-4 py-12 flex-grow w-full">
                {/* Filters Row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#EEEEEE] pb-6 mb-8 text-sm">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Size Filter */}
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500 font-medium">Tamanho:</span>
                            <div className="flex gap-1.5">
                                {['all', 'P', 'M', 'G', 'GG'].map(sz => (
                                    <button
                                        key={sz}
                                        onClick={() => setSelectedSize(sz)}
                                        className={`px-3 py-1 text-xs uppercase font-bold tracking-wider rounded-lg border transition-all ${
                                            selectedSize === sz
                                                ? 'bg-[#7A3E4A] border-[#7A3E4A] text-white'
                                                : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
                                        }`}
                                    >
                                        {sz === 'all' ? 'Todos' : sz}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sorting Filter & Layout Switcher */}
                    <div className="flex items-center gap-6 self-end sm:self-auto">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500 font-medium">Ordenar por:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-[#7A3E4A] text-gray-700 font-medium cursor-pointer"
                            >
                                <option value="newest">Novidades</option>
                                <option value="price-asc">Menor Preço</option>
                                <option value="price-desc">Maior Preço</option>
                            </select>
                        </div>

                        {/* View Grid Switcher (Hidden on Mobile) */}
                        <div className="hidden md:flex items-center gap-3 border-l border-gray-200 pl-6">
                            <span className="text-xs uppercase font-bold tracking-widest text-[#7A3E4A] font-semibold">Visualizar:</span>
                            <div className="flex gap-2">
                                {/* 3 Columns Button */}
                                <button 
                                    onClick={() => setViewCols(3)}
                                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${viewCols === 3 ? 'border-[#7A3E4A] bg-[#7A3E4A]/5 text-[#7A3E4A]' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                                    aria-label="Visualizar em 3 colunas"
                                    title="3 colunas"
                                >
                                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                        <rect x="3" y="4" width="4.5" height="16" rx="1" />
                                        <rect x="9.75" y="4" width="4.5" height="16" rx="1" />
                                        <rect x="16.5" y="4" width="4.5" height="16" rx="1" />
                                    </svg>
                                </button>
                                {/* 4 Columns Button */}
                                <button 
                                    onClick={() => setViewCols(4)}
                                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${viewCols === 4 ? 'border-[#7A3E4A] bg-[#7A3E4A]/5 text-[#7A3E4A]' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                                    aria-label="Visualizar em 4 colunas"
                                    title="4 colunas"
                                >
                                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                        <rect x="2" y="4" width="3.5" height="16" rx="0.75" />
                                        <rect x="7.5" y="4" width="3.5" height="16" rx="0.75" />
                                        <rect x="13" y="4" width="3.5" height="16" rx="0.75" />
                                        <rect x="18.5" y="4" width="3.5" height="16" rx="0.75" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product Count */}
                <div className="mb-6 text-[10px] text-gray-400 font-bold tracking-[0.15em] uppercase">
                    {filteredProducts.length === 0 
                        ? 'Nenhum produto encontrado' 
                        : filteredProducts.length === 1 
                            ? 'Foi encontrado 1 produto' 
                            : `Foram encontrados ${filteredProducts.length} produtos`}
                </div>

                {/* Catalog Grid */}
                {loading ? (
                    <div className="flex justify-center py-24">
                        <div className="w-8 h-8 border-[1px] border-[#C6A76A] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredProducts.length > 0 ? (
                    <div className="space-y-12">
                        <div className={`grid grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-8 sm:gap-y-12 ${viewCols === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
                            {paginatedProducts.map((product) => (
                                <div key={product.id}>
                                    <ProductCard
                                        product={product}
                                        onQuickView={setQuickViewProduct}
                                        onToggleWishlist={toggleWishlist}
                                        isWishlisted={isWishlisted(product.id)}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-16 font-sans">
                                <button
                                    onClick={() => {
                                        setCurrentPage(prev => Math.max(prev - 1, 1))
                                        window.scrollTo({ top: 300, behavior: 'smooth' })
                                    }}
                                    disabled={currentPage === 1}
                                    className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#7A3E4A] hover:text-[#7A3E4A] transition-all disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:text-gray-500 cursor-pointer"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                
                                {[...Array(totalPages)].map((_, index) => {
                                    const pageNumber = index + 1
                                    return (
                                        <button
                                            key={pageNumber}
                                            onClick={() => {
                                                setCurrentPage(pageNumber)
                                                window.scrollTo({ top: 300, behavior: 'smooth' })
                                            }}
                                            className={`w-10 h-10 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                                currentPage === pageNumber
                                                    ? 'bg-[#7A3E4A] border-[#7A3E4A] text-white shadow-md shadow-[#7A3E4A]/10'
                                                    : 'border-gray-200 text-gray-600 hover:border-[#7A3E4A] hover:text-[#7A3E4A]'
                                            }`}
                                        >
                                            {pageNumber}
                                        </button>
                                    )
                                })}
                                
                                <button
                                    onClick={() => {
                                        setCurrentPage(prev => Math.min(prev + 1, totalPages))
                                        window.scrollTo({ top: 300, behavior: 'smooth' })
                                    }}
                                    disabled={currentPage === totalPages}
                                    className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#7A3E4A] hover:text-[#7A3E4A] transition-all disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:text-gray-500 cursor-pointer"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-white rounded-2xl border border-gray-100/50">
                        <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <h3 className="font-heading text-xl font-bold text-gray-700 mb-2">Nenhum produto encontrado</h3>
                        <p className="text-gray-400 font-light text-sm max-w-xs mx-auto">Não temos peças disponíveis que correspondam aos filtros selecionados no momento.</p>
                    </div>
                )}
            </main>

            <Footer />
            <WhatsAppButton />
            <ScrollToTop />

            <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
            <QuickViewModal
                product={quickViewProduct}
                isOpen={!!quickViewProduct}
                onClose={() => setQuickViewProduct(null)}
                onAddToCart={handleAddToCart}
                isWishlisted={quickViewProduct ? isWishlisted(quickViewProduct.id) : false}
                onToggleWishlist={toggleWishlist}
            />
            <Notification message={notification.message} visible={notification.visible} onHide={() => setNotification({ message: '', visible: false })} />
        </div>
    )
}
