import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../hooks/useCart.js'
import { useAuth } from '../hooks/useAuth.js'
import { signUp, getUserProfile, updateUserProfile } from '../services/auth.js'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import WhatsAppButton from '../components/WhatsAppButton.jsx'
import Notification from '../components/Notification.jsx'
import { getAssetUrl } from '../utils/assets.js'
import { createPaymentSession } from '../services/payment.js'
import { fetchAddressByCep, calculateShippingOptions } from '../services/shipping.js'
import { trackInitiateCheckout, trackPurchase } from '../components/TrackingManager.jsx'

import { createOrderInDb } from '../services/database.js'

export default function CheckoutPage() {
    const { cart, clearCart, cartCount, subtotal: rawSubtotal, comboDiscount } = useCart()
    const { user } = useAuth()
    const navigate = useNavigate()
    const [notification, setNotification] = useState({ message: '', visible: false })

    // Form states
    const [name, setName] = useState(user?.user_metadata?.full_name || '')
    const [email, setEmail] = useState(user?.email || '')
    const [phone, setPhone] = useState('')
    const [cpf, setCpf] = useState('')
    const [password, setPassword] = useState('')
    
    // Address states
    const [cep, setCep] = useState('')
    const [street, setStreet] = useState('')
    const [number, setNumber] = useState('')
    const [complement, setComplement] = useState('')
    const [neighborhood, setNeighborhood] = useState('')
    const [city, setCity] = useState('')
    const [state, setState] = useState('')
    const [shippingMethod, setShippingMethod] = useState('local_delivery') // local_delivery, pickup
    const [availableShipping, setAvailableShipping] = useState(() => calculateShippingOptions('GO', 0))
    const [deliveryType, setDeliveryType] = useState(() => {
        try {
            const saved = localStorage.getItem('meraki_cart_shipping')
            if (saved) {
                const parsed = JSON.parse(saved)
                if (parsed.isPickup || parsed.id === 'pickup') return 'pickup'
            }
        } catch {}
        return 'delivery'
    })

    const [storeConfig, setStoreConfig] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
        } catch { return {} }
    })

    useEffect(() => {
        const updateConfig = () => {
            try {
                const config = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
                setStoreConfig(config)
            } catch {}
        }
        window.addEventListener('storeConfigUpdated', updateConfig)
        window.addEventListener('storage', updateConfig)
        return () => {
            window.removeEventListener('storeConfigUpdated', updateConfig)
            window.removeEventListener('storage', updateConfig)
        }
    }, [])

    const pickupAddressDisplay = useMemo(() => {
        const rawAddr = storeConfig.address || storeConfig.showroom_address || ''
        const rawCep = storeConfig.origin_cep || storeConfig.originCep || ''
        
        if (rawAddr) {
            if (rawAddr.toLowerCase().includes('cep')) {
                return `Meraki Moda Feminina — ${rawAddr}`
            }
            return `Meraki Moda Feminina — ${rawAddr}${rawCep ? ` - CEP: ${rawCep}` : ''}`
        }
        
        return 'Meraki Moda Feminina — Rua Lateral do Campo Qd20, Lt06 Jardim Santana. - CEP: 75195-385'
    }, [storeConfig])

    // Address selection states
    const [savedAddresses, setSavedAddresses] = useState([])
    const [selectedAddressId, setSelectedAddressId] = useState('')
    const [addressLabel, setAddressLabel] = useState('Casa')

    // Payment method state & Transparent Credit Card fields
    const [paymentMethod, setPaymentMethod] = useState('pix')
    const [cardNumber, setCardNumber] = useState('')
    const [cardHolder, setCardHolder] = useState('')
    const [cardExpiry, setCardExpiry] = useState('')
    const [cardCvv, setCardCvv] = useState('')
    const [installments, setInstallments] = useState('1')
    const [appliedCoupon, setAppliedCoupon] = useState(null)
    const [couponCode, setCouponCode] = useState('')
    const [couponError, setCouponError] = useState('')
    const [cardName, setCardName] = useState('')

    // Load saved addresses and user data
    useEffect(() => {
        if (user) {
            setName(user?.user_metadata?.full_name || '')
            setEmail(user?.email || '')

            getUserProfile(user.id).then(({ profile }) => {
                if (profile) {
                    if (profile.full_name) setName(profile.full_name)
                    if (profile.phone) setPhone(profile.phone)
                    if (profile.cpf) setCpf(profile.cpf)

                    const addresses = []
                    if (profile.address) {
                        addresses.push({
                            id: 'addr-profile',
                            label: 'Principal',
                            cep: profile.cep || '',
                            street: profile.address || '',
                            number: profile.number || '',
                            complement: profile.complement || '',
                            neighborhood: profile.neighborhood || '',
                            city: profile.city || '',
                            state: profile.state || ''
                        })
                    }
                    setSavedAddresses(addresses)
                    if (addresses.length > 0) {
                        const first = addresses[0]
                        setSelectedAddressId(first.id)
                        setCep(first.cep || '')
                        setStreet(first.street || '')
                        setNumber(first.number || '')
                        setComplement(first.complement || '')
                        setNeighborhood(first.neighborhood || '')
                        setCity(first.city || '')
                        setState(first.state || '')
                    } else {
                        setSelectedAddressId('new')
                    }
                } else {
                    setSelectedAddressId('new')
                }
            }).catch(console.error)
        } else {
            setSelectedAddressId('new')
        }
    }, [user])

    const handleSelectAddress = (id) => {
        setSelectedAddressId(id)
        if (id === 'new') {
            setCep('')
            setStreet('')
            setNumber('')
            setComplement('')
            setNeighborhood('')
            setCity('')
            setState('')
            setAddressLabel('Casa')
        } else {
            const addr = savedAddresses.find(a => a.id === id)
            if (addr) {
                setCep(addr.cep || '')
                setStreet(addr.street || '')
                setNumber(addr.number || '')
                setComplement(addr.complement || '')
                setNeighborhood(addr.neighborhood || '')
                setCity(addr.city || '')
                setState(addr.state || '')
            }
        }
    }

    const subtotal = Math.max(0, rawSubtotal - comboDiscount)

    useEffect(() => {
        setAvailableShipping(calculateShippingOptions(state || 'GO', subtotal))
    }, [state, subtotal])

    const selectedShippingOption = availableShipping.find(s => s.id === shippingMethod)
    const shipping = 0
    
    // Calculate subtotal of non-kit items (Kits already have special factory discount)
    const nonKitSubtotal = cart
        .filter(item => !item.isKit)
        .reduce((acc, item) => acc + (item.price + (item.customPrice || 0)) * item.quantity, 0)
    
    const hasKitsInCart = cart.some(item => item.isKit)

    // Pix discount is 5% off non-kit subtotal
    const pixDiscount = paymentMethod === 'pix' ? nonKitSubtotal * 0.05 : 0
    
    // Coupon discount calculation (only applies to non-kit subtotal)
    let couponDiscount = 0
    if (appliedCoupon) {
        if (appliedCoupon.type === 'percentage') {
            couponDiscount = nonKitSubtotal * (appliedCoupon.value / 100)
        } else {
            couponDiscount = Math.min(nonKitSubtotal, appliedCoupon.value)
        }
    }
    
    const discount = pixDiscount + couponDiscount
    const total = Math.max(0, subtotal + shipping - discount)

    const handleApplyCoupon = (e) => {
        if (e) e.preventDefault()
        setCouponError('')
        const code = couponCode.trim().toUpperCase()
        if (!code) return

        const storedCoupons = JSON.parse(localStorage.getItem('meraki_coupons') || '[]')
        const found = storedCoupons.find(c => c.code.toUpperCase() === code)

        if (!found) {
            setCouponError('Cupom inválido ou expirado.')
            setAppliedCoupon(null)
            return
        }

        if (subtotal < found.minPurchase) {
            setCouponError(`Compra mínima para este cupom: R$ ${found.minPurchase.toFixed(2)}`)
            setAppliedCoupon(null)
            return
        }

        setAppliedCoupon(found)
        showNotification(`Cupom ${code} aplicado com sucesso!`)
    }

    const formatCurrency = (val) => {
        return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    }

    const showNotification = (message) => {
        setNotification({ message, visible: true })
    }

    const maskCep = (val) => {
        return val
            .replace(/\D/g, '')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .slice(0, 9)
    }

    useEffect(() => {
        if (cart.length > 0) {
            trackInitiateCheckout(cart, rawSubtotal - comboDiscount)
        }
    }, [])

    const handleCepChange = async (e) => {
        const masked = maskCep(e.target.value)
        setCep(masked)
        
        const cleanVal = masked.replace(/\D/g, '')
        if (cleanVal.length === 8) {
            try {
                const addr = await fetchAddressByCep(cleanVal)
                setStreet(addr.street)
                setNeighborhood(addr.neighborhood)
                setCity(addr.city)
                setState(addr.state)
                
                const options = calculateShippingOptions(addr.state, subtotal)
                setAvailableShipping(options)
                showNotification('CEP preenchido e frete calculado com sucesso!')
            } catch (err) {
                showNotification(err.message || 'CEP não encontrado.')
            }
        }
    }

    const maskCpf = (val) => {
        return val
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
            .slice(0, 14)
    }

    const handleCheckoutSubmit = async (e) => {
        e.preventDefault()

        if (cart.length === 0) {
            alert('Seu carrinho está vazio.')
            return
        }

        if (!user) {
            if (!password) {
                alert('Por favor, crie uma senha para realizar seu cadastro e finalizar o pedido.')
                return
            }
            const { error: signUpError } = await signUp(
                email.trim().toLowerCase(),
                password,
                name,
                phone,
                cpf
            )
            if (signUpError) {
                alert('Erro ao realizar o cadastro: ' + signUpError.message)
                return
            }
        }

        const orderId = `MRK-${Math.floor(100000 + Math.random() * 900000)}`
        
        const newOrder = {
            id: orderId,
            customerName: name,
            customerEmail: email.trim().toLowerCase(),
            customerPhone: phone,
            customerCpf: cpf,
            shippingAddress: deliveryType === 'pickup' ? {
                cep: storeConfig.origin_cep || storeConfig.originCep || '75195-385',
                street: storeConfig.address || 'Rua Lateral do Campo Qd20, Lt06 Jardim Santana.',
                number: 'S/N',
                complement: 'Loja Física Meraki (Retirada na Loja)',
                neighborhood: 'Jardim Santana',
                city: 'Bonfinópolis',
                state: 'GO',
                isPickup: true
            } : {
                cep,
                street,
                number,
                complement,
                neighborhood,
                city,
                state
            },
            shippingMethod: deliveryType === 'pickup' ? 'Retirada na Loja (Grátis)' : (selectedShippingOption ? (selectedShippingOption.name || selectedShippingOption.label) : 'PAC (Correios)'),
            deliveryType,
            items: cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                size: item.size,
                color: item.color || '',
                image: item.image,
                isKit: Boolean(item.isKit),
                kitName: item.kitName || ''
            })),
            paymentMethod,
            subtotal,
            shipping,
            discount,
            total,
            coupon: appliedCoupon ? appliedCoupon.code : null,
            status: 'Pendente',
            created_at: new Date().toISOString()
        }

        // Save new address to profile and user addresses list
        if (user && user.email) {
            const cleanEmail = user.email.trim().toLowerCase()
            updateUserProfile(user.id, {
                phone,
                cpf,
                address: street,
                cep,
                number,
                complement,
                neighborhood,
                city,
                state
            }).catch(console.error)

            const existingAddrs = JSON.parse(localStorage.getItem(`meraki_user_addresses_${cleanEmail}`) || '[]')
            const exists = existingAddrs.some(a => a.cep === cep && a.number === number)
            if (!exists) {
                const newAddrObj = {
                    id: 'addr-' + Date.now(),
                    label: 'Entrega Recente',
                    cep,
                    street,
                    number,
                    complement,
                    neighborhood,
                    city,
                    state
                }
                const updatedAddrs = [newAddrObj, ...existingAddrs]
                localStorage.setItem(`meraki_user_addresses_${cleanEmail}`, JSON.stringify(updatedAddrs))
            }
        }

        // Save order directly into Supabase Database and local cache
        await createOrderInDb(newOrder)

        // Clear cart
        clearCart()

        if (paymentMethod === 'card') {
            let handle = 'merakimodafeminina2026'

            try {
                const { data: dbConfigRaw } = await supabase.from('store_config').select('infinitepay_handle,infinitepayhandle').eq('id', 'default').maybeSingle()
                if (dbConfigRaw && (dbConfigRaw.infinitepay_handle || dbConfigRaw.infinitepayhandle)) {
                    handle = dbConfigRaw.infinitepay_handle || dbConfigRaw.infinitepayhandle
                } else {
                    const storeConfig = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
                    handle = storeConfig.infinitepay_handle || storeConfig.infinitepayhandle || handle
                }
            } catch {
                const storeConfig = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
                handle = storeConfig.infinitepay_handle || storeConfig.infinitepayhandle || handle
            }

            const cleanHandle = String(handle).replace(/^\$/, '').trim() || 'merakimodafeminina2026'
            const rawTotal = Number(total) || 0
            const formattedAmount = (rawTotal % 1 === 0) ? Math.round(rawTotal) : rawTotal.toFixed(2)

            // Redireciona diretamente para a página oficial de checkout da InfinitePay com a carteira cadastrada e o valor em reais
            window.location.href = `https://pay.infinitepay.io/${cleanHandle}/${formattedAmount}`
        } else {
            // Se for PIX, gera o QR Code e chave Pix Copia e Cola na tela de Sucesso do site
            navigate(`/order-success/${orderId}`)
        }
    }

    if (cart.length === 0) {
        return (
            <div className="bg-[#FCFAFA] min-h-screen flex flex-col">
                <Header cartCount={0} />
                <main className="max-w-md mx-auto px-4 py-24 text-center flex-grow flex flex-col justify-center">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <h1 className="font-heading text-2xl font-bold text-gray-800 mb-2">Checkout Vazio</h1>
                    <p className="text-gray-500 font-light mb-8 text-sm">Adicione lingeries ao seu carrinho antes de finalizar a compra.</p>
                    <Link to="/" className="inline-block py-4 px-8 bg-[#7A3E4A] text-white text-xs font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-[#63303a] transition-colors">
                        Voltar para a Loja
                    </Link>
                </main>
                <Footer />
            </div>
        )
    }

    return (
        <div className="bg-[#FCFAFA] min-h-screen flex flex-col">
            <Header cartCount={cartCount} />

            <main className="max-w-7xl mx-auto px-4 py-12 flex-grow w-full">
                <div className="text-center mb-10">
                    <span className="text-[#C6A76A] text-[10px] uppercase font-bold tracking-[0.4em] mb-2 block">
                        Finalização da Compra
                    </span>
                    <h1 className="!font-sans text-2xl md:text-3xl font-bold tracking-tight text-[#1A1A1A] antialiased">
                        Checkout Seguro
                    </h1>
                </div>

                <form onSubmit={handleCheckoutSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left: Shipping and Payment forms */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Personal Data */}
                        <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm space-y-4">
                            <h2 className="!font-sans text-base font-semibold text-[#1A1A1A] flex items-center gap-2.5 border-b border-gray-100 pb-3 antialiased">
                                <span className="w-5.5 h-5.5 rounded-full bg-[#7A3E4A] text-white flex items-center justify-center text-[11px] font-bold font-sans antialiased">1</span>
                                Dados Pessoais
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col">
                                    <label className="text-xs text-gray-500 font-semibold mb-1">Nome Completo</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={name} 
                                        onChange={(e) => setName(e.target.value)}
                                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-[#7A3E4A] transition-all" 
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-xs text-gray-500 font-semibold mb-1">CPF</label>
                                    <input 
                                        type="text" 
                                        required 
                                        placeholder="000.000.000-00"
                                        value={cpf} 
                                        onChange={(e) => setCpf(maskCpf(e.target.value))}
                                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-[#7A3E4A] transition-all" 
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-xs text-gray-500 font-semibold mb-1">Email</label>
                                    <input 
                                        type="email" 
                                        required 
                                        value={email} 
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-[#7A3E4A] transition-all" 
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-xs text-gray-500 font-semibold mb-1">Telefone / WhatsApp</label>
                                    <input 
                                        type="tel" 
                                        required 
                                        placeholder="(00) 00000-0000"
                                        value={phone} 
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-[#7A3E4A] transition-all" 
                                    />
                                </div>
                                {!user && (
                                    <div className="flex flex-col sm:col-span-2">
                                        <label className="text-xs text-gray-500 font-semibold mb-1">Crie uma Senha para sua Conta</label>
                                        <input 
                                            type="password" 
                                            required 
                                            placeholder="Defina uma senha para finalizar seu cadastro"
                                            value={password} 
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-[#7A3E4A] transition-all" 
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Shipping & Delivery Modality */}
                        <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm space-y-4">
                            <h2 className="!font-sans text-base font-semibold text-[#1A1A1A] flex items-center gap-2.5 border-b border-gray-100 pb-3 antialiased">
                                <span className="w-5.5 h-5.5 rounded-full bg-[#7A3E4A] text-white flex items-center justify-center text-[11px] font-bold font-sans antialiased">2</span>
                                Modalidade de Envio / Entrega
                            </h2>

                            {/* Delivery Type Selector */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDeliveryType('delivery')
                                        setShippingMethod('local_delivery')
                                    }}
                                    className={`p-4 border rounded-2xl flex items-center justify-between transition-all text-left cursor-pointer ${
                                        deliveryType === 'delivery'
                                            ? 'border-[#7A3E4A] bg-[#FDF8F6] text-[#7A3E4A] ring-2 ring-[#7A3E4A]/10 font-bold shadow-xs'
                                            : 'border-gray-200 bg-[#FAF9F5] hover:border-gray-300 text-gray-600 font-semibold'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-full bg-[#7A3E4A]/10 text-[#7A3E4A] flex items-center justify-center shrink-0">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8h4l3 3v5h-2m-6 0h-2m4 0h-4m6 0a1 1 0 102 0 1 1 0 00-2 0zm-10 0a1 1 0 102 0 1 1 0 00-2 0z" />
                                            </svg>
                                        </span>
                                        <div>
                                            <div className="text-xs">Entrega no Endereço</div>
                                            <div className="text-[10px] text-gray-400 font-normal">Bonfinópolis - GO</div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full uppercase">
                                        Grátis
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setDeliveryType('pickup')
                                        setShippingMethod('pickup')
                                    }}
                                    className={`p-4 border rounded-2xl flex items-center justify-between transition-all text-left cursor-pointer ${
                                        deliveryType === 'pickup'
                                            ? 'border-[#7A3E4A] bg-[#FDF8F6] text-[#7A3E4A] ring-2 ring-[#7A3E4A]/10 font-bold shadow-xs'
                                            : 'border-gray-200 bg-[#FAF9F5] hover:border-gray-300 text-gray-600 font-semibold'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-full bg-[#7A3E4A]/10 text-[#7A3E4A] flex items-center justify-center shrink-0">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m4 10V11m-4 0h4" />
                                            </svg>
                                        </span>
                                        <div>
                                            <div className="text-xs">Retirada no Local</div>
                                            <div className="text-[10px] text-gray-400 font-normal">Bonfinópolis - GO</div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full uppercase">
                                        Grátis
                                    </span>
                                </button>
                            </div>

                            {/* Store Pickup Card View */}
                            {deliveryType === 'pickup' ? (
                                <div className="bg-emerald-50/80 border border-emerald-200 p-5 rounded-2xl space-y-3 animate-[fadeIn_200ms_ease-out]">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                                            <span>📍</span> Loja Física para Retirada
                                        </span>
                                        <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                                            FRETE R$ 0,00
                                        </span>
                                    </div>
                                    <p className="text-xs text-emerald-900 font-bold leading-relaxed">
                                        {pickupAddressDisplay}
                                    </p>
                                    <div className="pt-2 border-t border-emerald-200/60 text-[11px] text-emerald-800 space-y-1 font-medium">
                                        <p>⏱️ <strong>Prazo de Retirada:</strong> Pronto em até 1 dia útil após a confirmação do pagamento.</p>
                                        <p>📄 <strong>Requisitos:</strong> Apresentar documento de identificação com foto e o número do pedido.</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Address Selector */}
                                    {user && savedAddresses.length > 0 && (
                                        <div className="space-y-3 mb-6 pb-4 border-b border-gray-100">
                                            <label className="text-xs text-gray-500 font-semibold">Selecione o Endereço de Entrega:</label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {savedAddresses.map(addr => (
                                                    <button
                                                        key={addr.id}
                                                        type="button"
                                                        onClick={() => handleSelectAddress(addr.id)}
                                                        className={`text-left p-3.5 border transition-all rounded-xl cursor-pointer ${
                                                            selectedAddressId === addr.id
                                                                ? 'border-[#C6A76A] bg-[#FDF8F6] ring-1 ring-[#C6A76A]/20 shadow-xs'
                                                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <span className="text-[11px] font-bold text-[#C6A76A] uppercase tracking-wider">{addr.label}</span>
                                                            {selectedAddressId === addr.id && (
                                                                <span className="w-2.5 h-2.5 rounded-full bg-[#C6A76A]"></span>
                                                            )}
                                                        </div>
                                                        <div className="font-sans not-italic text-[11px] font-semibold text-gray-800 truncate">{addr.street}, {addr.number}</div>
                                                        <div className="font-sans not-italic text-[10px] text-gray-500 truncate">{addr.neighborhood} - {addr.city}/{addr.state}</div>
                                                    </button>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => handleSelectAddress('new')}
                                                    className={`text-center p-3.5 border border-dashed transition-all rounded-xl flex flex-col items-center justify-center min-h-[90px] cursor-pointer ${
                                                        selectedAddressId === 'new'
                                                            ? 'border-[#C6A76A] bg-[#FDF8F6]'
                                                            : 'border-gray-300 hover:border-gray-400 bg-white'
                                                    }`}
                                                >
                                                    <span className="text-xs font-bold text-gray-600">+ Adicionar Novo</span>
                                                    <span className="text-[10px] text-gray-400 mt-1">Entregar em outro endereço</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Label for new address */}
                                    {user && selectedAddressId === 'new' && (
                                        <div className="flex flex-col mb-4">
                                            <label className="text-xs text-gray-500 font-semibold mb-1">Identificação do Endereço (ex: Trabalho, Casa 2, etc.):</label>
                                            <input 
                                                type="text" 
                                                required 
                                                placeholder="Ex: Trabalho, Casa, etc."
                                                value={addressLabel} 
                                                onChange={(e) => setAddressLabel(e.target.value)}
                                                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-[#7A3E4A] transition-all" 
                                            />
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="flex flex-col">
                                            <label className="text-xs text-gray-500 font-semibold mb-1">CEP</label>
                                            <input 
                                                type="text" 
                                                required={deliveryType === 'delivery'} 
                                                placeholder="00000-000"
                                                value={cep} 
                                                onChange={handleCepChange}
                                                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-[#7A3E4A] transition-all" 
                                            />
                                        </div>
                                        <div className="flex flex-col sm:col-span-2">
                                            <label className="text-xs text-gray-500 font-semibold mb-1">Rua / Avenida</label>
                                            <input 
                                                type="text" 
                                                required={deliveryType === 'delivery'} 
                                                value={street} 
                                                onChange={(e) => setStreet(e.target.value)}
                                                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-[#7A3E4A] transition-all" 
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <label className="text-xs text-gray-500 font-semibold mb-1">Número</label>
                                            <input 
                                                type="text" 
                                                required={deliveryType === 'delivery'} 
                                                value={number} 
                                                onChange={(e) => setNumber(e.target.value)}
                                                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-[#7A3E4A] transition-all" 
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <label className="text-xs text-gray-500 font-semibold mb-1">Complemento</label>
                                            <input 
                                                type="text" 
                                                value={complement} 
                                                onChange={(e) => setComplement(e.target.value)}
                                                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-[#7A3E4A] transition-all" 
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <label className="text-xs text-gray-500 font-semibold mb-1">Bairro</label>
                                            <input 
                                                type="text" 
                                                required={deliveryType === 'delivery'} 
                                                value={neighborhood} 
                                                onChange={(e) => setNeighborhood(e.target.value)}
                                                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-[#7A3E4A] transition-all" 
                                            />
                                        </div>
                                        <div className="flex flex-col sm:col-span-2">
                                            <label className="text-xs text-gray-500 font-semibold mb-1">Cidade</label>
                                            <input 
                                                type="text" 
                                                required={deliveryType === 'delivery'} 
                                                value={city} 
                                                onChange={(e) => setCity(e.target.value)}
                                                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-[#7A3E4A] transition-all" 
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <label className="text-xs text-gray-500 font-semibold mb-1">Estado</label>
                                            <input 
                                                type="text" 
                                                required={deliveryType === 'delivery'} 
                                                value={state} 
                                                onChange={(e) => setState(e.target.value)}
                                                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-[#7A3E4A] transition-all" 
                                            />
                                        </div>
                                    </div>

                                    {availableShipping.length > 0 && (
                                        <div className="mt-6 pt-6 border-t border-gray-100 animate-[fadeIn_200ms_ease-out]">
                                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 block">Opções de Envio</label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {availableShipping.map(option => (
                                                    <button
                                                        key={option.id}
                                                        type="button"
                                                        onClick={() => setShippingMethod(option.id)}
                                                        className={`p-4 border rounded-2xl flex items-center justify-between transition-all text-left cursor-pointer ${
                                                            shippingMethod === option.id
                                                                ? 'border-[#7A3E4A] bg-[#FDF8F6] text-[#7A3E4A] ring-2 ring-[#7A3E4A]/5'
                                                                : 'border-gray-200 bg-white hover:border-gray-300 text-gray-600'
                                                        }`}
                                                    >
                                                        <div>
                                                            <div className="font-sans not-italic text-xs font-bold">{option.label}</div>
                                                            <div className="font-sans not-italic text-[10px] text-gray-400 font-medium mt-0.5">Prazo: {option.days}</div>
                                                        </div>
                                                        <span className="text-sm font-black">
                                                            {option.price === 0 ? 'Grátis' : formatCurrency(option.price)}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Payment Options */}
                        <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm space-y-6">
                            <h2 className="!font-sans text-base font-semibold text-[#1A1A1A] flex items-center gap-2.5 border-b border-gray-100 pb-3 antialiased">
                                <span className="w-5.5 h-5.5 rounded-full bg-[#7A3E4A] text-white flex items-center justify-center text-[11px] font-bold font-sans antialiased">3</span>
                                Método de Pagamento
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('pix')}
                                    className={`p-4 border rounded-2xl flex flex-col items-start gap-1.5 transition-all text-left cursor-pointer ${
                                        paymentMethod === 'pix'
                                            ? 'border-[#7A3E4A] bg-[#FDF8F6] text-[#7A3E4A] ring-2 ring-[#7A3E4A]/5'
                                            : 'border-gray-200 bg-white hover:border-gray-300 text-gray-600'
                                    }`}
                                >
                                    <div className="flex justify-between w-full items-center">
                                        <span className="text-sm font-bold">Pagar com Pix</span>
                                        <span className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md">
                                            5% OFF
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-light mt-0.5">
                                        Aprovado na hora. O código Pix Copia e Cola será gerado após finalizar.
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('card')}
                                    className={`p-4 border rounded-2xl flex flex-col items-start gap-1.5 transition-all text-left cursor-pointer ${
                                        paymentMethod === 'card'
                                            ? 'border-[#7A3E4A] bg-[#FDF8F6] text-[#7A3E4A] ring-2 ring-[#7A3E4A]/5'
                                            : 'border-gray-200 bg-white hover:border-gray-300 text-gray-600'
                                    }`}
                                >
                                    <div className="flex justify-between w-full items-center">
                                        <span className="text-sm font-bold">Cartão de Crédito / Débito</span>
                                        <span className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md">
                                            Até 12x
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-light mt-0.5">
                                        Pague no crédito ou débito com segurança pela plataforma InfinitePay.
                                    </span>
                                </button>
                            </div>

                            {/* Informativo sobre o redirecionamento seguro para a InfinitePay */}
                            {paymentMethod === 'card' && (
                                <div className="p-5 bg-gradient-to-br from-[#FFF9F6] via-white to-[#FDF4EC] border border-[#7A3E4A]/30 rounded-2xl space-y-3 animate-[fadeIn_150ms_ease-out] shadow-sm">
                                    <div className="flex items-center justify-between border-b border-[#E8E0D8] pb-2.5">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-xs font-black uppercase text-[#7A3E4A] tracking-wider">
                                                Pagamento Seguro via InfinitePay
                                            </span>
                                        </div>
                                        <div className="flex gap-1.5 text-[11px] font-bold text-gray-500">
                                            <span>💳 Visa</span>
                                            <span>💳 Master</span>
                                            <span>💳 Elo</span>
                                            <span>💳 Amex</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-600 font-medium leading-relaxed">
                                        Ao clicar em <strong>FINALIZAR PEDIDO</strong>, você será redirecionada automaticamente com total segurança para a página oficial da <strong>InfinitePay</strong> para concluir o pagamento no Cartão de Crédito ou Débito em até 12x.
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E8E0D8]/60 text-[10px] font-bold text-gray-500">
                                        <span>🔒 Ambiente 100% Criptografado</span>
                                        <span>•</span>
                                        <span>⚡ Aprovação Imediata</span>
                                        <span>•</span>
                                        <span>🛡️ Proteção do Comprador</span>
                                    </div>
                                </div>
                            )}

                            <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/60 rounded-2xl flex gap-3 text-xs text-emerald-900">
                                <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <div>
                                    <strong>Pagamento 100% Seguro:</strong> O pagamento no cartão é processado com criptografia oficial diretamente no ambiente seguro da InfinitePay.
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Order Summary */}
                    <div className="lg:col-span-5">
                        <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm sticky top-28 space-y-6">
                            <h2 className="!font-sans text-base font-semibold text-[#1A1A1A] border-b border-gray-100 pb-3 antialiased">
                                Resumo do Pedido
                            </h2>

                            {/* Cart List */}
                            <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
                                {cart.map(item => (
                                    <div key={`${item.id}-${item.size}`} className="flex gap-3 justify-between items-center text-sm">
                                        <div className="flex gap-3 items-center">
                                            <div className="w-12 h-16 bg-gray-50 border border-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                <img 
                                                    src={item.image ? getAssetUrl(item.image) : getAssetUrl('/assets/placeholder.jpg')} 
                                                    alt={item.name} 
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { e.target.onerror = null; e.target.src = getAssetUrl('/placeholder.jpg') }}
                                                />
                                            </div>
                                            <div>
                                                <h3 className="font-heading font-semibold text-[#1A1A1A] line-clamp-1">{item.name}</h3>
                                                <p className="text-[11px] text-gray-400 font-medium">Tamanho: {item.size} • Qtd: {item.quantity}</p>
                                            </div>
                                        </div>
                                        <span className="font-bold text-[#1A1A1A] whitespace-nowrap">
                                            {formatCurrency(item.price * item.quantity)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Coupon Input */}
                            <div className="border-t border-gray-100 pt-4 pb-1">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Cupom de Desconto</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="Digite seu cupom" 
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#7A3E4A] placeholder:text-gray-400 font-medium"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={handleApplyCoupon}
                                        className="px-4 py-2 bg-[#7A3E4A] hover:bg-[#63303a] text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                                    >
                                        Aplicar
                                    </button>
                                </div>
                                {couponError && (
                                    <p className="text-[10px] text-red-500 font-semibold mt-1.5">{couponError}</p>
                                )}
                                {appliedCoupon && (
                                    <div className="flex items-center justify-between bg-green-50 border border-green-200/50 px-2.5 py-1.5 rounded-lg mt-2.5 text-[10px] text-green-700 font-bold">
                                        <span>Cupom {appliedCoupon.code} ({appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}%` : `R$ ${appliedCoupon.value}`} OFF)</span>
                                        <button 
                                            type="button" 
                                            onClick={() => { setAppliedCoupon(null); setCouponCode('') }} 
                                            className="text-red-500 hover:text-red-700 font-bold uppercase text-[9px] cursor-pointer"
                                        >
                                            Remover
                                        </button>
                                    </div>
                                )}
                                {hasKitsInCart && (
                                    <p className="text-[10px] text-amber-700 font-medium mt-2 bg-amber-50 p-2 rounded-lg border border-amber-200/60">
                                        ℹ️ Produtos da modalidade Kit já possuem desconto especial e não acumulam com cupons adicionais.
                                    </p>
                                )}
                            </div>

                            {/* Summary Values */}
                            <div className="border-t border-gray-100 pt-4 space-y-2.5 text-sm">
                                {comboDiscount > 0 ? (
                                    <>
                                        <div className="flex justify-between text-gray-500">
                                            <span>Subtotal original</span>
                                            <span className="font-semibold text-gray-700">{formatCurrency(rawSubtotal)}</span>
                                        </div>
                                        <div className="flex justify-between text-[#D11A6E] font-medium">
                                            <span>Desconto do Combo</span>
                                            <span>-{formatCurrency(comboDiscount)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-500 font-bold">
                                            <span>Subtotal</span>
                                            <span className="text-gray-700">{formatCurrency(subtotal)}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex justify-between text-gray-500">
                                        <span>Subtotal</span>
                                        <span className="font-bold text-gray-700">{formatCurrency(subtotal)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-gray-500">
                                    <span>Entrega / Frete</span>
                                    <span className="font-bold text-gray-700">
                                        {shipping === 0 ? 'Grátis' : formatCurrency(shipping)}
                                    </span>
                                </div>
                                {pixDiscount > 0 && (
                                    <div className="flex justify-between text-green-600 font-medium">
                                        <span>Desconto (Pix 5%)</span>
                                        <span>-{formatCurrency(pixDiscount)}</span>
                                    </div>
                                )}
                                {couponDiscount > 0 && (
                                    <div className="flex justify-between text-green-600 font-medium">
                                        <span>Desconto (Cupom)</span>
                                        <span>-{formatCurrency(couponDiscount)}</span>
                                    </div>
                                )}
                                <div className="border-t border-gray-100 pt-4 flex justify-between items-end">
                                    <span className="text-[#1A1A1A] font-bold">Total</span>
                                    <span className="text-xl font-extrabold text-[#7A3E4A]">{formatCurrency(total)}</span>
                                </div>
                            </div>

                            {/* Order Action Button */}
                            <button
                                type="submit"
                                className="w-full py-4 bg-[#7A3E4A] hover:bg-[#63303a] text-white text-xs font-bold uppercase tracking-[0.2em] rounded-xl transition-all shadow-md hover:scale-[1.01]"
                            >
                                Finalizar Pedido
                            </button>
                        </div>
                    </div>
                </form>
            </main>

            <Footer />
            <WhatsAppButton />
            <Notification message={notification.message} visible={notification.visible} onHide={() => setNotification({ message: '', visible: false })} />
        </div>
    )
}
