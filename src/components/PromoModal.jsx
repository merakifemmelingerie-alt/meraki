import { useState, useEffect } from 'react'
import { getAssetUrl } from '../utils/assets.js'

export default function PromoModal({ onNotification }) {
    const [isOpen, setIsOpen] = useState(false)
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [accepted, setAccepted] = useState(false)

    useEffect(() => {
        const promoClosed = localStorage.getItem('meraki_promo_closed')
        if (!promoClosed) {
            const timer = setTimeout(() => {
                setIsOpen(true)
            }, 2500) // Show popup after 2.5 seconds
            return () => clearTimeout(timer)
        }
    }, [])

    const maskPhone = (val) => {
        return val
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '+$1 ($2')
            .replace(/(\d{2})(\d)/, '$1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .slice(0, 19)
    }

    const handleClose = () => {
        setIsOpen(false)
        localStorage.setItem('meraki_promo_closed', 'true')
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!accepted) {
            alert('Você precisa aceitar as políticas de privacidade.')
            return
        }
        
        // Save lead info
        const leads = JSON.parse(localStorage.getItem('meraki_promo_leads') || '[]')
        leads.push({ name, phone, email, date: new Date().toISOString() })
        localStorage.setItem('meraki_promo_leads', JSON.stringify(leads))
        
        onNotification?.('Cupom de 10% enviado para o seu e-mail! 🎉')
        handleClose()
    }

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            {/* Backdrop click closer */}
            <div className="absolute inset-0" onClick={handleClose} />

            {/* Modal Container */}
            <div className="relative w-full max-w-4xl bg-[#000000] text-white rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col md:flex-row animate-[fadeInUp_400ms_cubic-bezier(0.19,1,0.22,1)] border border-white/5">
                
                {/* Form Section */}
                <div className="flex-1 p-8 md:p-12 flex flex-col justify-center relative">
                    {/* Close Button on Mobile (inside the form area for visibility) */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 md:hidden"
                        aria-label="Fechar"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <span className="text-[#C6A76A] text-[10px] uppercase font-bold tracking-[0.4em] mb-4 block">
                        Boas-vindas
                    </span>
                    <h2 className="font-heading text-3xl md:text-4xl text-white mb-2 leading-tight">
                        Primeira vez <span className="font-light italic">por aqui?</span>
                    </h2>
                    <h3 className="font-heading text-2xl text-white mb-4">
                        Temos um <span className="text-primary italic font-medium">presente!</span>
                    </h3>

                    <div className="mb-6">
                        <div className="text-3xl font-extrabold text-[#C6A76A] tracking-wider mb-1">
                            10% <span className="text-base font-light text-white">de</span> desconto
                        </div>
                        <p className="text-gray-400 text-xs tracking-wider uppercase">na sua primeira compra</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <input
                                    type="text"
                                    placeholder="Nome"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#C6A76A] transition-all text-white placeholder:text-gray-600"
                                />
                            </div>
                            <div>
                                <input
                                    type="tel"
                                    placeholder="+55 (00) 00000-0000"
                                    required
                                    value={phone}
                                    onChange={(e) => setPhone(maskPhone(e.target.value))}
                                    className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#C6A76A] transition-all text-white placeholder:text-gray-600"
                                />
                            </div>
                        </div>

                        <div>
                            <input
                                type="email"
                                placeholder="Email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#C6A76A] transition-all text-white placeholder:text-gray-600"
                            />
                        </div>

                        {/* Terms */}
                        <label className="flex items-start gap-3 cursor-pointer select-none py-1">
                            <input
                                type="checkbox"
                                checked={accepted}
                                onChange={(e) => setAccepted(e.target.checked)}
                                className="mt-1 accent-primary w-4 h-4 rounded border-white/10 bg-[#111]"
                            />
                            <span className="text-gray-400 text-[11px] leading-relaxed">
                                Aceito as{' '}
                                <span className="underline hover:text-white transition-colors">
                                    políticas de privacidade
                                </span>
                            </span>
                        </label>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full py-4 bg-[#7A3E4A] hover:bg-[#63303a] text-white text-xs font-bold uppercase tracking-[0.2em] rounded-xl transition-all hover:scale-[1.01] hover:shadow-lg active:scale-100"
                        >
                            Enviar
                        </button>
                    </form>

                    {/* Social Handles */}
                    <div className="mt-8 flex items-center justify-center md:justify-start gap-2 text-gray-500 hover:text-white transition-colors text-xs font-semibold tracking-wider">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                        </svg>
                        <span>@merakistore</span>
                    </div>
                </div>

                {/* Image Section - Hidden on mobile, beautiful display on md+ */}
                <div className="hidden md:block md:w-1/2 relative min-h-[480px]">
                    <img
                        src={getAssetUrl('/assets/banners/promo-banner.jpg')}
                        alt="Promo Lingerie"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    
                    {/* Close Button on Desktop */}
                    <button
                        onClick={handleClose}
                        className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/30 hover:bg-black/60 transition-colors p-2.5 rounded-full backdrop-blur-sm"
                        aria-label="Fechar"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    )
}
