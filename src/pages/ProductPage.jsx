import { useState, useMemo, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import Seo from '../components/Seo.jsx'
import { getAssetUrl } from '../utils/assets.js'
import { useProducts } from '../hooks/useProducts.js'
import { useCart } from '../hooks/useCart.js'
import { useWishlist } from '../hooks/useWishlist.js'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import ProductCard from '../components/ProductCard.jsx'
import SearchOverlay from '../components/SearchOverlay.jsx'
import QuickViewModal from '../components/QuickViewModal.jsx'
import Notification from '../components/Notification.jsx'
import WhatsAppButton from '../components/WhatsAppButton.jsx'
import ScrollReveal from '../components/ScrollReveal.jsx'
import { fetchProductReviews, createProductReview } from '../services/database.js'

const slugifyCategory = (name) => name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/[\s-]+/g, '-')

export default function ProductPage() {
    const { id } = useParams()
    const { products, loading } = useProducts()
    const { cartCount, addToCart } = useCart()
    const { wishlistCount, toggleWishlist, isWishlisted } = useWishlist()

    const [selectedSize, setSelectedSize] = useState(null)
    const [quantity, setQuantity] = useState(1)
    const [activeTab, setActiveTab] = useState('description')
    const [searchOpen, setSearchOpen] = useState(false)
    const [quickViewProduct, setQuickViewProduct] = useState(null)
    const [notification, setNotification] = useState({ message: '', visible: false })
    const [reviews, setReviews] = useState([])
    const [newReview, setNewReview] = useState({ name: '', rating: 5, comment: '' })
    const [hoverRating, setHoverRating] = useState(0)
    const [reviewSuccess, setReviewSuccess] = useState(false)

    const [selectedColor, setSelectedColor] = useState(null)
    const [selectedKit, setSelectedKit] = useState(null)
    const [wantsCustomization, setWantsCustomization] = useState(false)
    const [customText, setCustomText] = useState('')
    const [activeImageIndex, setActiveImageIndex] = useState(0)
    const [lightboxOpen, setLightboxOpen] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    // Load reviews from Supabase / localStorage cache
    useEffect(() => {
        if (!id) return
        let isMounted = true
        fetchProductReviews(id).then(({ data }) => {
            if (isMounted && data) {
                setReviews(data)
            }
        })
        return () => { isMounted = false }
    }, [id])

    const averageRating = useMemo(() => {
        if (!reviews || reviews.length === 0) return '5.0'
        const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0)
        return (sum / reviews.length).toFixed(1)
    }, [reviews])

    // Find target product
    const product = useMemo(() => {
        if (!products) return null
        return products.find(p => p.id === parseInt(id) || p.id === id)
    }, [products, id])

    // Scroll to top on page load or product ID change
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        setSelectedSize(null)
        setSelectedColor(null)
        setSelectedKit(null)
        setQuantity(1)
        setErrorMsg('')
        setWantsCustomization(false)
        setCustomText('')
        setActiveImageIndex(0)
        setLightboxOpen(false)
    }, [id])

    const isCustomizableProduct = useMemo(() => {
        if (!product) return false
        return product.category?.toLowerCase() === 'personalizaveis' || product.category?.toLowerCase() === 'personalizáveis' || product.isCustomizable
    }, [product])

    const customPrice = useMemo(() => {
        if (!wantsCustomization || !customText) return 0
        const feeLetter = product.customFeeLetter !== undefined ? parseFloat(product.customFeeLetter) : 2.50
        const feeNumber = product.customFeeNumber !== undefined ? parseFloat(product.customFeeNumber) : 2.50
        const feeEmoji = product.customFeeEmoji !== undefined ? parseFloat(product.customFeeEmoji) : 3.00
        
        let total = 0
        for (const char of customText) {
            if (/\s/.test(char)) {
                continue
            } else if (/[a-zA-Z]/.test(char)) {
                total += feeLetter
            } else if (/[0-9]/.test(char)) {
                total += feeNumber
            } else {
                total += feeEmoji
            }
        }
        return total
    }, [wantsCustomization, customText, product])

    const displayedPrice = useMemo(() => {
        if (!product) return 0
        if (selectedKit) {
            return parseFloat(selectedKit.price) || 0
        }
        if (wantsCustomization) {
            const basePrice = product.customPriceWith ? parseFloat(product.customPriceWith) : product.price
            return basePrice + customPrice
        } else {
            return product.customPriceWithout ? parseFloat(product.customPriceWithout) : product.price
        }
    }, [selectedKit, wantsCustomization, customPrice, product])

    // Fallback/related products
    const relatedProducts = useMemo(() => {
        if (!products || !product) return []
        return products
            .filter(p => p.category === product.category && p.id !== product.id)
            .slice(0, 4)
    }, [products, product])

    const productImages = useMemo(() => {
        if (!product) return []
        const imgs = product.image
        return Array.isArray(imgs) ? imgs : (imgs ? [imgs] : [])
    }, [product])

    const sizes = useMemo(() => {
        if (!product || !product.sizes) return []
        const parsed = typeof product.sizes === 'string' 
            ? product.sizes.split(',').map(s => s.trim()) 
            : product.sizes
        const unique = []
        const seen = new Set()
        for (let s of parsed) {
            const key = s.trim().toUpperCase()
            if (key && !seen.has(key)) {
                seen.add(key)
                unique.push(s.trim())
            }
        }
        return unique
    }, [product])

    const activeEmojisList = useMemo(() => {
        if (!product) return []
        const raw = product.customizableEmojis || product.customizable_emojis
        const emojiList = raw 
            ? (typeof raw === 'string' ? raw.split(',').map(e => e.trim()) : raw)
            : ['🍎', '💛', '👄', '🍒', '😍', '🌶️', '🐰', '🌟']
        
        const labelsMap = {
            '🍎': 'Maçã',
            '💛': 'Coração Dourado',
            '👄': 'Boca/Lábios',
            '🍒': 'Cereja',
            '😍': 'Apaixonado',
            '🌶️': 'Pimenta',
            '🐰': 'Coelho Playboy Preto',
            '🌟': 'Coelho Brilha no Escuro'
        }
        
        return emojiList.map(emoji => ({
            emoji,
            label: labelsMap[emoji] || 'Emoji Especial'
        }))
    }, [product])

    const getAvailableStockForSelected = useCallback(() => {
        if (!product) return 0
        const variantStockMap = product.variantStock || product.variant_stock || {}
        const colorStockMap = product.colorStock || product.color_stock || {}

        if (selectedSize && selectedColor && variantStockMap[`${selectedSize}_${selectedColor}`] !== undefined) {
            return Math.max(0, parseInt(variantStockMap[`${selectedSize}_${selectedColor}`]))
        }
        if (selectedColor && colorStockMap[selectedColor] !== undefined) {
            return Math.max(0, parseInt(colorStockMap[selectedColor]))
        }
        if (product.stock !== undefined) {
            return Math.max(0, parseInt(product.stock))
        }
        return 99
    }, [product, selectedSize, selectedColor])

    useEffect(() => {
        const handleStockWarning = (e) => {
            if (e.detail?.message) {
                setNotification({ message: e.detail.message, visible: true })
            }
        }
        window.addEventListener('cart-stock-warning', handleStockWarning)
        return () => window.removeEventListener('cart-stock-warning', handleStockWarning)
    }, [])

    // Auto-adjust quantity if user selects a size/color combination with lower stock
    useEffect(() => {
        const maxStock = getAvailableStockForSelected()
        if (maxStock > 0 && quantity > maxStock) {
            setQuantity(maxStock)
        }
    }, [getAvailableStockForSelected, quantity])

    // Switch main gallery image when selectedColor changes if colorImages mapping exists
    useEffect(() => {
        if (!selectedColor || !product) return
        const colorMap = product.colorImages || product.color_images || {}
        const mappedImg = colorMap[selectedColor]
        if (mappedImg) {
            const idx = productImages.findIndex(img => img === mappedImg)
            if (idx !== -1) {
                setActiveImageIndex(idx)
            }
        }
    }, [selectedColor, product, productImages])

    if (loading) {
        return (
            <div className="bg-[#FCFAFA] min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-[#7A3E4A] border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!product) {
        return (
            <div className="bg-[#FCFAFA] min-h-screen flex flex-col">
                <Header cartCount={cartCount} wishlistCount={wishlistCount} onSearchOpen={() => setSearchOpen(true)} />
                <div className="max-w-7xl mx-auto px-4 py-24 text-center flex-grow">
                    <h2 className="font-heading text-3xl text-gray-900 mb-4">Produto não encontrado</h2>
                    <p className="text-gray-500 mb-8">O produto solicitado não foi localizado em nosso catálogo.</p>
                    <Link to="/" className="bg-[#7A3E4A] !text-white px-8 py-3 rounded-lg uppercase tracking-wider font-bold">
                        Voltar ao Início
                    </Link>
                </div>
                <Footer />
            </div>
        )
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)
    }

    const handleAddToCart = () => {
        if (sizes.length > 0 && !selectedSize) {
            setErrorMsg('Por favor, selecione um tamanho.')
            return
        }
        if (colors.length > 0 && !selectedColor) {
            setErrorMsg('Por favor, selecione uma cor.')
            return
        }
        setErrorMsg('')

        const maxStock = getAvailableStockForSelected()
        if (maxStock <= 0) {
            setErrorMsg('Desculpe, esta variação está esgotada no momento.')
            setNotification({ message: 'Esgotado nesta variação (Tamanho/Cor).', visible: true })
            return
        }

        if (quantity > maxStock) {
            setErrorMsg(`Apenas ${maxStock} un. disponível(is) para esta variação.`)
            setNotification({ message: `Não é possível adicionar ${quantity} un. Estoque disponível: ${maxStock} un.`, visible: true })
            setQuantity(maxStock)
            return
        }

        if (selectedKit) {
            const kitProduct = {
                ...product,
                name: `${product.name} (${selectedKit.name || `Kit com ${selectedKit.qty}`})`,
                price: parseFloat(selectedKit.price) || 0,
                isKit: true,
                kitName: selectedKit.name || `Kit com ${selectedKit.qty}`,
                kitQty: selectedKit.qty
            }
            const success = addToCart(kitProduct, selectedSize, selectedColor || '', '', 0, quantity)
            if (success !== false) {
                setNotification({ message: `${quantity}x ${selectedKit.name || 'Kit'} de ${product.name} adicionado ao carrinho!`, visible: true })
            }
            return
        }

        const basePrice = wantsCustomization
            ? (product.customPriceWith ? parseFloat(product.customPriceWith) : product.price)
            : (product.customPriceWithout ? parseFloat(product.customPriceWithout) : product.price)

        const productWithPricing = {
            ...product,
            price: basePrice
        }

        const success = addToCart(productWithPricing, selectedSize, selectedColor || '', wantsCustomization ? customText : '', wantsCustomization ? customPrice : 0, quantity)
        if (success !== false) {
            setNotification({ message: `${quantity}x ${product.name} adicionado ao carrinho!`, visible: true })
        }
    }

    const handleAddReview = async (e) => {
        e.preventDefault()
        if (!newReview.name.trim() || !newReview.comment.trim()) return

        const reviewPayload = {
            product_id: id,
            name: newReview.name.trim(),
            rating: newReview.rating,
            comment: newReview.comment.trim()
        }

        // Optimistically update state
        const tempObj = {
            ...reviewPayload,
            id: 'rev-' + Date.now(),
            date: new Date().toLocaleDateString('pt-BR'),
            verified: true
        }
        setReviews(prev => [tempObj, ...prev])
        setNewReview({ name: '', rating: 5, comment: '' })
        setReviewSuccess(true)
        setTimeout(() => setReviewSuccess(false), 4000)

        // Persist to Supabase
        await createProductReview(reviewPayload)
    }

    const imageSrc = getAssetUrl(productImages[activeImageIndex] || '/placeholder.jpg')
    const colors = product.colors ? (Array.isArray(product.colors) ? product.colors : (typeof product.colors === 'string' ? product.colors.split(',').map(c => c.trim()) : [])) : []

    const productImage = Array.isArray(product.image) ? product.image[0] : product.image
    const productJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        image: productImage ? [getAssetUrl(productImage)] : undefined,
        description: product.description || `${product.name} - Meraki Femme`,
        category: product.category,
        offers: {
            '@type': 'Offer',
            url: `https://merakifemme.com.br/product/${product.id}`,
            priceCurrency: 'BRL',
            price: Number(product.price) || 0,
            availability: (product.stock === undefined || product.stock > 0)
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock'
        }
    }

    return (
        <div className="bg-[#FCFAFA] min-h-screen flex flex-col font-sans">
            <Seo
                title={product.name}
                description={product.description ? product.description.slice(0, 155) : `${product.name} - Compre na Meraki Femme, lingerie e moda feminina premium.`}
                path={`/product/${product.id}`}
                image={productImage ? getAssetUrl(productImage) : undefined}
            />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
            <Header cartCount={cartCount} wishlistCount={wishlistCount} onSearchOpen={() => setSearchOpen(true)} />

            {/* Breadcrumbs */}
            <nav className="max-w-7xl mx-auto px-4 w-full py-4 text-xs text-gray-400">
                <Link to="/" className="hover:text-gray-900 transition-colors">Home</Link>
                <span className="mx-2">/</span>
                <Link to={`/category/${slugifyCategory(product.category)}`} className="hover:text-gray-900 transition-colors">
                    {product.category}
                </Link>
                <span className="mx-2">/</span>
                <span className="text-gray-700 font-medium">{product.name}</span>
            </nav>

            {/* Main Product Layout */}
            <main className="max-w-7xl mx-auto px-4 py-6 w-full flex-grow">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    
                    {/* Left Column: Premium Gallery with Thumbnails & Zoom */}
                    <div className="lg:col-span-7 flex flex-col gap-4">
                        <div 
                            onClick={() => setLightboxOpen(true)}
                            className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-gray-50 border border-gray-100/50 shadow-sm cursor-zoom-in group"
                        >
                            <img src={imageSrc} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="bg-white/95 text-gray-800 text-[11px] font-bold uppercase tracking-wider px-4 py-2.5 rounded-full shadow-md flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" /></svg>
                                    Clique para Ampliar
                                </span>
                            </div>
                        </div>

                        {productImages.length > 1 && (
                            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
                                {productImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImageIndex(idx)}
                                        className={`w-20 h-24 rounded-xl overflow-hidden border shrink-0 transition-all p-0.5 cursor-pointer ${
                                            activeImageIndex === idx 
                                                ? 'border-[#7A3E4A] ring-2 ring-[#7A3E4A]/10 scale-[1.02]' 
                                                : 'border-gray-200 hover:border-gray-450 bg-white'
                                        }`}
                                    >
                                        <img src={getAssetUrl(img)} alt="" className="w-full h-full object-cover rounded-lg" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Order Form */}
                    <div className="lg:col-span-5 flex flex-col">
                        {/* Rating Header */}
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                            <div className="flex">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <svg key={i} className={`w-4 h-4 ${i < Math.round(averageRating) ? 'text-amber-400 fill-current' : 'text-gray-200 fill-current'}`} viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>
                            <span className="cursor-pointer hover:underline text-gray-500 font-semibold" onClick={() => document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' })}>
                                {averageRating} ({reviews.length} avaliações)
                            </span>
                            <span className="text-gray-300">|</span>
                            <span>SKU: {1000000 + product.id}</span>
                        </div>

                        {/* Title */}
                        <h1 className="font-sans text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-4">{product.name}</h1>

                        {/* Pricing and payments */}
                        <div className="mb-6 pb-6 border-b border-gray-100">
                            <div className="flex items-baseline gap-3 mb-2">
                                {product.original_price > 0 && product.original_price > product.price && !selectedKit && (
                                    <span className="text-base sm:text-lg text-gray-400 line-through font-light">{formatPrice(product.original_price)}</span>
                                )}
                                <span className="text-3xl font-extrabold text-[#7A3E4A]">{formatPrice(displayedPrice)}</span>
                                {selectedKit && (
                                    <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                                        Preço Promocional do Kit
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 font-medium">
                                <span className="text-[#D11A6E] font-bold">{formatPrice(displayedPrice * 0.95)}</span> à vista no PIX ou 6x de {formatPrice(displayedPrice / 6)} sem juros no cartão.
                            </p>
                        </div>

                        {/* Seletor de Modalidade Kit */}
                        {product.hasKits && product.kitOptions && product.kitOptions.length > 0 && (
                            <div className="mb-6 bg-gradient-to-r from-[#FAF9F5] to-[#FFF8F8] p-4 rounded-2xl border border-[#EEEEEE] space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <span>🎁</span> Opções de Compras / Kits
                                    </h4>
                                    {selectedKit && (
                                        <span className="text-[10px] text-emerald-800 bg-emerald-100 font-bold px-2 py-0.5 rounded-full">
                                            Kit Selecionado
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    {/* Opção 1 Unidade */}
                                    <button
                                        type="button"
                                        onClick={() => setSelectedKit(null)}
                                        className={`py-3 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                                            !selectedKit
                                                ? 'border-[#7A3E4A] text-[#7A3E4A] bg-white ring-2 ring-[#7A3E4A]/10 scale-[1.02] shadow-xs'
                                                : 'border-gray-200 text-gray-600 bg-white hover:border-gray-400'
                                        }`}
                                    >
                                        <div>1 Unidade</div>
                                        <div className="text-[10px] font-medium text-gray-400 mt-0.5">
                                            {formatPrice(product.customPriceWithout || product.price)}
                                        </div>
                                    </button>

                                    {/* Opções de Kits Cadastrados */}
                                    {product.kitOptions.map((kit, idx) => {
                                        const isSelected = selectedKit?.name === kit.name && Number(selectedKit?.qty) === Number(kit.qty)
                                        const unitPrice = (kit.price && kit.qty) ? (parseFloat(kit.price) / parseInt(kit.qty)) : 0
                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setSelectedKit(kit)}
                                                className={`py-3 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center relative overflow-hidden ${
                                                    isSelected
                                                        ? 'border-[#7A3E4A] text-[#7A3E4A] bg-white ring-2 ring-[#7A3E4A]/10 scale-[1.02] shadow-xs'
                                                        : 'border-gray-200 text-gray-600 bg-white hover:border-gray-400'
                                                }`}
                                            >
                                                <div>{kit.name || `Kit com ${kit.qty}`}</div>
                                                <div className="text-[10px] font-semibold text-emerald-700 mt-0.5">
                                                    {formatPrice(kit.price)} <span className="font-normal text-gray-400">({formatPrice(unitPrice)}/un)</span>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>

                                {selectedKit && (
                                    <div className="text-[11px] text-[#7A3E4A] font-medium bg-[#7A3E4A]/5 p-2.5 rounded-xl border border-[#7A3E4A]/10 text-center flex items-center justify-center gap-1.5">
                                        <svg className="w-3.5 h-3.5 shrink-0 fill-[#7A3E4A]" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        <span>Os kits possuem valor promocional e não acumulam com cupons de desconto.</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Seletor de Cores Dinâmico com Estoque Individual */}
                        {colors.length > 0 && (
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2.5">
                                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Selecione a Cor</h4>
                                    {errorMsg && !selectedColor && <span className="text-red-500 text-xs font-bold animate-[pulse_1.5s_infinite]">{errorMsg}</span>}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {colors.map(color => {
                                        const COLOR_MAP = {
                                            'Preto': '#000000',
                                            'Branco': '#FFFFFF',
                                            'Vermelho': '#DC2626',
                                            'Nude': '#EED9C4',
                                            'Rosa': '#F472B6',
                                            'Bordô': '#800020',
                                            'Azul': '#2563EB',
                                            'Verde': '#16A34A',
                                            'Amarelo': '#FBBF24',
                                            'Lilás': '#C084FC',
                                            'Marinho': '#1E3A8A',
                                            'Pink': '#EC4899',
                                            'Rubi': '#9B111E',
                                            'Preto/Renda': '#1F1F1F',
                                            'Branco/Renda': '#F5F5F5'
                                        }
                                        const customMap = JSON.parse(localStorage.getItem('meraki_custom_colors_map') || '{}')
                                        let hex = COLOR_MAP[color] || customMap[color] || '#CCCCCC'
                                        
                                        if (hex === '#CCCCCC') {
                                            const lower = color.toLowerCase()
                                            if (lower.includes('verde')) hex = '#16A34A'
                                            else if (lower.includes('vermelho') || lower.includes('veremelho')) hex = '#DC2626'
                                            else if (lower.includes('preto')) hex = '#000000'
                                            else if (lower.includes('branco')) hex = '#FFFFFF'
                                            else if (lower.includes('rosa') || lower.includes('pink')) hex = '#F472B6'
                                            else if (lower.includes('azul') || lower.includes('marinho')) hex = '#1E3A8A'
                                            else if (lower.includes('nude')) hex = '#EED9C4'
                                            else if (lower.includes('bordô') || lower.includes('bordo')) hex = '#800020'
                                        }

                                        const variantStockMap = product.variantStock || product.variant_stock || {}
                                        const colorStockMap = product.colorStock || product.color_stock || {}

                                        let colorQty
                                        if (selectedSize && variantStockMap[`${selectedSize}_${color}`] !== undefined) {
                                            colorQty = parseInt(variantStockMap[`${selectedSize}_${color}`])
                                        } else {
                                            colorQty = colorStockMap[color] !== undefined ? parseInt(colorStockMap[color]) : undefined
                                        }
                                        const isOut = colorQty !== undefined && colorQty <= 0

                                        return (
                                            <button
                                                key={color}
                                                type="button"
                                                disabled={isOut}
                                                onClick={() => {
                                                    if (!isOut) {
                                                        setSelectedColor(color)
                                                        setErrorMsg('')
                                                    }
                                                }}
                                                className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                                                    isOut
                                                        ? 'opacity-40 line-through border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed'
                                                        : selectedColor === color
                                                            ? 'border-[#7A3E4A] text-[#7A3E4A] ring-2 ring-[#7A3E4A]/10 bg-white scale-[1.02] shadow-xs cursor-pointer'
                                                            : 'border-gray-200 text-gray-500 hover:border-gray-400 bg-white cursor-pointer'
                                                }`}
                                            >
                                                <span 
                                                    className="w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0" 
                                                    style={{ backgroundColor: hex }} 
                                                />
                                                <span>{color}</span>
                                                {colorQty !== undefined && (
                                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                                                        isOut
                                                            ? 'bg-red-100 text-red-600 no-underline font-normal'
                                                            : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                        {isOut ? 'Esgotado' : `${colorQty} un.`}
                                                    </span>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Stock Banner */}
                        {(() => {
                            const variantStockMap = product.variantStock || product.variant_stock || {}
                            const colorStockMap = product.colorStock || product.color_stock || {}

                            let currentStock
                            let stockLabel = ''

                            if (selectedSize && selectedColor && variantStockMap[`${selectedSize}_${selectedColor}`] !== undefined) {
                                currentStock = parseInt(variantStockMap[`${selectedSize}_${selectedColor}`])
                                stockLabel = `Tamanho ${selectedSize} / Cor ${selectedColor}`
                            } else if (selectedColor && colorStockMap[selectedColor] !== undefined) {
                                currentStock = parseInt(colorStockMap[selectedColor])
                                stockLabel = `Cor ${selectedColor}`
                            } else {
                                currentStock = product.stock !== undefined ? parseInt(product.stock) : undefined
                            }

                            if (currentStock === undefined) return null

                            return (
                                <div className={`text-xs px-4 py-3 flex items-center justify-center gap-2 mb-6 w-full text-center rounded-xl font-sans ${
                                    currentStock === 0 
                                        ? 'bg-red-50 text-red-700 border border-red-100' 
                                        : currentStock <= 5 
                                            ? 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse'
                                            : 'bg-[#7A3E4A]/10 text-[#4A2028]'
                                }`}>
                                    <svg className={`w-4 h-4 shrink-0 ${currentStock === 0 ? 'text-red-500 fill-red-500' : 'text-[#7A3E4A] fill-[#7A3E4A]'}`} viewBox="0 0 24 24">
                                        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
                                    </svg>
                                    <span>
                                        {currentStock === 0 
                                            ? (stockLabel ? `A variação ${stockLabel} está esgotada no momento.` : 'Produto esgotado no momento.')
                                            : stockLabel
                                                ? `Estoque para ${stockLabel}: apenas ${currentStock} unidade${currentStock > 1 ? 's' : ''} disponível${currentStock > 1 ? 'is' : ''}!`
                                                : `Restam apenas ${currentStock} unidade${currentStock > 1 ? 's' : ''} em estoque!`
                                        }
                                    </span>
                                </div>
                            )
                        })()}

                        {/* Size Selection */}
                        {sizes.length > 0 && (
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Selecione o Tamanho</h4>
                                    {errorMsg && <span className="text-red-500 text-xs font-bold animate-[pulse_1.5s_infinite]">{errorMsg}</span>}
                                </div>
                                <div className="flex flex-wrap gap-2.5">
                                    {sizes.map(size => {
                                        const variantStockMap = product.variantStock || product.variant_stock || {}
                                        let sizeQty
                                        if (selectedColor && variantStockMap[`${size}_${selectedColor}`] !== undefined) {
                                            sizeQty = parseInt(variantStockMap[`${size}_${selectedColor}`])
                                        }
                                        const isSizeOut = sizeQty !== undefined && sizeQty <= 0

                                        return (
                                            <button
                                                key={size}
                                                disabled={isSizeOut}
                                                onClick={() => {
                                                    if (!isSizeOut) {
                                                        setSelectedSize(size)
                                                        setErrorMsg('')
                                                    }
                                                }}
                                                className={`px-3 py-2 rounded-xl border text-xs uppercase font-extrabold flex items-center gap-1.5 transition-all ${
                                                    isSizeOut
                                                        ? 'opacity-40 line-through border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed'
                                                        : selectedSize === size
                                                            ? 'border-[#7A3E4A] text-[#7A3E4A] border-2 bg-transparent scale-105 shadow-xs cursor-pointer'
                                                            : 'border-gray-300 text-gray-650 hover:border-gray-450 bg-white cursor-pointer'
                                                }`}
                                            >
                                                <span>{size}</span>
                                                {sizeQty !== undefined && (
                                                    <span className={`text-[9px] px-1 py-0.2 rounded-md ${
                                                        isSizeOut ? 'bg-red-100 text-red-600 no-underline font-normal' : 'bg-gray-100 text-gray-600 font-normal'
                                                    }`}>
                                                        {isSizeOut ? 'Esgotado' : `${sizeQty} un.`}
                                                    </span>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}



                        {/* Personalization Section */}
                        {isCustomizableProduct && (
                            <div className="mb-6 bg-[#FAF9F5] p-5 rounded-2xl border border-[#EEEEEE] space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Personalização</h4>
                                    <span className="bg-[#C6A76A]/10 text-[#C6A76A] px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">Opcional</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setWantsCustomization(false)
                                            setCustomText('')
                                        }}
                                        className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                                            !wantsCustomization
                                                ? 'border-[#7A3E4A] text-[#7A3E4A] bg-white ring-2 ring-[#7A3E4A]/5 scale-[1.01] shadow-xs'
                                                : 'border-gray-200 text-gray-400 bg-white hover:text-gray-655'
                                        }`}
                                    >
                                        Sem Personalização
                                        <span className="block text-[10px] text-gray-400 font-medium mt-0.5">
                                            {product.customPriceWithout ? formatPrice(product.customPriceWithout) : formatPrice(product.price)}
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setWantsCustomization(true)}
                                        className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                                            wantsCustomization
                                                ? 'border-[#7A3E4A] text-[#7A3E4A] bg-white ring-2 ring-[#7A3E4A]/5 scale-[1.01] shadow-xs'
                                                : 'border-gray-200 text-gray-400 bg-white hover:text-gray-655'
                                        }`}
                                    >
                                        Com Personalização
                                        <span className="block text-[10px] text-gray-400 font-medium mt-0.5">
                                            {formatPrice((product.customPriceWith ? parseFloat(product.customPriceWith) : product.price) + customPrice)}
                                        </span>
                                    </button>
                                </div>

                                {wantsCustomization && (
                                    <div className="space-y-3 animate-[fadeIn_200ms_ease-out]">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Escreva seu texto:</label>
                                            <input
                                                type="text"
                                                maxLength={20}
                                                value={customText}
                                                onChange={e => setCustomText(e.target.value.toUpperCase())}
                                                placeholder="Ex: LOVE"
                                                className="w-full bg-white border border-[#EEEEEE] rounded-xl px-4 py-3 text-sm font-bold text-[#1A1A1A] outline-none focus:border-[#7A3E4A]"
                                            />
                                        </div>

                                        {/* Teclado de Símbolos & Emojis Disponíveis */}
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Passadores em Estoque (Clique para Inserir):</p>
                                            <div className="flex flex-wrap gap-1.5 p-3.5 bg-white rounded-xl border border-[#EEEEEE]">
                                                {/* Números */}
                                                <div className="flex items-center gap-1 border-r border-[#EEEEEE] pr-2.5 mr-1">
                                                    {['6', '9'].map(char => (
                                                        <button 
                                                            key={char} 
                                                            type="button" 
                                                            onClick={() => {
                                                                if (customText.length < 20) {
                                                                    setCustomText(prev => prev + char)
                                                                }
                                                            }}
                                                            className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-xs font-bold rounded-lg border border-[#EEEEEE] transition-all cursor-pointer"
                                                        >
                                                            {char}
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Símbolos */}
                                                <div className="flex items-center gap-1 border-r border-[#EEEEEE] pr-2.5 mr-1">
                                                    {['&', '?', '!'].map(char => (
                                                        <button 
                                                            key={char} 
                                                            type="button" 
                                                            onClick={() => {
                                                                if (customText.length < 20) {
                                                                    setCustomText(prev => prev + char)
                                                                }
                                                            }}
                                                            className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-xs font-bold rounded-lg border border-[#EEEEEE] transition-all cursor-pointer"
                                                        >
                                                            {char}
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Emojis */}
                                                {activeEmojisList.length > 0 && (
                                                    <div className="flex flex-wrap items-center gap-1">
                                                        {activeEmojisList.map(item => (
                                                            <button 
                                                                key={item.emoji} 
                                                                type="button" 
                                                                title={item.label}
                                                                onClick={() => {
                                                                    if (customText.length < 20) {
                                                                        setCustomText(prev => prev + item.emoji)
                                                                    }
                                                                }}
                                                                className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-base rounded-lg border border-[#EEEEEE] transition-all cursor-pointer relative group"
                                                            >
                                                                {item.emoji}
                                                                {/* Tooltip */}
                                                                <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[8px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                                                                    {item.label}
                                                                </span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-[9px] text-gray-400">Dica: Você também pode digitar letras normais (A-Z) para personalizar com nomes.</p>
                                        </div>

                                        {/* Fees breakdown */}
                                        <div className="bg-white p-3.5 rounded-xl border border-[#EEEEEE] space-y-1.5 text-[11px] text-gray-500 font-medium">
                                            <div className="flex justify-between">
                                                <span>Custo por Letra:</span>
                                                <span className="font-bold text-gray-700">{formatPrice(product.customFeeLetter !== undefined ? parseFloat(product.customFeeLetter) : 2.50)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Custo por Número:</span>
                                                <span className="font-bold text-gray-700">{formatPrice(product.customFeeNumber !== undefined ? parseFloat(product.customFeeNumber) : 2.50)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Custo por Emoji:</span>
                                                <span className="font-bold text-gray-700">{formatPrice(product.customFeeEmoji !== undefined ? parseFloat(product.customFeeEmoji) : 3.00)}</span>
                                            </div>
                                            {customText.length > 0 && (
                                                <div className="border-t border-dashed border-[#EEEEEE] pt-2 mt-2 flex justify-between text-[#7A3E4A] font-bold">
                                                    <span>Adicional da Palavra:</span>
                                                    <span>+{formatPrice(customPrice)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Quantity and Checkout Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 items-stretch mb-6">
                            {/* Quantity Selector */}
                            <div className="flex items-center justify-between border border-gray-200 bg-white rounded-xl px-4 py-3 sm:w-32 shrink-0">
                                <button 
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                    className="text-gray-500 hover:text-gray-900 font-bold px-2 text-lg focus:outline-none"
                                    disabled={product.stock === 0}
                                >
                                    -
                                </button>
                                <span className="font-extrabold text-gray-900 w-8 text-center text-sm">{product.stock === 0 ? 0 : quantity}</span>
                                <button 
                                    onClick={() => setQuantity(q => {
                                        const maxStock = getAvailableStockForSelected()
                                        if (q >= maxStock) {
                                            setNotification({
                                                message: `Estoque máximo para esta variação é de ${maxStock} un.`,
                                                visible: true
                                            })
                                            return maxStock
                                        }
                                        return q + 1
                                    })}
                                    className="text-gray-500 hover:text-gray-900 font-bold px-2 text-lg focus:outline-none"
                                    disabled={getAvailableStockForSelected() <= 0}
                                >
                                    +
                                </button>
                            </div>

                            {/* Cart Action Button */}
                            <button
                                onClick={handleAddToCart}
                                disabled={product.stock === 0}
                                className={`flex-grow py-4 px-8 rounded-xl text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 ${
                                    product.stock === 0 
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300' 
                                        : 'bg-[#7A3E4A] hover:bg-[#63303a] text-white shadow-md hover:shadow-lg'
                                }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                {product.stock === 0 ? 'Sem Estoque' : 'Adicionar à Sacola'}
                            </button>
                        </div>

                        {/* Wishlist Link Button */}
                        <button
                            onClick={() => toggleWishlist(product.id)}
                            className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900 py-2 border-b border-dotted border-gray-200 self-start mb-8 transition-colors"
                        >
                            <svg className={`w-4 h-4 ${isWishlisted(product.id) ? 'text-[#7A3E4A] fill-[#7A3E4A]' : 'text-gray-450'}`} fill={isWishlisted(product.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            Adicionar aos Meus Desejos
                        </button>

                        {/* Tabs: Description / Shipping */}
                        <div className="border-t border-gray-100 pt-6">
                            <div className="flex gap-6 border-b border-gray-100 pb-3 mb-4 text-xs font-bold uppercase tracking-wider">
                                <button
                                    onClick={() => setActiveTab('description')}
                                    className={`pb-3 border-b-2 transition-all ${activeTab === 'description' ? 'border-[#7A3E4A] text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                                >
                                    Descrição do Produto
                                </button>
                                <button
                                    onClick={() => setActiveTab('shipping')}
                                    className={`pb-3 border-b-2 transition-all ${activeTab === 'shipping' ? 'border-[#7A3E4A] text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                                >
                                    Política de Troca
                                </button>
                            </div>

                            <div className="text-xs text-gray-500 leading-relaxed space-y-4 font-light">
                                {activeTab === 'description' ? (
                                    <>
                                        <p>{product.description || 'Design sensual e sofisticado projetado para abraçar suas curvas com naturalidade. Confeccionado em renda francesa de toque macio e acabamento de alta costura.'}</p>
                                        
                                        {/* Primeira imagem inserida na descrição */}
                                        {productImages.length > 0 && (
                                            <div className="my-4 rounded-xl overflow-hidden border border-gray-100/60 max-w-sm">
                                                <img 
                                                    src={getAssetUrl(productImages[0])} 
                                                    alt={product.name} 
                                                    className="w-full h-auto object-cover aspect-[3/4]"
                                                />
                                            </div>
                                        )}

                                        <ul className="list-disc pl-4 space-y-1 mt-2">
                                            <li>Composição: 90% Poliamida, 10% Elastano.</li>
                                            <li>Forro do bojo e entretela de algodão premium.</li>
                                            <li>Alças reguláveis com banho antialérgico de ouro.</li>
                                        </ul>
                                    </>
                                ) : (
                                    <>
                                        <p>Por questões de higiene e saúde (peças íntimas), não realizamos devoluções ou reembolsos de produtos. No entanto, oferecemos a troca de tamanho ou modelo caso a peça esteja em perfeito estado, sem marcas de uso, com etiquetas intactas e na embalagem original.</p>
                                        <p>O prazo para solicitar a troca é de até 7 dias corridos após o recebimento.</p>
                                    </>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Reviews Section */}
                <section id="reviews-section" className="py-16 mt-16 border-t border-gray-100">
                    <h3 className="font-heading text-2xl text-gray-900 mb-8 text-center">Opiniões de Quem Já Comprou</h3>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Rating Summary */}
                        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-gray-100 shadow-2xs text-center flex flex-col justify-center items-center h-fit">
                            <span className="text-5xl font-extrabold text-gray-900">{averageRating}</span>
                            <div className="flex my-2">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <svg key={i} className={`w-5 h-5 ${i < Math.round(averageRating) ? 'text-amber-400 fill-current' : 'text-gray-200 fill-current'}`} viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>
                            <p className="text-xs text-gray-400 font-medium">Recomendado por 99% das compradoras</p>
                        </div>

                        {/* Customer Reviews List */}
                        <div className="lg:col-span-8 space-y-6">
                            {reviews.length > 0 ? (
                                <div className="space-y-4">
                                    {reviews.map(rev => (
                                        <div key={rev.id} className="bg-white p-5 rounded-2xl border border-gray-100/80 shadow-2xs">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-gray-900">{rev.name}</span>
                                                    {rev.verified && (
                                                        <span className="bg-emerald-50 text-emerald-600 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                                            ✓ Compradora verificada
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-gray-400">{rev.date}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-amber-400 mb-2">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <svg key={i} className={`w-4 h-4 ${i < (rev.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} viewBox="0 0 20 20">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                ))}
                                                <span className="text-xs font-bold text-gray-400 ml-1">{rev.rating || 5}.0</span>
                                            </div>
                                            <p className="text-xs text-gray-600 font-light leading-relaxed">{rev.comment}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center py-10 shadow-2xs">
                                    <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-400 flex items-center justify-center mx-auto mb-3">
                                        <svg className="w-6 h-6 fill-current" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-bold text-gray-800 mb-1">Nenhuma avaliação ainda</p>
                                    <p className="text-xs text-gray-400">Seja a primeira pessoa a avaliar este produto!</p>
                                </div>
                            )}

                            {/* Add Review Form */}
                            <form onSubmit={handleAddReview} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs mt-8">
                                <h4 className="font-heading text-lg text-gray-900 mb-4">Deixe sua Opinião</h4>
                                {reviewSuccess && (
                                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-4 py-2.5 rounded-lg mb-4">
                                        Muito obrigado! Sua avaliação foi cadastrada com sucesso.
                                    </div>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Seu Nome</label>
                                        <input
                                            type="text"
                                            required
                                            value={newReview.name}
                                            onChange={e => setNewReview({ ...newReview, name: e.target.value })}
                                            className="w-full bg-[#FCFAFA] border border-gray-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#7A3E4A] text-gray-700"
                                            placeholder="Ex: Amanda Lima"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Avaliação (Estrelas)</label>
                                        <div className="flex items-center gap-1 bg-[#FCFAFA] border border-gray-200 rounded-xl px-3 py-1.5 h-[40px]">
                                            {[1, 2, 3, 4, 5].map((star) => {
                                                const activeRating = hoverRating || newReview.rating
                                                const isFilled = star <= activeRating
                                                return (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                                                        onMouseEnter={() => setHoverRating(star)}
                                                        onMouseLeave={() => setHoverRating(0)}
                                                        className="p-1 cursor-pointer transition-transform hover:scale-115 focus:outline-none"
                                                        aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
                                                    >
                                                        <svg
                                                            className={`w-5 h-5 transition-colors ${
                                                                isFilled ? 'text-amber-400 fill-amber-400' : 'text-gray-300 fill-transparent stroke-gray-300'
                                                            }`}
                                                            viewBox="0 0 20 20"
                                                        >
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                    </button>
                                                )
                                            })}
                                            <span className="text-[10px] font-bold text-amber-500 ml-1">
                                                {hoverRating || newReview.rating}/5
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Comentário</label>
                                    <textarea
                                        required
                                        rows={3}
                                        value={newReview.comment}
                                        onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                                        className="w-full bg-[#FCFAFA] border border-gray-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#7A3E4A] text-gray-700 resize-none"
                                        placeholder="Compartilhe sua experiência com as outras compradoras..."
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="bg-[#7A3E4A] hover:bg-[#63303a] text-white py-3 px-6 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                                >
                                    Enviar Comentário
                                </button>
                            </form>
                        </div>
                    </div>
                </section>

                {/* Related Products Section */}
                {relatedProducts.length > 0 && (
                    <ScrollReveal variant="fade-up" as="section" className="py-16 border-t border-gray-100">
                        <h3 className="font-heading text-2xl text-gray-900 mb-8 text-center">Quem viu este produto também se interessou</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                            {relatedProducts.map((rel, idx) => (
                                <ScrollReveal key={rel.id} variant="fade-up" delay={idx * 80}>
                                    <ProductCard
                                        product={rel}
                                        onQuickView={setQuickViewProduct}
                                        onToggleWishlist={toggleWishlist}
                                        isWishlisted={isWishlisted(rel.id)}
                                    />
                                </ScrollReveal>
                            ))}
                        </div>
                    </ScrollReveal>
                )}
            </main>

            <Footer />

            <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
            
            <QuickViewModal
                product={quickViewProduct}
                isOpen={quickViewProduct !== null}
                onClose={() => setQuickViewProduct(null)}
                onAddToCart={addToCart}
                isWishlisted={isWishlisted}
                onToggleWishlist={toggleWishlist}
            />

            <Notification
                message={notification.message}
                visible={notification.visible}
                onClose={() => setNotification({ ...notification, visible: false })}
            />

            {/* LIGHTBOX MODAL (ZOOM) */}
            {lightboxOpen && productImages.length > 0 && (
                <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col justify-between items-center p-4 md:p-8 animate-[fadeIn_200ms_ease-out]">
                    {/* Header */}
                    <div className="w-full flex justify-between items-center text-white z-10">
                        <span className="text-xs font-bold tracking-widest text-gray-400">
                            {activeImageIndex + 1} / {productImages.length}
                        </span>
                        <button 
                            type="button"
                            onClick={() => setLightboxOpen(false)}
                            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center cursor-pointer text-white"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Main Image Slider */}
                    <div className="relative flex-1 w-full flex items-center justify-center max-h-[80vh]">
                        {productImages.length > 1 && (
                            <button
                                type="button"
                                onClick={() => setActiveImageIndex(prev => (prev - 1 + productImages.length) % productImages.length)}
                                className="absolute left-2 md:left-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}

                        <img 
                            src={getAssetUrl(productImages[activeImageIndex])} 
                            alt="" 
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-all duration-300"
                        />

                        {productImages.length > 1 && (
                            <button
                                type="button"
                                onClick={() => setActiveImageIndex(prev => (prev + 1) % productImages.length)}
                                className="absolute right-2 md:right-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Footer Slider Thumbnails */}
                    {productImages.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto py-4 max-w-full z-10">
                            {productImages.map((img, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setActiveImageIndex(idx)}
                                    className={`w-14 h-16 rounded-lg overflow-hidden border shrink-0 transition-all p-0.5 cursor-pointer ${
                                        activeImageIndex === idx 
                                            ? 'border-white ring-2 ring-white/20 scale-105' 
                                            : 'border-transparent opacity-50 hover:opacity-100'
                                    }`}
                                >
                                    <img src={getAssetUrl(img)} alt="" className="w-full h-full object-cover rounded" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* WhatsApp Floating Button */}
            <WhatsAppButton />
        </div>
    )
}
