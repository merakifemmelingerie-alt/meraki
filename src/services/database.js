import { supabase, supabaseUrl, supabaseAnonKey } from './supabase.js'
import { convertToWebP } from '../utils/assets.js'

export function generateUUID() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID()
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
    })
}

export function isValidUUID(str) {
    if (!str || typeof str !== 'string') return false
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str)
}


// Initialize database schema sync
// Define expected columns for each database table
const TABLE_COLUMNS = {
    orders: [
        'id', 'customername', 'customeremail', 'customerphone', 'customercpf', 'shippingaddress',
        'paymentmethod', 'subtotal', 'shipping', 'discount', 'total', 'coupon', 'status', 'items', 'created_at'
    ],
    coupons: ['id', 'code', 'value', 'type', 'minpurchase', 'created_at'],
    banners: ['id', 'image', 'mobile_image', 'alt', 'link', 'created_at'],
    returns: ['id', 'orderid', 'itemid', 'customeremail', 'type', 'postagecode', 'status', 'created_at'],
    categories: ['id', 'name', 'group', 'subtitle', 'description', 'image', 'created_at'],
    products: [
        'id', 'name', 'category', 'subcategory', 'price', 'original_price', 'cost_price', 'image', 'badge', 'section', 'sizes', 'description', 'stock', 'created_at',
        'colors', 'inpromocombo', 'iscustomizable', 'custompricewith', 'custompricewithout', 'customfeeletter', 'customfeenumber', 'customfeeemoji', 'customizable_emojis',
        'has_kits', 'kit_options', 'color_stock', 'variant_stock', 'color_images'
    ],
    store_config: [
        'id', 'whatsapp', 'sac_phone', 'address', 'cnpj', 'razao_social', 'origin_cep', 'meta_pixel_id', 'ga_tracking_id', 'infinitepay_handle',
        'topbarmessages', 'topbarstyle', 'promocombo', 'editorial', 'available_colors', 'available_emojis', 'shipping_message',
        'available_badges', 'installment_text', 'banner_transition', 'reward_bar', 'category_styles', 'pages_content', 'custom_pages_list', 'deleted_pages', 'categories_data', 'promo_message', 'available_sizes',
        'maintenance_mode', 'maintenance_title', 'maintenance_message', 'maintenance_eta'
    ],
    reviews: ['id', 'product_id', 'name', 'rating', 'comment', 'verified', 'created_at']
}

// Maps database columns to alternative frontend keys
const FIELD_MAPPING = {
    customername: ['customerName', 'customername'],
    customeremail: ['customerEmail', 'customeremail'],
    customerphone: ['customerPhone', 'customerphone'],
    customercpf: ['customerCpf', 'customercpf'],
    shippingaddress: ['shippingAddress', 'shippingaddress'],
    paymentmethod: ['paymentMethod', 'paymentmethod'],
    minpurchase: ['minPurchase', 'minpurchase'],
    orderid: ['orderId', 'orderid'],
    itemid: ['itemId', 'itemid'],
    postagecode: ['postageCode', 'postagecode'],
    inpromocombo: ['inPromoCombo', 'inpromocombo'],
    iscustomizable: ['isCustomizable', 'iscustomizable'],
    custompricewith: ['customPriceWith', 'custompricewith'],
    custompricewithout: ['customPriceWithout', 'custompricewithout'],
    customfeeletter: ['customFeeLetter', 'customfeeletter'],
    customfeenumber: ['customFeeNumber', 'customfeenumber'],
    customfeeemoji: ['customFeeEmoji', 'customfeeemoji'],
    customizable_emojis: ['customizableEmojis', 'customizable_emojis'],
    has_kits: ['hasKits', 'has_kits', 'haskits'],
    kit_options: ['kitOptions', 'kit_options', 'kitoptions'],
    color_stock: ['colorStock', 'color_stock', 'colorstock'],
    color_images: ['colorImages', 'color_images', 'colorimages'],
    topbarmessages: ['topbarMessages', 'topbarmessages'],
    topbarstyle: ['topbarStyle', 'topbarstyle'],
    promocombo: ['promoCombo', 'promocombo'],
    editorial: ['editorial', 'editorial'],
    available_colors: ['availableColors', 'available_colors'],
    available_emojis: ['availableEmojis', 'available_emojis'],
    shipping_message: ['shippingMessage', 'shipping_message'],
    promo_message: ['promoMessage', 'promo_message', 'promomessage'],
    available_sizes: ['availableSizes', 'available_sizes', 'availablesizes'],
    available_badges: ['availableBadges', 'available_badges'],
    installment_text: ['installmentText', 'installment_text'],
    banner_transition: ['bannerTransition', 'banner_transition'],
    pix_key: ['pixKey', 'pix_key', 'pixkey'],
    cost_price: ['costPrice', 'cost_price', 'costprice'],
    maintenance_mode: ['maintenanceMode', 'maintenance_mode', 'maintenancemode'],
    maintenance_title: ['maintenanceTitle', 'maintenance_title', 'maintenancetitle'],
    maintenance_message: ['maintenanceMessage', 'maintenance_message', 'maintenancemessage'],
    maintenance_eta: ['maintenanceEta', 'maintenance_eta', 'maintenanceeta']
}

// Normalize a category value (object or string) to its name string
function normalizeCategoryName(cat) {
    if (!cat) return ''
    if (typeof cat === 'object') return cat.name || ''
    try {
        const parsed = JSON.parse(cat)
        if (parsed && typeof parsed === 'object') return parsed.name || String(cat)
    } catch (_) { /* not JSON */ }
    return String(cat)
}

