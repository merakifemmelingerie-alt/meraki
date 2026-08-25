import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { getAssetUrl } from '../utils/assets.js'
import { useAdminProducts } from '../hooks/useProducts.js'
import { supabase } from '../services/supabase.js'
import { createProduct, updateProduct, deleteProduct, uploadMultipleImages, deleteImage, createCategory, getProfiles, updateStoreConfig, mergeTopbarStyle, clearProductBadges, generateUUID, getFinancialTransactions, createFinancialTransaction, updateFinancialTransactionStatus, deleteFinancialTransaction } from '../services/database.js'
import { signOut } from '../services/auth.js'
import AdminSidebar from '../components/admin/AdminSidebar.jsx'
import DashboardSection from '../components/admin/DashboardSection.jsx'
import {
    ProductsSection,
    OrdersSection,
    CouponsSection,
    BannersSection,
    PromoComboSection,
    WelcomeModalSection,
    EditorialSection,
    CategoriesSection,
    CustomersSection,
    NewsletterSection,
    ReturnsSection,
    SettingsSection,
    InstitutionalSection,
    FinancialSection,
    AutomationsSection,
    SuggestionsSection,
    PollsSection,
    WishlistAnalyticsSection,
    ProductRequestsSection,
    PlanningSection
} from '../components/admin/AdminSections.jsx'

// ─── Color helpers (case/whitespace-insensitive so "Rosa Blush" and "rosa blush " are the same color) ──
function parseAvailableColors(raw) {
    const seen = new Map()
    const list = []
    const hexMap = {}
    ;(raw || '').split(',').forEach(pair => {
        const [name, hex] = pair.split(':')
        if (!name) return
        const key = name.trim().toLowerCase()
        if (!seen.has(key)) {
            seen.set(key, name)
            list.push(name)
            hexMap[name] = hex || '#CCCCCC'
        }
    })
    return { list, hexMap }
}

function findCanonicalColor(name, colorsList) {
    if (!name) return name
    const key = name.trim().toLowerCase()
    return (colorsList || []).find(c => c.trim().toLowerCase() === key) || name
}

// ─── Icon Component ───────────────────────────────────────────────────────────
function Icon({ path, className = 'w-5 h-5' }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d={path} />
        </svg>
    )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const map = {
        'Pago':      'bg-emerald-50 text-emerald-700 border-emerald-200',
        'Enviado':   'bg-sky-50 text-sky-700 border-sky-200',
        'Entregue':  'bg-[#7A3E4A]/10 text-[#7A3E4A] border-[#7A3E4A]/20',
        'Cancelado': 'bg-red-50 text-red-600 border-red-200',
        'Pendente':  'bg-amber-50 text-amber-700 border-amber-200',
    }
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${map[status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
            {status}
        </span>
    )
}

