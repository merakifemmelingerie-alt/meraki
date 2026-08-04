import { useState, useEffect } from 'react'

export default function BenefitsBar() {
    const [shippingText, setShippingText] = useState('Frete grátis para a região Centro-Oeste nas compras acima de R$ 299,90.')
    const [promoText, setPromoText] = useState('10% OFF na primeira compra com o cupom: BEMVINDA10 (Ganhe R$ 10 OFF)')

    useEffect(() => {
        const loadConfig = () => {
            const storedShipping = localStorage.getItem('meraki_shipping_message')
            if (storedShipping) {
                setShippingText(storedShipping)
            } else {
                try {
                    const config = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
                    if (config.shippingMessage) setShippingText(config.shippingMessage)
                } catch {}
            }

            const storedPromo = localStorage.getItem('meraki_promo_message')
            if (storedPromo) {
                setPromoText(storedPromo)
            } else {
                try {
                    const config = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
                    if (config.promoMessage) setPromoText(config.promoMessage)
                } catch {}
            }
        }

        loadConfig()
        window.addEventListener('storage', loadConfig)
        window.addEventListener('storeConfigUpdated', loadConfig)
        window.addEventListener('shippingMessageUpdated', loadConfig)
        window.addEventListener('promoMessageUpdated', loadConfig)
        return () => {
            window.removeEventListener('storage', loadConfig)
            window.removeEventListener('storeConfigUpdated', loadConfig)
            window.removeEventListener('shippingMessageUpdated', loadConfig)
            window.removeEventListener('promoMessageUpdated', loadConfig)
        }
    }, [])

    return (
        <section className="bg-[#FAF9F5] py-3 md:py-2.5 px-4 font-sans">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center gap-3 md:gap-8 text-center text-[10px] md:text-xs text-gray-650 tracking-wide font-medium">
                {/* Left Side: Frase 1 */}
                <div className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-gray-550 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.129-1.125v-3.026a2.999 2.999 0 0 0-.828-2.122L17.5 7.5h-3V18.75m3 0H14.25m3-11.25h.008v-.008h-.008v.008zm-3 0h-3v11.25m0-11.25H9.75M9.75 7.5H5.25v11.25m4.5 0H5.25" />
                    </svg>
                    <span>{shippingText}</span>
                </div>

                {/* Vertical Divider */}
                <span className="hidden md:inline text-gray-300 font-light">|</span>

                {/* Right Side: Frase 2 */}
                <div className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-gray-550 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 10 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 14 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12z" />
                    </svg>
                    <span>{promoText}</span>
                </div>
            </div>
        </section>
    )
}