// Translate database properties back to camelCase for frontend pages
export function mapDbToFrontend(table, item) {
    if (!item) return item
    const mapped = { ...item }
    if (table === 'orders') {
        if (item.customername !== undefined) mapped.customerName = item.customername
        if (item.customeremail !== undefined) mapped.customerEmail = item.customeremail
        if (item.customerphone !== undefined) mapped.customerPhone = item.customerphone
        if (item.customercpf !== undefined) mapped.customerCpf = item.customercpf
        if (item.shippingaddress !== undefined) mapped.shippingAddress = item.shippingaddress
        if (item.paymentmethod !== undefined) mapped.paymentMethod = item.paymentmethod
    } else if (table === 'returns') {
        if (item.orderid !== undefined) mapped.orderId = item.orderid
        if (item.itemid !== undefined) mapped.itemId = item.itemid
        if (item.customeremail !== undefined) mapped.customerEmail = item.customeremail
        if (item.postagecode !== undefined) mapped.postageCode = item.postagecode
    } else if (table === 'coupons') {
        if (item.minpurchase !== undefined) mapped.minPurchase = item.minpurchase
    } else if (table === 'store_config') {
        if (item.pix_key !== undefined) mapped.pix_key = item.pix_key
        if (item.pixkey !== undefined) mapped.pix_key = item.pixkey
        if (item.infinitepay_handle !== undefined) mapped.infinitepay_handle = item.infinitepay_handle
        if (item.infinitepayhandle !== undefined) mapped.infinitepay_handle = item.infinitepayhandle
        mapped.pixKey = mapped.pix_key
    } else if (table === 'products') {
        mapped.category = normalizeCategoryName(item.category)
        if (item.inpromocombo !== undefined) mapped.inPromoCombo = item.inpromocombo
        if (item.iscustomizable !== undefined) mapped.isCustomizable = item.iscustomizable
        if (item.custompricewith !== undefined) mapped.customPriceWith = item.custompricewith
        if (item.custompricewithout !== undefined) mapped.customPriceWithout = item.custompricewithout
        if (item.customfeeletter !== undefined) mapped.customFeeLetter = item.customfeeletter
        if (item.customfeenumber !== undefined) mapped.customFeeNumber = item.customfeenumber
        if (item.customfeeemoji !== undefined) mapped.customFeeEmoji = item.customfeeemoji
        if (item.customizable_emojis !== undefined) mapped.customizableEmojis = item.customizable_emojis
        mapped.hasKits = item.has_kits !== undefined ? Boolean(item.has_kits) : (item.hasKits !== undefined ? Boolean(item.hasKits) : false)
        
        let parsedKits = item.kit_options || item.kitOptions || item.kitoptions
        if (parsedKits && typeof parsedKits === 'string') {
            try {
                parsedKits = JSON.parse(parsedKits)
            } catch {
                parsedKits = []
            }
        }
        mapped.kitOptions = Array.isArray(parsedKits) ? parsedKits : []

        let parsedColorStock = item.color_stock || item.colorStock || item.colorstock
        if (parsedColorStock && typeof parsedColorStock === 'string') {
            try {
                parsedColorStock = JSON.parse(parsedColorStock)
            } catch {
                parsedColorStock = {}
            }
        }
        mapped.colorStock = (parsedColorStock && typeof parsedColorStock === 'object') ? parsedColorStock : {}

        let parsedVariantStock = item.variant_stock || item.variantStock || item.variantstock
        if (parsedVariantStock && typeof parsedVariantStock === 'string') {
            try {
                parsedVariantStock = JSON.parse(parsedVariantStock)
            } catch {
                parsedVariantStock = {}
            }
        }
        mapped.variantStock = (parsedVariantStock && typeof parsedVariantStock === 'object') ? parsedVariantStock : {}

        let parsedColorImages = item.color_images || item.colorImages || item.colorimages
        if (parsedColorImages && typeof parsedColorImages === 'string') {
            try {
                parsedColorImages = JSON.parse(parsedColorImages)
            } catch {
                parsedColorImages = {}
            }
        }
        mapped.colorImages = (parsedColorImages && typeof parsedColorImages === 'object') ? parsedColorImages : {}
        
        // Normaliza colors e sizes do banco de dados (PG text array ou string delimitada por vírgula)
        if (item.colors) {
            if (typeof item.colors === 'string') {
                const clean = item.colors.replace(/[\{\}]/g, '')
                mapped.colors = clean.split(',').map(c => c.trim()).filter(Boolean)
            } else if (Array.isArray(item.colors)) {
                mapped.colors = item.colors.map(c => String(c).trim()).filter(Boolean)
            }
        } else {
            mapped.colors = []
        }

        if (item.sizes) {
            if (typeof item.sizes === 'string') {
                const clean = item.sizes.replace(/[\{\}]/g, '')
                mapped.sizes = clean.split(',').map(s => s.trim()).filter(Boolean)
            } else if (Array.isArray(item.sizes)) {
                mapped.sizes = item.sizes.map(s => String(s).trim()).filter(Boolean)
            }
        } else {
            mapped.sizes = []
        }
    } else if (table === 'store_config') {
        if (item.topbarmessages !== undefined) mapped.topbarMessages = item.topbarmessages
        if (item.topbarMessages !== undefined) mapped.topbarMessages = item.topbarMessages
        if (item.topbarstyle !== undefined) mapped.topbarStyle = item.topbarstyle
        if (item.topbarStyle !== undefined) mapped.topbarStyle = item.topbarStyle
        
        const rawPromo = item.promocombo !== undefined ? item.promocombo : (item.promoCombo !== undefined ? item.promoCombo : item.promo_combo)
        if (rawPromo !== undefined) {
            let parsed = rawPromo
            if (typeof parsed === 'string') {
                try { parsed = JSON.parse(parsed) } catch (e) {}
            }
            mapped.promoCombo = parsed
        }
        
        const rawEditorial = item.editorial
        if (rawEditorial !== undefined) {
            let parsed = rawEditorial
            if (typeof parsed === 'string') {
                try { parsed = JSON.parse(parsed) } catch (e) {}
            }
            mapped.editorial = parsed
        }
        
        if (item.available_colors !== undefined) mapped.availableColors = item.available_colors
        if (item.availableColors !== undefined) mapped.availableColors = item.availableColors
        if (item.available_emojis !== undefined) mapped.availableEmojis = item.available_emojis
        if (item.availableEmojis !== undefined) mapped.availableEmojis = item.availableEmojis
        if (item.shipping_message !== undefined) mapped.shippingMessage = item.shipping_message
        if (item.shippingMessage !== undefined) mapped.shippingMessage = item.shippingMessage
        if (item.promo_message !== undefined) mapped.promoMessage = item.promo_message
        if (item.promoMessage !== undefined) mapped.promoMessage = item.promoMessage
        if (item.promomessage !== undefined) mapped.promoMessage = item.promomessage
        if (item.available_badges !== undefined) mapped.availableBadges = item.available_badges
        if (item.availableBadges !== undefined) mapped.availableBadges = item.availableBadges
        if (item.available_sizes !== undefined) mapped.availableSizes = item.available_sizes
        if (item.availableSizes !== undefined) mapped.availableSizes = item.availableSizes
        if (item.availablesizes !== undefined) mapped.availableSizes = item.availablesizes
        if (item.installment_text !== undefined) mapped.installmentText = item.installment_text
        if (item.installmentText !== undefined) mapped.installmentText = item.installmentText
        if (item.banner_transition !== undefined) mapped.bannerTransition = item.banner_transition
        if (item.bannerTransition !== undefined) mapped.bannerTransition = item.bannerTransition
        if (item.maintenance_mode !== undefined) {
            mapped.maintenance_mode = item.maintenance_mode
            mapped.maintenanceMode = item.maintenance_mode
        }
        if (item.maintenance_title !== undefined) {
            mapped.maintenance_title = item.maintenance_title
            mapped.maintenanceTitle = item.maintenance_title
        }
        if (item.maintenance_message !== undefined) {
            mapped.maintenance_message = item.maintenance_message
            mapped.maintenanceMessage = item.maintenance_message
        }
        if (item.maintenance_eta !== undefined) {
            mapped.maintenance_eta = item.maintenance_eta
            mapped.maintenanceEta = item.maintenance_eta
        }
    }
    return mapped
}

export let isInitialSyncComplete = false
let isSyncing = false

/**
 * Sanitize all known localStorage array keys to remove null/invalid entries.
 * Runs once at startup to fix any previously corrupted data.
 */
function sanitizeLocalStorage() {
    const arrayKeysWithName = ['meraki_categories', 'meraki_products', 'meraki_homepage_categories']
    const plainArrayKeys = ['meraki_orders', 'meraki_coupons', 'meraki_banners', 'meraki_all_returns', 'meraki_cart']

    for (const key of arrayKeysWithName) {
        try {
            const raw = localStorage.getItem(key)
            if (!raw) continue
            const parsed = JSON.parse(raw)
            if (!Array.isArray(parsed)) continue
            const cleaned = parsed.filter(item => item != null && typeof item === 'object' && item.name)
            if (cleaned.length !== parsed.length) {
                localStorage.setItem(key, JSON.stringify(cleaned))
            }
        } catch (_) { /* ignore corrupt JSON */ }
    }

    for (const key of plainArrayKeys) {
        try {
            const raw = localStorage.getItem(key)
            if (!raw) continue
            const parsed = JSON.parse(raw)
            if (!Array.isArray(parsed)) continue
            const cleaned = parsed.filter(item => item != null)
            if (cleaned.length !== parsed.length) {
                localStorage.setItem(key, JSON.stringify(cleaned))
            }
        } catch (_) { /* ignore corrupt JSON */ }
    }
}

// Run sanitization immediately at module load, before any component reads localStorage
sanitizeLocalStorage()

