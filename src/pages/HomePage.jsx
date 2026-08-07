import { useState, useCallback, useEffect } from 'react'
import ScrollReveal from '../components/ScrollReveal.jsx'
import { getAssetUrl } from '../utils/assets.js'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import HeroBanner from '../components/HeroBanner.jsx'
import BenefitsBar from '../components/BenefitsBar.jsx'
import CategoryCard from '../components/CategoryCard.jsx'
import ProductCard from '../components/ProductCard.jsx'
import SearchOverlay from '../components/SearchOverlay.jsx'
import QuickViewModal from '../components/QuickViewModal.jsx'
import ScrollToTop from '../components/ScrollToTop.jsx'
import WhatsAppButton from '../components/WhatsAppButton.jsx'
import Notification from '../components/Notification.jsx'
import PromoModal from '../components/PromoModal.jsx'
import { useProducts } from '../hooks/useProducts.js'
import { useCart } from '../hooks/useCart.js'
import { useWishlist } from '../hooks/useWishlist.js'

// ─── ProductSection defined OUTSIDE the parent component ──────────────────
// This is critical: defining it inside causes React to remount on every render,
// which destroys the IntersectionObserver state and breaks scroll animations.
function ProductSection({ title, subtitle, products, loading, id, onQuickView, onToggleWishlist, isWishlisted }) {
    return (
        <ScrollReveal variant="fade-up">
            <section className="py-24" id={id}>
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex flex-col items-center text-center mb-16 px-4">
                        <span className="text-[#C6A76A] text-[10px] uppercase font-bold tracking-[0.4em] mb-4 block">
                            Exclusividade Meraki
                        </span>
                        <h2 className="font-heading text-4xl md:text-5xl text-[#1A1A1A] mb-6">
                            {title}
                        </h2>
                        <div className="w-12 h-[1px] bg-[#C6A76A] mb-6"></div>
                        <p className="text-gray-500 max-w-lg italic font-light text-lg">{subtitle}</p>
                    </div>
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-[1px] border-[#C6A76A] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : products.length > 0 ? (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-8 sm:gap-y-12">
                            {products.map((product, idx) => (
                                <ScrollReveal key={product.id} variant="fade-up" delay={idx * 80} threshold={0.05}>
                                    <ProductCard
                                        product={product}
                                        onQuickView={onQuickView}
                                        onToggleWishlist={onToggleWishlist}
                                        isWishlisted={isWishlisted(product.id)}
                                    />
                                </ScrollReveal>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-400 py-8">Nenhum produto disponível no momento.</p>
                    )}
                </div>
            </section>
        </ScrollReveal>
    )
}


export default function HomePage() {
    const navigate = useNavigate()
    const [searchOpen, setSearchOpen] = useState(false)
    const [quickViewProduct, setQuickViewProduct] = useState(null)
    const [notification, setNotification] = useState({ message: '', visible: false })
    const [categories, setCategories] = useState(() => {
        try {
            const stored = localStorage.getItem('meraki_homepage_categories')
            if (stored) {
                const parsed = JSON.parse(stored)
                return Array.isArray(parsed) ? parsed.filter(c => c && c.name) : []
            }
        } catch (e) {
            console.error(e)
        }
        return [
            { name: 'Home', description: 'Voltar para a página inicial', image: '/assets/categories/cat-conjuntos.webp', link: '/' },
            { name: 'Categorias', description: 'Navegar pelas nossas coleções', image: '/assets/categories/cat-noite.webp', link: '/category/conjuntos' },
            { name: 'Política de Troca', description: 'Regras e prazos para trocas de produtos', image: '/assets/categories/cat-sexy.webp', link: '/returns' },
            { name: 'Ofertas', description: 'Confira nossos produtos com descontos', image: '/assets/categories/cat-plus.webp', link: '/category/ofertas' },
        ]
    })

    const [promoCombo, setPromoCombo] = useState(() => {
        const stored = localStorage.getItem('meraki_promo_combo')
        if (stored) {
            try {
                const parsed = JSON.parse(stored)
                if (parsed?.image && parsed.image.includes('photo-1616422285623')) {
                    parsed.image = '/assets/categories/cat-conjuntos.webp'
                }
                return parsed
            } catch (e) { console.error(e) }
        }
        return {
            title: 'Combo Sutiã',
            subtitle: 'Do P ao EG. Diversos modelos para você escolher.',
            image: '/assets/categories/cat-conjuntos.webp',
            price2Items: 139,
            price3Items: 169,
            link: '/category/promo-combo',
            query: 'sutiã',
            visible: false
        }
    })

    const [editorial, setEditorial] = useState(() => {
        const stored = localStorage.getItem('meraki_editorial')
        if (stored) {
            try { return JSON.parse(stored) } catch (e) { console.error(e) }
        }
        return {
            label: 'Artesanal & Premium',
            title: 'A arte de se sentir extraordinária.',
            description: 'Cada costura, cada detalhe em renda foi pensado para elevar sua confiança e celebrar sua beleza única em todos os momentos.',
            buttonText: 'Ver Manifesto',
            buttonLink: '/story',
            image: '/assets/banners/banner-2.webp'
        }
    })

    const [installmentText, setInstallmentText] = useState(() => {
        try {
            const config = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
            return config.installmentText || 'Em até 2x sem juros'
        } catch { return 'Em até 2x sem juros' }
    })

    const { products: allProducts, loading: loadingAll } = useProducts()
    const { cartCount, addToCart } = useCart()
    const { wishlistCount, toggleWishlist, isWishlisted } = useWishlist()

    // Auto-generate display texts from numeric price fields
    const promoPrice2 = Number(promoCombo.price2Items) || 139
    const promoPrice3 = Number(promoCombo.price3Items) || 169
    const promoPriceLine1 = `Leve 2 por R$ ${promoPrice2.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
    const promoPriceLine2 = `Leve 3 por R$ ${promoPrice3.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
    const promoBadgeText = `Leve 2 por R$ ${promoPrice2} | 3 por R$ ${promoPrice3}`

    useEffect(() => {
        const updatePromo = () => {
            const stored = localStorage.getItem('meraki_promo_combo')
            if (stored) {
                try { setPromoCombo(JSON.parse(stored)) } catch (e) { console.error(e) }
            }
        }
        const updateEditorial = () => {
            const stored = localStorage.getItem('meraki_editorial')
            if (stored) {
                try { setEditorial(JSON.parse(stored)) } catch (e) { console.error(e) }
            }
        }
        const updateInstallment = () => {
            try {
                const config = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
                if (config.installmentText) setInstallmentText(config.installmentText)
            } catch {}
        }
        const updateHomepageCats = () => {
            try {
                const stored = localStorage.getItem('meraki_homepage_categories')
                if (stored) {
                    const parsed = JSON.parse(stored)
                    setCategories(Array.isArray(parsed) ? parsed.filter(c => c && c.name) : [])
                }
            } catch (e) {
                console.error(e)
            }
        }
        window.addEventListener('storage', updatePromo)
        window.addEventListener('storage', updateEditorial)
        window.addEventListener('storage', updateInstallment)
        window.addEventListener('storage', updateHomepageCats)
        window.addEventListener('promoComboUpdated', updatePromo)
        window.addEventListener('editorialUpdated', updateEditorial)
        window.addEventListener('storeConfigUpdated', updatePromo)
        window.addEventListener('storeConfigUpdated', updateEditorial)
        window.addEventListener('storeConfigUpdated', updateInstallment)
        window.addEventListener('storeConfigUpdated', updateHomepageCats)
        window.addEventListener('homepageCategoriesUpdated', updateHomepageCats)
        return () => {
            window.removeEventListener('storage', updatePromo)
            window.removeEventListener('storage', updateEditorial)
            window.removeEventListener('storage', updateInstallment)
            window.removeEventListener('storage', updateHomepageCats)
            window.removeEventListener('promoComboUpdated', updatePromo)
            window.removeEventListener('editorialUpdated', updateEditorial)
            window.removeEventListener('storeConfigUpdated', updatePromo)
            window.removeEventListener('storeConfigUpdated', updateEditorial)
            window.removeEventListener('storeConfigUpdated', updateInstallment)
            window.removeEventListener('storeConfigUpdated', updateHomepageCats)
            window.removeEventListener('homepageCategoriesUpdated', updateHomepageCats)
        }
    }, [])

    useEffect(() => {
        const handleHashScroll = () => {
            const hash = window.location.hash
            if (hash) {
                // Handle router hash structure: can be #/hash or #hash
                const cleanHash = hash.replace('#/', '').replace('#', '')
                const element = document.getElementById(cleanHash)
                if (element) {
                    setTimeout(() => {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }, 100)
                }
            }
        }
        
        handleHashScroll()
        window.addEventListener('hashchange', handleHashScroll)
        return () => window.removeEventListener('hashchange', handleHashScroll)
    }, [])

    // Synchronously derive sectioned lists from a single products fetch to prevent redundant async cascades
    const bestSellers = allProducts.filter(p => p.section === 'best-sellers')
    const featured = allProducts.filter(p => p.section === 'featured')
    const newCollection = allProducts.filter(p => p.section === 'new-collection')
    const loadingBest = loadingAll
    const loadingFeatured = loadingAll
    const loadingNew = loadingAll

    const showNotification = useCallback((message) => {
        setNotification({ message, visible: true })
    }, [])

    const handleAddToCart = useCallback((product, size) => {
        addToCart(product, size)
        setQuickViewProduct(null)
        showNotification('Produto adicionado ao carrinho!')
    }, [addToCart, showNotification])


    return (
        <div className="bg-[#FCFAFA]">
            <Header cartCount={cartCount} wishlistCount={wishlistCount} onSearchOpen={() => setSearchOpen(true)} />

            <HeroBanner />

            <ScrollReveal variant="fade-up">
                <BenefitsBar />
            </ScrollReveal>

            <ScrollReveal variant="fade-up">
                <section className="py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex flex-col items-center text-center mb-16 px-4">
                            <span className="text-[#C6A76A] text-[10px] uppercase font-bold tracking-[0.4em] mb-4 block">
                                Nossas Coleções
                            </span>
                            <h2 className="font-heading text-4xl md:text-5xl text-[#1A1A1A] mb-6">
                                Categorias
                            </h2>
                            <div className="w-12 h-[1px] bg-[#C6A76A] mb-6"></div>
                            <p className="text-gray-500 max-w-lg italic font-light text-lg">Curadoria exclusiva das melhores peças para você.</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {categories.filter(cat => cat && cat.name).map((cat, idx) => (
                                <ScrollReveal
                                    key={cat.name}
                                    variant="fade-up"
                                    delay={idx * 100}
                                    id={(cat.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(' ', '-')}
                                >
                                    <CategoryCard {...cat} />
                                </ScrollReveal>
                            ))}
                        </div>
                    </div>
                </section>
            </ScrollReveal>

            {/* Combo Section (First Image style) */}
            {Boolean(promoCombo && promoCombo.visible !== false && promoCombo.visible !== 'false' && promoCombo.visible !== 0 && promoCombo.visible !== '0') && (
                <ScrollReveal variant="fade-up">
                    <section className="py-16 px-4 max-w-7xl mx-auto" id="best-sellers">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                            {/* Promo Banner Left Side */}
                            <div className="lg:col-span-6 bg-[#FAF6F3] rounded-3xl p-8 md:p-12 flex flex-col justify-between items-center text-center relative overflow-hidden min-h-[500px]">
                                {/* Product Image top - Elegant framed luxury portrait */}
                                <div className="w-full max-w-[340px] mx-auto overflow-hidden rounded-3xl mb-6 relative shadow-lg bg-gradient-to-tr from-[#F3ECE6] to-[#FCFAF8] p-3 border border-[#E3D7C5]/45 hover:shadow-2xl transition-all duration-500 group/img">
                                    <div className="w-full h-[260px] rounded-2xl overflow-hidden bg-white shadow-inner flex items-center justify-center border border-gray-100/50">
                                        <img 
                                            src={getAssetUrl(promoCombo.image)} 
                                            alt={promoCombo.title} 
                                            className="w-full h-full object-contain hover:scale-108 transition-transform duration-700 p-3"
                                        />
                                    </div>
                                    {/* Subtle decorative gold sparkle corner details */}
                                    <div className="absolute top-1.5 left-1.5 w-1 h-1 rounded-full bg-[#C6A76A]/40" />
                                    <div className="absolute top-1.5 right-1.5 w-1 h-1 rounded-full bg-[#C6A76A]/40" />
                                    <div className="absolute bottom-1.5 left-1.5 w-1 h-1 rounded-full bg-[#C6A76A]/40" />
                                    <div className="absolute bottom-1.5 right-1.5 w-1 h-1 rounded-full bg-[#C6A76A]/40" />
                                </div>
                                <div className="space-y-4 max-w-md z-10">
                                    <span className="text-[#7A3E4A] text-xs font-bold uppercase tracking-[0.3em] block">{promoCombo.title}</span>
                                    <h3 className="font-heading text-4xl md:text-5xl text-[#7A3E4A] font-light leading-tight">
                                        {promoPriceLine1}<br />
                                        {promoPriceLine2}
                                    </h3>
                                    <p className="text-gray-600 text-sm font-medium pt-2">{promoCombo.subtitle}</p>
                                </div>
                                <Link 
                                    to="/category/promo-combo" 
                                    className="mt-8 px-8 py-4 bg-[#7A3E4A] text-white text-xs font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-[#63303a] transition-all z-10"
                                >
                                    Comprar Agora &gt;
                                </Link>
                            </div>

                            {/* Product Grid Right Side */}
                            <div className="lg:col-span-6 grid grid-cols-2 gap-4 sm:gap-6">
                                {(() => {
                                    const normalizeText = (str) => (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                                    const rawQuery = promoCombo.query || promoCombo.keyword || 'sutiã'
                                    const queryStr = normalizeText(rawQuery)

                                    // 1. Products explicitly marked as inPromoCombo
                                    const explicitPromo = allProducts.filter(p => p.inPromoCombo === true || p.in_promo_combo === true)

                                    // 2. Products matching keyword/query in name, category, or description (accent-insensitive)
                                    const matchedByQuery = allProducts.filter(p => {
                                        const nameNorm = normalizeText(p.name)
                                        const catNorm = normalizeText(p.category)
                                        const descNorm = normalizeText(p.description)
                                        return nameNorm.includes(queryStr) || catNorm.includes(queryStr) || descNorm.includes(queryStr)
                                    })

                                    // 3. Fallback to all products so the grid is NEVER empty
                                    const combined = []
                                    const addUnique = (list) => {
                                        for (const p of list) {
                                            if (combined.length >= 2) break
                                            if (!combined.some(existing => existing.id === p.id)) {
                                                combined.push(p)
                                            }
                                        }
                                    }

                                    addUnique(explicitPromo)
                                    addUnique(matchedByQuery)
                                    addUnique(bestSellers)
                                    addUnique(allProducts)

                                    const displayProducts = combined.slice(0, 2)
                                    return displayProducts.map(product => {
                                        const isWish = isWishlisted(product.id)
                                        return (
                                            <div key={product.id}>
                                                <ProductCard 
                                                    product={product}
                                                    onQuickView={setQuickViewProduct}
                                                    onToggleWishlist={toggleWishlist}
                                                    isWishlisted={isWish}
                                                />
                                            </div>
                                        )
                                    })
                                })()}
                            </div>
                        </div>
                    </section>
                </ScrollReveal>
            )}

            <ScrollReveal variant="fade-left">
                <section className="py-12 px-4 max-w-7xl mx-auto" id="ofertas">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-[#FDF8F6] p-8 md:p-16">
                        <div className="space-y-6">
                            <span className="text-[#C6A76A] text-[10px] uppercase font-bold tracking-[0.4em]">{editorial.label}</span>
                            <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl text-[#1A1A1A] leading-tight">
                                {editorial.title.includes('extraordinária') ? (
                                    <>A arte de se sentir <span className="italic">extraordinária</span>.</>
                                ) : (
                                    editorial.title
                                )}
                            </h2>
                            <p className="text-gray-600 font-light leading-relaxed max-w-md">{editorial.description}</p>
                            <Link to={editorial.buttonLink} className="inline-block border-b-2 border-[#1A1A1A] pb-2 text-xs font-bold uppercase tracking-widest hover:text-[#C6A76A] hover:border-[#C6A76A] transition-all">{editorial.buttonText}</Link>
                        </div>
                        <div className="relative aspect-square">
                            <img src={getAssetUrl(editorial.image)} className="w-full h-full object-cover shadow-2xl" alt="Manifesto Meraki" />
                        </div>
                    </div>
                </section>
            </ScrollReveal>

            <ScrollReveal variant="fade-up">
                <section className="py-16 bg-white border-t border-gray-50" id="sale-outlet">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <span className="text-[#C6A76A] text-[10px] uppercase font-bold tracking-[0.4em] mb-1.5 block">Ofertas Especiais</span>
                                <h2 className="font-heading text-4xl text-[#1A1A1A] tracking-wider font-light">
                                    <span className="font-bold text-[#7A3E4A]">SALE</span> OUTLET
                                </h2>
                            </div>
                            {/* Navigation Arrows */}
                            <div className="flex gap-2">
                                <button className="w-10 h-10 border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:border-[#7A3E4A] hover:text-[#7A3E4A] transition-all cursor-pointer">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <button className="w-10 h-10 border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:border-[#7A3E4A] hover:text-[#7A3E4A] transition-all cursor-pointer">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        </div>

                        {loadingAll ? (
                            <div className="flex justify-center py-12">
                                <div className="w-8 h-8 border-[1px] border-[#C6A76A] border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                                {allProducts.filter(p => p.original_price > 0).slice(0, 4).map(product => {
                                    const isWish = isWishlisted(product.id)
                                    const discountPercent = Math.round(((product.original_price - product.price) / product.original_price) * 100)
                                    return (
                                        <div key={product.id}>
                                            <ProductCard 
                                                product={product}
                                                onQuickView={setQuickViewProduct}
                                                onToggleWishlist={toggleWishlist}
                                                isWishlisted={isWish}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>
            </ScrollReveal>

            <ProductSection
                id="new-collection"
                title="Novos Horizontes"
                subtitle="Descubra o frescor da estação em nossa nova coleção."
                products={newCollection}
                loading={loadingNew}
                onQuickView={setQuickViewProduct}
                onToggleWishlist={toggleWishlist}
                isWishlisted={isWishlisted}
            />

            <ScrollReveal variant="fade-up">
                <section className="py-32 bg-white border-t border-[#EEEEEE]">
                    <div className="max-w-4xl mx-auto px-6 text-center">
                        <span className="text-[#C6A76A] text-[10px] uppercase font-bold tracking-[0.4em] mb-6 block">Concierge & Lifestyle</span>
                        <h2 className="font-heading text-4xl md:text-6xl text-[#1A1A1A] mb-8 px-4">Junte-se ao Universo <span className="italic">Meraki</span>.</h2>
                        <p className="text-[#666666] mb-12 font-light text-lg max-w-xl mx-auto leading-relaxed">Assine nossa newsletter e receba convites para eventos exclusivos, lançamentos antecipados e curadoria de moda íntima.</p>

                        <form className="relative max-w-md mx-auto group" onSubmit={(e) => { e.preventDefault(); showNotification('Bem-vinda ao universo Meraki!') }}>
                            <div className="flex flex-col sm:flex-row items-center border-b border-[#1A1A1A] pb-2 transition-all duration-500 focus-within:border-[#C6A76A]">
                                <input
                                    type="email"
                                    placeholder="SEU MELHOR E-MAIL"
                                    required
                                    className="w-full px-2 py-4 text-[11px] font-bold tracking-[0.2em] outline-none bg-transparent placeholder:text-gray-300"
                                />
                                <button type="submit" className="whitespace-nowrap px-8 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#1A1A1A] hover:text-[#C6A76A] transition-colors">
                                    Inscrever
                                </button>
                            </div>
                        </form>
                    </div>
                </section>
            </ScrollReveal>

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
            <PromoModal onNotification={showNotification} />
        </div>
    )
}
