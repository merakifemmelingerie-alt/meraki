import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart.js'
import { useAuth } from '../hooks/useAuth.js'
import { getAssetUrl } from '../utils/assets.js'

import { getUserProfile } from '../services/auth.js'

const readRewardConfig = () => {
    try {
        const storedReward = JSON.parse(localStorage.getItem('meraki_reward_bar') || 'null')
        if (storedReward && typeof storedReward === 'object' && Object.keys(storedReward).length > 0) {
            return {
                enabled: storedReward.enabled !== false,
                target_type: storedReward.target_type || 'value',
                target_value: Number(storedReward.target_value) > 0 ? Number(storedReward.target_value) : 299.99,
                reward_type: storedReward.reward_type || 'frete_gratis',
                reward_title: storedReward.reward_title || 'Frete Grátis',
                success_message: storedReward.success_message || 'Parabéns! Você ganhou Frete Grátis!'
            }
        }

        const storedConfig = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
        const cfg = storedConfig?.rewardBar || storedConfig?.reward_bar
        if (cfg && typeof cfg === 'object' && Object.keys(cfg).length > 0) {
            return {
                enabled: cfg.enabled !== false,
                target_type: cfg.target_type || 'value',
                target_value: Number(cfg.target_value) > 0 ? Number(cfg.target_value) : 299.99,
                reward_type: cfg.reward_type || 'frete_gratis',
                reward_title: cfg.reward_title || 'Frete Grátis',
                success_message: cfg.success_message || 'Parabéns! Você ganhou Frete Grátis!'
            }
        }
    } catch (e) {
        console.error(e)
    }

    return {
        enabled: true,
        target_type: 'value',
        target_value: 299.99,
        reward_type: 'frete_gratis',
        reward_title: 'Frete Grátis',
        success_message: 'Parabéns! Você ganhou Frete Grátis!'
    }
}