export async function initSupabaseSync() {
    isSyncing = true
    try {
        console.log('🔄 Sincronizando tabelas com o Supabase...')
        
        // 1. Sync Products
        const { data: dbProducts, error: pError } = await supabase.from('products').select('*')
        if (!pError) {
            const cleanProducts = (dbProducts || []).filter(p => p && p.name)
            localStorage.setItem('meraki_products', JSON.stringify(cleanProducts))
        }

        // 2. Sync Orders — always overwrite to clear stale cache
        const { data: dbOrders, error: oError } = await supabase.from('orders').select('*')
        if (!oError) {
            const mappedOrders = (dbOrders || []).map(o => mapDbToFrontend('orders', o)).filter(o => o != null)
            localStorage.setItem('meraki_orders', JSON.stringify(mappedOrders))
        }

        // 3. Sync Coupons — always overwrite to clear stale cache
        const { data: dbCoupons, error: cError } = await supabase.from('coupons').select('*')
        if (!cError) {
            const mappedCoupons = (dbCoupons || []).map(c => mapDbToFrontend('coupons', c)).filter(c => c != null)
            localStorage.setItem('meraki_coupons', JSON.stringify(mappedCoupons))
        }

        // 4. Sync Banners
        const { data: dbBanners, error: bError } = await supabase.from('banners').select('*')
        if (!bError) {
            if (dbBanners && dbBanners.length > 0) {
                localStorage.setItem('meraki_banners', JSON.stringify(dbBanners))
            } else {
                const localBanners = JSON.parse(localStorage.getItem('meraki_banners') || '[]')
                if (localBanners.length > 0) {
                    await syncTableToSupabase('banners', localBanners)
                }
            }
        }

        // 5. Sync Categories — merge DB categories & store_config with local to preserve custom images
        const { data: dbCategories, error: catError } = await supabase.from('categories').select('*')
        const storedConfig = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
        const configCategories = storedConfig.categories_data || storedConfig.categoriesData || []

        if (!catError || configCategories.length > 0) {
            const localCats = JSON.parse(localStorage.getItem('meraki_categories') || '[]')
            const rawDbList = [...(dbCategories || []), ...configCategories]
            const categoryMap = new Map()

            for (const lc of localCats) {
                if (lc && lc.name) {
                    categoryMap.set(lc.name.toLowerCase().trim(), lc)
                }
            }

            for (const dbCat of rawDbList) {
                if (!dbCat || !dbCat.name) continue
                const key = dbCat.name.toLowerCase().trim()
                const existing = categoryMap.get(key)
                
                const dbImageValid = dbCat.image && dbCat.image !== '/placeholder.jpg' && !dbCat.image.includes('placeholder')
                const localImageValid = existing?.image && existing.image !== '/placeholder.jpg' && !existing.image.includes('placeholder')

                categoryMap.set(key, {
                    group: 'Lingerie',
                    description: 'Coleção Meraki',
                    ...existing,
                    ...dbCat,
                    image: dbImageValid ? dbCat.image : (localImageValid ? existing.image : (dbCat.image || existing?.image || '/placeholder.jpg'))
                })
            }

            const mergedCategories = Array.from(categoryMap.values())
            originalSetItem('meraki_categories', JSON.stringify(mergedCategories))
        }

        // 6. Sync Returns — always overwrite to clear stale cache
        const { data: dbReturns, error: rError } = await supabase.from('returns').select('*')
        if (!rError) {
            const mappedReturns = (dbReturns || []).map(r => mapDbToFrontend('returns', r)).filter(r => r != null)
            localStorage.setItem('meraki_all_returns', JSON.stringify(mappedReturns))
        }

        // 7. Sync Store Config
        let dbConfigRaw = null
        try {
            const { data, error: configErr } = await supabase.from('store_config').select('*').limit(1).maybeSingle()
            if (!configErr && data) {
                dbConfigRaw = data
            } else {
                const res = await fetch(`${supabaseUrl}/rest/v1/store_config?select=*&limit=1`, {
                    headers: { 'apikey': supabaseAnonKey }
                })
                if (res.ok) {
                    const list = await res.json()
                    dbConfigRaw = Array.isArray(list) ? list[0] : list
                }
            }
        } catch (e) {
            console.error('Erro ao buscar store_config no sync:', e)
        }
        const dbConfig = dbConfigRaw ? mapDbToFrontend('store_config', dbConfigRaw) : null
        
        if (dbConfig) {
            const existingLocal = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
            const mergedConfig = { ...existingLocal, ...dbConfig }
            if (existingLocal.pix_key) mergedConfig.pix_key = existingLocal.pix_key
            if (existingLocal.pixKey) mergedConfig.pixKey = existingLocal.pixKey

            if (mergedConfig.topbarStyle && mergedConfig.topbarStyle.default_category_image) {
                mergedConfig.default_category_image = mergedConfig.topbarStyle.default_category_image
            }
            localStorage.setItem('meraki_store_config', JSON.stringify(mergedConfig))
            // Extract and sync visual keys to individual localStorage items
            if (Array.isArray(dbConfig.topbarMessages)) {
                originalSetItem('meraki_topbar_messages', JSON.stringify(dbConfig.topbarMessages))
            } else {
                const existingLocalMsgs = localStorage.getItem('meraki_topbar_messages')
                if (existingLocalMsgs) {
                    try {
                        mergedConfig.topbarMessages = JSON.parse(existingLocalMsgs)
                        originalSetItem('meraki_store_config', JSON.stringify(mergedConfig))
                    } catch (e) {}
                }
            }
            if (dbConfig.topbarStyle) {
                localStorage.setItem('meraki_topbar_style', JSON.stringify(dbConfig.topbarStyle))
                window.dispatchEvent(new Event('topbarStyleUpdated'))
                if (dbConfig.topbarStyle.availableSections) {
                    localStorage.setItem('meraki_sections', JSON.stringify(dbConfig.topbarStyle.availableSections))
                }
                const rawHomeCats = dbConfig.topbarStyle.homepageCategories || [
                    { name: 'Home', description: 'Voltar para a página inicial', image: '/assets/categories/cat-conjuntos.webp', link: '/' },
                    { name: 'Categorias', description: 'Navegar pelas nossas coleções', image: '/assets/categories/cat-noite.webp', link: '/category/conjuntos' },
                    { name: 'Política de Troca', description: 'Regras e prazos para trocas de produtos', image: '/assets/categories/cat-sexy.webp', link: '/returns' },
                    { name: 'Ofertas', description: 'Confira nossos produtos com descontos', image: '/assets/categories/cat-plus.webp', link: '/category/ofertas' }
                ]
                const homeCats = Array.isArray(rawHomeCats) ? rawHomeCats.filter(c => c && c.name) : rawHomeCats
                localStorage.setItem('meraki_homepage_categories', JSON.stringify(homeCats))
            }
            if (dbConfig.promoCombo) {
                if (dbConfig.promoCombo.image && dbConfig.promoCombo.image.includes('photo-1616422285623')) {
                    dbConfig.promoCombo.image = '/assets/categories/cat-conjuntos.webp'
                }
                localStorage.setItem('meraki_promo_combo', JSON.stringify(dbConfig.promoCombo))
                window.dispatchEvent(new Event('promoComboUpdated'))
            }
            if (dbConfig.editorial) {
                localStorage.setItem('meraki_editorial', JSON.stringify(dbConfig.editorial))
                window.dispatchEvent(new Event('editorialUpdated'))
            }
            if (dbConfig.shippingMessage) localStorage.setItem('meraki_shipping_message', dbConfig.shippingMessage)
            if (dbConfig.promoMessage) localStorage.setItem('meraki_promo_message', dbConfig.promoMessage)
            if (dbConfig.availableSizes && Array.isArray(dbConfig.availableSizes)) localStorage.setItem('meraki_available_sizes', JSON.stringify(dbConfig.availableSizes))
            if (dbConfig.availableColors && Array.isArray(dbConfig.availableColors)) localStorage.setItem('meraki_available_colors', JSON.stringify(dbConfig.availableColors))
            if (dbConfig.availableEmojis && Array.isArray(dbConfig.availableEmojis)) localStorage.setItem('meraki_available_emojis', JSON.stringify(dbConfig.availableEmojis))
            if (dbConfig.availableBadges && Array.isArray(dbConfig.availableBadges)) localStorage.setItem('meraki_available_badges', JSON.stringify(dbConfig.availableBadges))
            if (dbConfig.rewardBar) localStorage.setItem('meraki_reward_bar', JSON.stringify(dbConfig.rewardBar))
            if (dbConfig.categoryStyles) localStorage.setItem('meraki_category_styles', JSON.stringify(dbConfig.categoryStyles))
            if (dbConfig.pagesContent) localStorage.setItem('meraki_pages_content', JSON.stringify(dbConfig.pagesContent))
            if (dbConfig.customPagesList) localStorage.setItem('meraki_custom_pages_list', JSON.stringify(dbConfig.customPagesList))
            if (dbConfig.deletedPages) localStorage.setItem('meraki_deleted_pages', JSON.stringify(dbConfig.deletedPages))
            if (dbConfig.categoriesData) localStorage.setItem('meraki_categories_data', JSON.stringify(dbConfig.categoriesData))
            window.dispatchEvent(new Event('storeConfigUpdated'))
        } else {
            const existingLocalMsgs = localStorage.getItem('meraki_topbar_messages')
            let initialMsgs = [
                "✨ Frete Grátis acima de R$ 299 • Parcele em até 12x",
                "Utilize o cupom BEMVIND010 em sua primeira compra!",
                "Ganhe 5% de desconto pagando no PIX!"
            ]
            if (existingLocalMsgs) {
                try { initialMsgs = JSON.parse(existingLocalMsgs) } catch (e) {}
            }

            const defaultConfig = {
                id: 'default',
                whatsapp: '551123880403',
                sac_phone: '(11) 2388-0403',
                address: 'Avenida Alfredo Nasser, Qd. 14, Lt. 05 - Centro, Bonfinópolis - GO, CEP: 75195-000',
                cnpj: '57.484.768/0064-89',
                infinitepay_handle: 'merakimodafeminina2026',
                topbarMessages: initialMsgs,
                topbarStyle: { bgColor: '#5B6E57', textColor: '#FFFFFF' },
                promoCombo: {
                    title: 'Combo Sutiã',
                    subtitle: 'Do P ao EG. Diversos modelos para você escolher.',
                    image: '/assets/categories/cat-conjuntos.webp',
                    price2Items: 139,
                    price3Items: 169,
                    link: '/category/promo-combo',
                    query: 'sutiã',
                    visible: true
                },
                editorial: {
                    label: 'Artesanal & Premium',
                    title: 'A arte de se sentir extraordinária.',
                    description: 'Cada costura, cada detalhe em renda foi pensado para elevar sua confiança e celebrar sua beleza única em todos os momentos.',
                    buttonText: 'Ver Manifesto',
                    buttonLink: '/story',
                    image: '/assets/banners/banner-2.webp'
                },
                shippingMessage: 'Frete grátis para a região Centro-Oeste nas compras acima de R$ 299,90.',
                rewardBar: {
                    enabled: true,
                    target_type: 'value',
                    target_value: 299.99,
                    reward_type: 'frete_gratis',
                    reward_title: 'Frete Grátis',
                    success_message: 'Parabéns! Você ganhou Frete Grátis!'
                }
            }
            localStorage.setItem('meraki_store_config', JSON.stringify(defaultConfig))
            if (!existingLocalMsgs) {
                localStorage.setItem('meraki_topbar_messages', JSON.stringify(defaultConfig.topbarMessages))
            }
            if (!localStorage.getItem('meraki_topbar_style')) {
                localStorage.setItem('meraki_topbar_style', JSON.stringify(defaultConfig.topbarStyle))
            }
            if (!localStorage.getItem('meraki_promo_combo')) {
                localStorage.setItem('meraki_promo_combo', JSON.stringify(defaultConfig.promoCombo))
            }
            if (!localStorage.getItem('meraki_editorial')) {
                localStorage.setItem('meraki_editorial', JSON.stringify(defaultConfig.editorial))
            }
            if (!localStorage.getItem('meraki_shipping_message')) {
                localStorage.setItem('meraki_shipping_message', defaultConfig.shippingMessage)
            }
            if (!localStorage.getItem('meraki_reward_bar')) {
                localStorage.setItem('meraki_reward_bar', JSON.stringify(defaultConfig.rewardBar))
            }
            const defaultHomeCats = [
                { name: 'Home', description: 'Voltar para a página inicial', image: '/assets/categories/cat-conjuntos.webp', link: '/' },
                { name: 'Categorias', description: 'Navegar pelas nossas coleções', image: '/assets/categories/cat-noite.webp', link: '/category/conjuntos' },
                { name: 'Política de Troca', description: 'Regras e prazos para trocas de produtos', image: '/assets/categories/cat-sexy.webp', link: '/returns' },
                { name: 'Ofertas', description: 'Confira nossos produtos com descontos', image: '/assets/categories/cat-plus.webp', link: '/category/ofertas' }
            ]
            if (!localStorage.getItem('meraki_homepage_categories')) {
                localStorage.setItem('meraki_homepage_categories', JSON.stringify(defaultHomeCats))
            }
            // Seed Supabase with defaultConfig so future queries will find the record
            updateStoreConfig(defaultConfig)
        }

        console.log('✅ Sincronização concluída com sucesso.')
        
        // Sanitize all arrays one final time before notifying React components,
        // ensuring no null entries slip through regardless of Supabase data quality.
        sanitizeLocalStorage()

    } catch (e) {
        console.error('⚠️ Falha ao sincronizar dados com Supabase:', e)
    } finally {
        isSyncing = false
        isInitialSyncComplete = true

        // Dispatch global events asynchronously via requestAnimationFrame to allow React to process renders cleanly
        setTimeout(() => {
            requestAnimationFrame(() => {
                window.dispatchEvent(new Event('categoriesUpdated'))
                window.dispatchEvent(new Event('productsUpdated'))
                window.dispatchEvent(new Event('bannersUpdated'))
                window.dispatchEvent(new Event('couponsUpdated'))
                window.dispatchEvent(new Event('ordersUpdated'))
                window.dispatchEvent(new Event('returnsUpdated'))
                window.dispatchEvent(new Event('storeConfigUpdated'))
                window.dispatchEvent(new Event('homepageCategoriesUpdated'))
                window.dispatchEvent(new Event('topbarMessagesUpdated'))
                window.dispatchEvent(new Event('topbarStyleUpdated'))
                window.dispatchEvent(new Event('promoComboUpdated'))
                window.dispatchEvent(new Event('editorialUpdated'))
                window.dispatchEvent(new Event('meraki_db_synced'))
            })
        }, 100)
    }
}