export default function AdminPage() {
    const { session, user, admin, loading: authLoading } = useAuth()
    const { products, loading: productsLoading, setProducts } = useAdminProducts()
    const [activeSection, setActiveSection] = useState('dashboard')
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        let meta = document.querySelector("meta[name='robots']")
        let created = false
        if (!meta) {
            meta = document.createElement('meta')
            meta.name = 'robots'
            document.head.appendChild(meta)
            created = true
        }
        meta.content = 'noindex, nofollow'

        return () => {
            if (created && meta.parentNode) {
                meta.parentNode.removeChild(meta)
            }
        }
    }, [])

    // Modals
    const [modal, setModal] = useState({ open: false, editing: null })
    const [deleteModal, setDeleteModal] = useState({ open: false, product: null })
    const [couponModal, setCouponModal] = useState(false)
    const [editingCoupon, setEditingCoupon] = useState(null)
    const [bannerModal, setBannerModal] = useState(false)
    const [editingBannerId, setEditingBannerId] = useState(null)

    const [saving, setSaving] = useState(false)
    const [sidebarOpen, setSidebarOpen] = useState(false)

    // Data lists
    const [orders, setOrders] = useState([])
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [coupons, setCoupons] = useState([])
    const [banners, setBanners] = useState([])
    const [customers, setCustomers] = useState([])
    const [returns, setReturns] = useState([])
    const [transactions, setTransactions] = useState([])
    const [selectedReturn, setSelectedReturn] = useState(null)

    useEffect(() => {
        getFinancialTransactions().then(({ data }) => {
            if (data) setTransactions(data)
        })
    }, [])

    const handleCreateTransaction = async (txData) => {
        const { data } = await createFinancialTransaction(txData)
        if (data) {
            setTransactions(prev => [data, ...prev.filter(t => t.id !== data.id)])
        }
    }

    const handleUpdateTransactionStatus = async (id, status) => {
        const { data } = await updateFinancialTransactionStatus(id, status)
        setTransactions(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    }

    const handleDeleteTransaction = async (id) => {
        await deleteFinancialTransaction(id)
        setTransactions(prev => prev.filter(t => t.id !== id))
    }

    const [topbarMessages, setTopbarMessages] = useState([])
    const [newTopbarMsg, setNewTopbarMsg] = useState('')
    const [shippingMessage, setShippingMessage] = useState(() => {
        try {
            const stored = localStorage.getItem('meraki_shipping_message')
            if (stored) return stored
            const config = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
            return config.shippingMessage || 'Frete grátis para a região Centro-Oeste nas compras acima de R$ 299,90.'
        } catch { return 'Frete grátis para a região Centro-Oeste nas compras acima de R$ 299,90.' }
    })
    const [promoMessage, setPromoMessage] = useState(() => {
        try {
            const stored = localStorage.getItem('meraki_promo_message')
            if (stored) return stored
            const config = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
            return config.promoMessage || '10% OFF na primeira compra com o cupom: BEMVINDA10 (Ganhe R$ 10 OFF)'
        } catch { return '10% OFF na primeira compra com o cupom: BEMVINDA10 (Ganhe R$ 10 OFF)' }
    })
    const [installmentText, setInstallmentText] = useState(() => {
        try {
            const config = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
            return config.installmentText || 'Em até 2x sem juros'
        } catch { return 'Em até 2x sem juros' }
    })
    const [topbarStyle, setTopbarStyle] = useState(() => {
        try {
            const stored = localStorage.getItem('meraki_topbar_style')
            return stored ? JSON.parse(stored) : { bgColor: '#C6A76A', textColor: '#FFFFFF' }
        } catch { return { bgColor: '#C6A76A', textColor: '#FFFFFF' } }
    })

    const [categories, setCategories] = useState(() => {
        const stored = localStorage.getItem('meraki_categories')
        if (stored) {
            try {
                const parsed = JSON.parse(stored)
                if (!Array.isArray(parsed)) return []
                return parsed
                    .map(c => typeof c === 'string' ? { name: c, description: 'Coleção Meraki', image: '/placeholder.jpg', group: 'Lingerie' } : c)
                    .filter(c => c && c.name)
            } catch (e) { console.error(e) }
        }
        return []
    })
    const [newCategoryName, setNewCategoryName] = useState('')
    const [selectedModalCategory, setSelectedModalCategory] = useState('')
    const [selectedModalSizes, setSelectedModalSizes] = useState(['P', 'M', 'G', 'GG'])

    const DEFAULT_SIZES = ['U', 'Único', 'P', 'M', 'G', 'GG', 'EGG', 'XG', '34', '36', '38', '40', '42', '44', '46', '48', '50']
    const [masterSizesList, setMasterSizesList] = useState(() => {
        try {
            const stored = localStorage.getItem('meraki_available_sizes')
            if (stored) {
                const parsed = JSON.parse(stored)
                if (Array.isArray(parsed) && parsed.length > 0) return parsed
            }
            const config = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
            if (config.availableSizes && Array.isArray(config.availableSizes) && config.availableSizes.length > 0) {
                return config.availableSizes
            }
        } catch {}
        return DEFAULT_SIZES
    })
    const [newCustomSizeInput, setNewCustomSizeInput] = useState('')

    const handleAddMasterSize = (sizeToAdd) => {
        const clean = sizeToAdd.trim()
        if (!clean || masterSizesList.includes(clean)) return
        const updated = [...masterSizesList, clean]
        setMasterSizesList(updated)
        localStorage.setItem('meraki_available_sizes', JSON.stringify(updated))
        updateStoreConfig({ available_sizes: updated })
        setNewCustomSizeInput('')
    }

    const handleDeleteMasterSize = (sizeToDelete) => {
        const updated = masterSizesList.filter(s => s !== sizeToDelete)
        setMasterSizesList(updated)
        localStorage.setItem('meraki_available_sizes', JSON.stringify(updated))
        updateStoreConfig({ available_sizes: updated })
        setSelectedModalSizes(prev => prev.filter(s => s !== sizeToDelete))
    }

    // Pagination states
    const [pPage, setPPage] = useState(1) // Products
    const [oPage, setOPage] = useState(1) // Orders
    const [cPage, setCPage] = useState(1) // Customers
    const [rPage, setRPage] = useState(1) // Returns
    const [cpPage, setCpPage] = useState(1) // Coupons
    const ITEMS_PER_PAGE = 8

    const [sections, setSections] = useState(() => {
        try {
            const stored = localStorage.getItem('meraki_sections')
            if (stored) {
                const parsed = JSON.parse(stored)
                if (Array.isArray(parsed)) return parsed
            }
        } catch {}
        return [
            { id: 'best-sellers', label: 'Best Sellers' },
            { id: 'featured', label: 'Destaques' },
            { id: 'new-collection', label: 'Novas Coleções' }
        ]
    })

    const [homepageCategories, setHomepageCategories] = useState(() => {
        try {
            const stored = localStorage.getItem('meraki_homepage_categories')
            if (stored) {
                const parsed = JSON.parse(stored)
                return Array.isArray(parsed) ? parsed.filter(c => c && c.name) : []
            }
        } catch {}
        return []
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
            visible: true
        }
    })

    const [welcomeModal, setWelcomeModal] = useState(() => {
        const stored = localStorage.getItem('meraki_welcome_modal')
        if (stored) {
            try { return JSON.parse(stored) } catch (e) { console.error(e) }
        }
        return {
            enabled: true,
            eyebrow: 'Boas-vindas',
            headline: 'Primeira vez',
            headlineItalic: 'por aqui?',
            highlight: 'Preparamos um presente',
            highlightItalic: 'especial',
            discountText: '10%',
            discountSubtext: 'de desconto na sua primeira compra',
            instagramHandle: '@merakistore',
            desktopImage: '/assets/banners/promo-banner.webp',
            mobileImage: '/assets/banners/promo-banner.webp',
            delaySeconds: 2.5,
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

    const [newSectionLabel, setNewSectionLabel] = useState('')
    const [selectedModalSection, setSelectedModalSection] = useState('best-sellers')
    const [selectedModalSubcategory, setSelectedModalSubcategory] = useState('')
    const [modalPrice, setModalPrice] = useState('')
    const [modalCostPrice, setModalCostPrice] = useState('')

    const [selectedModalColors, setSelectedModalColors] = useState([])
    const [modalColorStock, setModalColorStock] = useState({})
    const [modalVariantStock, setModalVariantStock] = useState({})
    const [modalColorImages, setModalColorImages] = useState({})
    const [isCustomizable, setIsCustomizable] = useState(false)
    const [customPriceWith, setCustomPriceWith] = useState('')
    const [customPriceWithout, setCustomPriceWithout] = useState('')
    const [customFeeLetter, setCustomFeeLetter] = useState('2.50')
    const [customFeeNumber, setCustomFeeNumber] = useState('2.50')
    const [customFeeEmoji, setCustomFeeEmoji] = useState('3.00')
    const [customizableEmojis, setCustomizableEmojis] = useState(['🍎', '💛', '👄', '🍒', '😍', '🌶️', '🐰', '🌟'])
    const [newEmojiInput, setNewEmojiInput] = useState('')

    const [hasKits, setHasKits] = useState(false)
    const [kitOptions, setKitOptions] = useState([])

    // Badge (Etiqueta) states
    const [selectedModalBadge, setSelectedModalBadge] = useState('')
    const [newBadgeInput, setNewBadgeInput] = useState('')
    const [masterBadgesList, setMasterBadgesList] = useState(() => {
        try {
            const config = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
            if (config.availableBadges) return config.availableBadges.split(',').map(b => b.trim()).filter(Boolean)
        } catch {}
        return []
    })

    useEffect(() => {
        const updatePromo = () => {
            const stored = localStorage.getItem('meraki_promo_combo')
            if (stored) {
                try { setPromoCombo(JSON.parse(stored)) } catch (e) { console.error(e) }
            }
        }
        window.addEventListener('promoComboUpdated', updatePromo)
        window.addEventListener('storeConfigUpdated', updatePromo)
        return () => {
            window.removeEventListener('promoComboUpdated', updatePromo)
            window.removeEventListener('storeConfigUpdated', updatePromo)
        }
    }, [])

    useEffect(() => {
        const updateWelcomeModal = () => {
            const stored = localStorage.getItem('meraki_welcome_modal')
            if (stored) {
                try { setWelcomeModal(JSON.parse(stored)) } catch (e) { console.error(e) }
            }
        }
        window.addEventListener('welcomeModalUpdated', updateWelcomeModal)
        window.addEventListener('storeConfigUpdated', updateWelcomeModal)
        return () => {
            window.removeEventListener('welcomeModalUpdated', updateWelcomeModal)
            window.removeEventListener('storeConfigUpdated', updateWelcomeModal)
        }
    }, [])

    const saveBadgesToConfig = async (list) => {
        const serialized = list.join(',')
        await updateStoreConfig({ available_badges: serialized })
        
        // Remove a tag excluída de todos os produtos no banco de dados e localmente
        if (products && products.length > 0) {
            const { success, updatedIds } = await clearProductBadges(list)
            if (success && updatedIds && updatedIds.length > 0) {
                const updatedProds = products.map(p => {
                    if (updatedIds.includes(p.id)) {
                        return { ...p, badge: '' }
                    }
                    return p
                })
                setProducts(updatedProds)
            }
        }
    }

    const saveSectionsToConfig = async (list) => {
        try {
            localStorage.setItem('meraki_sections', JSON.stringify(list))
            await mergeTopbarStyle({ availableSections: list })
        } catch (e) {
            console.error(e)
        }
    }

    const saveHomepageCategoriesToConfig = async (list) => {
        try {
            localStorage.setItem('meraki_homepage_categories', JSON.stringify(list))
            window.dispatchEvent(new Event('homepageCategoriesUpdated'))
            await mergeTopbarStyle({ homepageCategories: list })
        } catch (e) {
            console.error(e)
        }
    }
    
    // Master Config lists
    const [colorsList, setColorsList] = useState(() => {
        try {
            const config = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
            if (config.availableColors) {
                return parseAvailableColors(config.availableColors).list
            }
        } catch {}
        return ['Preto', 'Branco', 'Vermelho', 'Nude', 'Rosa', 'Bordô', 'Azul', 'Verde', 'Amarelo', 'Lilás', 'Marinho', 'Pink', 'Rubi', 'Preto/Renda', 'Branco/Renda']
    })

    const [colorHexMap, setColorHexMap] = useState(() => {
        try {
            const config = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
            if (config.availableColors) {
                return parseAvailableColors(config.availableColors).hexMap
            }
        } catch {}
        return {
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
    })

    const getColorHex = (name) => {
        if (!name) return '#CCCCCC'
        if (colorHexMap[name]) return colorHexMap[name]
        const key = name.trim().toLowerCase()
        const found = Object.keys(colorHexMap).find(c => c.trim().toLowerCase() === key)
        return found ? colorHexMap[found] : '#CCCCCC'
    }

    const [masterEmojisList, setMasterEmojisList] = useState(() => {
        try {
            const config = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
            if (config.availableEmojis) {
                return config.availableEmojis.split(',').map(e => e.trim())
            }
        } catch {}
        return ['🍎', '💛', '👄', '🍒', '😍', '🌶️', '🐰', '🌟']
    })

    const [newColorName, setNewColorName] = useState('')
    const [newColorHex, setNewColorHex] = useState('#7A3E4A')

    const saveColorsToConfig = async (newColorsList, newHexMap) => {
        const serialized = newColorsList.map(name => `${name}:${newHexMap[name] || '#CCCCCC'}`).join(',')
        await updateStoreConfig({ available_colors: serialized })
    }

    const handleDeleteGlobalColor = async (colorToDelete) => {
        if (!colorToDelete) return
        const confirmDel = window.confirm(`Tem certeza que deseja excluir a cor "${colorToDelete}" definitivamente do sistema e de todos os produtos?`)
        if (!confirmDel) return

        const updatedList = colorsList.filter(c => c !== colorToDelete)
        setColorsList(updatedList)

        const updatedHexMap = { ...colorHexMap }
        delete updatedHexMap[colorToDelete]
        setColorHexMap(updatedHexMap)

        await saveColorsToConfig(updatedList, updatedHexMap)

        // Remove color from currently open product modal
        setSelectedModalColors(prev => prev.filter(c => c !== colorToDelete))
        setModalColorStock(prev => {
            const copy = { ...prev }
            delete copy[colorToDelete]
            return copy
        })

        // Remove color from all products in state & database
        const updatedProducts = products.map(prod => {
            if (prod.colors && prod.colors.includes(colorToDelete)) {
                const newColors = prod.colors.filter(c => c !== colorToDelete)
                const newStock = { ...(prod.colorStock || {}) }
                delete newStock[colorToDelete]

                // Async update in DB
                updateProduct(prod.id, {
                    colors: newColors,
                    color_stock: newStock
                }).catch(console.error)

                return {
                    ...prod,
                    colors: newColors,
                    colorStock: newStock,
                    color_stock: newStock
                }
            }
            return prod
        })
        setProducts(updatedProducts)
    }

    const saveEmojisToConfig = async (newEmojisList) => {
        const serialized = newEmojisList.join(',')
        await updateStoreConfig({ available_emojis: serialized })
    }

    // Form inputs
    const [couponForm, setCouponForm] = useState({ code: '', type: 'percentage', value: '', minPurchase: '' })
    const [bannerForm, setBannerForm] = useState({ image: '', mobile_image: '', alt: '', link: '/shop' })
    const [bannerImageFiles, setBannerImageFiles] = useState([])
    const [bannerMobileImageFiles, setBannerMobileImageFiles] = useState([])

    // Product Images states
    const [imageFiles, setImageFiles] = useState([])
    const [existingImages, setExistingImages] = useState([])
    const [dragActive, setDragActive] = useState(false)
    const fileInputRef = useRef(null)

    useEffect(() => {
        setPPage(1)
    }, [searchQuery])

    useEffect(() => {
        setPPage(1)
        setOPage(1)
        setCPage(1)
        setRPage(1)
        setCpPage(1)
    }, [activeSection])

    useEffect(() => {
        let loadedCoupons = JSON.parse(localStorage.getItem('meraki_coupons') || '[]')
        let loadedBanners = JSON.parse(localStorage.getItem('meraki_banners') || '[]')

        // Fetch Orders directly from Supabase Database
        supabase.from('orders').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
            if (!error && data) {
                setOrders(data.map(o => ({
                    id: o.id,
                    customerName: o.customername,
                    customerEmail: o.customeremail,
                    customerPhone: o.customerphone,
                    customerCpf: o.customercpf,
                    shippingAddress: o.shippingaddress,
                    paymentMethod: o.paymentmethod,
                    subtotal: Number(o.subtotal) || 0,
                    shipping: Number(o.shipping) || 0,
                    discount: Number(o.discount) || 0,
                    total: Number(o.total) || 0,
                    coupon: o.coupon,
                    status: o.status,
                    items: o.items || [],
                    created_at: o.created_at
                })))
            } else {
                setOrders(JSON.parse(localStorage.getItem('meraki_orders') || '[]'))
            }
        }).catch(() => {
            setOrders(JSON.parse(localStorage.getItem('meraki_orders') || '[]'))
        })

        // Fetch Customers/Profiles directly from Supabase Database
        getProfiles().then(({ data }) => {
            if (data) setCustomers(data)
        }).catch(console.error)

        setCoupons(loadedCoupons)
        setBanners(loadedBanners)

        // Fetch Returns directly from Supabase Database
        supabase.from('returns').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
            if (!error && data) {
                setReturns(data.map(r => ({
                    id: r.id,
                    orderId: r.orderid,
                    itemId: r.itemid,
                    customerEmail: r.customeremail,
                    type: r.type,
                    postageCode: r.postagecode,
                    status: r.status,
                    created_at: r.created_at
                })))
            } else {
                const loadedReturns = []
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i)
                    if (key && key.startsWith('meraki_returns_')) {
                        const email = key.replace('meraki_returns_', '')
                        try {
                            const userReturns = JSON.parse(localStorage.getItem(key) || '[]')
                            userReturns.forEach(ret => { loadedReturns.push({ ...ret, customerEmail: email }) })
                        } catch (e) { console.error(e) }
                    }
                }
                setReturns(loadedReturns.sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date)))
            }
        }).catch(() => {
            setReturns([])
        })

        const storedTopbar = localStorage.getItem('meraki_topbar_messages')
        const loadedTopbar = storedTopbar ? JSON.parse(storedTopbar) : [
            "✨ Frete Grátis acima de R$ 299 • Parcele em até 12x",
            "Utilize o cupom BEMVIND010 em sua primeira compra!",
            "Ganhe 5% de desconto pagando no PIX!"
        ]
        setTopbarMessages(loadedTopbar)

        const storedShipping = localStorage.getItem('meraki_shipping_message')
        if (storedShipping) {
            setShippingMessage(storedShipping)
        } else {
            try {
                const config = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
                if (config.shippingMessage) setShippingMessage(config.shippingMessage)
            } catch {}
        }

        // Sincroniza as etiquetas, seções, cores e parcelamento a partir do banco (store_config)
        try {
            const config = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
            if (config.availableBadges) {
                setMasterBadgesList(config.availableBadges.split(',').map(b => b.trim()).filter(Boolean))
            }
            if (config.installmentText) {
                setInstallmentText(config.installmentText)
            }
            if (config.topbarStyle && config.topbarStyle.availableSections) {
                setSections(config.topbarStyle.availableSections)
            }
            if (config.topbarStyle && config.topbarStyle.homepageCategories) {
                setHomepageCategories(config.topbarStyle.homepageCategories)
            }
            if (config.availableColors) {
                const colors = config.availableColors.split(',').map(pair => pair.split(':')[0])
                setColorsList(colors)
                const map = {}
                config.availableColors.split(',').forEach(pair => {
                    const [name, hex] = pair.split(':')
                    if (name) map[name] = hex || '#CCCCCC'
                })
                setColorHexMap(map)
            }
        } catch (e) { console.error(e) }
    }, [activeSection])

    useEffect(() => {
        const syncTopbar = () => {
            try {
                const stored = localStorage.getItem('meraki_topbar_messages')
                if (stored) setTopbarMessages(JSON.parse(stored))
            } catch (e) {}
        }
        window.addEventListener('topbarMessagesUpdated', syncTopbar)
        window.addEventListener('storeConfigUpdated', syncTopbar)
        return () => {
            window.removeEventListener('topbarMessagesUpdated', syncTopbar)
            window.removeEventListener('storeConfigUpdated', syncTopbar)
        }
    }, [])

    useEffect(() => {
        if (modal.open && modal.editing) {
            const product = products.find(p => p.id === modal.editing)
            const imgs = product?.image || []
            setExistingImages(Array.isArray(imgs) ? imgs : (imgs ? [imgs] : []))
            setImageFiles([])
            setSelectedModalCategory(product?.category || categories[0]?.name || '')
            setSelectedModalSubcategory(product?.subcategory || '')
            const prodSizes = product?.sizes || []
            setSelectedModalSizes(prodSizes)
            if (Array.isArray(prodSizes) && prodSizes.length > 0) {
                setMasterSizesList(prev => {
                    const missing = prodSizes.filter(s => s && !prev.includes(s))
                    if (missing.length > 0) {
                        const updated = [...prev, ...missing]
                        localStorage.setItem('meraki_available_sizes', JSON.stringify(updated))
                        updateStoreConfig({ available_sizes: updated })
                        return updated
                    }
                    return prev
                })
            }
            setSelectedModalSection(product?.section || 'best-sellers')

            const rawColorStock = product?.colorStock || product?.color_stock || {}
            const parsedColorStock = typeof rawColorStock === 'string' ? (JSON.parse(rawColorStock) || {}) : (rawColorStock || {})

            const rawVariantStock = product?.variantStock || product?.variant_stock || {}
            const parsedVariantStock = typeof rawVariantStock === 'string' ? (JSON.parse(rawVariantStock) || {}) : (rawVariantStock || {})

            const rawColorImages = product?.colorImages || product?.color_images || {}
            const parsedColorImages = typeof rawColorImages === 'string' ? (JSON.parse(rawColorImages) || {}) : (rawColorImages || {})

            // Dedup cores que só diferem por maiúsculas/espaços (ex: "Rosa Blush" x "Rosa blush"),
            // mesclando o estoque/imagem vinculados de cada variante duplicada na cor canônica.
            const prodColorsRaw = product?.colors || []
            const canonicalByLower = new Map()
            const dedupedColors = []
            prodColorsRaw.forEach(c => {
                if (!c) return
                const key = c.trim().toLowerCase()
                if (!canonicalByLower.has(key)) {
                    const canonical = findCanonicalColor(c, colorsList)
                    canonicalByLower.set(key, canonical)
                    dedupedColors.push(canonical)
                }
            })

            const dedupedColorStock = {}
            const dedupedColorImages = {}
            Object.keys(parsedColorStock).forEach(c => {
                const canonical = canonicalByLower.get(c.trim().toLowerCase()) || c
                if (parsedColorStock[c] !== undefined && parsedColorStock[c] !== '') dedupedColorStock[canonical] = parsedColorStock[c]
            })
            Object.keys(parsedColorImages).forEach(c => {
                const canonical = canonicalByLower.get(c.trim().toLowerCase()) || c
                if (parsedColorImages[c]) dedupedColorImages[canonical] = parsedColorImages[c]
            })

            const dedupedVariantStock = {}
            Object.keys(parsedVariantStock).forEach(key => {
                const underscoreIdx = key.indexOf('_')
                if (underscoreIdx === -1) {
                    dedupedVariantStock[key] = parsedVariantStock[key]
                    return
                }
                const size = key.slice(0, underscoreIdx)
                const color = key.slice(underscoreIdx + 1)
                const canonical = canonicalByLower.get(color.trim().toLowerCase()) || color
                const newKey = `${size}_${canonical}`
                const val = parseInt(parsedVariantStock[key]) || 0
                dedupedVariantStock[newKey] = Math.max(dedupedVariantStock[newKey] || 0, val)
            })

            setSelectedModalColors(dedupedColors)
            setModalColorStock(dedupedColorStock)
            setModalVariantStock(dedupedVariantStock)
            setModalColorImages(dedupedColorImages)

            // Cor usada no produto mas ausente da lista global não aparece como chip
            // em "Cores Disponíveis" e por isso não tem botão de excluir. Registra aqui.
            const missingColors = dedupedColors.filter(c => !colorsList.some(lc => lc.trim().toLowerCase() === c.trim().toLowerCase()))
            if (missingColors.length > 0) {
                const updatedList = [...colorsList, ...missingColors]
                const updatedHexMap = { ...colorHexMap }
                missingColors.forEach(c => { if (!updatedHexMap[c]) updatedHexMap[c] = '#CCCCCC' })
                setColorsList(updatedList)
                setColorHexMap(updatedHexMap)
                saveColorsToConfig(updatedList, updatedHexMap)
            }

            // Badge: se o produto já tem badge que não está na lista, adiciona
            const prodBadge = product?.badge || ''
            setSelectedModalBadge(prodBadge)
            if (prodBadge) {
                setMasterBadgesList(prev => {
                    const upper = prodBadge.trim().toUpperCase()
                    const alreadyIn = prev.some(b => b.toUpperCase() === upper)
                    return alreadyIn ? prev : [...prev, upper]
                })
            }

            setIsCustomizable(product?.isCustomizable || product?.category?.toLowerCase() === 'personalizaveis' || product?.category?.toLowerCase() === 'personalizáveis' || false)
            setCustomPriceWith(product?.customPriceWith || '')
            setCustomPriceWithout(product?.customPriceWithout || '')
            setCustomFeeLetter(product?.customFeeLetter !== undefined ? String(product.customFeeLetter) : '2.50')
            setCustomFeeNumber(product?.customFeeNumber !== undefined ? String(product.customFeeNumber) : '2.50')
            setCustomFeeEmoji(product?.customFeeEmoji !== undefined ? String(product.customFeeEmoji) : '3.00')
            
            const rawEmojis = product?.customizableEmojis || product?.customizable_emojis
            setCustomizableEmojis(
                rawEmojis 
                    ? (typeof rawEmojis === 'string' ? rawEmojis.split(',').map(e => e.trim()) : rawEmojis)
                    : masterEmojisList
            )
            setModalPrice(product?.price !== undefined ? String(product.price) : '')
            setModalCostPrice(product?.cost_price || product?.costPrice ? String(product.cost_price || product.costPrice) : '')
        } else if (modal.open && !modal.editing) {
            setExistingImages([])
            setImageFiles([])
            setSelectedModalCategory(categories[0]?.name || '')
            setSelectedModalSubcategory('')
            setModalPrice('')
            setModalCostPrice('')
            setSelectedModalSizes(['P', 'M', 'G', 'GG'])
            setSelectedModalSection(sections[0]?.id || 'best-sellers')
            setSelectedModalColors([])
            setModalColorStock({})
            setModalVariantStock({})
            setModalColorImages({})
            setSelectedModalBadge('')
            setIsCustomizable(false)
            setCustomPriceWith('')
            setCustomPriceWithout('')
            setCustomFeeLetter('2.50')
            setCustomFeeNumber('2.50')
            setCustomFeeEmoji('3.00')
            setCustomizableEmojis(masterEmojisList)
        }
    }, [modal.open, modal.editing, products, categories, sections])


    // ─── Auth Guards ───────────────────────────────────────────────────────────
    if (authLoading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FAF9F5 0%, #F5EEE9 100%)' }}>
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-[#7A3E4A]/20 border-t-[#7A3E4A] animate-spin" />
                <span className="text-xs font-bold text-[#7A3E4A]/60 uppercase tracking-widest">Carregando Painel</span>
            </div>
        </div>
    )

    if (!session || !admin) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 text-center" style={{ background: 'linear-gradient(135deg, #FAF9F5 0%, #F5EEE9 100%)' }}>
            <div className="w-20 h-20 rounded-2xl bg-[#7A3E4A]/10 flex items-center justify-center">
                <Icon path="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" className="w-8 h-8 text-[#7A3E4A]" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Acesso Restrito</h2>
                <p className="text-gray-500 text-sm max-w-xs">Você precisa estar autenticada como administradora para acessar este painel.</p>
            </div>
            <Link to="/auth" className="px-8 py-3 bg-[#7A3E4A] text-white rounded-xl font-bold text-sm hover:bg-[#63303a] transition-all shadow-lg shadow-[#7A3E4A]/20">
                Fazer Login
            </Link>
        </div>
    )

    // ─── Computed ─────────────────────────────────────────────────────────────
    const safeProducts = Array.isArray(products) ? products : []
    const safeOrders = Array.isArray(orders) ? orders : []
    const safeCustomers = Array.isArray(customers) ? customers : []
    const safeReturns = Array.isArray(returns) ? returns : []
    const safeCoupons = Array.isArray(coupons) ? coupons : []

    const filteredProducts = searchQuery
        ? safeProducts.filter(p => p && (p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || (typeof p.category === 'string' ? p.category : p.category?.name || '').toLowerCase().includes(searchQuery.toLowerCase())))
        : safeProducts

    const paginatedProducts = (filteredProducts || []).slice((pPage - 1) * ITEMS_PER_PAGE, pPage * ITEMS_PER_PAGE)
    const paginatedOrders = safeOrders.slice((oPage - 1) * ITEMS_PER_PAGE, oPage * ITEMS_PER_PAGE)
    const paginatedCustomers = safeCustomers.slice((cPage - 1) * ITEMS_PER_PAGE, cPage * ITEMS_PER_PAGE)
    const paginatedReturns = safeReturns.slice((rPage - 1) * ITEMS_PER_PAGE, rPage * ITEMS_PER_PAGE)
    const paginatedCoupons = safeCoupons.slice((cpPage - 1) * ITEMS_PER_PAGE, cpPage * ITEMS_PER_PAGE)

    const paidOrders = safeOrders.filter(o => o && ['Pago', 'Enviado', 'Entregue'].includes(o.status))
    const totalSales = paidOrders.reduce((sum, o) => sum + (Number(o?.total) || 0), 0)
    const ticketMedio = paidOrders.length > 0 ? totalSales / paidOrders.length : 0
    const stats = { sales: totalSales, orders: safeOrders.length, ticket: ticketMedio, customers: safeCustomers.length, products: safeProducts.length }

    const sectionLabel = (s) => ({ 'best-sellers': 'Best Sellers', 'featured': 'Destaques', 'new-collection': 'Novas Coleções' }[s] || s)
    const getProductImage = (product) => {
        if (Array.isArray(product.image)) return getAssetUrl(product.image[0] || '/placeholder.jpg')
        return getAssetUrl(product.image || '/placeholder.jpg')
    }

    const renderPagination = (currentPage, totalItems, onPageChange) => {
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)
        if (totalPages <= 1) return null

        return (
            <div className="flex justify-between items-center px-6 py-4 bg-white border-t border-[#EEEEEE] font-sans">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    Página {currentPage} de {totalPages} ({totalItems} itens)
                </span>
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => onPageChange(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2 border border-[#EEEEEE] rounded-xl text-gray-500 hover:text-[#7A3E4A] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                        <Icon path="M15.75 19.5L8.25 12l7.5-7.5" className="w-3.5 h-3.5" />
                    </button>
                    {[...Array(totalPages)].map((_, idx) => {
                        const page = idx + 1
                        return (
                            <button
                                key={page}
                                onClick={() => onPageChange(page)}
                                className={`w-8 h-8 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                                    currentPage === page
                                        ? 'bg-[#7A3E4A] text-white shadow-md shadow-[#7A3E4A]/10'
                                        : 'border border-[#EEEEEE] text-gray-600 hover:border-[#7A3E4A]/40'
                                }`}
                            >
                                {page}
                            </button>
                        )
                    })}
                    <button
                        onClick={() => onPageChange(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-2 border border-[#EEEEEE] rounded-xl text-gray-500 hover:text-[#7A3E4A] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                        <Icon path="M8.25 4.5l7.5 7.5-7.5 7.5" className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        )
    }

    const compressImage = (file, maxWidth = 1000, targetRatio = null) => new Promise((resolve) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = (event) => {
            const img = new Image()
            img.src = event.target.result
            img.onload = () => {
                const canvas = document.createElement('canvas')
                let width = img.width, height = img.height

                let sourceX = 0
                let sourceY = 0
                let sourceWidth = width
                let sourceHeight = height

                if (targetRatio) {
                    const currentRatio = width / height
                    if (currentRatio > targetRatio) {
                        // Image is wider than target ratio: crop sides
                        sourceWidth = height * targetRatio
                        sourceX = (width - sourceWidth) / 2
                    } else if (currentRatio < targetRatio) {
                        // Image is taller than target ratio: crop top/bottom
                        sourceHeight = width / targetRatio
                        sourceY = (height - sourceHeight) / 2
                    }
                    width = maxWidth
                    height = Math.round(maxWidth / targetRatio)
                } else {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width)
                        width = maxWidth
                    }
                }

                canvas.width = width
                canvas.height = height
                canvas.getContext('2d').drawImage(
                    img, 
                    sourceX, sourceY, sourceWidth, sourceHeight, 
                    0, 0, width, height
                )
                canvas.toBlob((blob) => {
                    resolve(blob ? new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.webp', { type: 'image/webp', lastModified: Date.now() }) : file)
                }, 'image/webp', 0.9)
            }
            img.onerror = () => resolve(file)
        }
        reader.onerror = () => resolve(file)
    })

    const handleFileSelect = async (files) => {
        const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
        const compressed = await Promise.all(validFiles.map(f => compressImage(f)))
        setImageFiles(prev => [...prev, ...compressed])
    }

    const handleStatusChange = (orderId, newStatus) => {
        const updated = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
        setOrders(updated)
        localStorage.setItem('meraki_orders', JSON.stringify(updated))
        if (selectedOrder?.id === orderId) setSelectedOrder(prev => ({ ...prev, status: newStatus }))
    }

    async function handleSave(e) {
        e.preventDefault(); setSaving(true)
        const form = e.target
        let uploadedUrls = []
        if (imageFiles.length > 0) {
            const { urls } = await uploadMultipleImages(imageFiles)
            uploadedUrls = urls
        }
        const allImages = [...existingImages, ...uploadedUrls].filter(Boolean)

        // Calculate size+color variant stock matrix
        const cleanedVariantStock = {}
        let totalVariantStockSum = 0
        const hasVariantMatrix = selectedModalSizes.length > 0 && selectedModalColors.length > 0

        if (hasVariantMatrix) {
            selectedModalSizes.forEach(s => {
                selectedModalColors.forEach(c => {
                    const key = `${s}_${c}`
                    const qty = parseInt(modalVariantStock[key]) || 0
                    cleanedVariantStock[key] = qty
                    totalVariantStockSum += qty
                })
            })
        }

        // Calculate fallback color stock
        const cleanedColorStock = {}
        let totalColorStockSum = 0
        selectedModalColors.forEach(c => {
            let colorSum = 0
            if (hasVariantMatrix) {
                selectedModalSizes.forEach(s => {
                    colorSum += (parseInt(modalVariantStock[`${s}_${c}`]) || 0)
                })
            } else {
                colorSum = parseInt(modalColorStock[c]) || 0
            }
            cleanedColorStock[c] = colorSum
            totalColorStockSum += colorSum
        })

        const finalStock = hasVariantMatrix 
            ? totalVariantStockSum 
            : (selectedModalColors.length > 0 ? totalColorStockSum : (parseInt(form.pStock.value) || 0))

        const productData = {
            name: form.pName.value, category: selectedModalCategory,
            subcategory: selectedModalSubcategory || '',
            price: parseFloat(form.pPrice.value), original_price: parseFloat(form.pOriginalPrice.value) || 0,
            cost_price: parseFloat(form.pCostPrice?.value || '0') || 0,
            costPrice: parseFloat(form.pCostPrice?.value || '0') || 0,
            stock: finalStock,
            badge: form.pBadge.value, section: selectedModalSection, sizes: selectedModalSizes, image: allImages, description: form.pDescription.value,
            colors: selectedModalColors,
            color_stock: cleanedColorStock,
            colorStock: cleanedColorStock,
            variant_stock: cleanedVariantStock,
            variantStock: cleanedVariantStock,
            color_images: modalColorImages,
            colorImages: modalColorImages,
            inPromoCombo: form.pInPromoCombo?.checked || false,
            isCustomizable: isCustomizable || selectedModalCategory?.toLowerCase() === 'personalizaveis' || selectedModalCategory?.toLowerCase() === 'personalizáveis',
            customPriceWith: parseFloat(form.pCustomPriceWith?.value || '0') || 0,
            customPriceWithout: parseFloat(form.pCustomPriceWithout?.value || '0') || 0,
            customFeeLetter: parseFloat(form.pCustomFeeLetter?.value || '2.50') || 2.50,
            customFeeNumber: parseFloat(form.pCustomFeeNumber?.value || '2.50') || 2.50,
            customFeeEmoji: parseFloat(form.pCustomFeeEmoji?.value || '3.00') || 3.00,
            customizable_emojis: customizableEmojis.join(','),
            has_kits: hasKits,
            kit_options: kitOptions,
        }
        if (modal.editing) {
            const { data, error } = await updateProduct(modal.editing, productData)
            if (!error && data) setProducts(prev => prev.map(p => p.id === modal.editing ? data : p))
        } else {
            const { data, error } = await createProduct(productData)
            if (!error && data) setProducts(prev => [data, ...prev])
        }
        setSaving(false); setModal({ open: false, editing: null })
    }

    async function handleDelete() {
        if (!deleteModal.product) return
        const imgs = deleteModal.product.image
        if (Array.isArray(imgs)) await Promise.all(imgs.map(url => deleteImage(url)))
        await deleteProduct(deleteModal.product.id)
        setProducts(prev => prev.filter(p => p.id !== deleteModal.product.id))
        setDeleteModal({ open: false, product: null })
    }

    const handleOpenCreateCoupon = () => {
        setEditingCoupon(null)
        setCouponForm({ code: '', type: 'percentage', value: '', minPurchase: '' })
        setCouponModal(true)
    }

    const handleOpenEditCoupon = (cp) => {
        setEditingCoupon(cp)
        setCouponForm({
            code: cp.code || '',
            type: cp.type || 'percentage',
            value: cp.value !== undefined ? String(cp.value) : '',
            minPurchase: cp.minPurchase !== undefined ? String(cp.minPurchase) : ''
        })
        setCouponModal(true)
    }

    const handleCreateCoupon = (e) => {
        e.preventDefault()
        if (!couponForm.code.trim()) return

        let updated
        if (editingCoupon) {
            updated = coupons.map(c => c.id === editingCoupon.id ? {
                ...c,
                code: couponForm.code.toUpperCase().trim(),
                type: couponForm.type,
                value: parseFloat(couponForm.value) || 0,
                minPurchase: parseFloat(couponForm.minPurchase) || 0
            } : c)
        } else {
            const newCoupon = {
                id: generateUUID(),
                code: couponForm.code.toUpperCase().trim(),
                type: couponForm.type,
                value: parseFloat(couponForm.value) || 0,
                minPurchase: parseFloat(couponForm.minPurchase) || 0
            }
            updated = [...coupons, newCoupon]
        }

        setCoupons(updated)
        localStorage.setItem('meraki_coupons', JSON.stringify(updated))
        setCouponForm({ code: '', type: 'percentage', value: '', minPurchase: '' })
        setEditingCoupon(null)
        setCouponModal(false)
        window.dispatchEvent(new Event('couponsUpdated'))
    }

    const handleDeleteCoupon = (id) => {
        const updated = coupons.filter(c => c.id !== id)
        setCoupons(updated); localStorage.setItem('meraki_coupons', JSON.stringify(updated))
        window.dispatchEvent(new Event('couponsUpdated'))
    }

    const handleCreateBanner = async (e) => {
        e.preventDefault(); setSaving(true)
        let imageUrl = bannerForm.image
        let mobileImageUrl = bannerForm.mobile_image || ''

        if (bannerImageFiles.length > 0) {
            const { urls } = await uploadMultipleImages(bannerImageFiles)
            if (urls?.[0]) imageUrl = urls[0]
        }
        if (bannerMobileImageFiles.length > 0) {
            const { urls } = await uploadMultipleImages(bannerMobileImageFiles)
            if (urls?.[0]) mobileImageUrl = urls[0]
        }

        if (!imageUrl && !mobileImageUrl) {
            alert('Por favor insira um link ou faça upload de um arquivo de mídia (foto, GIF ou vídeo) para Desktop ou Mobile.')
            setSaving(false)
            return
        }

        let updated
        if (editingBannerId) {
            updated = banners.map(b => b.id === editingBannerId ? {
                ...b,
                image: imageUrl,
                mobile_image: mobileImageUrl,
                alt: bannerForm.alt || 'Banner Meraki',
                link: bannerForm.link || '/shop'
            } : b)
        } else {
            const newBanner = {
                id: generateUUID(),
                image: imageUrl,
                mobile_image: mobileImageUrl,
                alt: bannerForm.alt || 'Banner Meraki',
                link: bannerForm.link || '/shop'
            }
            updated = [...banners, newBanner]
        }
        setBanners(updated); localStorage.setItem('meraki_banners', JSON.stringify(updated))
        setBannerForm({ image: '', mobile_image: '', alt: '', link: '/shop' })
        setBannerImageFiles([])
        setBannerMobileImageFiles([])
        setBannerModal(false)
        setEditingBannerId(null)
        setSaving(false)
        window.dispatchEvent(new Event('bannersUpdated'))
    }

    const openEditBanner = (bn) => {
        setBannerForm({ image: bn.image || '', mobile_image: bn.mobile_image || '', alt: bn.alt || '', link: bn.link || '/shop' })
        setBannerImageFiles([])
        setBannerMobileImageFiles([])
        setEditingBannerId(bn.id)
        setBannerModal(true)
    }

    const handleDeleteBanner = (id) => {
        const updated = banners.filter(b => b.id !== id)
        setBanners(updated); localStorage.setItem('meraki_banners', JSON.stringify(updated))
        window.dispatchEvent(new Event('bannersUpdated'))
    }

    const handleUpdateBannerImage = (id, newImageUrl) => {
        const updated = banners.map(b => b.id === id ? { ...b, image: newImageUrl } : b)
        setBanners(updated); localStorage.setItem('meraki_banners', JSON.stringify(updated))
        window.dispatchEvent(new Event('bannersUpdated'))
    }

    const handleUpdateBannerMobileImage = (id, newMobileImageUrl) => {
        const updated = banners.map(b => b.id === id ? { ...b, mobile_image: newMobileImageUrl } : b)
        setBanners(updated); localStorage.setItem('meraki_banners', JSON.stringify(updated))
        window.dispatchEvent(new Event('bannersUpdated'))
    }

    const handleUpdateReturn = (customerEmail, returnId, updatedFields) => {
        const key = `meraki_returns_${customerEmail}`
        const userReturns = JSON.parse(localStorage.getItem(key) || '[]')
        const updated = userReturns.map(ret => ret.id === returnId ? { ...ret, ...updatedFields } : ret)
        localStorage.setItem(key, JSON.stringify(updated))
        setReturns(returns.map(ret => ret.id === returnId && ret.customerEmail === customerEmail ? { ...ret, ...updatedFields } : ret))
        if (selectedReturn?.id === returnId && selectedReturn?.customerEmail === customerEmail)
            setSelectedReturn(prev => ({ ...prev, ...updatedFields }))
    }

    const handleAddTopbarMessage = (e) => {
        e.preventDefault()
        if (!newTopbarMsg.trim()) return
        const updated = [...topbarMessages, newTopbarMsg.trim()]
        setTopbarMessages(updated)
        localStorage.setItem('meraki_topbar_messages', JSON.stringify(updated))
        try {
            const stored = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
            const newConfig = { ...stored, id: 'default', topbarMessages: updated }
            localStorage.setItem('meraki_store_config', JSON.stringify(newConfig))
            updateStoreConfig(newConfig)
        } catch (err) {}
        setNewTopbarMsg('')
        window.dispatchEvent(new Event('topbarMessagesUpdated'))
        window.dispatchEvent(new Event('storeConfigUpdated'))
    }

    const handleDeleteTopbarMessage = (index) => {
        const updated = topbarMessages.filter((_, i) => i !== index)
        setTopbarMessages(updated)
        localStorage.setItem('meraki_topbar_messages', JSON.stringify(updated))
        try {
            const stored = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
            const newConfig = { ...stored, id: 'default', topbarMessages: updated }
            localStorage.setItem('meraki_store_config', JSON.stringify(newConfig))
            updateStoreConfig(newConfig)
        } catch (err) {}
        window.dispatchEvent(new Event('topbarMessagesUpdated'))
        window.dispatchEvent(new Event('storeConfigUpdated'))
    }

    const handleUpdateTopbarMessage = (index, value) => {
        const updated = [...topbarMessages]
        updated[index] = value
        setTopbarMessages(updated)
        localStorage.setItem('meraki_topbar_messages', JSON.stringify(updated))
        try {
            const stored = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
            const newConfig = { ...stored, id: 'default', topbarMessages: updated }
            localStorage.setItem('meraki_store_config', JSON.stringify(newConfig))
            updateStoreConfig(newConfig)
        } catch (err) {}
        window.dispatchEvent(new Event('topbarMessagesUpdated'))
        window.dispatchEvent(new Event('storeConfigUpdated'))
    }

    const adminName = user?.user_metadata?.full_name || 'Admin'
    const adminInitials = adminName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

    const menuItems = [
        { id: 'dashboard', label: 'Painel Geral',   icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { id: 'products', label: 'Produtos',         icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
        { id: 'categories', label: 'Categorias',     icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
        { id: 'orders',   label: 'Pedidos',           icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2' },
        { id: 'financial', label: 'Gestão Financeira', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { id: 'planning', label: 'Planejamento & Coleções', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
        { id: 'coupons',  label: 'Cupons',            icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
        { id: 'automations', label: 'Automações Marketing', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
        { id: 'suggestions', label: 'Mural de Sugestões', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
        { id: 'polls', label: 'Enquetes Rápidas', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
        { id: 'wishlist_analytics', label: 'Desejos Inteligente', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
        { id: 'product_requests', label: 'Produtos Solicitados', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
        { id: 'banners',  label: 'Banners Home',      icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
        { id: 'promocombo', label: 'Promoção Combo', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { id: 'welcomemodal', label: 'Pop-up Boas-vindas', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { id: 'editorial',  label: 'Manifesto Editorial', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.282.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.282.477-4.5 1.253' },
        { id: 'topbar',   label: 'Faixa Promocional', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
        { id: 'customers',label: 'Clientes',          icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
        { id: 'newsletter', label: 'Newsletter',      icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
        { id: 'returns',  label: 'Trocas',            icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
        { id: 'institutional', label: 'Páginas & Textos (História...)', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        { id: 'settings', label: 'Configuração da Loja', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    ]

    // ─── Shared input styles ──────────────────────────────────────────────────
    const inputCls = "w-full px-4 py-3 bg-[#FAF9F5] border border-[#EEEEEE] rounded-xl text-sm text-gray-800 outline-none focus:border-[#7A3E4A] focus:ring-2 focus:ring-[#7A3E4A]/10 transition-all font-medium placeholder-gray-400"
    const labelCls = "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5"

    return (
        <div className="flex min-h-screen" style={{ background: '#F7F4F1', fontFamily: '"Plus Jakarta Sans", "Inter", system-ui, -apple-system, sans-serif' }}>

            {/* ─── Sidebar Desktop ─────────────────────────────────────────────── */}
            <aside className="w-64 bg-white border-r border-[#EEEEEE] flex flex-col shrink-0 hidden lg:flex sticky top-0 h-screen overflow-hidden">
                <AdminSidebar
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    adminName={adminName}
                    adminInitials={adminInitials}
                    menuItems={menuItems}
                />
            </aside>

            {/* ─── Mobile Drawer Overlay ───────────────────────────────────────── */}
            {sidebarOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[98] lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                    <aside className="fixed inset-y-0 left-0 w-72 bg-white z-[99] flex flex-col lg:hidden shadow-2xl animate-slide-right">
                        <div className="flex items-center justify-between p-5 border-b border-[#EEEEEE]">
                            <span className="font-heading text-lg font-black tracking-[0.25em] text-[#7A3E4A]">MERAKI</span>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                            >
                                <Icon path="M6 18L18 6M6 6l12 12" className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <AdminSidebar
                                activeSection={activeSection}
                                setActiveSection={setActiveSection}
                                adminName={adminName}
                                adminInitials={adminInitials}
                                menuItems={menuItems}
                                onNavClick={() => setSidebarOpen(false)}
                            />
                        </div>
                    </aside>
                </>
            )}

            {/* ─── Main Content ────────────────────────────────────────────────── */}
            <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">

                {/* Top Header Bar */}
                <header className="bg-white border-b border-[#EEEEEE] px-4 md:px-8 h-16 flex items-center justify-between sticky top-0 z-40">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden w-9 h-9 rounded-xl bg-[#FAF9F5] flex items-center justify-center cursor-pointer hover:bg-[#7A3E4A]/10 transition-colors"
                            aria-label="Abrir menu"
                        >
                            <Icon path="M4 6h16M4 12h16M4 18h16" className="w-5 h-5 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-sm font-black text-gray-900 uppercase tracking-wider leading-none">
                                {menuItems.find(i => i.id === activeSection)?.label}
                            </h1>
                            <p className="text-[10px] text-gray-400 font-medium">Meraki Admin</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">

                        <Link
                            to="/"
                            className="hidden md:flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#7A3E4A] font-semibold transition-colors px-3 py-1.5 rounded-lg hover:bg-[#7A3E4A]/5"
                        >
                            <Icon path="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" className="w-4 h-4" />
                            Ver Loja
                        </Link>
                        <div className="flex items-center gap-2">
                            <span className="hidden md:block text-xs font-semibold text-gray-600">{adminName}</span>
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7A3E4A] to-[#9A5060] flex items-center justify-center text-white text-xs font-black tracking-wider shadow-md shadow-[#7A3E4A]/20">
                                {adminInitials}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">

                    {/* ═══════════════════════════════════════════════════════════ */}
                    {/* SECTION 1: DASHBOARD */}
                    {/* ═══════════════════════════════════════════════════════════ */}
                    {activeSection === 'dashboard' && (
                        <DashboardSection
                            adminName={adminName}
                            totalSales={totalSales}
                            ticketMedio={ticketMedio}
                            stats={stats}
                            orders={orders}
                            products={products}
                            coupons={coupons}
                            setActiveSection={setActiveSection}
                            getProductImage={getProductImage}
                        />
                    )}
                           {/* ═══════════════════════════════════════════════════════════ */}
                    {/* SECTION 2: PRODUCTS */}
                    {/* ═══════════════════════════════════════════════════════════ */}
                    {activeSection === 'products' && (
                        <ProductsSection
                            productsLoading={productsLoading}
                            filteredProducts={filteredProducts}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            setModal={setModal}
                            setDeleteModal={setDeleteModal}
                            paginatedProducts={paginatedProducts}
                            getProductImage={getProductImage}
                            sectionLabel={sectionLabel}
                            renderPagination={renderPagination}
                            pPage={pPage}
                            setPPage={setPPage}
                        />
                    )}

                    {/* ═══════════════════════════════════════════════════════════ */}
                    {/* SECTION 3: ORDERS */}
                    {/* ═══════════════════════════════════════════════════════════ */}
                    {activeSection === 'orders' && (
                        <OrdersSection
                            orders={orders}
                            paginatedOrders={paginatedOrders}
                            handleStatusChange={handleStatusChange}
                            setSelectedOrder={setSelectedOrder}
                            renderPagination={renderPagination}
                            oPage={oPage}
                            setOPage={setOPage}
                        />
                    )}

                    {/* ═══════════════════════════════════════════════════════════ */}
                    {/* SECTION: MARKETING AUTOMATIONS */}
                    {/* ═══════════════════════════════════════════════════════════ */}
                    {activeSection === 'automations' && (
                        <AutomationsSection />
                    )}

                    {/* ═══════════════════════════════════════════════════════════ */}
                    {/* SECTION: FINANCIAL MANAGEMENT */}
                    {/* ═══════════════════════════════════════════════════════════ */}
                    {activeSection === 'financial' && (
                        <FinancialSection
                            orders={orders}
                            products={products}
                            transactions={transactions}
                            onCreateTransaction={handleCreateTransaction}
                            onUpdateTransactionStatus={handleUpdateTransactionStatus}
                            onDeleteTransaction={handleDeleteTransaction}
                            updateStoreConfig={updateStoreConfig}
                        />
                    )}

                    {/* ═══════════════════════════════════════════════════════════ */}
                    {/* SECTION: PLANNING & COLLECTIONS */}
                    {/* ═══════════════════════════════════════════════════════════ */}
                    {activeSection === 'planning' && (
                        <PlanningSection
                            orders={orders}
                            products={products}
                        />
                    )}

                    {/* ═══════════════════════════════════════════════════════════ */}
                    {/* SECTION 4: COUPONS */}
                    {/* ═══════════════════════════════════════════════════════════ */}
                    {activeSection === 'coupons' && (
                        <CouponsSection
                            coupons={coupons}
                            paginatedCoupons={paginatedCoupons}
                            setCouponModal={setCouponModal}
                            handleOpenCreateCoupon={handleOpenCreateCoupon}
                            handleOpenEditCoupon={handleOpenEditCoupon}
                            handleDeleteCoupon={handleDeleteCoupon}
                            renderPagination={renderPagination}
                            cpPage={cpPage}
                            setCpPage={setCpPage}
                        />
                    )}

                    {/* ═══════════════════════════════════════════════════════════ */}
                    {/* SECTION 5: BANNERS */}
                    {/* ═══════════════════════════════════════════════════════════ */}
                    {activeSection === 'banners' && (
                        <BannersSection
                            banners={banners}
                            setBannerModal={() => { setEditingBannerId(null); setBannerForm({ image: '', mobile_image: '', alt: '', link: '/shop' }); setBannerImageFiles([]); setBannerMobileImageFiles([]); setBannerModal(true) }}
                            onEditBanner={openEditBanner}
                            getAssetUrl={getAssetUrl}
                            compressImage={compressImage}
                            uploadMultipleImages={uploadMultipleImages}
                            handleUpdateBannerImage={handleUpdateBannerImage}
                            handleUpdateBannerMobileImage={handleUpdateBannerMobileImage}
                            handleDeleteBanner={handleDeleteBanner}
                            updateStoreConfig={updateStoreConfig}
                        />
                    )}

                    {/* ═══════════════════════════════════════════════════════════ */}
                    {/* SECTION 5.4: PROMO COMBO CONFIGURATION */}
                    {/* ═══════════════════════════════════════════════════════════ */}
                    {activeSection === 'promocombo' && (
                        <PromoComboSection
                            promoCombo={promoCombo}
                            setPromoCombo={setPromoCombo}
                            saving={saving}
                            setSaving={setSaving}
                            compressImage={compressImage}
                            uploadMultipleImages={uploadMultipleImages}
                            getAssetUrl={getAssetUrl}
                            updateStoreConfig={updateStoreConfig}
                        />
                    )}

                    {/* ═══════════════════════════════════════════════════════════ */}
                    {/* SECTION 5.3.1: WELCOME MODAL CONFIGURATION */}
                    {/* ═══════════════════════════════════════════════════════════ */}
                    {activeSection === 'welcomemodal' && (
                        <WelcomeModalSection
                            welcomeModal={welcomeModal}
                            setWelcomeModal={setWelcomeModal}
                            saving={saving}
                            setSaving={setSaving}
                            compressImage={compressImage}
                            uploadMultipleImages={uploadMultipleImages}
                            getAssetUrl={getAssetUrl}
                            updateStoreConfig={updateStoreConfig}
                        />
                    )}

                    {/* ═══════════════════════════════════════════════════════════ */}
                    {/* SECTION 5.4.1: EDITORIAL CONFIGURATION */}
                    {/* ═══════════════════════════════════════════════════════════ */}
                    {activeSection === 'editorial' && (
                        <EditorialSection
                            editorial={editorial}
                            setEditorial={setEditorial}
                            saving={saving}
                            setSaving={setSaving}
                            compressImage={compressImage}
                            uploadMultipleImages={uploadMultipleImages}
                            getAssetUrl={getAssetUrl}
                            updateStoreConfig={updateStoreConfig}
                        />
                    )}

                    {/* ═══════════════════════════════════════════════════════════ */}
                    {/* SECTION 5.5: CATEGORIES MANAGEMENT */}
                    {/* ═══════════════════════════════════════════════════════════ */}
                    {activeSection === 'categories' && (
                        <CategoriesSection
                            categories={categories}
                            setCategories={setCategories}
                            saving={saving}
                            setSaving={setSaving}
                            compressImage={compressImage}
                            uploadMultipleImages={uploadMultipleImages}
                            getAssetUrl={getAssetUrl}
                            homepageCategories={homepageCategories}
                            setHomepageCategories={setHomepageCategories}
                            saveHomepageCategoriesToConfig={saveHomepageCategoriesToConfig}
                        />
                    )}

                    {/* ═══════════════════════════════════════════════════════════ */}
                    {/* SECTION: MURAL DE SUGESTÕES */}
                    {/* ═══════════════════════════════════════════════════════════ */}
                    {activeSection === 'suggestions' && (
                        <SuggestionsSection />
                    )}

                    {/* ═══════════════════════════════════════════════════════════ */}
                    {/* SECTION: ENQUETES */}
                    {/* ═══════════════════════════════════════════════════════════ */}
                    {activeSection === 'polls' && (
                        <PollsSection />
                    )}

                    {/* ═══════════════════════════════════════════════════════════ */}
                    {/* SECTION: LISTA DE DESEJOS INTELIGENTE */}
                    {/* ═══════════════════════════════════════════════════════════ */}
                    {activeSection === 'wishlist_analytics' && (
                        <WishlistAnalyticsSection />
                    )}

                    {/* ═══════════════════════════════════════════════════════════ */}
                    {/* SECTION: PRODUTOS SOLICITADOS */}
                    {/* ═══════════════════════════════════════════════════════════ */}
                    {activeSection === 'product_requests' && (
                        <ProductRequestsSection />
                    )}
                    {activeSection === 'customers' && (
                        <CustomersSection
                            customers={customers}
                            orders={orders}
                            paginatedCustomers={paginatedCustomers}
                            renderPagination={renderPagination}
                            cPage={cPage}
                            setCPage={setCPage}
                        />
                    )}

                    {activeSection === 'newsletter' && (
                        <NewsletterSection />
                    )}

                    {/* ═══════════════════════════════════════════════════════════ */}
                    {/* SECTION 7: RETURNS */}
                    {/* ═══════════════════════════════════════════════════════════ */}
                    {activeSection === 'returns' && (
                        <ReturnsSection
                            returns={returns}
                            paginatedReturns={paginatedReturns}
                            setSelectedReturn={setSelectedReturn}
                            renderPagination={renderPagination}
                            rPage={rPage}
                            setRPage={setRPage}
                        />
                    )}

                    {/* ═══════════════════════════════════════════════════════════ */}
                    {/* SECTION 7.4: INSTITUTIONAL PAGES & TEXTS */}
                    {/* ═══════════════════════════════════════════════════════════ */}
                    {activeSection === 'institutional' && (
                        <InstitutionalSection
                            saving={saving}
                            setSaving={setSaving}
                            updateStoreConfig={updateStoreConfig}
                        />
                    )}

                    {/* ═══════════════════════════════════════════════════════════ */}
                    {/* SECTION 7.5: STORE SETTINGS */}
                    {/* ═══════════════════════════════════════════════════════════ */}
                    {activeSection === 'settings' && (
                        <SettingsSection
                            saving={saving}
                            setSaving={setSaving}
                            updateStoreConfig={updateStoreConfig}
                        />
                    )}

                    {/* ═══════════════════════════════════════════════════════════ */}
                    {/* SECTION 8: FAIXA PROMOCIONAL (TOPBAR MESSAGES) */}
                    {/* ═══════════════════════════════════════════════════════════ */}
                    {activeSection === 'topbar' && (
                        <div className="space-y-6">
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#EEEEEE]">
                                <div>
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-1">Frases Rotativas do Topo</h3>
                                    <p className="text-xs text-gray-400">Configure as mensagens promocionais que aparecem na barra no topo do site.</p>
                                </div>
                            </div>

                            {/* Benefits Bar config (Frases abaixo do Hero) */}
                            <div className="bg-white p-6 rounded-2xl border border-[#EEEEEE] space-y-4">
                                <div>
                                    <h4 className="text-[10px] font-bold text-[#7A3E4A] uppercase tracking-widest">Frases da Barra de Benefícios (Abaixo do Banner Hero)</h4>
                                    <p className="text-xs text-gray-400 mt-1">Altere as duas frases exibidas na barra de benefícios logo abaixo dos banners principais da home.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Frase 1 (Esquerda - Frete / Benefício)</label>
                                        <input
                                            type="text"
                                            value={shippingMessage}
                                            onChange={(e) => setShippingMessage(e.target.value)}
                                            placeholder="Ex: Frete grátis para a região Centro-Oeste nas compras acima de R$ 299,90."
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Frase 2 (Direita - Cupom / Promoção)</label>
                                        <input
                                            type="text"
                                            value={promoMessage}
                                            onChange={(e) => setPromoMessage(e.target.value)}
                                            placeholder="Ex: 10% OFF na primeira compra com o cupom: BEMVINDA10 (Ganhe R$ 10 OFF)"
                                            className={inputCls}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end pt-1">
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            const shipMsg = shippingMessage.trim()
                                            const prMsg = promoMessage.trim()
                                            localStorage.setItem('meraki_shipping_message', shipMsg)
                                            localStorage.setItem('meraki_promo_message', prMsg)
                                            window.dispatchEvent(new Event('shippingMessageUpdated'))
                                            window.dispatchEvent(new Event('promoMessageUpdated'))
                                            await updateStoreConfig({ shipping_message: shipMsg, promo_message: prMsg })
                                        }}
                                        className="px-5 py-2.5 bg-[#7A3E4A] hover:bg-[#5A2E34] text-white text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer active:scale-98 shadow-xs"
                                    >
                                        Salvar Frases da Barra
                                    </button>
                                </div>
                            </div>

                            {/* Installment text config */}
                            <div className="bg-white p-6 rounded-2xl border border-[#EEEEEE] space-y-4">
                                <div>
                                    <h4 className="text-[10px] font-bold text-[#7A3E4A] uppercase tracking-widest">Texto de Parcelamento (Cards de Produto)</h4>
                                    <p className="text-xs text-gray-400 mt-1">Defina o texto que aparece abaixo do preço em todos os cards de produto. Ex: "Em até 6x sem juros".</p>
                                </div>
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={installmentText}
                                        onChange={(e) => setInstallmentText(e.target.value)}
                                        placeholder="Ex: Em até 6x sem juros"
                                        className={inputCls}
                                    />
                                    <div className="flex justify-end pt-1">
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                const txt = installmentText.trim()
                                                if (txt) {
                                                    const config = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
                                                    const updated = { ...config, installmentText: txt }
                                                    localStorage.setItem('meraki_store_config', JSON.stringify(updated))
                                                    window.dispatchEvent(new Event('storeConfigUpdated'))
                                                    await updateStoreConfig({ installment_text: txt })
                                                }
                                            }}
                                            className="px-5 py-2.5 bg-[#7A3E4A] hover:bg-[#5A2E34] text-white text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer active:scale-98 shadow-xs"
                                        >
                                            Salvar Parcelamento
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Color Pickers */}
                            <div className="bg-white p-6 rounded-2xl border border-[#EEEEEE] space-y-4">
                                <h4 className="text-[10px] font-bold text-[#7A3E4A] uppercase tracking-widest">Cores da Faixa</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-700 mb-2 uppercase tracking-wider">Cor de Fundo</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="color"
                                                value={topbarStyle.bgColor}
                                                onChange={async (e) => {
                                                    const updated = { ...topbarStyle, bgColor: e.target.value }
                                                    setTopbarStyle(updated)
                                                    await mergeTopbarStyle({ bgColor: e.target.value })
                                                }}
                                                className="w-10 h-10 rounded-lg border border-[#EEEEEE] cursor-pointer p-0.5 bg-white"
                                            />
                                            <span className="text-xs font-mono text-gray-500">{topbarStyle.bgColor}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-700 mb-2 uppercase tracking-wider">Cor das Letras</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="color"
                                                value={topbarStyle.textColor}
                                                onChange={async (e) => {
                                                    const updated = { ...topbarStyle, textColor: e.target.value }
                                                    setTopbarStyle(updated)
                                                    await mergeTopbarStyle({ textColor: e.target.value })
                                                }}
                                                className="w-10 h-10 rounded-lg border border-[#EEEEEE] cursor-pointer p-0.5 bg-white"
                                            />
                                            <span className="text-xs font-mono text-gray-500">{topbarStyle.textColor}</span>
                                        </div>
                                    </div>
                                </div>
                                {/* Live Preview */}
                                <div
                                    className="w-full rounded-xl py-2.5 px-4 text-center text-[11px] font-bold uppercase tracking-[0.15em] transition-all"
                                    style={{ background: topbarStyle.bgColor, color: topbarStyle.textColor }}
                                >
                                    {topbarMessages[0] || 'Pré-visualização da Faixa Promocional'}
                                </div>
                                <div className="flex gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            const reset = { ...topbarStyle, bgColor: '#C6A76A', textColor: '#FFFFFF' }
                                            setTopbarStyle(reset)
                                            await mergeTopbarStyle({ bgColor: '#C6A76A', textColor: '#FFFFFF' })
                                        }}
                                        className="text-[10px] font-bold text-gray-400 hover:text-[#7A3E4A] px-3 py-1.5 rounded-lg hover:bg-[#FAF9F5] transition-all cursor-pointer border border-[#EEEEEE]"
                                    >
                                        Restaurar Padrão
                                    </button>
                                </div>
                            </div>

                            {/* Add message form */}
                            <form onSubmit={handleAddTopbarMessage} className="bg-white p-6 rounded-2xl border border-[#EEEEEE] space-y-4">
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Adicionar Nova Frase</h4>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={newTopbarMsg}
                                        onChange={(e) => setNewTopbarMsg(e.target.value)}
                                        placeholder="Ex: ✨ Desconto de 10% na primeira compra com o cupom MERAKI10!"
                                        className={inputCls}
                                        maxLength={100}
                                    />
                                    <button
                                        type="submit"
                                        className="px-6 bg-[#7A3E4A] hover:bg-[#5A2E34] text-white text-xs font-bold rounded-xl shrink-0 transition-colors uppercase tracking-wider cursor-pointer"
                                    >
                                        Adicionar
                                    </button>
                                </div>
                            </form>

                            {/* Messages list */}
                            <div className="bg-white rounded-2xl border border-[#EEEEEE] overflow-hidden">
                                <div className="p-6 border-b border-[#EEEEEE]">
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Frases Ativas ({topbarMessages.length})</h4>
                                </div>
                                {topbarMessages.length > 0 ? (
                                    <div className="divide-y divide-[#EEEEEE]">
                                        {(topbarMessages || []).map((msg, index) => (
                                            <div key={index} className="p-4 flex items-center justify-between gap-4 hover:bg-[#FAF9F5] transition-colors">
                                                <div className="flex-1">
                                                    <input
                                                        type="text"
                                                        value={msg}
                                                        onChange={(e) => handleUpdateTopbarMessage(index, e.target.value)}
                                                        className="w-full bg-transparent border-0 border-b border-transparent focus:border-[#7A3E4A] focus:outline-none text-sm text-gray-700 font-medium py-1"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteTopbarMessage(index)}
                                                    className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 hover:text-red-700 cursor-pointer transition-colors"
                                                    title="Excluir frase"
                                                >
                                                    <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 text-center text-gray-400">
                                        Nenhuma frase cadastrada. A barra de anúncios ficará oculta no site.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </main>

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* MODAL: ORDER DETAILS */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {selectedOrder && (
                <>
                    <div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
                    <div className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-[95] bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-[#EEEEEE]">
                            <div>
                                <h2 className="text-sm font-black text-gray-900">Detalhes do Pedido</h2>
                                <p className="text-[10px] text-gray-400 font-mono">#{selectedOrder.id?.slice(-8)}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center cursor-pointer transition-colors">
                                <Icon path="M6 18L18 6M6 6l12 12" className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 bg-[#FAF9F5] rounded-xl space-y-1">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Cliente</p>
                                    <p className="text-sm font-bold text-gray-900">{selectedOrder.customerName}</p>
                                    <p className="text-xs text-gray-500">{selectedOrder.customerEmail}</p>
                                    <p className="text-xs text-gray-500">{selectedOrder.customerPhone}</p>
                                    <p className="text-xs text-gray-500">CPF: {selectedOrder.customerCpf}</p>
                                </div>
                                <div className="p-4 bg-[#FAF9F5] rounded-xl space-y-1">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Endereço</p>
                                    <p className="text-xs text-gray-700 leading-relaxed">
                                        {selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.number}<br />
                                        {selectedOrder.shippingAddress?.neighborhood} — {selectedOrder.shippingAddress?.city}/{selectedOrder.shippingAddress?.state}<br />
                                        CEP: {selectedOrder.shippingAddress?.cep}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">Itens Comprados</p>
                                <div className="border border-[#EEEEEE] rounded-xl overflow-hidden divide-y divide-[#F5F5F5]">
                                    {selectedOrder.items?.map(item => (
                                        <div key={`${item.id}-${item.size}`} className="flex items-center gap-3 p-3">
                                            <div className="w-9 h-12 bg-gray-50 rounded-lg overflow-hidden border border-[#EEEEEE] shrink-0">
                                                <img src={getProductImage(item)} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-gray-800 truncate">{item.name}</p>
                                                <p className="text-[10px] text-gray-400">Tam: {item.size} • Qtd: {item.quantity}</p>
                                            </div>
                                            <p className="text-xs font-black text-gray-900">{(item.price * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2 border-t border-[#EEEEEE]">
                                <div>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Alterar Status</p>
                                    <select
                                        value={selectedOrder.status}
                                        onChange={e => handleStatusChange(selectedOrder.id, e.target.value)}
                                        className="px-4 py-2.5 bg-white border border-[#EEEEEE] rounded-xl text-xs font-bold outline-none focus:border-[#7A3E4A] cursor-pointer"
                                    >
                                        {['Pendente', 'Pago', 'Enviado', 'Entregue', 'Cancelado'].map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1 text-right">
                                    {[
                                        { label: 'Subtotal', value: selectedOrder.subtotal?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), cls: 'text-gray-500' },
                                        { label: 'Frete', value: selectedOrder.shipping === 0 ? 'Grátis' : selectedOrder.shipping?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), cls: 'text-gray-500' },
                                        ...(selectedOrder.discount > 0 ? [{ label: 'Desconto', value: `-${selectedOrder.discount?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, cls: 'text-emerald-600 font-black' }] : []),
                                        { label: 'Total', value: selectedOrder.total?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), cls: 'text-[#7A3E4A] font-black text-base border-t border-dashed border-[#EEEEEE] pt-1' },
                                    ].map((row, i) => (
                                        <div key={i} className={`flex justify-end gap-6 text-xs font-semibold ${row.cls}`}>
                                            <span>{row.label}:</span><span>{row.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* MODAL: DELETE PRODUCT */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {deleteModal.open && (
                <>
                    <div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm" onClick={() => setDeleteModal({ open: false, product: null })} />
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[95] bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-[calc(100%-2rem)] space-y-4">
                        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto">
                            <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="w-5 h-5 text-red-500" />
                        </div>
                        <div className="text-center">
                            <h2 className="text-sm font-black text-gray-900 mb-1">Excluir Produto?</h2>
                            <p className="text-xs text-gray-500 leading-relaxed">Você tem certeza que deseja excluir <strong>"{deleteModal.product?.name}"</strong>? Esta ação não pode ser desfeita.</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteModal({ open: false, product: null })} className="flex-1 py-3 border border-[#EEEEEE] text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">Cancelar</button>
                            <button onClick={handleDelete} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer">Excluir</button>
                        </div>
                    </div>
                </>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* MODAL: CREATE/EDIT PRODUCT */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {modal.open && (() => {
                const editingProduct = modal.editing ? products.find(p => p.id === modal.editing) : null
                return (
                    <>
                        <div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm" onClick={() => setModal({ open: false, editing: null })} />
                        <div className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-[95] bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between p-6 border-b border-[#EEEEEE] sticky top-0 bg-white z-10">
                                <h2 className="text-sm font-black text-gray-900">{modal.editing ? 'Editar Produto' : 'Novo Produto'}</h2>
                                <button onClick={() => setModal({ open: false, editing: null })} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center cursor-pointer transition-colors">
                                    <Icon path="M6 18L18 6M6 6l12 12" className="w-4 h-4 text-gray-600" />
                                </button>
                            </div>
                            <form onSubmit={handleSave} className="p-6 space-y-4">
                                <div>
                                    <label className={labelCls}>Nome do Produto</label>
                                    <input type="text" name="pName" required defaultValue={editingProduct?.name || ''} className={inputCls} />
                                </div>
                                
                                <div>
                                    <label className={labelCls}>Categoria</label>
                                    <div className="flex flex-wrap gap-1.5 mb-2 bg-[#FAF9F5] p-3 rounded-xl border border-[#EEEEEE]">
                                        {(categories || []).map(cat => {
                                            const catName = typeof cat === 'object' ? cat.name : cat
                                            return (
                                                <button
                                                    key={catName}
                                                    type="button"
                                                    onClick={() => setSelectedModalCategory(catName)}
                                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                                                        selectedModalCategory === catName
                                                            ? 'bg-[#7A3E4A] text-white border-[#7A3E4A] shadow-xs'
                                                            : 'bg-white text-gray-500 border-[#EEEEEE] hover:bg-gray-150'
                                                    }`}
                                                >
                                                    {catName}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <label className={labelCls}>Estilo de Filtragem ("Filtre por Estilo")</label>
                                    {(() => {
                                        const storedStyles = JSON.parse(localStorage.getItem('meraki_category_styles') || '{}')
                                        const slugifyCatName = (n) => (n || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/[\s-]+/g, '-')
                                        const catKey = slugifyCatName(selectedModalCategory)

                                        const DEFAULT_STYLES_MAP = {
                                            'linha-sexy': [{ name: 'Bodys' }, { name: 'Corsets' }, { name: 'Conjuntos Sexy' }, { name: 'Acessórios' }],
                                            'conjuntos': [{ name: 'Cobertura Total' }, { name: 'Meia Taça' }, { name: 'Triângulo' }, { name: 'Sem Alça' }, { name: 'Top' }, { name: 'Balconet' }],
                                            'conjuntos-sem-bojo': [{ name: 'Cobertura Total' }, { name: 'Meia Taça' }, { name: 'Triângulo' }, { name: 'Sem Alça' }, { name: 'Top' }],
                                            'conjuntos-com-bojo': [{ name: 'Cobertura Total' }, { name: 'Meia Taça' }, { name: 'Balconet' }, { name: 'Sem Alça' }],
                                            'camisolas-babydolls': [{ name: 'Robes' }, { name: 'Camisolas' }, { name: 'Baby Dolls' }],
                                            'baby-doll': [{ name: 'Robes' }, { name: 'Camisolas' }, { name: 'Baby Dolls' }],
                                            'camisolas': [{ name: 'Robes' }, { name: 'Camisolas' }, { name: 'Baby Dolls' }],
                                            'plus-size': [{ name: 'Sutiãs' }, { name: 'Calcinhas' }, { name: 'Bodys' }, { name: 'Conjuntos' }],
                                            'body': [{ name: 'Renda' }, { name: 'Tule' }, { name: 'Sem Bojo' }, { name: 'Com Bojo' }],
                                            'fantasias': [{ name: 'Completa' }, { name: 'Com Acessórios' }, { name: 'Sensual' }],
                                            'tangas': [{ name: 'Fio Dental' }, { name: 'Renda' }, { name: 'Comfy' }, { name: 'Regulável' }],
                                            'calcinhas-comfy': [{ name: 'Algodão' }, { name: 'Renda' }, { name: 'Cintura Alta' }, { name: 'Fio' }]
                                        }

                                        let catStyles = storedStyles[catKey] || storedStyles[selectedModalCategory]
                                        if (!catStyles || catStyles.length === 0) {
                                            catStyles = DEFAULT_STYLES_MAP[catKey] || []
                                        }

                                        return (
                                            <div className="space-y-2">
                                                <div className="flex flex-wrap gap-1.5 bg-[#FAF9F5] p-3 rounded-xl border border-[#EEEEEE]">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedModalSubcategory('')}
                                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                                                            !selectedModalSubcategory
                                                                ? 'bg-[#7A3E4A] text-white border-[#7A3E4A] shadow-xs font-extrabold'
                                                                : 'bg-white text-gray-500 border-[#EEEEEE] hover:bg-gray-150'
                                                        }`}
                                                    >
                                                        Sem Estilo Específico
                                                    </button>

                                                    {(catStyles || []).map(st => {
                                                        const stName = typeof st === 'string' ? st : st.name
                                                        const isSelected = selectedModalSubcategory?.toLowerCase() === stName?.toLowerCase()
                                                        return (
                                                            <button
                                                                key={stName}
                                                                type="button"
                                                                onClick={() => setSelectedModalSubcategory(stName)}
                                                                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                                                                    isSelected
                                                                        ? 'bg-[#7A3E4A] text-white border-[#7A3E4A] shadow-xs font-extrabold scale-105 ring-2 ring-[#7A3E4A]/30'
                                                                        : 'bg-white text-gray-500 border-[#EEEEEE] hover:bg-gray-150'
                                                                }`}
                                                            >
                                                                <span>✨</span> {stName}
                                                            </button>
                                                        )
                                                    })}
                                                </div>

                                                {catStyles.length === 0 && (
                                                    <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 p-2.5 rounded-xl font-medium">
                                                        ℹ️ Esta categoria ainda não tem estilos cadastrados. Você pode cadastrar os estilos dessa categoria no painel em <strong>Categorias da Loja ➔ 🎨 Estilos</strong>.
                                                    </p>
                                                )}
                                            </div>
                                        )
                                    })()}
                                    <p className="text-[9px] text-gray-400 font-semibold mt-1">
                                        Clique no estilo acima para selecionar. O produto será filtrado quando a cliente clicar no círculo correspondente no site.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                                    <div>
                                        <label className={labelCls}>Preço Venda (R$)</label>
                                        <input
                                            type="number"
                                            name="pPrice"
                                            step="0.01"
                                            min="0"
                                            required
                                            value={modalPrice}
                                            onChange={(e) => setModalPrice(e.target.value)}
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Preço Original (R$)</label>
                                        <input
                                            type="number"
                                            name="pOriginalPrice"
                                            step="0.01"
                                            min="0"
                                            defaultValue={editingProduct?.original_price || '0'}
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Preço Custo (R$)</label>
                                        <input
                                            type="number"
                                            name="pCostPrice"
                                            step="0.01"
                                            min="0"
                                            value={modalCostPrice}
                                            onChange={(e) => setModalCostPrice(e.target.value)}
                                            placeholder="Ex: 35.00"
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Estoque Geral</label>
                                        <input
                                            type="number"
                                            name="pStock"
                                            min="0"
                                            required
                                            defaultValue={editingProduct?.stock !== undefined ? editingProduct.stock : 10}
                                            className={inputCls}
                                        />
                                    </div>
                                </div>

                                {/* SIMULADOR DE LUCRO DO PRODUTO */}
                                {(() => {
                                    const p = parseFloat(modalPrice) || 0
                                    const c = parseFloat(modalCostPrice) || 0
                                    if (p > 0) {
                                        const profit = p - c
                                        const margin = ((profit / p) * 100).toFixed(1)
                                        const markup = c > 0 ? (p / c).toFixed(2) : 'N/A'
                                        return (
                                            <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold text-emerald-900 mt-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                                                    <span>Simulador de Lucro Unitário:</span>
                                                </div>
                                                <div className="flex items-center gap-4 flex-wrap text-emerald-800">
                                                    <span>Lucro Bruto: <strong className="font-extrabold text-emerald-950">R$ {profit.toFixed(2)}</strong></span>
                                                    <span>Margem Bruta: <strong className="font-extrabold text-emerald-950">{margin}%</strong></span>
                                                    {c > 0 && <span>Markup: <strong className="font-extrabold text-emerald-950">{markup}x</strong></span>}
                                                </div>
                                            </div>
                                        )
                                    }
                                    return null
                                })()}

                                <div>
                                    <label className={labelCls}>Tag / Etiqueta do Produto</label>
                                    {/* Hidden input keeps form.pBadge working in handleSave */}
                                    <input type="hidden" name="pBadge" value={selectedModalBadge} />
                                    <div className="space-y-3">
                                        {/* Chip selector */}
                                        <div className="flex flex-wrap gap-2 bg-[#FAF9F5] p-3 rounded-xl border border-[#EEEEEE]">
                                            {/* Indicador do badge atual do produto se não estiver na lista */}
                                            {selectedModalBadge && !(masterBadgesList || []).some(b => b.toLowerCase() === selectedModalBadge.toLowerCase()) && (
                                                <div className="flex items-center rounded-lg border border-[#D11A6E] overflow-hidden bg-[#D11A6E]/5">
                                                    <span className="px-3 py-1.5 text-xs font-bold text-[#D11A6E]">
                                                        {selectedModalBadge} <span className="text-[9px] ml-1 opacity-60">(atual)</span>
                                                    </span>
                                                    <div className="w-px h-4 bg-[#D11A6E]/20" />
                                                    <button type="button" onClick={() => setSelectedModalBadge('')} className="px-2 py-1.5 text-[10px] text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer">✕</button>
                                                </div>
                                            )}
                                            {/* Option: no tag */}
                                            <button
                                                type="button"
                                                onClick={() => setSelectedModalBadge('')}
                                                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                                                    selectedModalBadge === ''
                                                        ? 'bg-gray-700 text-white border-gray-700 shadow-xs'
                                                        : 'bg-white text-gray-400 border-[#EEEEEE] hover:bg-gray-50'
                                                }`}
                                            >
                                                Sem etiqueta
                                            </button>
                                            {(masterBadgesList || []).map(tag => {
                                                const isSelected = selectedModalBadge.toLowerCase() === tag.toLowerCase()
                                                return (
                                                    <div key={tag} className="flex items-center rounded-lg border border-[#EEEEEE] overflow-hidden">
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedModalBadge(isSelected ? '' : tag)}
                                                            className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                                                                isSelected
                                                                    ? 'bg-[#D11A6E] text-white'
                                                                    : 'bg-white text-[#D11A6E] hover:bg-pink-50'
                                                            }`}
                                                        >
                                                            {tag}
                                                        </button>
                                                        <div className="w-px h-4 bg-[#EEEEEE]" />
                                                        <button
                                                            type="button"
                                                            title="Remover tag"
                                                            onClick={async () => {
                                                                const updated = (masterBadgesList || []).filter(b => b !== tag)
                                                                setMasterBadgesList(updated)
                                                                if (selectedModalBadge.toLowerCase() === tag.toLowerCase()) setSelectedModalBadge('')
                                                                await saveBadgesToConfig(updated)
                                                            }}
                                                            className="px-2 py-1.5 text-[10px] text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        {/* Add new badge */}
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newBadgeInput}
                                                onChange={e => setNewBadgeInput(e.target.value)}
                                                onKeyDown={async e => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault()
                                                        const val = newBadgeInput.trim().toUpperCase()
                                                        if (val && !(masterBadgesList || []).includes(val)) {
                                                            const updated = [...(masterBadgesList || []), val]
                                                            setMasterBadgesList(updated)
                                                            setSelectedModalBadge(val)
                                                            setNewBadgeInput('')
                                                            await saveBadgesToConfig(updated)
                                                        }
                                                    }
                                                }}
                                                placeholder="Nova tag (ex: 10% OFF) + Enter"
                                                className="flex-1 px-3 py-2 bg-white border border-[#EEEEEE] rounded-xl text-xs outline-none focus:border-[#7A3E4A] focus:ring-2 focus:ring-[#7A3E4A]/10 transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    const val = newBadgeInput.trim().toUpperCase()
                                                    if (val && !(masterBadgesList || []).includes(val)) {
                                                        const updated = [...(masterBadgesList || []), val]
                                                        setMasterBadgesList(updated)
                                                        setSelectedModalBadge(val)
                                                        setNewBadgeInput('')
                                                        await saveBadgesToConfig(updated)
                                                    }
                                                }}
                                                className="px-4 py-2 bg-[#7A3E4A] hover:bg-[#5A2E34] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                                            >
                                                + Adicionar
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className={labelCls}>Seção da Loja</label>
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap gap-2 bg-[#FAF9F5] p-3 rounded-xl border border-[#EEEEEE]">
                                            {(sections || []).map(sec => {
                                                const isSelected = selectedModalSection === sec.id
                                                const isDefault = ['best-sellers', 'featured', 'new-collection'].includes(sec.id)
                                                return (
                                                    <div key={sec.id} className="flex items-center rounded-lg border border-[#EEEEEE] overflow-hidden">
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedModalSection(sec.id)}
                                                            className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                                                                isSelected
                                                                    ? 'bg-[#7A3E4A] text-white'
                                                                    : 'bg-white text-gray-500 hover:bg-gray-50'
                                                            }`}
                                                        >
                                                            {sec.label}
                                                        </button>
                                                        {!isDefault && (
                                                            <>
                                                                <div className="w-px h-4 bg-[#EEEEEE]" />
                                                                <button
                                                                    type="button"
                                                                    title="Remover seção"
                                                                    onClick={() => {
                                                                        const updated = sections.filter(s => s.id !== sec.id)
                                                                        setSections(updated)
                                                                        saveSectionsToConfig(updated)
                                                                        if (selectedModalSection === sec.id) {
                                                                            setSelectedModalSection(updated[0]?.id || 'best-sellers')
                                                                        }
                                                                    }}
                                                                    className="px-2 py-1.5 text-[10px] text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        {/* Add new section */}
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newSectionLabel}
                                                onChange={e => setNewSectionLabel(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault()
                                                        const label = newSectionLabel.trim()
                                                        if (label) {
                                                            const id = label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
                                                            const alreadyExists = sections.some(s => s.id === id || s.label.toLowerCase() === label.toLowerCase())
                                                            if (!alreadyExists) {
                                                                const updated = [...sections, { id, label }]
                                                                setSections(updated)
                                                                saveSectionsToConfig(updated)
                                                                setSelectedModalSection(id)
                                                                setNewSectionLabel('')
                                                            }
                                                        }
                                                    }
                                                }}
                                                placeholder="Nova seção (ex: Promoções) + Enter"
                                                className="flex-1 px-3 py-2 bg-white border border-[#EEEEEE] rounded-xl text-xs outline-none focus:border-[#7A3E4A] focus:ring-2 focus:ring-[#7A3E4A]/10 transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const label = newSectionLabel.trim()
                                                    if (label) {
                                                        const id = label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
                                                        const alreadyExists = sections.some(s => s.id === id || s.label.toLowerCase() === label.toLowerCase())
                                                        if (!alreadyExists) {
                                                            const updated = [...sections, { id, label }]
                                                            setSections(updated)
                                                            saveSectionsToConfig(updated)
                                                            setSelectedModalSection(id)
                                                            setNewSectionLabel('')
                                                        }
                                                    }
                                                }}
                                                className="px-4 py-2 bg-[#7A3E4A] hover:bg-[#5A2E34] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                                            >
                                                + Adicionar
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className={labelCls}>Tamanhos Disponíveis</label>
                                            <span className="text-[10px] text-gray-400 font-normal">Passe o mouse no tamanho e clique no ✕ para excluir da lista</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 bg-[#FAF9F5] p-3 rounded-xl border border-[#EEEEEE] mb-3">
                                            {(masterSizesList || []).map(size => {
                                                const isSelected = selectedModalSizes.includes(size)
                                                return (
                                                    <div key={size} className="relative group">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (isSelected) {
                                                                    setSelectedModalSizes(prev => prev.filter(s => s !== size))
                                                                } else {
                                                                    setSelectedModalSizes(prev => [...prev, size])
                                                                }
                                                            }}
                                                            className={`min-w-9 h-9 px-2.5 text-xs font-bold rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
                                                                isSelected
                                                                    ? 'bg-[#C6A76A] text-white border-[#C6A76A] shadow-xs'
                                                                    : 'bg-white text-gray-400 border-[#EEEEEE] hover:bg-gray-150'
                                                            }`}
                                                        >
                                                            {size}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            title={`Excluir tamanho ${size} da lista mestre`}
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleDeleteMasterSize(size)
                                                            }}
                                                            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full text-[9px] font-black items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs flex"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={newCustomSizeInput}
                                                onChange={(e) => setNewCustomSizeInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault()
                                                        handleAddMasterSize(newCustomSizeInput)
                                                    }
                                                }}
                                                placeholder="Cadastrar novo tamanho (ex: PP, EXG, 52)"
                                                className="flex-1 px-3 py-2 bg-white border border-[#EEEEEE] rounded-xl text-xs focus:border-[#7A3E4A] focus:outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleAddMasterSize(newCustomSizeInput)}
                                                className="px-4 py-2 bg-[#7A3E4A] hover:bg-[#5A2E34] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
                                            >
                                                + Adicionar Tamanho
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelCls}>Cores Disponíveis</label>
                                        <div className="flex flex-wrap gap-1.5 bg-[#FAF9F5] p-3 rounded-xl border border-[#EEEEEE]">
                                            {(colorsList || []).map(color => {
                                                const isSelected = selectedModalColors.includes(color)
                                                const hex = getColorHex(color)
                                                return (
                                                    <div 
                                                        key={color} 
                                                        className={`inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-xl border text-xs font-bold transition-all ${
                                                            isSelected 
                                                                ? 'bg-[#C6A76A]/10 text-[#C6A76A] border-[#C6A76A]' 
                                                                : 'bg-white text-gray-500 border-[#EEEEEE] hover:border-gray-300'
                                                        }`}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (isSelected) {
                                                                    setSelectedModalColors(prev => prev.filter(c => c !== color))
                                                                } else {
                                                                    setSelectedModalColors(prev => [...prev, color])
                                                                }
                                                            }}
                                                            className="flex items-center gap-1.5 cursor-pointer text-left focus:outline-none"
                                                        >
                                                            <span className="w-3 h-3 rounded-full border border-gray-300/40 shrink-0" style={{ backgroundColor: hex }} />
                                                            <span>{color}</span>
                                                        </button>
                                                        <span className="w-[1px] h-3 bg-gray-200 mx-1 shrink-0" />
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleDeleteGlobalColor(color)
                                                            }}
                                                            className="w-4 h-4 rounded-md hover:bg-red-50 hover:text-red-500 text-gray-400 flex items-center justify-center text-[9px] cursor-pointer transition-colors"
                                                            title="Excluir Cor Globalmente"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                )
                                            })}
                                        </div>

                                    {/* Inseridor de Nova Cor */}
                                    <div className="flex gap-2 items-center mt-2 bg-white p-2.5 rounded-xl border border-[#EEEEEE]">
                                        <input 
                                            type="text" 
                                            value={newColorName}
                                            onChange={e => setNewColorName(e.target.value)}
                                            placeholder="Nova Cor (Ex: Azul Serenity)" 
                                            className={`${inputCls} !py-2 !px-3 text-xs flex-grow`}
                                        />
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">Tom:</label>
                                            <input 
                                                type="color" 
                                                value={newColorHex}
                                                onChange={e => setNewColorHex(e.target.value)}
                                                className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                                            />
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={async () => {
                                                const typed = newColorName.trim()
                                                if (typed) {
                                                    const existing = findCanonicalColor(typed, colorsList)
                                                    const alreadyExists = colorsList.some(c => c.trim().toLowerCase() === typed.toLowerCase())
                                                    const name = alreadyExists ? existing : typed

                                                    const updatedMap = { ...colorHexMap, [name]: newColorHex }
                                                    const updatedList = alreadyExists ? colorsList : [...colorsList, name]
                                                    setColorsList(updatedList)
                                                    setColorHexMap(updatedMap)

                                                    if (!selectedModalColors.some(c => c.trim().toLowerCase() === name.toLowerCase())) {
                                                        setSelectedModalColors(prev => [...prev, name])
                                                    }
                                                    setNewColorName('')
                                                    setNewColorHex('#7A3E4A')
                                                    await saveColorsToConfig(updatedList, updatedMap)
                                                }
                                            }}
                                            className="px-3.5 py-2 bg-[#7A3E4A] hover:bg-[#6b3540] text-white text-xs font-black uppercase rounded-lg transition-all cursor-pointer shadow-2xs active:scale-98"
                                        >
                                            + Cor
                                        </button>
                                    </div>
                                </div>

                                {/* Seção de Estoque por Tamanho e Cor (Matriz de Variações) */}
                                {selectedModalSizes.length > 0 && selectedModalColors.length > 0 ? (
                                    <div className="p-4 bg-[#FAF9F5] rounded-xl border border-[#7A3E4A]/30 space-y-3 animate-[fadeIn_200ms_ease-out]">
                                        <div className="flex items-center justify-between border-b border-gray-200/80 pb-2">
                                            <label className="text-xs font-extrabold text-[#7A3E4A] uppercase tracking-wider flex items-center gap-1.5">
                                                <span>📦</span> Estoque por Tamanho e Cor
                                            </label>
                                            <span className="text-[10px] text-gray-500 font-medium">
                                                Defina o estoque exato para cada combinação
                                            </span>
                                        </div>

                                        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                                            {(selectedModalSizes || []).map(size => (
                                                <div key={size} className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs space-y-2">
                                                    <div className="flex items-center gap-2 border-b border-gray-100 pb-1.5">
                                                        <span className="px-2 py-0.5 bg-[#7A3E4A] text-white text-[10px] font-black rounded-md uppercase">
                                                            Tamanho {size}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                                        {(selectedModalColors || []).map(color => {
                                                            const hex = getColorHex(color)
                                                            const key = `${size}_${color}`
                                                            const qty = modalVariantStock[key] !== undefined ? modalVariantStock[key] : ''
                                                            return (
                                                                <div key={key} className="flex items-center justify-between bg-gray-50/80 p-2 rounded-lg border border-gray-200/80">
                                                                    <div className="flex items-center gap-1.5 min-w-0 pr-1">
                                                                        <span className="w-3 h-3 rounded-full border border-gray-300 shrink-0" style={{ backgroundColor: hex }} />
                                                                        <span className="text-[11px] font-bold text-gray-800 truncate">{color}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1 shrink-0">
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            placeholder="0"
                                                                            value={qty}
                                                                            onChange={(e) => {
                                                                                const val = Math.max(0, parseInt(e.target.value) || 0)
                                                                                setModalVariantStock(prev => ({ ...prev, [key]: val }))
                                                                            }}
                                                                            className="w-14 px-1.5 py-0.5 border border-gray-300 rounded-md text-xs font-bold text-center outline-none focus:border-[#7A3E4A] bg-white"
                                                                        />
                                                                        <span className="text-[9px] text-gray-400 font-semibold">un.</span>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-gray-200/60 text-xs">
                                            <span className="text-gray-500 font-medium">Estoque Total Combinado:</span>
                                            <span className="font-extrabold text-[#7A3E4A] text-sm">
                                                {selectedModalSizes.reduce((totalSum, s) => {
                                                    return totalSum + selectedModalColors.reduce((cSum, c) => cSum + (parseInt(modalVariantStock[`${s}_${c}`]) || 0), 0)
                                                }, 0)} unidades
                                            </span>
                                        </div>
                                    </div>
                                ) : selectedModalColors.length > 0 ? (
                                    <div className="p-4 bg-[#FAF9F5] rounded-xl border border-[#C6A76A]/40 space-y-3 animate-[fadeIn_200ms_ease-out]">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                                <span>📦</span> Estoque por Cor do Produto
                                            </label>
                                            <span className="text-[10px] text-gray-500 font-medium">
                                                Defina a quantidade para cada cor
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                            {(selectedModalColors || []).map(color => {
                                                const hex = getColorHex(color)
                                                const qty = modalColorStock[color] !== undefined ? modalColorStock[color] : ''
                                                return (
                                                    <div key={color} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-gray-200 shadow-xs">
                                                        <div className="flex items-center gap-2 min-w-0 pr-2">
                                                            <span className="w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0" style={{ backgroundColor: hex }} />
                                                            <span className="text-xs font-bold text-gray-800 truncate">{color}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                placeholder="0"
                                                                value={qty}
                                                                onChange={(e) => {
                                                                    const val = Math.max(0, parseInt(e.target.value) || 0)
                                                                    setModalColorStock(prev => ({ ...prev, [color]: val }))
                                                                }}
                                                                className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-xs font-bold text-center outline-none focus:border-[#7A3E4A] bg-gray-50/50"
                                                            />
                                                            <span className="text-[10px] text-gray-400 font-semibold">un.</span>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-gray-200/60 text-xs">
                                            <span className="text-gray-500 font-medium">Estoque Total (Soma das Cores):</span>
                                            <span className="font-extrabold text-[#7A3E4A] text-sm">
                                                {selectedModalColors.reduce((sum, c) => sum + (parseInt(modalColorStock[c]) || 0), 0)} unidades
                                            </span>
                                        </div>
                                    </div>
                                ) : null}

                                {/* Seção de Fotos por Cor (Vincular Imagem à Cor) */}
                                {selectedModalColors.length > 0 && (
                                    <div className="p-4 bg-[#FAF9F5] rounded-xl border border-[#EEEEEE] space-y-3 animate-[fadeIn_200ms_ease-out]">
                                        <div>
                                            <label className="text-xs font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                                <span>📸</span> Imagem por Cor (Mudar foto ao clicar na cor)
                                            </label>
                                            <p className="text-[11px] text-gray-500 mt-0.5 font-medium">
                                                Selecione qual foto do produto deve aparecer na tela quando a cliente clicar em cada cor.
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            {(selectedModalColors || []).map(color => {
                                                const hex = getColorHex(color)
                                                const assignedImg = modalColorImages[color] || ''
                                                const availablePhotos = existingImages

                                                return (
                                                    <div key={color} className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <span className="w-4 h-4 rounded-full border border-gray-300 shrink-0" style={{ backgroundColor: hex }} />
                                                            <span className="text-xs font-bold text-gray-800">{color}</span>
                                                            {assignedImg && (
                                                                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                                                                    Foto Vinculada
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            {availablePhotos.length === 0 ? (
                                                                <span className="text-[10px] text-gray-400 italic">Adicione e salve imagens do produto para poder vincular às cores</span>
                                                            ) : (
                                                                availablePhotos.map((photoUrl, pIdx) => {
                                                                    const isSelected = assignedImg === photoUrl
                                                                    return (
                                                                        <button
                                                                            key={pIdx}
                                                                            type="button"
                                                                            title={isSelected ? "Desvincular foto desta cor" : "Vincular esta foto a esta cor"}
                                                                            onClick={() => {
                                                                                setModalColorImages(prev => {
                                                                                    if (isSelected) {
                                                                                        const copy = { ...prev }
                                                                                        delete copy[color]
                                                                                        return copy
                                                                                    } else {
                                                                                        return { ...prev, [color]: photoUrl }
                                                                                    }
                                                                                })
                                                                            }}
                                                                            className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                                                                                isSelected
                                                                                    ? 'border-[#7A3E4A] ring-2 ring-[#7A3E4A]/30 scale-105 shadow-xs'
                                                                                    : 'border-gray-200 opacity-60 hover:opacity-100 hover:border-gray-400'
                                                                            }`}
                                                                        >
                                                                            <img src={getAssetUrl(photoUrl)} alt="" className="w-full h-full object-cover" />
                                                                            {isSelected && (
                                                                                <div className="absolute inset-0 bg-[#7A3E4A]/40 flex items-center justify-center text-white text-sm font-black">
                                                                                    ✓
                                                                                </div>
                                                                            )}
                                                                        </button>
                                                                    )
                                                                })
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="p-4 bg-[#FAF9F5] rounded-xl border border-[#EEEEEE] space-y-4">
                                    <label className="flex items-center gap-2.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="pInPromoCombo"
                                            defaultChecked={editingProduct?.inPromoCombo || false}
                                            className="w-4 h-4 text-[#7A3E4A] focus:ring-[#7A3E4A] border-gray-300 rounded"
                                        />
                                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Destacar no Combo da Home Page</span>
                                    </label>

                                    {/* Configuração de Kits do Produto */}
                                    <label className="flex items-center gap-2.5 cursor-pointer pt-2 border-t border-[#EEEEEE] border-dashed">
                                        <input
                                            type="checkbox"
                                            checked={hasKits}
                                            onChange={e => {
                                                const checked = e.target.checked
                                                setHasKits(checked)
                                                if (checked && kitOptions.length === 0) {
                                                    setKitOptions([
                                                        { name: 'Kit com 5', qty: 5, price: 0 },
                                                        { name: 'Kit com 10', qty: 10, price: 0 }
                                                    ])
                                                }
                                            }}
                                            className="w-4 h-4 text-[#7A3E4A] focus:ring-[#7A3E4A] border-gray-300 rounded"
                                        />
                                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Ativar Modalidade Kit</span>
                                    </label>

                                    {hasKits && (
                                        <div className="space-y-3 p-3 rounded-xl border border-pink-100 bg-[#FAF9F5] animate-[fadeIn_200ms_ease-out]">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-bold text-[#7A3E4A] uppercase tracking-wider">Opções de Kits Disponíveis</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setKitOptions(prev => [...prev, { name: `Kit com ${prev.length > 0 ? (prev[prev.length - 1].qty || 5) + 5 : 5}`, qty: prev.length > 0 ? (prev[prev.length - 1].qty || 5) + 5 : 5, price: 0 }])}
                                                    className="text-xs text-[#7A3E4A] font-bold underline cursor-pointer hover:opacity-80"
                                                >
                                                    + Adicionar Kit
                                                </button>
                                            </div>
                                            {(kitOptions || []).map((kit, index) => {
                                                const unitPrice = (kit.price && kit.qty) ? (parseFloat(kit.price) / parseInt(kit.qty)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'
                                                return (
                                                    <div key={index} className="flex items-end gap-2 bg-white p-3 rounded-xl border border-gray-200 shadow-xs">
                                                        <div className="flex-1 grid grid-cols-3 gap-2">
                                                            <div>
                                                                <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1 whitespace-nowrap truncate">Nome do Kit</label>
                                                                <input
                                                                    type="text"
                                                                    value={kit.name || ''}
                                                                    onChange={e => {
                                                                        const val = e.target.value
                                                                        setKitOptions(prev => prev.map((k, i) => i === index ? { ...k, name: val } : k))
                                                                    }}
                                                                    className="w-full text-xs p-2 border border-gray-300 rounded-lg font-medium outline-none focus:border-[#7A3E4A]"
                                                                    placeholder="Ex: Kit com 5"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1 whitespace-nowrap truncate">Qtd. Itens</label>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={kit.qty || ''}
                                                                    onChange={e => {
                                                                        const val = parseInt(e.target.value) || 1
                                                                        setKitOptions(prev => prev.map((k, i) => i === index ? { ...k, qty: val } : k))
                                                                    }}
                                                                    className="w-full text-xs p-2 border border-gray-300 rounded-lg font-medium outline-none focus:border-[#7A3E4A]"
                                                                    placeholder="5"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1 whitespace-nowrap truncate" title="Preço Total do Kit (R$)">Preço Total (R$)</label>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    value={kit.price !== undefined ? kit.price : ''}
                                                                    onChange={e => {
                                                                        const val = parseFloat(e.target.value) || 0
                                                                        setKitOptions(prev => prev.map((k, i) => i === index ? { ...k, price: val } : k))
                                                                    }}
                                                                    className="w-full text-xs p-2 border border-gray-300 rounded-lg font-bold text-[#7A3E4A] outline-none focus:border-[#7A3E4A]"
                                                                    placeholder="199.90"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 shrink-0 pb-0.5">
                                                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-1.5 rounded-lg border border-emerald-200 whitespace-nowrap">
                                                                R$ {unitPrice} / un
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => setKitOptions(prev => prev.filter((_, i) => i !== index))}
                                                                className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50 text-xs font-bold cursor-pointer"
                                                                title="Remover este Kit"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}

                                    <label className="flex items-center gap-2.5 cursor-pointer pt-2 border-t border-[#EEEEEE] border-dashed">
                                        <input
                                            type="checkbox"
                                            checked={isCustomizable}
                                            onChange={e => setIsCustomizable(e.target.checked)}
                                            className="w-4 h-4 text-[#7A3E4A] focus:ring-[#7A3E4A] border-gray-300 rounded"
                                        />
                                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Ativar Personalização de Nome</span>
                                    </label>

                                    {isCustomizable && (
                                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-dashed border-gray-200 animate-[fadeIn_200ms_ease-out]">
                                            <div>
                                                <label className={labelCls}>Preço SEM Personalização (R$)</label>
                                                <input 
                                                    type="number" 
                                                    name="pCustomPriceWithout" 
                                                    step="0.01" 
                                                    min="0" 
                                                    value={customPriceWithout}
                                                    onChange={e => setCustomPriceWithout(e.target.value)}
                                                    className={inputCls} 
                                                    placeholder="Ex: 18.00"
                                                />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Preço COM Personalização (R$)</label>
                                                <input 
                                                    type="number" 
                                                    name="pCustomPriceWith" 
                                                    step="0.01" 
                                                    min="0" 
                                                    value={customPriceWith}
                                                    onChange={e => setCustomPriceWith(e.target.value)}
                                                    className={inputCls} 
                                                    placeholder="Ex: 18.00"
                                                />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Taxa por Letra (R$)</label>
                                                <input 
                                                    type="number" 
                                                    name="pCustomFeeLetter" 
                                                    step="0.01" 
                                                    min="0" 
                                                    value={customFeeLetter}
                                                    onChange={e => setCustomFeeLetter(e.target.value)}
                                                    className={inputCls} 
                                                />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Taxa por Número (R$)</label>
                                                <input 
                                                    type="number" 
                                                    name="pCustomFeeNumber" 
                                                    step="0.01" 
                                                    min="0" 
                                                    value={customFeeNumber}
                                                    onChange={e => setCustomFeeNumber(e.target.value)}
                                                    className={inputCls} 
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className={labelCls}>Taxa por Emoji/Especial (R$)</label>
                                                <input 
                                                    type="number" 
                                                    name="pCustomFeeEmoji" 
                                                    step="0.01" 
                                                    min="0" 
                                                    value={customFeeEmoji}
                                                    onChange={e => setCustomFeeEmoji(e.target.value)}
                                                    className={inputCls} 
                                                />
                                            </div>
                                            <div className="col-span-2 space-y-3">
                                                <label className={labelCls}>Emojis Disponíveis para Personalização</label>
                                                
                                                <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-xl border border-[#EEEEEE]">
                                                    {(masterEmojisList || []).map(emoji => {
                                                        const isSelected = customizableEmojis.includes(emoji)
                                                        return (
                                                            <div 
                                                                key={emoji} 
                                                                className={`inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-xl border text-sm transition-all ${
                                                                    isSelected 
                                                                        ? 'bg-[#C6A76A]/10 border-[#C6A76A] scale-105 shadow-2xs' 
                                                                        : 'bg-white border-gray-205 hover:border-gray-300'
                                                                }`}
                                                            >
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (isSelected) {
                                                                            setCustomizableEmojis(prev => prev.filter(e => e !== emoji))
                                                                        } else {
                                                                            setCustomizableEmojis(prev => [...prev, emoji])
                                                                        }
                                                                    }}
                                                                    className={`cursor-pointer transition-opacity ${isSelected ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}
                                                                >
                                                                     {emoji}
                                                                </button>
                                                                <span className="w-[1px] h-3 bg-gray-200 mx-1 shrink-0" />
                                                                <button
                                                                    type="button"
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation()
                                                                        setCustomizableEmojis(prev => prev.filter(e => e !== emoji))
                                                                        const updatedList = masterEmojisList.filter(e => e !== emoji)
                                                                        setMasterEmojisList(updatedList)
                                                                        await saveEmojisToConfig(updatedList)
                                                                    }}
                                                                    className="w-4 h-4 rounded-md hover:bg-red-50 hover:text-red-500 text-gray-400 flex items-center justify-center text-[9px] cursor-pointer transition-colors"
                                                                    title="Excluir Emoji"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        )
                                                    })}
                                                </div>

                                                {/* Inseridor de Novo Emoji */}
                                                <div className="flex gap-2">
                                                    <input 
                                                        type="text" 
                                                        value={newEmojiInput}
                                                        onChange={e => setNewEmojiInput(e.target.value.trim())}
                                                        placeholder="Cole ou digite um novo emoji (Ex: 🔥)" 
                                                        className={`${inputCls} max-w-[240px] !py-2 !px-3 text-xs`}
                                                        maxLength={4}
                                                    />
                                                    <button 
                                                        type="button" 
                                                        onClick={async () => {
                                                            const val = newEmojiInput.trim()
                                                            if (val) {
                                                                const updatedList = [...masterEmojisList]
                                                                if (!updatedList.includes(val)) {
                                                                    updatedList.push(val)
                                                                }
                                                                setMasterEmojisList(updatedList)
                                                                if (!customizableEmojis.includes(val)) {
                                                                    setCustomizableEmojis(prev => [...prev, val])
                                                                }
                                                                setNewEmojiInput('')
                                                                await saveEmojisToConfig(updatedList)
                                                            }
                                                        }}
                                                        className="px-4 py-2 bg-[#7A3E4A] hover:bg-[#6b3540] text-white text-xs font-black uppercase rounded-xl transition-all cursor-pointer shadow-2xs active:scale-98 shrink-0"
                                                    >
                                                        + Adicionar
                                                    </button>
                                                </div>

                                                <p className="text-[9px] text-gray-400">Marque os emojis que estarão disponíveis para o cliente escolher ao personalizar este produto. Use o campo acima para adicionar qualquer emoji novo ou excluir os existentes clicando no ✕.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div><label className={labelCls}>Descrição</label><textarea name="pDescription" rows="3" defaultValue={editingProduct?.description || ''} className={`${inputCls} resize-none`} /></div>

                                {/* Image Upload */}
                                <div>
                                    <label className={labelCls}>Imagens do Produto <span className="text-[9px] text-[#C6A76A] lowercase font-normal">(Recomendado: 800x1000px - Proporção 4:5)</span></label>
                                    {existingImages.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {existingImages.map((url, i) => (
                                                <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#EEEEEE]">
                                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                                    <button type="button" onClick={() => setExistingImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-black cursor-pointer shadow-sm">✕</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div
                                        onDragOver={e => { e.preventDefault(); setDragActive(true) }}
                                        onDragLeave={() => setDragActive(false)}
                                        onDrop={e => { e.preventDefault(); setDragActive(false); handleFileSelect(e.dataTransfer.files) }}
                                        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${dragActive ? 'border-[#7A3E4A] bg-[#7A3E4A]/5' : 'border-[#EEEEEE] hover:border-[#7A3E4A]/40 hover:bg-[#FAF9F5]'}`}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <input type="file" ref={fileInputRef} multiple accept="image/*,video/*,.gif,.mp4,.webm,.mov" className="hidden" onChange={e => handleFileSelect(e.target.files)} />
                                        <Icon path="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                        <p className="text-xs font-bold text-gray-400">Arraste mídias ou clique para enviar</p>
                                        <p className="text-[10px] text-gray-300 mt-1">Aceita: Fotos, GIFs e Vídeos (MP4, WebM, MOV)</p>
                                    </div>
                                    {imageFiles.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {imageFiles.map((file, i) => (
                                                <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#EEEEEE]">
                                                    {file.type?.startsWith('video/') ? (
                                                        <video src={URL.createObjectURL(file)} autoPlay loop muted className="w-full h-full object-cover" />
                                                    ) : (
                                                        <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                                                    )}
                                                    <button type="button" onClick={() => setImageFiles(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-black cursor-pointer shadow-sm">✕</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button type="submit" disabled={saving} className="w-full py-4 bg-gradient-to-r from-[#7A3E4A] to-[#9A5060] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:shadow-lg hover:shadow-[#7A3E4A]/30 transition-all disabled:opacity-50 cursor-pointer">
                                    {saving ? 'Salvando...' : 'Salvar Produto'}
                                </button>
                            </form>
                        </div>
                    </>
                )
            })()}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* MODAL: CREATE / EDIT COUPON */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {couponModal && (
                <>
                    <div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm" onClick={() => { setCouponModal(false); setEditingCoupon(null); }} />
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[95] bg-white rounded-2xl shadow-2xl max-w-sm w-[calc(100%-2rem)]">
                        <div className="flex items-center justify-between p-5 border-b border-[#EEEEEE]">
                            <h2 className="text-sm font-black text-gray-900">{editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}</h2>
                            <button onClick={() => { setCouponModal(false); setEditingCoupon(null); }} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center cursor-pointer transition-colors">
                                <Icon path="M6 18L18 6M6 6l12 12" className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateCoupon} className="p-5 space-y-4">
                            <div><label className={labelCls}>Código do Cupom</label><input type="text" required placeholder="Ex: MERAKI15" value={couponForm.code} onChange={e => setCouponForm(prev => ({ ...prev, code: e.target.value }))} className={`${inputCls} uppercase tracking-widest font-black`} /></div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelCls}>Tipo</label>
                                    <select value={couponForm.type} onChange={e => setCouponForm(prev => ({ ...prev, type: e.target.value }))} className={inputCls}>
                                        <option value="percentage">Porcentagem (%)</option>
                                        <option value="fixed">Fixo (R$)</option>
                                    </select>
                                </div>
                                <div><label className={labelCls}>Valor</label><input type="number" required placeholder="15" value={couponForm.value} onChange={e => setCouponForm(prev => ({ ...prev, value: e.target.value }))} className={inputCls} /></div>
                            </div>
                            <div><label className={labelCls}>Mínimo de Compra (R$)</label><input type="number" placeholder="100" value={couponForm.minPurchase} onChange={e => setCouponForm(prev => ({ ...prev, minPurchase: e.target.value }))} className={inputCls} /></div>
                            <button type="submit" className="w-full py-4 bg-gradient-to-r from-[#7A3E4A] to-[#9A5060] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:shadow-lg hover:shadow-[#7A3E4A]/30 transition-all cursor-pointer">
                                {editingCoupon ? 'Salvar Alterações' : 'Criar Cupom'}
                            </button>
                        </form>
                    </div>
                </>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* MODAL: ADD BANNER */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {bannerModal && (
                <>
                    <div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm" onClick={() => { setBannerModal(false); setEditingBannerId(null) }} />
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[95] bg-white rounded-2xl shadow-2xl max-w-sm w-[calc(100%-2rem)]">
                        <div className="flex items-center justify-between p-5 border-b border-[#EEEEEE]">
                            <h2 className="text-sm font-black text-gray-900">{editingBannerId ? 'Editar Banner' : 'Adicionar Banner'}</h2>
                            <button onClick={() => { setBannerModal(false); setEditingBannerId(null) }} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center cursor-pointer transition-colors">
                                <Icon path="M6 18L18 6M6 6l12 12" className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateBanner} className="p-5 space-y-4">
                            <div>
                                <label className={labelCls}>Upload de Mídia Desktop (Foto, GIF ou Vídeo) <span className="text-[9px] text-[#C6A76A] lowercase font-normal">(MP4, WebM, JPG, PNG, GIF)</span></label>
                                <input type="file" accept="image/*,video/*,.gif,.mp4,.webm,.mov" onChange={e => {
                                     if (e.target.files?.[0]) setBannerImageFiles([e.target.files[0]])
                                }} className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#7A3E4A]/10 file:text-[#7A3E4A] hover:file:bg-[#7A3E4A]/20 cursor-pointer" />
                            </div>
                            <div><label className={labelCls}>Ou Link de Mídia Desktop</label><input type="text" placeholder="https://..." value={bannerForm.image} onChange={e => setBannerForm(prev => ({ ...prev, image: e.target.value }))} className={inputCls} /></div>
                            
                            <div className="border-t border-dashed border-[#EEEEEE] pt-3">
                                <label className={labelCls}>Upload de Mídia Mobile (Foto, GIF ou Vídeo) <span className="text-[9px] text-[#C6A76A] lowercase font-normal">(MP4, WebM, JPG, PNG, GIF)</span></label>
                                <input type="file" accept="image/*,video/*,.gif,.mp4,.webm,.mov" onChange={e => {
                                     if (e.target.files?.[0]) setBannerMobileImageFiles([e.target.files[0]])
                                }} className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#7A3E4A]/10 file:text-[#7A3E4A] hover:file:bg-[#7A3E4A]/20 cursor-pointer" />
                            </div>
                            <div><label className={labelCls}>Ou Link de Mídia Mobile</label><input type="text" placeholder="https://..." value={bannerForm.mobile_image} onChange={e => setBannerForm(prev => ({ ...prev, mobile_image: e.target.value }))} className={inputCls} /></div>
                            
                            <div><label className={labelCls}>Texto Alternativo (Alt)</label><input type="text" placeholder="Ex: Nova Coleção" value={bannerForm.alt} onChange={e => setBannerForm(prev => ({ ...prev, alt: e.target.value }))} className={inputCls} /></div>
                            <div><label className={labelCls}>Link de Destino</label><input type="text" value={bannerForm.link} onChange={e => setBannerForm(prev => ({ ...prev, link: e.target.value }))} className={inputCls} /></div>
                            <button type="submit" disabled={saving} className="w-full py-4 bg-gradient-to-r from-[#7A3E4A] to-[#9A5060] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:shadow-lg hover:shadow-[#7A3E4A]/30 transition-all cursor-pointer disabled:opacity-50">
                                {saving ? 'Salvando...' : (editingBannerId ? 'Salvar Alterações' : 'Adicionar Banner')}
                            </button>
                        </form>
                    </div>
                </>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* MODAL: RETURN MANAGEMENT */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {selectedReturn && (
                <>
                    <div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm" onClick={() => setSelectedReturn(null)} />
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[95] bg-white rounded-2xl shadow-2xl max-w-sm w-[calc(100%-2rem)]">
                        <div className="flex items-center justify-between p-5 border-b border-[#EEEEEE]">
                            <h2 className="text-sm font-black text-gray-900">Gerenciar Troca</h2>
                            <button onClick={() => setSelectedReturn(null)} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center cursor-pointer transition-colors">
                                <Icon path="M6 18L18 6M6 6l12 12" className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="p-4 bg-[#FAF9F5] rounded-xl space-y-2 text-xs">
                                <div className="flex justify-between"><span className="font-bold text-gray-400">Protocolo</span><span className="font-mono text-gray-700 text-[10px]">{selectedReturn.id}</span></div>
                                <div className="flex justify-between"><span className="font-bold text-gray-400">Cliente</span><span className="text-gray-700">{selectedReturn.customerEmail}</span></div>
                                <div className="flex justify-between"><span className="font-bold text-gray-400">Pedido</span><span className="text-gray-700">{selectedReturn.orderId}</span></div>
                                <div className="flex justify-between"><span className="font-bold text-gray-400">Tipo</span><span className="font-bold text-sky-500">Troca</span></div>
                                {selectedReturn.reason && <div className="border-t border-[#EEEEEE] pt-2"><span className="font-bold text-gray-400 block mb-1">Motivo</span><p className="text-gray-600 italic">"{selectedReturn.reason}"</p></div>}
                            </div>

                            <div>
                                <label className={labelCls}>Status da Solicitação</label>
                                <select value={selectedReturn.status} onChange={e => handleUpdateReturn(selectedReturn.customerEmail, selectedReturn.id, { status: e.target.value })} className={inputCls}>
                                    <option value="Autorizado (Aguardando Postagem)">Autorizado (Aguardando Postagem)</option>
                                    <option value="Produto Recebido (Em Análise)">Produto Recebido (Em Análise)</option>
                                    <option value="Concluído (Cupom/Estorno Gerado)">Concluído (Cupom/Estorno Gerado)</option>
                                    <option value="Recusado">Recusado</option>
                                </select>
                            </div>

                            <div>
                                <label className={labelCls}>Código de Postagem Reversa</label>
                                <input
                                    type="text"
                                    placeholder="Ex: 982183201"
                                    defaultValue={selectedReturn.postageCode || ''}
                                    onBlur={e => handleUpdateReturn(selectedReturn.customerEmail, selectedReturn.id, { postageCode: e.target.value })}
                                    className={`${inputCls} font-mono uppercase tracking-wider`}
                                />
                                <p className="text-[10px] text-gray-400 mt-1.5 italic">Alterações são salvas automaticamente ao sair do campo.</p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