export default function CartDrawer() {
    const [isOpen, setIsOpen] = useState(false)
    const { cart, removeFromCart, updateQuantity, cartCount, subtotal, comboDiscount, total } = useCart()
    const { user } = useAuth()
    const navigate = useNavigate()

    // Shipping Calculator State
    const [cepInput, setCepInput] = useState('')
    const [calculatingCep, setCalculatingCep] = useState(false)
    const [shippingOption, setShippingOption] = useState(null)
    const [shippingError, setShippingError] = useState('')
    const [savedAddresses, setSavedAddresses] = useState([])
    const [selectedAddressId, setSelectedAddressId] = useState(null)
    const [rewardBarConfig, setRewardBarConfig] = useState(readRewardConfig)
    const [stockWarning, setStockWarning] = useState('')

    useEffect(() => {
        const handleToggle = (e) => {
            setIsOpen(e.detail?.open !== undefined ? e.detail.open : !isOpen)
        }
        window.addEventListener('toggle-cart', handleToggle)
        return () => window.removeEventListener('toggle-cart', handleToggle)
    }, [isOpen])

    // Load user's saved addresses dynamically from Supabase Database & localStorage
    useEffect(() => {
        const fetchAddresses = async () => {
            if (!user || !user.email) {
                setSavedAddresses([])
                return
            }
            const cleanEmail = user.email.trim().toLowerCase()
            let loadedAddrs = []

            // 1. Fetch fresh profile from Supabase Database
            try {
                const { profile: freshProfile } = await getUserProfile(user.id)
                if (freshProfile && Array.isArray(freshProfile.addresses) && freshProfile.addresses.length > 0) {
                    loadedAddrs = freshProfile.addresses
                }
            } catch (e) {
                console.error(e)
            }

            // 2. Fallback: Check local storage
            if (loadedAddrs.length === 0) {
                try {
                    const specificAddrs = localStorage.getItem(`meraki_user_addresses_${cleanEmail}`)
                    if (specificAddrs) {
                        const parsed = JSON.parse(specificAddrs)
                        if (Array.isArray(parsed)) loadedAddrs = parsed
                    }
                } catch (e) {
                    console.error(e)
                }
            }

            setSavedAddresses(loadedAddrs)
        }

        fetchAddresses()
        window.addEventListener('storage', fetchAddresses)
        window.addEventListener('toggle-cart', fetchAddresses)
        return () => {
            window.removeEventListener('storage', fetchAddresses)
            window.removeEventListener('toggle-cart', fetchAddresses)
        }
    }, [user, isOpen])

    const formatCurrency = (val) => {
        return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    }

    useEffect(() => {
        const handleUpdate = () => {
            setRewardBarConfig(readRewardConfig())
        }
        window.addEventListener('storeConfigUpdated', handleUpdate)
        window.addEventListener('storage', handleUpdate)
        return () => {
            window.removeEventListener('storeConfigUpdated', handleUpdate)
            window.removeEventListener('storage', handleUpdate)
        }
    }, [])

    const isRewardEnabled = rewardBarConfig?.enabled !== false
    const targetType = rewardBarConfig?.target_type || 'value'
    const targetValue = Number(rewardBarConfig?.target_value) > 0 ? Number(rewardBarConfig?.target_value) : 299.99
    const rewardTitle = rewardBarConfig?.reward_title || 'Frete Grátis'
    const successMessage = rewardBarConfig?.success_message || 'Parabéns! Você ganhou Frete Grátis!'

    const currentProgressValue = targetType === 'quantity' ? cartCount : subtotal
    const isCompleted = currentProgressValue >= targetValue
    const progressPercentage = Math.min(100, Math.max(0, (currentProgressValue / targetValue) * 100))
    const remainingValue = Math.max(0, targetValue - currentProgressValue)

    // Check if free shipping reward is activated by progress bar
    const isFreeShippingBonusActive = isRewardEnabled && isCompleted && (
        rewardBarConfig?.reward_type === 'frete_gratis' || 
        rewardTitle.toLowerCase().includes('frete')
    )

    // Calculate freight for a given CEP
    const handleCalculateShipping = async (rawCep, addrLabel = '') => {
        const cleanCep = (rawCep || '').replace(/\D/g, '')
        if (cleanCep.length !== 8) {
            setShippingError('Digite um CEP válido com 8 números.')
            return
        }

        setCalculatingCep(true)
        setShippingError('')

        try {
            const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
            const data = await res.json()

            if (data.erro) {
                setShippingError('CEP não encontrado. Tente novamente.')
                setCalculatingCep(false)
                return
            }

            const city = data.localidade || ''
            const state = data.uf || ''
            const isBonfinopolis = cleanCep.startsWith('75195') || cleanCep.startsWith('75198') || cleanCep.startsWith('75225') || cleanCep.startsWith('7519') || city.toLowerCase().includes('bonfinópolis') || city.toLowerCase().includes('bonfinopolis')

            let calculatedOption = null

            if (isBonfinopolis) {
                const freeLocal = subtotal >= 29.99 || isFreeShippingBonusActive
                calculatedOption = {
                    title: freeLocal ? 'Entrega Grátis (Bonfinópolis-GO)' : 'Entrega Local (Bonfinópolis)',
                    price: freeLocal ? 0 : 9.90,
                    deadline: 'Hoje ou próximo dia útil',
                    cep: cleanCep,
                    city,
                    state,
                    label: addrLabel || 'Bonfinópolis'
                }
            } else if (isFreeShippingBonusActive) {
                calculatedOption = {
                    title: 'PAC Correios — Frete Grátis Bônus! 🎉',
                    price: 0,
                    deadline: '5 a 8 dias úteis',
                    cep: cleanCep,
                    city,
                    state,
                    label: addrLabel
                }
            } else {
                calculatedOption = {
                    title: `PAC Correios (${city}/${state})`,
                    price: 19.90,
                    deadline: '5 a 8 dias úteis',
                    cep: cleanCep,
                    city,
                    state,
                    label: addrLabel
                }
            }

            setShippingOption(calculatedOption)
            localStorage.setItem('meraki_cart_shipping', JSON.stringify(calculatedOption))
        } catch (err) {
            console.error(err)
            setShippingError('Erro ao consultar CEP. Tente novamente.')
        } finally {
            setCalculatingCep(false)
        }
    }

    const shippingCost = shippingOption ? shippingOption.price : 0
    const finalCartTotal = Math.max(0, total + shippingCost)

    useEffect(() => {
        const handleWarning = (e) => {
            if (e.detail?.message) {
                setStockWarning(e.detail.message)
                setTimeout(() => setStockWarning(''), 4000)
            }
        }
        window.addEventListener('cart-stock-warning', handleWarning)
        return () => window.removeEventListener('cart-stock-warning', handleWarning)
    }, [])

    return (
        <div className={`fixed inset-0 z-[150] flex justify-end font-sans transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-xs animate-[fadeIn_200ms_ease-out]"
                onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col z-10 animate-[slideInRight_300ms_cubic-bezier(0.16,1,0.3,1)]">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="font-heading text-lg font-bold text-[#1A1A1A]">Seu Carrinho</h2>
                        <p className="text-xs text-gray-400 font-light">{cartCount} {cartCount === 1 ? 'item' : 'itens'} adicionados</p>
                    </div>
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="p-2 text-gray-400 hover:text-[#1A1A1A] transition-colors rounded-full hover:bg-gray-50 cursor-pointer"
                        aria-label="Fechar carrinho"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Stock Warning Toast */}
                {stockWarning && (
                    <div className="bg-amber-50 border-b border-amber-200 p-3 text-center text-xs font-bold text-amber-800 animate-[fadeIn_150ms_ease-out] flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>{stockWarning}</span>
                    </div>
                )}

                {/* Reward Progress Bar */}
                {isRewardEnabled && (
                    <div className="bg-gradient-to-r from-[#FAF6F0] via-[#FFF9F6] to-[#F7F2EC] px-6 py-4 border-b border-[#EEEEEE]">
                        {isCompleted ? (
                            <div className="flex items-center gap-3 text-[#7A3E4A]">
                                <div className="w-8 h-8 rounded-full bg-[#7A3E4A]/10 flex items-center justify-center shrink-0 animate-bounce">
                                    <span className="text-sm">🎉</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-black tracking-wide text-[#7A3E4A] leading-tight">
                                        {successMessage}
                                    </p>
                                    <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                                        Recompensa ativada no seu pedido!
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center justify-between text-xs mb-2">
                                    <span className="font-semibold text-gray-700 text-[11px] flex items-center gap-1.5">
                                        <svg className="w-4 h-4 text-[#7A3E4A] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        {targetType === 'quantity' ? (
                                            <>Faltam <strong className="text-[#7A3E4A] font-extrabold">{remainingValue} {remainingValue === 1 ? 'item' : 'itens'}</strong> para ganhar <span className="font-extrabold text-[#7A3E4A]">{rewardTitle}</span></>
                                        ) : (
                                            <>Faltam <strong className="text-[#7A3E4A] font-extrabold">{formatCurrency(remainingValue)}</strong> para <span className="font-extrabold text-[#7A3E4A]">{rewardTitle}</span></>
                                        )}
                                    </span>
                                    <span className="text-[10px] font-black text-[#7A3E4A] bg-[#7A3E4A]/10 px-2 py-0.5 rounded-full">
                                        {Math.round(progressPercentage)}%
                                    </span>
                                </div>

                                {/* Progress Track */}
                                <div className="w-full h-3 bg-gray-200/90 rounded-full overflow-hidden p-0.5 border border-gray-300/50 shadow-inner">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-[#7A3E4A] via-[#9A5060] to-[#C6A76A] transition-all duration-500 ease-out shadow-sm"
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {cart.length > 0 ? (
                        cart.filter(item => item && item.id).map((item) => (
                            <div key={`${item.id}-${item.size}-${item.color || ''}-${item.customText || ''}-${item.isKit ? 'kit' : 'norm'}-${item.kitName || ''}`} className="flex gap-4 pb-6 border-b border-gray-50 last:border-0">
                                {/* Thumbnail */}
                                <div className="w-20 h-24 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                                    <img 
                                        src={item.image ? getAssetUrl(Array.isArray(item.image) ? item.image[0] : item.image) : getAssetUrl('/assets/placeholder.jpg')} 
                                        alt={item.name} 
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.src = getAssetUrl('/assets/placeholder.jpg') }}
                                    />
                                </div>

                                {/* Details */}
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between gap-2">
                                            <h3 className="font-heading text-sm font-semibold text-[#1A1A1A] line-clamp-1">
                                                {item.name}
                                            </h3>
                                            <button 
                                                onClick={() => removeFromCart(item.id, item.size, item.color, item.customText, item.isKit, item.kitName)}
                                                className="text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                                                aria-label="Remover item"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-0.5">
                                            <p className="text-xs text-gray-400">Tamanho: <span className="font-bold text-[#1A1A1A] uppercase">{item.size}</span></p>
                                            {item.color && (
                                                <p className="text-xs text-gray-400">Cor: <span className="font-bold text-[#1A1A1A]">{item.color}</span></p>
                                            )}
                                        </div>
                                        {item.isKit && (
                                            <div className="mt-1 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-lg text-[10px] text-emerald-800 font-bold inline-block">
                                                🎁 KIT PROMOCIONAL ({item.kitName || 'Kit'})
                                            </div>
                                        )}
                                        {item.customText && (
                                            <div className="mt-1 bg-[#7A3E4A]/5 border border-[#7A3E4A]/10 px-2.5 py-1 rounded-lg text-[10px] text-[#7A3E4A] font-bold">
                                                Personalização: <span className="text-gray-800 font-semibold">"{item.customText}"</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between mt-2">
                                        {/* Quantity Controls */}
                                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50/50">
                                            <button 
                                                onClick={() => updateQuantity(item.id, item.size, item.quantity - 1, item.color, item.customText, item.isKit, item.kitName)}
                                                className="px-2.5 py-1 text-gray-500 hover:bg-gray-100 transition-colors text-sm cursor-pointer"
                                            >
                                                -
                                            </button>
                                            <span className="px-3 text-xs font-semibold text-gray-700">{item.quantity}</span>
                                            <button 
                                                onClick={() => updateQuantity(item.id, item.size, item.quantity + 1, item.color, item.customText, item.isKit, item.kitName)}
                                                className="px-2.5 py-1 text-gray-500 hover:bg-gray-100 transition-colors text-sm cursor-pointer"
                                            >
                                                +
                                            </button>
                                        </div>
                                        
                                        {/* Price */}
                                        <span className="text-sm font-bold text-[#1A1A1A]">
                                            {formatCurrency((item.price + (item.customPrice || 0)) * item.quantity)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20">
                            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            <h3 className="font-heading text-base font-bold text-gray-700 mb-1">Seu carrinho está vazio</h3>
                            <p className="text-gray-400 text-xs font-light max-w-[200px] mx-auto">Adicione peças da nossa curadoria para iniciar suas compras.</p>
                        </div>
                    )}
                </div>

                {/* Shipping Calculation & Footer Section */}
                {cart.length > 0 && (
                    <div className="p-6 border-t border-gray-100 bg-gray-50/50 space-y-4">
                        
                        {/* Freight Calculation Box */}
                        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                                    <svg className="w-4 h-4 text-[#7A3E4A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                                    </svg>
                                    Opções de Frete / Entrega
                                </span>
                                {shippingOption && (
                                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                                        {shippingOption.isPickup ? 'Retirada na Loja' : `CEP ${shippingOption.cep}`}
                                    </span>
                                )}
                            </div>

                            {/* Store Pickup Quick Option Button */}
                            <button
                                type="button"
                                onClick={() => {
                                    const pickupOpt = {
                                        title: 'Retirada na Loja Física (Bonfinópolis/GO)',
                                        price: 0,
                                        deadline: 'Pronto em até 1 dia útil',
                                        isPickup: true,
                                        cep: '75195-000'
                                    }
                                    setShippingOption(pickupOpt)
                                    localStorage.setItem('meraki_cart_shipping', JSON.stringify(pickupOpt))
                                }}
                                className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                                    shippingOption?.isPickup
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/10'
                                        : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-gray-50/50'
                                }`}
                            >
                                <span className="flex items-center gap-1.5">
                                    <span>🏪</span> Retirar na Loja Física
                                </span>
                                <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                                    GRÁTIS
                                </span>
                            </button>

                            {/* Saved Address Pills for Logged-In Customer */}
                            {savedAddresses.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Seus Endereços Salvos:</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {savedAddresses.map(addr => (
                                            <button
                                                key={addr.id}
                                                onClick={() => {
                                                    setSelectedAddressId(addr.id)
                                                    setCepInput(addr.cep)
                                                    handleCalculateShipping(addr.cep, addr.label)
                                                }}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                                                    selectedAddressId === addr.id
                                                        ? 'bg-[#7A3E4A] text-white shadow-xs'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            >
                                                {addr.label?.toLowerCase().includes('casa') ? (
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                                    </svg>
                                                ) : addr.label?.toLowerCase().includes('trabalho') || addr.label?.toLowerCase().includes('escritório') ? (
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                )}
                                                <span>{addr.label}</span>
                                                <span className="text-[10px] opacity-75 font-mono">({addr.cep})</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Manual CEP Input Field */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    maxLength="9"
                                    placeholder="Digitar CEP (ex: 75195-000)"
                                    value={cepInput}
                                    onChange={(e) => setCepInput(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#7A3E4A] bg-gray-50/50"
                                />
                                <button
                                    onClick={() => {
                                        setSelectedAddressId(null)
                                        handleCalculateShipping(cepInput)
                                    }}
                                    disabled={calculatingCep}
                                    className="px-4 py-2 bg-[#7A3E4A] hover:bg-[#63303a] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    {calculatingCep ? '...' : 'Calcular'}
                                </button>
                            </div>

                            {shippingError && (
                                <p className="text-[10px] text-red-500 font-medium">{shippingError}</p>
                            )}

                            {/* Calculated Shipping Result Banner */}
                            {shippingOption && (
                                <div className="p-3 bg-[#FAF6F0] rounded-xl border border-[#C6A76A]/30 flex items-center justify-between text-xs">
                                    <div>
                                        <p className="font-bold text-gray-900 leading-tight">{shippingOption.title}</p>
                                        <p className="text-[10px] text-gray-500">{shippingOption.deadline}</p>
                                    </div>
                                    <span className="font-black text-[#7A3E4A] text-sm">
                                        {shippingOption.price === 0 ? 'GRÁTIS' : formatCurrency(shippingOption.price)}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Summary Costs Table */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500 font-medium">Subtotal</span>
                                <span className="text-gray-900 font-semibold">{formatCurrency(subtotal)}</span>
                            </div>
                            
                            {comboDiscount > 0 && (
                                <div className="flex items-center justify-between text-xs text-[#D11A6E] font-medium">
                                    <span>Desconto do Combo</span>
                                    <span>-{formatCurrency(comboDiscount)}</span>
                                </div>
                            )}

                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500 font-medium">Frete</span>
                                <span className="font-semibold text-gray-900">
                                    {shippingOption ? (
                                        shippingOption.price === 0 ? (
                                            <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">GRÁTIS</span>
                                        ) : (
                                            formatCurrency(shippingOption.price)
                                        )
                                    ) : (
                                        <span className="text-gray-400 font-normal">A calcular</span>
                                    )}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200/60">
                                <span className="text-[#1A1A1A] font-bold">Total</span>
                                <span className="text-base font-extrabold text-[#7A3E4A]">{formatCurrency(finalCartTotal)}</span>
                            </div>
                        </div>

                        <p className="text-[11px] text-gray-400 font-light leading-relaxed">Fretamento e descontos aplicados diretamente na etapa de finalização da compra.</p>
                        
                        <button
                            onClick={() => {
                                setIsOpen(false)
                                navigate('/checkout')
                            }}
                            className="w-full py-4 bg-[#7A3E4A] hover:bg-[#63303a] text-white text-xs font-bold uppercase tracking-[0.2em] rounded-xl transition-all shadow-md flex items-center justify-center gap-2 hover:scale-[1.01] cursor-pointer"
                        >
                            Finalizar Compra
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