// Start sync immediately
initSupabaseSync()

// Supabase Realtime Listener for store_config table updates across all connected devices
try {
    supabase
        .channel('store_config_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'store_config' }, (payload) => {
            if (payload && payload.new) {
                const mapped = mapDbToFrontend('store_config', payload.new)
                if (mapped.promoCombo) {
                    originalSetItem('meraki_promo_combo', JSON.stringify(mapped.promoCombo))
                    window.dispatchEvent(new Event('promoComboUpdated'))
                }
                if (mapped.editorial) {
                    originalSetItem('meraki_editorial', JSON.stringify(mapped.editorial))
                    window.dispatchEvent(new Event('editorialUpdated'))
                }
                originalSetItem('meraki_store_config', JSON.stringify(mapped))
                window.dispatchEvent(new Event('storeConfigUpdated'))
            }
        })
        .subscribe()
} catch (e) {
    console.warn('Realtime subscription failed:', e)
}

// Intercept LocalStorage writes to sync them back to Supabase
const originalSetItem = localStorage.setItem.bind(localStorage)

localStorage.setItem = function(key, value) {
    // Sanitize known array-with-name keys BEFORE writing to storage
    let sanitizedValue = value
    const nameArrayKeys = ['meraki_categories', 'meraki_products', 'meraki_homepage_categories']
    if (nameArrayKeys.includes(key)) {
        try {
            const parsed = JSON.parse(value)
            if (Array.isArray(parsed)) {
                const cleaned = parsed.filter(item => item != null && typeof item === 'object' && item.name)
                sanitizedValue = JSON.stringify(cleaned)
            }
        } catch (_) { /* leave as-is if not JSON */ }
    }
    originalSetItem(key, sanitizedValue)
    
    if (isSyncing) return
    
    // Asynchronously push updates to Supabase
    try {
        const parsed = JSON.parse(value)
        if (key === 'meraki_products') {
            syncTableToSupabase('products', parsed)
        } else if (key === 'meraki_orders') {
            syncTableToSupabase('orders', parsed)
        } else if (key === 'meraki_coupons') {
            syncTableToSupabase('coupons', parsed)
        } else if (key === 'meraki_banners') {
            syncTableToSupabase('banners', parsed)
        } else if (key === 'meraki_categories') {
            const categoriesWithDefaults = parsed.map(cat => ({
                group: 'Geral',
                ...cat,
            }))
            syncTableToSupabase('categories', categoriesWithDefaults)
        } else if (key.startsWith('meraki_returns_')) {
            const email = key.replace('meraki_returns_', '')
            const returnsWithEmail = parsed.map(ret => ({ ...ret, customerEmail: email }))
            syncTableToSupabase('returns', returnsWithEmail)
        } else if (key === 'meraki_store_config') {
            updateStoreConfig(parsed).then(() => {
                window.dispatchEvent(new Event('storeConfigUpdated'))
            })
        } else if (
            key === 'meraki_topbar_messages' ||
            key === 'meraki_topbar_style' ||
            key === 'meraki_sections' ||
            key === 'meraki_homepage_categories' ||
            key === 'meraki_promo_combo' ||
            key === 'meraki_editorial' ||
            key === 'meraki_shipping_message' ||
            key === 'meraki_promo_message' ||
            key === 'meraki_available_sizes' ||
            key === 'meraki_available_colors' ||
            key === 'meraki_available_emojis' ||
            key === 'meraki_available_badges' ||
            key === 'meraki_reward_bar' ||
            key === 'meraki_category_styles' ||
            key === 'meraki_pages_content' ||
            key === 'meraki_custom_pages_list' ||
            key === 'meraki_deleted_pages' ||
            key === 'meraki_categories_data'
        ) {
            // Helper to sync subcomponents configs directly inside store_config record
            const currentConfig = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
            
            if (key === 'meraki_topbar_messages') currentConfig.topbarMessages = parsed
            else if (key === 'meraki_topbar_style') currentConfig.topbarStyle = parsed
            else if (key === 'meraki_sections') {
                currentConfig.topbarStyle = currentConfig.topbarStyle || {}
                currentConfig.topbarStyle.availableSections = parsed
            }
            else if (key === 'meraki_homepage_categories') {
                currentConfig.topbarStyle = currentConfig.topbarStyle || {}
                currentConfig.topbarStyle.homepageCategories = parsed
            }
            else if (key === 'meraki_promo_combo') currentConfig.promoCombo = parsed
            else if (key === 'meraki_editorial') currentConfig.editorial = parsed
            else if (key === 'meraki_shipping_message') currentConfig.shippingMessage = parsed
            else if (key === 'meraki_promo_message') currentConfig.promoMessage = parsed
            else if (key === 'meraki_available_sizes') currentConfig.availableSizes = parsed
            else if (key === 'meraki_available_colors') currentConfig.availableColors = parsed
            else if (key === 'meraki_available_emojis') currentConfig.availableEmojis = parsed
            else if (key === 'meraki_available_badges') currentConfig.availableBadges = parsed
            else if (key === 'meraki_reward_bar') currentConfig.rewardBar = parsed
            else if (key === 'meraki_category_styles') currentConfig.categoryStyles = parsed
            else if (key === 'meraki_pages_content') currentConfig.pagesContent = parsed
            else if (key === 'meraki_custom_pages_list') currentConfig.customPagesList = parsed
            else if (key === 'meraki_deleted_pages') currentConfig.deletedPages = parsed
            else if (key === 'meraki_categories_data') currentConfig.categoriesData = parsed

            originalSetItem('meraki_store_config', JSON.stringify(currentConfig))
            updateStoreConfig(currentConfig).then(() => {
                window.dispatchEvent(new Event('storeConfigUpdated'))
                if (key === 'meraki_promo_combo') window.dispatchEvent(new Event('promoComboUpdated'))
                if (key === 'meraki_editorial') window.dispatchEvent(new Event('editorialUpdated'))
            })
        }
    } catch (e) {
        // Not JSON or non-sync key
    }
}

