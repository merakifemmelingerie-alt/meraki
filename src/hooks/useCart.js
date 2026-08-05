import { useState, useEffect } from 'react'
import { trackAddToCart } from '../components/TrackingManager.jsx'
import { saveAbandonedCart } from '../services/marketing.js'

const CART_KEY = 'meraki_cart'

function loadFromStorage() {
    try {
        const saved = localStorage.getItem(CART_KEY)
        return saved ? JSON.parse(saved) : []
    } catch {
        return []
    }
}

// Global set of hook state setters to synchronize all active useCart instances
const cartListeners = new Set()

export function useCart() {
    const [cart, setCart] = useState(loadFromStorage)

    useEffect(() => {
        const syncListener = (newCart) => {
            setCart(newCart)
        }
        cartListeners.add(syncListener)
        
        // Listen to storage events from other tabs/windows
        const handleStorageChange = (e) => {
            if (e.key === CART_KEY) {
                const updatedCart = loadFromStorage()
                cartListeners.forEach(listener => listener(updatedCart))
            }
        }
        window.addEventListener('storage', handleStorageChange)

        return () => {
            cartListeners.delete(syncListener)
            window.removeEventListener('storage', handleStorageChange)
        }
    }, [])

function updateCartState(newCart) {
    localStorage.setItem(CART_KEY, JSON.stringify(newCart))
    // Dispatch to all listeners in the current tab
    cartListeners.forEach(listener => listener(newCart))
    // Dispatch custom event to notify other components that might listen to window
    window.dispatchEvent(new Event('cart-updated'))
    
    // Salvar silenciosamente no Supabase para automação de carrinho abandonado
    const subtotal = (newCart || []).reduce((acc, item) => acc + (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1), 0)
    saveAbandonedCart({ items: newCart, subtotal }).catch(() => {})
}

    function getMaxStockForItem(product, size, color) {
        if (!product) return Infinity
        const variantStockMap = product.variantStock || product.variant_stock || {}
        const colorStockMap = product.colorStock || product.color_stock || {}

        if (size && color && variantStockMap[`${size}_${color}`] !== undefined) {
            return parseInt(variantStockMap[`${size}_${color}`])
        }
        if (color && colorStockMap[color] !== undefined) {
            return parseInt(colorStockMap[color])
        }
        if (product.stock !== undefined) {
            return parseInt(product.stock)
        }
        return Infinity
    }

    function addToCart(product, size, color = '', customText = '', customPrice = 0, addQty = 1) {
        trackAddToCart(product)
        const currentCart = loadFromStorage()
        const maxStock = getMaxStockForItem(product, size, color)

        const existingIndex = currentCart.findIndex(
            item => item.id === product.id && 
                    item.size === size && 
                    (item.color || '') === (color || '') && 
                    (item.customText || '') === (customText || '') &&
                    Boolean(item.isKit) === Boolean(product.isKit) &&
                    (item.kitName || '') === (product.kitName || '')
        )
        
        let updated
        if (existingIndex >= 0) {
            const currentQty = currentCart[existingIndex].quantity
            const targetQty = Math.min(currentQty + addQty, maxStock)
            if (targetQty <= currentQty && maxStock !== Infinity) {
                window.dispatchEvent(new CustomEvent('cart-stock-warning', { 
                    detail: { message: `Estoque máximo (${maxStock} un.) já atingido no carrinho para esta variação.` }
                }))
                return false
            }
            updated = [...currentCart]
            updated[existingIndex] = {
                ...updated[existingIndex],
                quantity: targetQty,
            }
        } else {
            const initialQty = Math.min(addQty, maxStock)
            if (initialQty <= 0 && maxStock !== Infinity) {
                window.dispatchEvent(new CustomEvent('cart-stock-warning', { 
                    detail: { message: `Desculpe! Produto esgotado para o Tamanho ${size} na cor ${color}.` }
                }))
                return false
            }
            updated = [...currentCart, { ...product, size, color, customText, customPrice, quantity: initialQty }]
        }
        updateCartState(updated)
        return true
    }

    function removeFromCart(productId, size, color = '', customText = '', isKit = false, kitName = '') {
        const currentCart = loadFromStorage()
        const updated = currentCart.filter(item => !(
            item.id === productId && 
            item.size === size && 
            (item.color || '') === (color || '') && 
            (item.customText || '') === (customText || '') &&
            Boolean(item.isKit) === Boolean(isKit) &&
            (item.kitName || '') === (kitName || '')
        ))
        updateCartState(updated)
    }

    function clearCart() {
        updateCartState([])
    }

    function updateQuantity(productId, size, quantity, color = '', customText = '', isKit = false, kitName = '') {
        if (quantity <= 0) {
            removeFromCart(productId, size, color, customText, isKit, kitName)
            return
        }
        const currentCart = loadFromStorage()
        const targetItem = currentCart.find(
            item => item.id === productId && 
                    item.size === size && 
                    (item.color || '') === (color || '') && 
                    (item.customText || '') === (customText || '') &&
                    Boolean(item.isKit) === Boolean(isKit) &&
                    (item.kitName || '') === (kitName || '')
        )

        let targetQty = quantity
        if (targetItem) {
            const maxStock = getMaxStockForItem(targetItem, size, color)
            targetQty = Math.min(quantity, maxStock)
            if (targetQty < quantity && maxStock !== Infinity) {
                window.dispatchEvent(new CustomEvent('cart-stock-warning', { 
                    detail: { message: `Apenas ${maxStock} unidade(s) disponível(is) em estoque para este tamanho/cor.` }
                }))
            }
        }

        const updated = currentCart.map(item => 
            (item.id === productId && 
             item.size === size && 
             (item.color || '') === (color || '') && 
             (item.customText || '') === (customText || '') &&
             Boolean(item.isKit) === Boolean(isKit) &&
             (item.kitName || '') === (kitName || ''))
                ? { ...item, quantity: targetQty }
                : item
        )
        updateCartState(updated)
    }

    const subtotal = cart.reduce((acc, item) => acc + (item.price + (item.customPrice || 0)) * item.quantity, 0)

    // Helper to calculate promotional combo discounts
    const comboDiscount = (() => {
        const promoCombo = (() => {
            try {
                const stored = localStorage.getItem('meraki_promo_combo')
                return stored ? JSON.parse(stored) : null
            } catch { return null }
        })()

        if (!promoCombo || promoCombo.visible === false) return 0

        // Use direct numeric values configured in the Admin Panel
        const price2 = Number(promoCombo.price2Items) || 139
        const price3 = Number(promoCombo.price3Items) || 169

        const promoItems = []
        cart.forEach(item => {
            if (item.inPromoCombo && !item.isKit) {
                for (let i = 0; i < item.quantity; i++) {
                    promoItems.push(item.price)
                }
            }
        })

        if (promoItems.length < 2) return 0

        // Sort descending to bundle higher-priced items first
        promoItems.sort((a, b) => b - a)

        const originalPromoTotal = promoItems.reduce((acc, p) => acc + p, 0)
        let discountedPromoTotal = 0
        const tempItems = [...promoItems]

        // Apply 3-item bundles first, then 2-item bundles, then any remaining at full price
        while (tempItems.length >= 3) {
            tempItems.splice(0, 3)
            discountedPromoTotal += price3
        }

        if (tempItems.length === 2) {
            tempItems.splice(0, 2)
            discountedPromoTotal += price2
        }

        if (tempItems.length === 1) {
            discountedPromoTotal += tempItems[0]
        }

        return Math.max(0, originalPromoTotal - discountedPromoTotal)
    })()

    const total = Math.max(0, subtotal - comboDiscount)
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0)

    return { cart, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, subtotal, comboDiscount, total }
}
