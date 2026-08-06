import { useState } from 'react'
import { getAssetUrl } from '../utils/assets.js'
import FireworksEffect from './FireworksEffect.jsx'

export default function OrderTracker({ order, onCopyPix, pixCopied }) {
    const [copiedTracking, setCopiedTracking] = useState(false)

    if (!order) return null

    const formatCurrency = (val) => {
        return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    }

    const customerFirstName = (order.customerName || 'Cliente').split(' ')[0]

    // Determine current active step (0-indexed)
    // 0: Pedido realizado
    // 1: Aguardando pagamento
    // 2: Pagamento aprovado
    // 3: Entregue à transportadora
    // 4: Pedido entregue
    const getStepIndex = (status) => {
        const s = (status || '').toLowerCase()
        if (s === 'entregue') return 4
        if (s === 'enviado') return 3
        if (s === 'pago' || s === 'aprovado') return 2
        if (s === 'pendente') return 1
        return 0
    }

    const activeStep = getStepIndex(order.status)
    const isCancelled = (order.status || '').toLowerCase() === 'cancelado'

    const steps = [
        { key: 'created', label: 'Pedido realizado', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
        { key: 'pending', label: 'Aguardando pagamento', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { key: 'paid', label: 'Pagamento aprovado', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
        { key: 'shipped', label: 'Preparando pedido', icon: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0' },
        { key: 'delivered', label: 'Pedido entregue', icon: 'M5 13l4 4L19 7' }
    ]

    const getStatusMessage = () => {
        if (isCancelled) return `${customerFirstName}, seu pedido foi cancelado.`
        switch (activeStep) {
            case 0:
                return `${customerFirstName}, seu pedido foi registrado com sucesso em nosso sistema!`
            case 1:
                return `${customerFirstName}, seu pedido foi gerado! Aguardando a confirmação do pagamento para prosseguir.`
            case 2:
                return `${customerFirstName}, seu pagamento foi aprovado! Suas peças já estão sendo preparadas para envio.`
            case 3:
                return `${customerFirstName}, seu pedido está sendo preparado com todo carinho para envio!`
            case 4:
                return `${customerFirstName}, seu pedido foi entregue com sucesso! Esperamos que você se sinta extraordinária com suas novas peças.`
            default:
                return `${customerFirstName}, estamos processando seu pedido.`
        }
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return new Date().toLocaleDateString('pt-BR')
        try {
            return new Date(dateStr).toLocaleDateString('pt-BR')
        } catch {
            return dateStr
        }
    }

    const itemsCount = (order.items || []).reduce((acc, item) => acc + (item.quantity || 1), 0)
    const trackingCode = order.trackingCode || order.postageCode || order.postagecode || ''

    const handleCopyTracking = () => {
        if (!trackingCode) return
        navigator.clipboard.writeText(trackingCode)
        setCopiedTracking(true)
        setTimeout(() => setCopiedTracking(false), 3000)
    }

    const isBonfinopolisOrder = () => {
        if (!order) return false
        const addr = order.shippingAddress
        const cep = (typeof addr === 'object' ? addr?.cep : '') || order.cep || ''
        const city = (typeof addr === 'object' ? addr?.city : '') || order.city || ''
        const cleanCep = (cep || '').replace(/\D/g, '')
        
        return (
            cleanCep.startsWith('75195') ||
            cleanCep.startsWith('75198') ||
            cleanCep.startsWith('75225') ||
            cleanCep.startsWith('7519') ||
            city.toLowerCase().includes('bonfinópolis') ||
            city.toLowerCase().includes('bonfinopolis')
        )
    }

    return (
        <div className="space-y-8 font-sans">
            {activeStep >= 2 && !isCancelled && <FireworksEffect duration={5000} />}
            
            {/* Header Title & Personalized Message */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#7A3E4A]/10 flex items-center justify-center text-[#7A3E4A]">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#C6A76A]">Status em Tempo Real</span>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">Pedido #{order.id}</h1>
                        </div>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        isCancelled ? 'bg-red-50 text-red-700 border border-red-200' :
                        order.status === 'Entregue' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        order.status === 'Enviado' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                        order.status === 'Pago' ? 'bg-[#7A3E4A]/10 text-[#7A3E4A] border border-[#7A3E4A]/20' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                        {order.status || 'Pendente'}
                    </span>
                </div>

                <div className="bg-[#FAF6F0] rounded-2xl p-4 sm:p-5 border border-[#C6A76A]/20">
                    <p className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed">
                        <span className="font-bold text-[#7A3E4A]">{customerFirstName}</span>, {getStatusMessage().replace(`${customerFirstName}, `, '')}
                    </p>
                </div>

                {/* Bonfinópolis Location Sharing Notice */}
                {isBonfinopolisOrder() && (
                    <div className="bg-gradient-to-br from-[#FFF9F6] via-white to-[#FDF4EC] border border-[#E8E0D8] rounded-2xl p-5 sm:p-6 space-y-4 shadow-md relative overflow-hidden">
                        <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-[#7A3E4A] text-white flex items-center justify-center shrink-0 shadow-md">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div className="flex-1 space-y-1">
                                <span className="bg-[#7A3E4A] text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block shadow-xs">
                                    Aviso de Entrega Local — Bonfinópolis-GO
                                </span>
                                <h3 className="font-sans text-sm sm:text-base font-black text-gray-900 leading-snug">
                                    Envie sua Localização em Tempo Real no WhatsApp 📍
                                </h3>
                                <p className="text-xs text-gray-600 leading-relaxed font-medium pt-1">
                                    Como os endereços na cidade de Bonfinópolis podem ter numerações ou quadras confusas, assim que o pagamento for autorizado por favor nos envie o comprovante e sua <strong className="text-[#7A3E4A] font-extrabold">localização em tempo real</strong> pelo WhatsApp para garantirmos uma entrega super rápida!
                                </p>
                            </div>
                        </div>

                        <div className="pt-1 flex flex-col sm:flex-row gap-3">
                            <a
                                href={`https://wa.me/551123880403?text=${encodeURIComponent(`Olá! Fiz o pedido #${order.id} em Bonfinópolis-GO. Segue o comprovante de pagamento e minha localização em tempo real para a entrega:`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md hover:scale-[1.01] cursor-pointer"
                            >
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                                </svg>
                                Enviar Localização no WhatsApp
                            </a>
                        </div>
                    </div>
                )}

                {/* 5-Step Visual Timeline Track */}
                {!isCancelled ? (
                    <div className="pt-6 pb-2 px-2 overflow-x-auto">
                        <div className="min-w-[650px] relative">
                            {/* Connecting Progress Line */}
                            <div className="absolute top-[22px] left-[35px] right-[35px] h-1 bg-gray-100 -z-0">
                                <div 
                                    className="h-full bg-gradient-to-r from-[#7A3E4A] via-[#9A5060] to-emerald-500 transition-all duration-700 ease-out rounded-full"
                                    style={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
                                />
                            </div>

                            {/* Steps Grid */}
                            <div className="grid grid-cols-5 relative z-10 text-center">
                                {steps.map((step, idx) => {
                                    const isPassed = idx <= activeStep
                                    const isCurrent = idx === activeStep
                                    return (
                                        <div key={step.key} className="flex flex-col items-center group">
                                            {/* Step Circle Container with Pulsing Effect */}
                                            <div className="relative flex items-center justify-center">
                                                {/* Continuous Pulsing Aura for active step */}
                                                {isCurrent && (
                                                    <>
                                                        <span className="absolute inset-0 rounded-full bg-emerald-500/40 animate-ping opacity-75" />
                                                        <span className="absolute -inset-2 rounded-full bg-emerald-400/30 animate-pulse" />
                                                    </>
                                                )}
                                                
                                                <div className={`relative z-10 w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                                    isPassed
                                                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                                        : 'bg-white border-gray-200 text-gray-400'
                                                } ${isCurrent ? 'ring-4 ring-emerald-200 scale-110' : ''}`}>
                                                    {isPassed ? (
                                                        <svg className="w-5 h-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={step.icon} />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Step Label */}
                                            <p className={`text-[11px] font-bold mt-3 leading-snug px-1 ${
                                                isPassed ? 'text-gray-900' : 'text-gray-400'
                                            }`}>
                                                {step.label}
                                            </p>

                                            {/* Step Date */}
                                            <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                                                {isPassed ? formatDate(order.created_at) : '–'}
                                            </p>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-xs font-bold text-center">
                        Este pedido foi cancelado. Se tiver dúvidas, entre em contato com nosso atendimento via WhatsApp.
                    </div>
                )}
            </div>

            {/* Main Content Grid: Left Column (Items & Tracking) + Right Column (Order Summary Card) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Column: Items List & Tracking */}
                <div className="lg:col-span-7 space-y-6">
                    
                    {/* Código de Rastreamento (se houver) */}
                    {trackingCode && (
                        <div className="bg-gradient-to-r from-sky-50 to-blue-50/40 p-6 rounded-2xl border border-sky-100 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sky-900">
                                    <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8" />
                                    </svg>
                                    <span className="text-xs font-black uppercase tracking-wider">Código de Rastreamento</span>
                                </div>
                                <span className="text-[10px] bg-sky-200/60 text-sky-800 font-bold px-2 py-0.5 rounded-full uppercase">Correios</span>
                            </div>
                            
                            <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-sky-200">
                                <input
                                    type="text"
                                    readOnly
                                    value={trackingCode}
                                    className="flex-1 text-xs font-mono font-bold text-gray-800 bg-transparent px-2 outline-none"
                                />
                                <button
                                    onClick={handleCopyTracking}
                                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer uppercase tracking-wider"
                                >
                                    {copiedTracking ? 'Copiado!' : 'Copiar'}
                                </button>
                            </div>
                            
                            <a
                                href={`https://rastreamento.correios.com.br/app/index.php?codigo=${trackingCode}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-900 transition-colors"
                            >
                                Rastrear nos Correios
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        </div>
                    )}

                    {/* Items List */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center gap-2">
                            <svg className="w-4 h-4 text-[#7A3E4A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            Itens no Pedido ({itemsCount})
                        </h3>

                        <div className="divide-y divide-gray-100">
                            {(order.items || []).map((item, idx) => (
                                <div key={idx} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
                                    {/* Item Image */}
                                    <div className="w-16 h-20 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                                        <img
                                            src={item.image ? getAssetUrl(Array.isArray(item.image) ? item.image[0] : item.image) : getAssetUrl('/assets/placeholder.jpg')}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.onerror = null; e.target.src = getAssetUrl('/placeholder.jpg') }}
                                        />
                                    </div>

                                    {/* Item Details */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-bold text-gray-900 truncate mb-1">{item.name}</h4>
                                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500">
                                            {item.size && <span>Tamanho: <strong className="text-gray-700 uppercase">{item.size}</strong></span>}
                                            {item.color && <span>Cor: <strong className="text-gray-700">{item.color}</strong></span>}
                                            <span>Qtd: <strong className="text-gray-700">{item.quantity || 1}</strong></span>
                                        </div>
                                        {item.customText && (
                                            <p className="text-[10px] text-[#7A3E4A] font-bold mt-1">
                                                Personalização: "{item.customText}"
                                            </p>
                                        )}
                                    </div>

                                    {/* Price */}
                                    <div className="text-right">
                                        <span className="text-xs font-bold text-gray-900 block">
                                            {formatCurrency((item.price || 0) * (item.quantity || 1))}
                                        </span>
                                        {item.quantity > 1 && (
                                            <span className="text-[10px] text-gray-400 font-medium">
                                                {formatCurrency(item.price)} cada
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Delivery Address / Pickup Card */}
                    {order.shippingAddress && (
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-[#7A3E4A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {order.shippingAddress.isPickup || order.deliveryType === 'pickup' ? 'Local de Retirada' : 'Endereço de Entrega'}
                                </span>
                                {(order.shippingAddress.isPickup || order.deliveryType === 'pickup') && (
                                    <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                                        RETIRADA NA LOJA
                                    </span>
                                )}
                            </h3>
                            <div className="text-xs text-gray-600 space-y-1">
                                <p className="font-bold text-gray-900">{order.customerName}</p>
                                <p>{order.shippingAddress.street}, {order.shippingAddress.number} {order.shippingAddress.complement && `- ${order.shippingAddress.complement}`}</p>
                                <p>{order.shippingAddress.neighborhood} — {order.shippingAddress.city}/{order.shippingAddress.state}</p>
                                <p className="font-mono text-gray-500">CEP: {order.shippingAddress.cep}</p>
                            </div>
                            {(order.shippingAddress.isPickup || order.deliveryType === 'pickup') && (
                                <div className="mt-3 bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-[11px] text-emerald-900 space-y-0.5">
                                    <p className="font-bold">📍 Meraki Moda Feminina - Loja Física</p>
                                    <p>Retirada disponível em até 1 dia útil após a aprovação do pagamento. Apresentar documento com foto ou número do pedido.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Column: Order Summary Card (Resumo da Compra) */}
                <div className="lg:col-span-5">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6 sticky top-24">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
                            <div className="w-8 h-8 rounded-xl bg-[#7A3E4A]/10 flex items-center justify-center text-[#7A3E4A]">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Resumo da compra</h3>
                        </div>

                        <div className="space-y-3.5 text-xs text-gray-600">
                            <div className="flex justify-between items-center">
                                <span className="font-bold uppercase tracking-wider text-gray-400 text-[10px]">PEDIDO</span>
                                <span className="font-mono font-bold text-gray-900 text-sm">#{order.id}</span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="font-bold uppercase tracking-wider text-gray-400 text-[10px]">STATUS DO PEDIDO</span>
                                <span className="font-bold text-[#7A3E4A] uppercase tracking-wider text-[11px] bg-[#7A3E4A]/10 px-2.5 py-0.5 rounded-full">
                                    {order.status || 'Pendente'}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="font-bold uppercase tracking-wider text-gray-400 text-[10px]">PAGAMENTO</span>
                                <span className="font-bold text-gray-800 capitalize">
                                    {order.paymentMethod === 'pix' ? 'PIX à vista' : order.paymentMethod === 'card' ? 'Cartão de Crédito' : 'Boleto Bancário'}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="font-bold uppercase tracking-wider text-gray-400 text-[10px]">ITENS NA SACOLA</span>
                                <span className="font-bold text-gray-900">{itemsCount}</span>
                            </div>

                            <div className="w-full h-[1px] bg-gray-100 my-2"></div>

                            <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-500">SUBTOTAL</span>
                                <span className="font-semibold text-gray-800">{formatCurrency(order.subtotal)}</span>
                            </div>

                            {order.discount > 0 && (
                                <div className="flex justify-between items-center text-emerald-600 font-medium">
                                    <span>DESCONTO</span>
                                    <span>- {formatCurrency(order.discount)}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-500">FRETE</span>
                                <span className="font-semibold text-gray-800">
                                    {order.shipping === 0 ? 'GRÁTIS' : formatCurrency(order.shipping)}
                                </span>
                            </div>

                            <div className="w-full h-[1px] bg-gray-200 my-2"></div>

                            <div className="flex justify-between items-center text-sm font-black pt-1">
                                <span className="text-gray-900 uppercase tracking-wider text-xs">VALOR TOTAL</span>
                                <span className="text-lg font-extrabold text-[#7A3E4A]">{formatCurrency(order.total)}</span>
                            </div>
                        </div>

                        {/* WhatsApp Support Button */}
                        <a
                            href={`https://wa.me/551123880403?text=Ol%C3%A1!%20Gostaria%20de%20informa%C3%A7%C3%B5es%20sobre%20o%20meu%20pedido%20%23${order.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                            </svg>
                            Dúvidas? Fale no WhatsApp
                        </a>
                    </div>
                </div>

            </div>
        </div>
    )
}