function filterPayloadForTable(table, item) {
    const allowedCols = TABLE_COLUMNS[table]
    if (!allowedCols) return item
    const payload = {}
    for (const col of allowedCols) {
        const possibleKeys = FIELD_MAPPING[col] || [col]
        let val = undefined
        for (const key of possibleKeys) {
            if (item[key] !== undefined) {
                val = item[key]
                break
            }
        }
        if (val !== undefined) {
            payload[col] = val
        }
    }

    if (table === 'products') {
        if (payload.image !== undefined) {
            if (typeof payload.image === 'string') {
                payload.image = payload.image.replace(/[\{\}]/g, '').split(',').map(i => i.trim()).filter(Boolean)
            } else if (!Array.isArray(payload.image)) {
                payload.image = payload.image ? [String(payload.image)] : []
            }
        }
        if (payload.sizes !== undefined) {
            if (typeof payload.sizes === 'string') {
                payload.sizes = payload.sizes.replace(/[\{\}]/g, '').split(',').map(s => s.trim()).filter(Boolean)
            } else if (!Array.isArray(payload.sizes)) {
                payload.sizes = []
            }
        }
        if (payload.colors !== undefined) {
            if (typeof payload.colors === 'string') {
                payload.colors = payload.colors.replace(/[\{\}]/g, '').split(',').map(c => c.trim()).filter(Boolean)
            } else if (!Array.isArray(payload.colors)) {
                payload.colors = []
            }
        }
        if (payload.customizable_emojis !== undefined) {
            if (typeof payload.customizable_emojis === 'string') {
                payload.customizable_emojis = payload.customizable_emojis.replace(/[\{\}]/g, '').split(',').map(e => e.trim()).filter(Boolean)
            } else if (!Array.isArray(payload.customizable_emojis)) {
                payload.customizable_emojis = []
            }
        }

        if (payload.price !== undefined) payload.price = parseFloat(payload.price) || 0
        if (payload.original_price !== undefined) payload.original_price = parseFloat(payload.original_price) || 0
        if (payload.custompricewith !== undefined) payload.custompricewith = parseFloat(payload.custompricewith) || 0
        if (payload.custompricewithout !== undefined) payload.custompricewithout = parseFloat(payload.custompricewithout) || 0
        if (payload.customfeeletter !== undefined) payload.customfeeletter = parseFloat(payload.customfeeletter) || 0
        if (payload.customfeenumber !== undefined) payload.customfeenumber = parseFloat(payload.customfeenumber) || 0
        if (payload.customfeeemoji !== undefined) payload.customfeeemoji = parseFloat(payload.customfeeemoji) || 0
        if (payload.stock !== undefined) payload.stock = parseInt(payload.stock) || 0
        if (payload.category !== undefined) payload.category = normalizeCategoryName(payload.category)
    }

    return payload
}

async function syncTableToSupabase(table, items) {
    if (!Array.isArray(items)) return
    // Filter out any null/undefined entries that may have ended up in localStorage
    items = items.filter(item => item != null)
    try {
        const uuidTables = ['banners', 'coupons', 'categories', 'returns', 'products']
        const isUuidTable = uuidTables.includes(table)

        // Clean/fix invalid UUID IDs for local items if this is a UUID table
        let itemsModified = false
        if (isUuidTable) {
            for (const item of items) {
                if (item && item.id && !isValidUUID(item.id)) {
                    item.id = generateUUID()
                    itemsModified = true
                }
            }
        }

        // If local items were updated with valid UUIDs, re-save to localStorage
        if (itemsModified) {
            const keyMap = {
                banners: 'meraki_banners',
                coupons: 'meraki_coupons',
                categories: 'meraki_categories',
                products: 'meraki_products'
            }
            if (keyMap[table]) {
                originalSetItem(keyMap[table], JSON.stringify(items))
            }
        }

        const conflictKey = table === 'categories' ? 'name' : table === 'coupons' ? 'code' : 'id'

        // For local-first array tables, delete items from Supabase that are missing in the new list
        if (table === 'banners' || table === 'coupons' || table === 'categories') {
            const currentKeys = items
                .filter(item => item != null)
                .map(item => item[conflictKey])
                .filter(k => Boolean(k) && (conflictKey !== 'id' || isValidUUID(k)))

            if (currentKeys.length > 0) {
                const inList = `(${currentKeys.map(k => `"${k}"`).join(',')})`
                await supabase.from(table).delete().filter(conflictKey, 'not.in', inList)
            } else {
                if (conflictKey === 'id') {
                    await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
                } else if (conflictKey === 'name') {
                    await supabase.from(table).delete().neq('name', '___impossible_name___')
                } else if (conflictKey === 'code') {
                    await supabase.from(table).delete().neq('code', '___impossible_code___')
                }
            }
        }

        for (const item of items) {
            if (!item) continue
            const payload = filterPayloadForTable(table, item)

            if (isUuidTable) {
                if (!payload.id || !isValidUUID(payload.id)) {
                    payload.id = item.id && isValidUUID(item.id) ? item.id : generateUUID()
                    item.id = payload.id
                }
            } else {
                if (payload.id && (payload.id.length < 10 || !isNaN(payload.id))) {
                    delete payload.id
                }
            }

            let { error } = await supabase.from(table).upsert(payload, { onConflict: conflictKey })
            if (error) {
                if (table === 'products') {
                    const fallbackPayload = { ...payload }
                    delete fallbackPayload.has_kits
                    delete fallbackPayload.kit_options
                    delete fallbackPayload.color_stock
                    delete fallbackPayload.variant_stock
                    const retry = await supabase.from(table).upsert(fallbackPayload, { onConflict: conflictKey })
                    if (retry.error) {
                        console.error(`Erro ao upsertar item na tabela ${table}:`, retry.error.message, fallbackPayload)
                    }
                } else {
                    console.error(`Erro ao upsertar item na tabela ${table}:`, error.message, payload)
                }
            }
        }
    } catch (e) {
        console.error(`Erro ao sincronizar tabela ${table} para o Supabase:`, e)
    }
}

// Helper database functions expected by pages
export async function getProducts() {
    try {
        const { data, error } = await supabase.from('products').select('*')
        if (error) throw error
        const mapped = (data || []).map(p => mapDbToFrontend('products', p))
        return { data: mapped, error: null }
    } catch (e) {
        return { data: [], error: e }
    }
}

export async function getProfiles() {
    try {
        const { data, error } = await supabase.from('profiles').select('*')
        if (error) throw error
        return { data: data || [], error: null }
    } catch (e) {
        return { data: [], error: e }
    }
}

export async function getProductById(id) {
    try {
        const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle()
        if (error) throw error
        return { data: data ? mapDbToFrontend('products', data) : null, error: null }
    } catch (e) {
        return { data: null, error: e }
    }
}

export async function getProductsBySection(section) {
    try {
        const { data, error } = await supabase.from('products').select('*').eq('section', section)
        if (error) throw error
        const mapped = (data || []).map(p => mapDbToFrontend('products', p))
        return { data: mapped, error: null }
    } catch (e) {
        return { data: [], error: e }
    }
}

export async function createProduct(product) {
    try {
        const payload = filterPayloadForTable('products', product)
        let data = null
        let error = null

        const res = await supabase.from('products').insert([payload]).select().single()
        data = res.data
        error = res.error

        if (error) {
            console.warn('⚠️ Supabase createProduct falhou. Tentando payload compatível:', error.message)
            const fallbackPayload = { ...payload }
            delete fallbackPayload.has_kits
            delete fallbackPayload.kit_options
            delete fallbackPayload.color_stock
            delete fallbackPayload.variant_stock
            const retry = await supabase.from('products').insert([fallbackPayload]).select().single()
            if (retry.error) throw retry.error
            data = retry.data
        }
        
        const mapped = mapDbToFrontend('products', data)
        const current = JSON.parse(localStorage.getItem('meraki_products') || '[]')
        current.unshift({ ...mapped, ...product })
        originalSetItem('meraki_products', JSON.stringify(current))

        return { data: mapped, error: null }
    } catch (e) {
        console.error('Erro ao criar produto no Supabase:', e)
        return { data: null, error: e }
    }
}

export async function updateProduct(id, updates) {
    try {
        const payload = filterPayloadForTable('products', updates)
        let data = null
        let error = null

        const res = await supabase.from('products').update(payload).eq('id', id).select().single()
        data = res.data
        error = res.error

        if (error) {
            console.warn('⚠️ Supabase updateProduct falhou. Tentando payload compatível:', error.message)
            const fallbackPayload = { ...payload }
            delete fallbackPayload.has_kits
            delete fallbackPayload.kit_options
            delete fallbackPayload.color_stock
            delete fallbackPayload.variant_stock
            const retry = await supabase.from('products').update(fallbackPayload).eq('id', id).select().single()
            if (retry.error) throw retry.error
            data = retry.data
        }

        const mapped = mapDbToFrontend('products', data)
        const current = JSON.parse(localStorage.getItem('meraki_products') || '[]')
        const idx = current.findIndex(p => p.id === id)
        if (idx !== -1) {
            current[idx] = { ...current[idx], ...updates, ...mapped }
            originalSetItem('meraki_products', JSON.stringify(current))
        }

        return { data: mapped, error: null }
    } catch (e) {
        console.error('Erro ao atualizar produto no Supabase:', e)
        return { data: null, error: e }
    }
}

export async function deleteProduct(id) {
    try {
        const { error } = await supabase.from('products').delete().eq('id', id)
        if (error) throw error

        // Update local cache
        const current = JSON.parse(localStorage.getItem('meraki_products') || '[]')
        const filtered = current.filter(p => p.id !== id)
        originalSetItem('meraki_products', JSON.stringify(filtered))

        return { data: true, error: null }
    } catch (e) {
        return { data: null, error: e }
    }
}

export async function searchProducts(query) {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .or(`name.ilike.%${query}%,category.ilike.%${query}%,description.ilike.%${query}%`)
        if (error) throw error
        return { data: data || [], error: null }
    } catch (e) {
        return { data: [], error: e }
    }
}

