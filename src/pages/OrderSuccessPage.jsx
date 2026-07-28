import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import WhatsAppButton from '../components/WhatsAppButton.jsx'
import Notification from '../components/Notification.jsx'
import OrderTracker from '../components/OrderTracker.jsx'
import FireworksEffect from '../components/FireworksEffect.jsx'
import { supabase } from '../services/supabase.js'

function generatePixPayload({ pixKey = '57328371000114', receiverName = 'MERAKI FEMME', receiverCity = 'BONFINOPOLIS', amount = 0, txid = '' }) {
    const cleanKey = (pixKey || '57328371000114').trim()
    const cleanName = (receiverName || 'MERAKI FEMME').normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9 ]/g, "").slice(0, 25).toUpperCase()
    const cleanCity = (receiverCity || 'BONFINOPOLIS').normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9 ]/g, "").slice(0, 15).toUpperCase()
    const formattedAmount = Number(amount || 0).toFixed(2)
    const cleanTxid = (txid || 'MERAKI' + Date.now()).replace(/[^a-zA-Z0-9]/g, '').slice(0, 25)

    function formatField(id, value) {
        const len = value.length.toString().padStart(2, '0')
        return `${id}${len}${value}`
    }

    const merchantAccountInfo = formatField('00', 'br.gov.bcb.pix') + formatField('01', cleanKey)
    const additionalDataField = formatField('05', cleanTxid)

    let payload = 
        formatField('00', '01') +
        formatField('26', merchantAccountInfo) +
        formatField('52', '0000') +
        formatField('53', '986') +
        formatField('54', formattedAmount) +
        formatField('58', 'BR') +
        formatField('59', cleanName) +
        formatField('60', cleanCity) +
        formatField('62', additionalDataField) +
        '6304'

    let crc = 0xFFFF
    for (let i = 0; i < payload.length; i++) {
        crc ^= (payload.charCodeAt(i) << 8)
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) !== 0) {
                crc = ((crc << 1) ^ 0x1021) & 0xFFFF
            } else {
                crc = (crc << 1) & 0xFFFF
            }
        }
    }
    const crcHex = (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0')
    return payload + crcHex
}