// Storage/image uploading with automatic WebP conversion
export async function uploadImage(file) {
    try {
        // Automatically convert any image (JPG, PNG, JPEG) to WebP format in high quality (90%)
        const webpFile = await convertToWebP(file, 0.90)
        
        const isWebP = webpFile.type === 'image/webp'
        const fileExt = isWebP ? 'webp' : (webpFile.name?.split('.').pop() || 'webp')
        const fileName = `products/${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
        
        const { data, error } = await supabase.storage.from('product-images').upload(fileName, webpFile, {
            contentType: webpFile.type || 'image/webp',
            cacheControl: '3600'
        })
        
        if (error) {
            console.error('Supabase upload error:', error.message)
            // Fallback to FileReader Base64 encoding if bucket is not configured
            return new Promise((resolve) => {
                const reader = new FileReader()
                reader.onloadend = () => resolve({ url: reader.result, error: null })
                reader.onerror = (e) => resolve({ url: null, error: e })
                reader.readAsDataURL(webpFile)
            })
        }

        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName)
        return { url: publicUrl, error: null }
    } catch (e) {
        return { url: null, error: e }
    }
}

export async function uploadMultipleImages(files) {
    const results = await Promise.all(files.map(f => uploadImage(f)))
    const urls = results.filter(r => r.url).map(r => r.url)
    const errors = results.filter(r => r.error).map(r => r.error)
    return { urls, errors }
}

export async function deleteImage(url) {
    try {
        if (url.includes('/storage/v1/object/public/product-images/')) {
            const parts = url.split('/storage/v1/object/public/product-images/')
            if (parts.length > 1) {
                const pathInBucket = parts[1]
                await supabase.storage.from('product-images').remove([pathInBucket])
            }
        } else if (url.includes('/storage/v1/object/public/images/')) {
            const fileName = url.split('/').pop()
            await supabase.storage.from('images').remove([fileName])
        }
        return { error: null }
    } catch (e) {
        return { error: e }
    }
}

export async function createCategory(category) {
    try {
        const payload = filterPayloadForTable('categories', category)
        const { data, error } = await supabase.from('categories').insert([payload]).select().single()
        if (error) throw error

        // Update local cache
        const current = JSON.parse(localStorage.getItem('meraki_categories') || '[]')
        current.push(data)
        originalSetItem('meraki_categories', JSON.stringify(current))

        return { data, error: null }
    } catch (e) {
        return { data: null, error: e }
    }
}

export async function updateStoreConfig(config) {
    try {
        const payload = filterPayloadForTable('store_config', config)
        if (!payload.id) payload.id = 'default'

        // 1. Try UPSERT first via Supabase client
        const { data: upsertData, error: upsertError } = await supabase
            .from('store_config')
            .upsert(payload, { onConflict: 'id' })
            .select()
            .maybeSingle()

        if (!upsertError && upsertData) {
            const mapped = mapDbToFrontend('store_config', upsertData)
            const merged = { ...config, ...mapped }
            if (config.pix_key) merged.pix_key = config.pix_key
            if (config.pixKey) merged.pixKey = config.pixKey
            originalSetItem('meraki_store_config', JSON.stringify(merged))
            return { data: merged, error: null }
        }

        // 2. Try UPDATE as secondary attempt
        const { data: updateData, error: updateError } = await supabase
            .from('store_config')
            .update(payload)
            .eq('id', 'default')
            .select()
            .maybeSingle()

        if (!updateError && updateData) {
            const mapped = mapDbToFrontend('store_config', updateData)
            const merged = { ...config, ...mapped }
            if (config.pix_key) merged.pix_key = config.pix_key
            if (config.pixKey) merged.pixKey = config.pixKey
            originalSetItem('meraki_store_config', JSON.stringify(merged))
            return { data: merged, error: null }
        }

        // 3. Fallback: REST API PATCH using anon key if client requests hit RLS / JWT issues
        console.warn('⚠️ Supabase client store_config falhou. Tentando via REST API direta...')
        const res = await fetch(`${supabaseUrl}/rest/v1/store_config?id=eq.default`, {
            method: 'PATCH',
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(payload)
        })

        if (res.ok) {
            const list = await res.json()
            const updated = Array.isArray(list) ? list[0] : list
            if (updated) {
                const mapped = mapDbToFrontend('store_config', updated)
                const merged = { ...config, ...mapped }
                originalSetItem('meraki_store_config', JSON.stringify(merged))
                return { data: merged, error: null }
            }
        }
    } catch (e) {
        console.warn('Erro ao atualizar store_config no Supabase:', e)
    }

    const mapped = mapDbToFrontend('store_config', config)
    const merged = { ...config, ...mapped }
    if (config.pix_key) merged.pix_key = config.pix_key
    if (config.pixKey) merged.pixKey = config.pixKey
    originalSetItem('meraki_store_config', JSON.stringify(merged))
    return { data: merged, error: null }
}

export async function clearProductBadges(badgeList) {
    try {
        const uppercaseList = badgeList.map(b => b.toUpperCase())
        
        // Fetch all products to check their badges
        const { data: products, error: fetchError } = await supabase.from('products').select('id, badge')
        if (fetchError) throw fetchError
        
        const productsToUpdate = (products || []).filter(p => p.badge && !uppercaseList.includes(p.badge.toUpperCase()))
        if (productsToUpdate.length === 0) return { success: true }
        
        const ids = productsToUpdate.map(p => p.id)
        const { error: updateError } = await supabase.from('products').update({ badge: '' }).in('id', ids)
        if (updateError) throw updateError
        
        // Update local cache
        const localProds = JSON.parse(localStorage.getItem('meraki_products') || '[]')
        const updatedLocal = localProds.map(p => {
            if (ids.includes(p.id)) return { ...p, badge: '' }
            return p
        })
        originalSetItem('meraki_products', JSON.stringify(updatedLocal))
        
        return { success: true, updatedIds: ids }
    } catch (e) {
        console.error('Error clearing product badges:', e)
        return { success: false, error: e }
    }
}

// ─── REVIEWS / AVALIAÇÕES DO SUPABASE ────────────────────────────────────────

export async function fetchProductReviews(productId) {
    if (!productId) return { data: [], error: null }
    try {
        const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('product_id', String(productId))
            .order('created_at', { ascending: false })
            
        if (!error && data) {
            localStorage.setItem(`meraki_reviews_${productId}`, JSON.stringify(data))
            return { data, error: null }
        }
    } catch (e) {
        console.warn('Erro ao carregar avaliações do Supabase, usando cache local:', e)
    }

    const cached = JSON.parse(localStorage.getItem(`meraki_reviews_${productId}`) || '[]')
    return { data: cached, error: null }
}

export async function createProductReview({ product_id, name, rating, comment }) {
    const payload = {
        product_id: String(product_id),
        name,
        rating: Number(rating) || 5,
        comment,
        verified: true,
        created_at: new Date().toISOString()
    }

    // Save to local cache immediately
    const cached = JSON.parse(localStorage.getItem(`meraki_reviews_${product_id}`) || '[]')
    const updated = [payload, ...cached]
    localStorage.setItem(`meraki_reviews_${product_id}`, JSON.stringify(updated))

    try {
        const { data, error } = await supabase.from('reviews').insert([payload]).select().single()
        if (!error && data) {
            return { data, error: null }
        }
    } catch (e) {
        console.warn('Erro ao inserir avaliação no Supabase:', e)
    }

    return { data: payload, error: null }
}

// ─── ORDERS / PEDIDOS NO SUPABASE ──────────────────────────────────────────────

export async function createOrderInDb(order) {
    const payload = filterPayloadForTable('orders', {
        id: order.id,
        customername: order.customerName,
        customeremail: order.customerEmail,
        customerphone: order.customerPhone || '',
        customercpf: order.customerCpf || '',
        shippingaddress: order.shippingAddress || {},
        paymentmethod: order.paymentMethod || 'pix',
        subtotal: Number(order.subtotal) || 0,
        shipping: Number(order.shipping) || 0,
        discount: Number(order.discount) || 0,
        total: Number(order.total) || 0,
        coupon: order.coupon || null,
        status: order.status || 'Pendente',
        items: order.items || [],
        created_at: order.created_at || new Date().toISOString()
    })

    // Save to local cache immediately for instant UI responsiveness
    const savedOrders = JSON.parse(localStorage.getItem('meraki_orders') || '[]')
    const filtered = savedOrders.filter(o => o.id !== order.id)
    filtered.unshift(order)
    originalSetItem('meraki_orders', JSON.stringify(filtered))

    try {
        const { data, error } = await supabase.from('orders').insert([payload]).select().single()
        if (!error && data) {
            const mapped = mapDbToFrontend('orders', data)
            const current = JSON.parse(localStorage.getItem('meraki_orders') || '[]')
            const idx = current.findIndex(o => o.id === mapped.id)
            if (idx !== -1) current[idx] = mapped
            else current.unshift(mapped)
            originalSetItem('meraki_orders', JSON.stringify(current))
            return { data: mapped, error: null }
        }
    } catch (e) {
        console.warn('Erro ao inserir pedido no Supabase, mantido em cache local:', e)
    }

    return { data: order, error: null }
}

export async function updateOrderStatusInDb(orderId, status) {
    const savedOrders = JSON.parse(localStorage.getItem('meraki_orders') || '[]')
    const idx = savedOrders.findIndex(o => o.id === orderId)
    if (idx !== -1) {
        savedOrders[idx].status = status
        originalSetItem('meraki_orders', JSON.stringify(savedOrders))
    }

    try {
        const { data, error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', orderId)
            .select()
            .single()

        if (!error && data) {
            const mapped = mapDbToFrontend('orders', data)
            return { data: mapped, error: null }
        }
    } catch (e) {
        console.warn('Erro ao atualizar status do pedido no Supabase:', e)
    }

    return { data: savedOrders[idx] || null, error: null }
}

// ─── RETURNS / TROCAS E DEVOLUÇÕES NO SUPABASE ──────────────────────────────────

export async function createReturnInDb(ret) {
    const payload = filterPayloadForTable('returns', {
        id: ret.id || 'ret-' + Date.now(),
        orderid: ret.orderId || ret.orderid,
        itemid: ret.itemId || ret.itemid || '',
        customeremail: ret.customerEmail || ret.customeremail,
        type: ret.type || 'Troca por Tamanho',
        postagecode: ret.postageCode || ret.postagecode || '',
        status: ret.status || 'Pendente',
        created_at: ret.created_at || new Date().toISOString()
    })

    try {
        const { data, error } = await supabase.from('returns').insert([payload]).select().single()
        if (!error && data) {
            const mapped = mapDbToFrontend('returns', data)
            return { data: mapped, error: null }
        }
    } catch (e) {
        console.warn('Erro ao inserir troca no Supabase:', e)
    }

    return { data: ret, error: null }
}

export async function updateReturnStatusInDb(returnId, status, postageCode = '') {
    try {
        const updates = { status }
        if (postageCode) updates.postagecode = postageCode

        const { data, error } = await supabase
            .from('returns')
            .update(updates)
            .eq('id', returnId)
            .select()
            .single()

        if (!error && data) {
            const mapped = mapDbToFrontend('returns', data)
            return { data: mapped, error: null }
        }
    } catch (e) {
        console.warn('Erro ao atualizar status da troca no Supabase:', e)
    }

    return { data: null, error: null }
}

// ─── FINANCIAL TRANSACTIONS / GESTÃO FINANCEIRA ──────────────────────────────────

export async function getFinancialTransactions() {
    const local = JSON.parse(localStorage.getItem('meraki_financial_transactions') || '[]')
    try {
        const { data, error } = await supabase
            .from('financial_transactions')
            .select('*')
            .order('created_at', { ascending: false })
            
        if (!error && data) {
            localStorage.setItem('meraki_financial_transactions', JSON.stringify(data))
            return { data, error: null }
        }
    } catch (e) {
        console.warn('Erro ao buscar transações financeiras no Supabase:', e)
    }
    return { data: local, error: null }
}

export async function createFinancialTransaction(transaction) {
    const localList = JSON.parse(localStorage.getItem('meraki_financial_transactions') || '[]')
    const newTx = {
        id: transaction.id || generateUUID(),
        type: transaction.type || 'despesa',
        title: transaction.title || 'Lançamento sem título',
        category: transaction.category || 'Outros',
        amount: parseFloat(transaction.amount) || 0,
        due_date: transaction.due_date || new Date().toISOString().split('T')[0],
        payment_date: transaction.payment_date || (transaction.status === 'pago' ? new Date().toISOString().split('T')[0] : null),
        status: transaction.status || 'pago',
        payment_method: transaction.payment_method || 'PIX',
        notes: transaction.notes || '',
        order_id: transaction.order_id || null,
        created_at: new Date().toISOString()
    }

    const updatedList = [newTx, ...localList]
    localStorage.setItem('meraki_financial_transactions', JSON.stringify(updatedList))

    try {
        const { data, error } = await supabase
            .from('financial_transactions')
            .insert([newTx])
            .select()
            .single()

        if (!error && data) {
            return { data, error: null }
        }
    } catch (e) {
        console.warn('Erro ao salvar transação financeira no Supabase:', e)
    }

    return { data: newTx, error: null }
}

export async function updateFinancialTransactionStatus(id, status, payment_date = null) {
    const localList = JSON.parse(localStorage.getItem('meraki_financial_transactions') || '[]')
    const idx = localList.findIndex(t => t.id === id)
    if (idx !== -1) {
        localList[idx].status = status
        if (status === 'pago') {
            localList[idx].payment_date = payment_date || new Date().toISOString().split('T')[0]
        }
        localStorage.setItem('meraki_financial_transactions', JSON.stringify(localList))
    }

    try {
        const payload = { status }
        if (status === 'pago') {
            payload.payment_date = payment_date || new Date().toISOString().split('T')[0]
        }
        const { data, error } = await supabase
            .from('financial_transactions')
            .update(payload)
            .eq('id', id)
            .select()
            .single()

        if (!error && data) {
            return { data, error: null }
        }
    } catch (e) {
        console.warn('Erro ao atualizar status da transação financeira:', e)
    }

    return { data: localList[idx] || null, error: null }
}

export async function deleteFinancialTransaction(id) {
    const localList = JSON.parse(localStorage.getItem('meraki_financial_transactions') || '[]')
    const filtered = localList.filter(t => t.id !== id)
    localStorage.setItem('meraki_financial_transactions', JSON.stringify(filtered))

    try {
        const { error } = await supabase
            .from('financial_transactions')
            .delete()
            .eq('id', id)

        if (!error) return { error: null }
    } catch (e) {
        console.warn('Erro ao excluir transação financeira no Supabase:', e)
    }

    return { error: null }
}

// ─── CUSTO REAL DA VENDA (ORDER REAL COSTS) ──────────────────────────────────

export async function getOrderRealCosts() {
    const local = JSON.parse(localStorage.getItem('meraki_order_real_costs') || '{}')
    try {
        const { data, error } = await supabase
            .from('order_real_costs')
            .select('*')
            
        if (!error && data) {
            const map = {}
            data.forEach(item => { map[item.order_id] = item })
            localStorage.setItem('meraki_order_real_costs', JSON.stringify(map))
            return { data: map, error: null }
        }
    } catch (e) {
        console.warn('Erro ao buscar custos reais de pedidos no Supabase:', e)
    }
    return { data: local, error: null }
}

export async function saveOrderRealCost(costData) {
    const localMap = JSON.parse(localStorage.getItem('meraki_order_real_costs') || '{}')
    localMap[costData.order_id] = costData
    localStorage.setItem('meraki_order_real_costs', JSON.stringify(localMap))

    try {
        const { data, error } = await supabase
            .from('order_real_costs')
            .upsert([costData], { onConflict: 'order_id' })
            .select()
            .single()

        if (!error && data) {
            return { data, error: null }
        }
    } catch (e) {
        console.warn('Erro ao salvar custo real do pedido no Supabase:', e)
    }

    return { data: costData, error: null }
}

// ==============================================================================
// MURAL DE SUGESTÕES, ENQUETES, WISHLIST INTELIGENTE & PEDIDOS DE PRODUTOS
// ==============================================================================

// 1. Sugestões
export async function submitSuggestion(suggestionData) {
    try {
        const payload = {
            customer_name: suggestionData.customer_name || 'Anônima',
            customer_phone: suggestionData.customer_phone || '',
            message: suggestionData.message,
            category: suggestionData.category || 'Geral',
            status: 'pendente',
            created_at: new Date().toISOString()
        }
        const { data, error } = await supabase.from('suggestions').insert([payload]).select().single()
        if (error) throw error
        return { data, error: null }
    } catch (e) {
        console.error('Erro ao enviar sugestão:', e)
        return { data: null, error: e }
    }
}

export async function getSuggestions() {
    try {
        const { data, error } = await supabase.from('suggestions').select('*').order('created_at', { ascending: false })
        if (error) throw error
        return { data: data || [], error: null }
    } catch (e) {
        return { data: [], error: e }
    }
}

export async function updateSuggestionStatus(id, status) {
    try {
        const { data, error } = await supabase.from('suggestions').update({ status }).eq('id', id).select()
        return { data, error }
    } catch (e) {
        return { data: null, error: e }
    }
}

export async function deleteSuggestion(id) {
    try {
        const { error } = await supabase.from('suggestions').delete().eq('id', id)
        return { error }
    } catch (e) {
        return { error: e }
    }
}

// 2. Enquetes (Polls)
export async function getPolls() {
    try {
        const { data, error } = await supabase.from('polls').select('*').order('created_at', { ascending: false })
        if (error) throw error
        return { data: data || [], error: null }
    } catch (e) {
        return { data: [], error: e }
    }
}

export async function createPoll(pollData) {
    try {
        const payload = {
            question: pollData.question,
            options: pollData.options || [],
            allow_custom_text: pollData.allow_custom_text !== false,
            active: true,
            created_at: new Date().toISOString()
        }
        const { data, error } = await supabase.from('polls').insert([payload]).select().single()
        if (error) throw error
        return { data, error: null }
    } catch (e) {
        return { data: null, error: e }
    }
}

export async function togglePollActive(id, active) {
    try {
        const { data, error } = await supabase.from('polls').update({ active }).eq('id', id).select()
        return { data, error }
    } catch (e) {
        return { data: null, error: e }
    }
}

export async function deletePoll(id) {
    try {
        const { error } = await supabase.from('polls').delete().eq('id', id)
        return { error }
    } catch (e) {
        return { error: e }
    }
}

export async function submitPollVote({ poll_id, option_id, custom_text, user_identifier }) {
    try {
        const payload = {
            poll_id,
            option_id: option_id || null,
            custom_text: custom_text || null,
            user_identifier: user_identifier || localStorage.getItem('meraki_user_anon_id') || Math.random().toString(36).substring(2),
            created_at: new Date().toISOString()
        }
        const { data, error } = await supabase.from('poll_votes').insert([payload]).select().single()
        if (error) throw error
        return { data, error: null }
    } catch (e) {
        return { data: null, error: e }
    }
}

export async function getPollVotes(poll_id) {
    try {
        const { data, error } = await supabase.from('poll_votes').select('*').eq('poll_id', poll_id)
        if (error) throw error
        return { data: data || [], error: null }
    } catch (e) {
        return { data: [], error: e }
    }
}

// 3. Lista de Desejos Inteligente Analytics
export async function recordWishlistAction({ product_id, product_name, selected_color, selected_size }) {
    try {
        const payload = {
            product_id: isValidUUID(product_id) ? product_id : null,
            product_name: product_name || 'Produto',
            selected_color: selected_color || null,
            selected_size: selected_size || null,
            created_at: new Date().toISOString()
        }
        await supabase.from('wishlist_items').insert([payload])
    } catch (e) {
        console.warn('Erro ao registrar favorito inteligente:', e)
    }
}

export async function getWishlistAnalytics() {
    try {
        const { data, error } = await supabase.from('wishlist_items').select('*')
        if (error) throw error
        
        const productCounts = {}
        const colorCounts = {}
        const sizeCounts = {}

        (data || []).forEach(item => {
            if (item.product_name) {
                productCounts[item.product_name] = (productCounts[item.product_name] || 0) + 1
            }
            if (item.selected_color) {
                colorCounts[item.selected_color] = (colorCounts[item.selected_color] || 0) + 1
            }
            if (item.selected_size) {
                sizeCounts[item.selected_size] = (sizeCounts[item.selected_size] || 0) + 1
            }
        })

        const topProducts = Object.entries(productCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20)

        const topColors = Object.entries(colorCounts)
            .map(([color, count]) => ({ color, count }))
            .sort((a, b) => b.count - a.count)

        const topSizes = Object.entries(sizeCounts)
            .map(([size, count]) => ({ size, count }))
            .sort((a, b) => b.count - a.count)

        return { data: { topProducts, topColors, topSizes, totalFavorites: (data || []).length }, error: null }
    } catch (e) {
        return { data: { topProducts: [], topColors: [], topSizes: [], totalFavorites: 0 }, error: e }
    }
}

// 4. Pedido de Produtos (Produtos Solicitados)
export async function submitProductRequest(requestData) {
    try {
        let referencePhotoUrl = requestData.reference_photo || null

        if (requestData.photo_file) {
            const uploadRes = await uploadImage(requestData.photo_file)
            if (uploadRes?.url) {
                referencePhotoUrl = uploadRes.url
            }
        }

        const payload = {
            customer_name: requestData.customer_name,
            customer_phone: requestData.customer_phone,
            customer_email: requestData.customer_email || '',
            product_name: requestData.product_name,
            description: requestData.description || '',
            reference_photo: referencePhotoUrl,
            color: requestData.color || '',
            size: requestData.size || '',
            price_range: requestData.price_range || '',
            status: 'pendente',
            created_at: new Date().toISOString()
        }

        const { data, error } = await supabase.from('product_requests').insert([payload]).select().single()
        if (error) throw error
        return { data, error: null }
    } catch (e) {
        console.error('Erro ao enviar solicitação de produto:', e)
        return { data: null, error: e }
    }
}

export async function getProductRequests() {
    try {
        const { data, error } = await supabase.from('product_requests').select('*').order('created_at', { ascending: false })
        if (error) throw error
        return { data: data || [], error: null }
    } catch (e) {
        return { data: [], error: e }
    }
}

export async function updateProductRequestStatus(id, status) {
    try {
        const { data, error } = await supabase.from('product_requests').update({ status }).eq('id', id).select()
        return { data, error }
    } catch (e) {
        return { data: null, error: e }
    }
}

export async function deleteProductRequest(id) {
    try {
        const { error } = await supabase.from('product_requests').delete().eq('id', id)
        return { error }
    } catch (e) {
        return { error: e }
    }
}

// 5. Planejamento Comercial & Gestão de Coleções
export async function getCollectionsPlanning() {
    try {
        const { data, error } = await supabase.from('collections_planning').select('*').order('launch_date', { ascending: true })
        if (error) throw error
        return { data: data || [], error: null }
    } catch (e) {
        console.warn('Erro ao buscar coleções:', e)
        return { data: [], error: e }
    }
}

export async function createCollectionPlanning(collectionData) {
    try {
        const payload = {
            title: collectionData.title,
            commercial_event: collectionData.commercial_event || null,
            status: collectionData.status || 'em_planejamento',
            supplier_deadline: collectionData.supplier_deadline || null,
            photoshoot_deadline: collectionData.photoshoot_deadline || null,
            launch_date: collectionData.launch_date || null,
            target_budget: Number(collectionData.target_budget) || 0,
            notes: collectionData.notes || '',
            created_at: new Date().toISOString()
        }
        const { data, error } = await supabase.from('collections_planning').insert([payload]).select().single()
        if (error) throw error

        // Default tasks auto-creation
        if (data?.id) {
            const defaultTasks = [
                { collection_id: data.id, title: `Fazer pedido ao fornecedor${data.supplier_deadline ? ' até ' + data.supplier_deadline : ''}`, category: 'fornecedor', due_date: data.supplier_deadline },
                { collection_id: data.id, title: `Sessão de fotos e catálogo${data.photoshoot_deadline ? ' até ' + data.photoshoot_deadline : ''}`, category: 'fotos', due_date: data.photoshoot_deadline },
                { collection_id: data.id, title: `Lançar coleção no site${data.launch_date ? ' em ' + data.launch_date : ''}`, category: 'lancamento', due_date: data.launch_date },
                { collection_id: data.id, title: 'Criar campanha no Instagram & WhatsApp', category: 'marketing', due_date: data.launch_date }
            ]
            await supabase.from('collection_tasks').insert(defaultTasks)
        }

        return { data, error: null }
    } catch (e) {
        return { data: null, error: e }
    }
}

export async function updateCollectionPlanning(id, updates) {
    try {
        const { data, error } = await supabase.from('collections_planning').update(updates).eq('id', id).select().single()
        return { data, error }
    } catch (e) {
        return { data: null, error: e }
    }
}

export async function deleteCollectionPlanning(id) {
    try {
        const { error } = await supabase.from('collections_planning').delete().eq('id', id)
        return { error }
    } catch (e) {
        return { error: e }
    }
}

// Tasks per Collection
export async function getCollectionTasks(collection_id) {
    try {
        const { data, error } = await supabase.from('collection_tasks').select('*').eq('collection_id', collection_id).order('created_at', { ascending: true })
        if (error) throw error
        return { data: data || [], error: null }
    } catch (e) {
        return { data: [], error: e }
    }
}

export async function createCollectionTask({ collection_id, title, due_date, category }) {
    try {
        const payload = {
            collection_id,
            title,
            due_date: due_date || null,
            category: category || 'geral',
            completed: false,
            created_at: new Date().toISOString()
        }
        const { data, error } = await supabase.from('collection_tasks').insert([payload]).select().single()
        return { data, error }
    } catch (e) {
        return { data: null, error: e }
    }
}

export async function toggleCollectionTask(id, completed) {
    try {
        const { data, error } = await supabase.from('collection_tasks').update({ completed }).eq('id', id).select().single()
        return { data, error }
    } catch (e) {
        return { data: null, error: e }
    }
}

export async function deleteCollectionTask(id) {
    try {
        const { error } = await supabase.from('collection_tasks').delete().eq('id', id)
        return { error }
    } catch (e) {
        return { error: e }
    }
}

// Commercial Calendar Events
export async function getCommercialCalendar() {
    try {
        const { data, error } = await supabase.from('commercial_calendar').select('*').order('event_date', { ascending: true })
        if (error) throw error
        return { data: data || [], error: null }
    } catch (e) {
        return { data: [], error: e }
    }
}

export async function createCommercialEvent(eventData) {
    try {
        const payload = {
            title: eventData.title,
            event_date: eventData.event_date,
            order_deadline_date: eventData.order_deadline_date || null,
            description: eventData.description || '',
            created_at: new Date().toISOString()
        }
        const { data, error } = await supabase.from('commercial_calendar').insert([payload]).select().single()
        return { data, error }
    } catch (e) {
        return { data: null, error: e }
    }
}

export async function deleteCommercialEvent(id) {
    try {
        const { error } = await supabase.from('commercial_calendar').delete().eq('id', id)
        return { error }
    } catch (e) {
        return { error: e }
    }
}