export default function OrderSuccessPage() {
    const { orderId } = useParams()
    const [order, setOrder] = useState(null)
    const [copied, setCopied] = useState(false)
    const [notification, setNotification] = useState({ message: '', visible: false })
    const [showFireworks, setShowFireworks] = useState(false)
    const [infinitePayHandle, setInfinitePayHandle] = useState(() => {
        try {
            const config = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
            return config.infinitepay_handle || config.infinitepayhandle || 'merakimodafeminina2026'
        } catch {
            return 'merakimodafeminina2026'
        }
    })

    useEffect(() => {
        const checkOrder = () => {
            const savedOrders = JSON.parse(localStorage.getItem('meraki_orders') || '[]')
            const targetOrder = savedOrders.find(o => o.id === orderId)
            if (targetOrder) {
                setOrder(prev => {
                    const prevStatus = (prev?.status || '').toLowerCase()
                    const newStatus = (targetOrder.status || '').toLowerCase()
                    if (prevStatus === 'pendente' && (newStatus === 'pago' || newStatus === 'aprovado' || newStatus === 'enviado')) {
                        setShowFireworks(true)
                        setNotification({ message: '🎉 Pagamento autorizado com sucesso!', visible: true })
                    }
                    return targetOrder
                })

                const s = (targetOrder.status || '').toLowerCase()
                if (s === 'pago' || s === 'aprovado' || s === 'entregue' || s === 'enviado') {
                    setShowFireworks(true)
                }
            } else {
                setShowFireworks(true)
            }
        }

        checkOrder()
        const interval = setInterval(checkOrder, 3000)
        window.addEventListener('storage', checkOrder)
        window.addEventListener('ordersUpdated', checkOrder)

        return () => {
            clearInterval(interval)
            window.removeEventListener('storage', checkOrder)
            window.removeEventListener('ordersUpdated', checkOrder)
        }
    }, [orderId])

    const [dynamicPixKey, setDynamicPixKey] = useState(() => {
        try {
            const config = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
            return config.pix_key || config.pixKey || '57328371000114'
        } catch {
            return '57328371000114'
        }
    })

    useEffect(() => {
        const syncPixKey = async () => {
            try {
                const config = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
                if (config.pix_key || config.pixKey) {
                    setDynamicPixKey(config.pix_key || config.pixKey)
                }
                if (config.infinitepay_handle) {
                    setInfinitePayHandle(config.infinitepay_handle)
                }

                const { data } = await supabase.from('store_config').select('*').eq('id', 'default').maybeSingle()
                if (data) {
                    if (data.pix_key || data.pixkey) setDynamicPixKey(data.pix_key || data.pixkey)
                    if (data.infinitepay_handle) setInfinitePayHandle(data.infinitepay_handle)
                }
            } catch (e) {
                console.warn('Erro ao sincronizar pix_key:', e)
            }
        }

        syncPixKey()
        window.addEventListener('storeConfigUpdated', syncPixKey)
        window.addEventListener('storage', syncPixKey)
        return () => {
            window.removeEventListener('storeConfigUpdated', syncPixKey)
            window.removeEventListener('storage', syncPixKey)
        }
    }, [])

    const pixPayload = useMemo(() => {
        if (!order) return ''
        return generatePixPayload({
            pixKey: dynamicPixKey,
            receiverName: 'MERAKI FEMME',
            receiverCity: 'BONFINOPOLIS',
            amount: order.total || 0,
            txid: order.id
        })
    }, [order, dynamicPixKey])

    const qrCodeUrl = useMemo(() => {
        if (!pixPayload) return ''
        return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixPayload)}`
    }, [pixPayload])

    const showNotification = (message) => {
        setNotification({ message, visible: true })
    }

    const handleCopyPix = () => {
        if (!pixPayload) return
        navigator.clipboard.writeText(pixPayload)
        setCopied(true)
        showNotification('Chave Pix copiada com sucesso! 🚀')
        setTimeout(() => setCopied(false), 3000)
    }

    if (!order) {
        return (
            <div className="bg-[#FCFAFA] min-h-screen flex flex-col font-sans">
                <Header />
                <main className="max-w-md mx-auto px-4 py-24 text-center flex-grow flex flex-col justify-center">
                    <div className="w-8 h-8 border-2 border-[#7A3E4A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 font-medium text-sm">Carregando detalhes do seu pedido...</p>
                </main>
                <Footer />
            </div>
        )
    }

    return (
        <div className="bg-[#FCFAFA] min-h-screen flex flex-col font-sans">
            {showFireworks && <FireworksEffect duration={6000} />}
            <Header />

            <main className="max-w-6xl mx-auto px-4 py-12 flex-grow w-full space-y-8">
                
                {/* PIX Payment Native Direct Container */}
                {order.paymentMethod === 'pix' && order.status === 'Pendente' && (
                    <div className="bg-gradient-to-br from-[#FFF9F6] via-white to-[#FDF4EC] border border-[#E8E0D8] rounded-3xl p-6 sm:p-10 space-y-6 text-center shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#7A3E4A] via-[#C6A76A] to-[#7A3E4A]" />

                        <div className="flex flex-col items-center gap-2 pt-2">
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#7A3E4A]/10 border border-[#7A3E4A]/20 text-[#7A3E4A] text-[10px] font-black uppercase tracking-[0.2em]">
                                ⚡ Pagamento Instantâneo via PIX
                            </span>
                            <h3 className="font-sans text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                                QR Code PIX Gerado com Sucesso!
                            </h3>
                        </div>

                        <div className="bg-[#7A3E4A]/10 border border-[#7A3E4A]/20 rounded-2xl px-6 py-3.5 inline-block mx-auto">
                            <span className="text-xs text-gray-500 font-medium block uppercase tracking-wider">Valor Total com Desconto PIX</span>
                            <span className="text-2xl sm:text-3xl font-black text-[#7A3E4A]">
                                {(order.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        </div>

                        {/* Native Scannable QR Code */}
                        <div className="relative w-64 h-64 bg-white border-2 border-[#C6A76A]/30 rounded-3xl p-3.5 mx-auto shadow-lg flex flex-col items-center justify-center">
                            {qrCodeUrl ? (
                                <img src={qrCodeUrl} alt="QR Code PIX" className="w-full h-full object-contain rounded-2xl" />
                            ) : (
                                <div className="w-8 h-8 border-2 border-[#7A3E4A] border-t-transparent rounded-full animate-spin" />
                            )}
                        </div>

                        <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-md mx-auto leading-relaxed">
                            Abra o aplicativo do seu banco no celular (Nubank, Itaú, Bradesco, Mercado Pago, Inter, Caixa, etc.), selecione <strong>PIX &rarr; Ler QR Code</strong> ou utilize a chave <strong>Pix Copia e Cola</strong> abaixo:
                        </p>

                        <div className="max-w-lg mx-auto space-y-2">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Código Pix Copia e Cola (EMV)</label>
                            <div className="flex items-center border border-[#E8E0D8] rounded-2xl overflow-hidden bg-white shadow-sm ring-1 ring-black/5">
                                <input
                                    type="text"
                                    readOnly
                                    value={pixPayload}
                                    className="flex-1 px-4 py-4 text-xs font-mono text-gray-600 outline-none bg-transparent select-all"
                                />
                                <button
                                    onClick={handleCopyPix}
                                    className="px-7 py-4 bg-gradient-to-r from-[#7A3E4A] to-[#603039] hover:from-[#603039] text-white text-xs font-extrabold uppercase tracking-widest transition-all cursor-pointer shadow-sm shrink-0 flex items-center gap-1.5"
                                >
                                    {copied ? '✅ Copiado!' : '📋 Copiar Código'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Credit Card Payment Container via InfinitePay */}
                {order.paymentMethod === 'card' && order.status === 'Pendente' && (
                    <div className="bg-gradient-to-br from-[#FFF9F6] via-white to-[#FDF4EC] border border-[#E8E0D8] rounded-3xl p-6 sm:p-10 space-y-6 text-center shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#7A3E4A] via-[#C6A76A] to-[#7A3E4A]" />

                        <div className="flex flex-col items-center gap-2 pt-2">
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#7A3E4A]/10 border border-[#7A3E4A]/20 text-[#7A3E4A] text-[10px] font-black uppercase tracking-[0.2em]">
                                💳 PAGAMENTO NO CARTÃO DE CRÉDITO VIA INFINITEPAY
                            </span>
                            <h3 className="font-sans text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                                Autorize a Cobrança no seu Cartão
                            </h3>
                        </div>

                        <div className="bg-[#7A3E4A]/10 border border-[#7A3E4A]/20 rounded-2xl px-6 py-3.5 inline-block mx-auto">
                            <span className="text-xs text-gray-500 font-medium block uppercase tracking-wider">Valor Total a Cobrar</span>
                            <span className="text-2xl sm:text-3xl font-black text-[#7A3E4A]">
                                {(order.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        </div>

                        <div className="max-w-md mx-auto space-y-4">
                            <button
                                type="button"
                                onClick={() => {
                                    const cleanHandle = String(infinitePayHandle).replace(/^\$/, '').trim() || 'merakimodafeminina2026'
                                    const rawTotal = Number(order.total) || 0
                                    const formattedAmount = (rawTotal % 1 === 0) ? Math.round(rawTotal) : rawTotal.toFixed(2)
                                    window.location.href = `https://pay.infinitepay.io/${cleanHandle}/${formattedAmount}`
                                }}
                                className="w-full py-4 px-6 bg-gradient-to-r from-[#7A3E4A] to-[#603039] hover:from-[#603039] text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all cursor-pointer shadow-lg hover:shadow-[#7A3E4A]/30 flex items-center justify-center gap-2 active:scale-98"
                            >
                                ⚡ Processar Cobrança de {(order.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} na InfinitePay
                            </button>

                            <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                Para efetuar a cobrança real no seu cartão de crédito e receber a notificação do seu banco, clique no botão acima para concluir o pagamento via <strong>InfinitePay</strong>.
                            </p>
                        </div>
                    </div>
                )}

                {/* Credit Card Approved Container */}
                {order.paymentMethod === 'card' && (order.status === 'Pago' || order.status === 'Aprovado') && (
                    <div className="bg-gradient-to-br from-[#F0FDF4] via-white to-[#DCFCE7] border border-[#BBF7D0] rounded-3xl p-6 sm:p-10 space-y-6 text-center shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#10B981] via-[#059669] to-[#10B981]" />

                        <div className="flex flex-col items-center gap-2 pt-2">
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-[10px] font-black uppercase tracking-[0.2em]">
                                ✅ PAGAMENTO NO CARTÃO APROVADO COM SUCESSO
                            </span>
                            <h3 className="font-sans text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                                Cobrança Efetuada e Confirmada!
                            </h3>
                        </div>

                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-3.5 inline-block mx-auto shadow-2xs">
                            <span className="text-xs text-emerald-700 font-medium block uppercase tracking-wider">Valor Autorizado no Cartão</span>
                            <span className="text-2xl sm:text-3xl font-black text-emerald-800">
                                {(order.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        </div>
                    </div>
                )}

                {order.paymentMethod === 'boleto' && order.status === 'Pendente' && (
                    <div className="bg-gradient-to-br from-[#FFF9F6] via-white to-[#FDF4EC] border border-[#E8E0D8] rounded-3xl p-6 sm:p-10 text-center space-y-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#7A3E4A] via-[#C6A76A] to-[#7A3E4A]" />

                        <div className="flex flex-col items-center gap-2 pt-2">
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#7A3E4A]/10 border border-[#7A3E4A]/20 text-[#7A3E4A] text-[10px] font-black uppercase tracking-[0.2em]">
                                📄 Boleto Bancário
                            </span>
                            <h3 className="font-sans text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                                Boleto Bancário Gerado
                            </h3>
                        </div>

                        <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-md mx-auto leading-relaxed">
                            O boleto foi enviado para o seu e-mail. Utilize a linha digitável abaixo para realizar o pagamento.
                        </p>

                        <div className="max-w-lg mx-auto flex items-center border border-[#E8E0D8] rounded-2xl overflow-hidden bg-white shadow-sm ring-1 ring-black/5">
                            <input
                                type="text"
                                readOnly
                                value="34191.79001 01043.513184 91020.150008 7 987600000"
                                className="flex-1 px-4 py-4 text-xs font-mono text-gray-600 outline-none bg-transparent select-all"
                            />
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText("34191.7900101043513184910201500087987600000")
                                    showNotification('Código de barras copiado com sucesso!')
                                }}
                                className="px-7 py-4 bg-gradient-to-r from-[#7A3E4A] to-[#603039] hover:from-[#603039] hover:to-[#4A2027] text-white text-xs font-extrabold uppercase tracking-widest transition-all cursor-pointer shadow-sm flex items-center gap-1.5 shrink-0"
                            >
                                Copiar Código
                            </button>
                        </div>
                    </div>
                )}

                {/* Banner de Pagamento Aprovado com Sucesso */}
                {(order.status === 'Pago' || order.status === 'Aprovado' || order.status === 'Enviado' || order.status === 'Entregue') && (
                    <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 border border-emerald-500 rounded-3xl p-6 sm:p-8 text-white text-center shadow-2xl space-y-3 relative overflow-hidden animate-[fadeInUp_400ms_ease-out]">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto text-2xl shadow-inner border border-white/30 animate-bounce">
                            🎉
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                            Pagamento Concluído com Sucesso!
                        </h2>
                        <p className="text-xs sm:text-sm text-emerald-100 font-medium max-w-lg mx-auto leading-relaxed">
                            Identificamos a autorização do seu PIX com sucesso! Seu pedido foi confirmado e já está sendo preparado pela nossa equipe com todo carinho.
                        </p>
                    </div>
                )}

                {/* Main Order Tracker Component */}
                <OrderTracker order={order} onCopyPix={handleCopyPix} pixCopied={copied} />

                {/* Navigation Buttons */}
                <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link
                        to="/profile"
                        className="w-full sm:w-auto text-center py-4 px-8 bg-[#7A3E4A] hover:bg-[#63303a] text-white text-xs font-bold uppercase tracking-[0.2em] rounded-xl transition-all shadow-md hover:scale-[1.01]"
                    >
                        Ver Meus Pedidos
                    </Link>
                    <Link
                        to="/"
                        className="w-full sm:w-auto text-center py-4 px-8 border border-[#7A3E4A] text-[#7A3E4A] hover:bg-[#7A3E4A]/5 text-xs font-bold uppercase tracking-[0.2em] rounded-xl transition-all hover:scale-[1.01]"
                    >
                        Voltar à Loja
                    </Link>
                </div>

            </main>

            <Footer />
            <WhatsAppButton />
            <Notification message={notification.message} visible={notification.visible} onHide={() => setNotification({ message: '', visible: false })} />
        </div>
    )
}
