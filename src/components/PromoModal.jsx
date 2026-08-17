import { useState, useEffect } from 'react'
import { getAssetUrl } from '../utils/assets.js'
import { subscribeNewsletter } from '../services/database.js'

const DEFAULT_CONFIG = {
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

function readConfig() {
    try {
        const stored = localStorage.getItem('meraki_welcome_modal')
        if (stored) return { ...DEFAULT_CONFIG, ...JSON.parse(stored) }
    } catch (e) { console.error(e) }
    return DEFAULT_CONFIG
}

export default function PromoModal({ onNotification }) {
    const [config, setConfig] = useState(readConfig)
    const [isOpen, setIsOpen] = useState(false)
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [accepted, setAccepted] = useState(false)

    useEffect(() => {
        const updateConfig = () => setConfig(readConfig())
        window.addEventListener('welcomeModalUpdated', updateConfig)
        window.addEventListener('storeConfigUpdated', updateConfig)
        return () => {
            window.removeEventListener('welcomeModalUpdated', updateConfig)
            window.removeEventListener('storeConfigUpdated', updateConfig)
        }
    }, [])

    useEffect(() => {
        if (!config.enabled) return
        const promoClosed = localStorage.getItem('meraki_promo_closed')
        if (!promoClosed) {
            const timer = setTimeout(() => {
                setIsOpen(true)
            }, (config.delaySeconds ?? 2.5) * 1000)
            return () => clearTimeout(timer)
        }
    }, [config.enabled, config.delaySeconds])

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

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!accepted) {
            onNotification?.('Você precisa aceitar as políticas de privacidade.')
            return
        }

        const leads = JSON.parse(localStorage.getItem('meraki_promo_leads') || '[]')
        leads.push({ name, phone, email, date: new Date().toISOString() })
        localStorage.setItem('meraki_promo_leads', JSON.stringify(leads))

        subscribeNewsletter(email).catch(() => {})

        onNotification?.('Cupom de 10% enviado para o seu e-mail! 🎉')
        handleClose()
    }

    if (!config.enabled) return null

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0" onClick={handleClose} />

            {/* ═══ DESKTOP ═══ */}
            <div
                data-open={isOpen}
                className="welcome-modal-panel hidden md:flex relative w-full max-w-5xl bg-[#5A2E34] text-white rounded-[28px] overflow-hidden shadow-2xl z-10 border border-[#C6A76A]/15"
            >
                <div className="welcome-modal-grain absolute inset-0 pointer-events-none z-0" />

                {/* Content panel */}
                <div className="relative w-[46%] shrink-0 p-14 flex flex-col justify-center">
                    <button
                        onClick={handleClose}
                        className="absolute top-7 right-7 text-white/40 hover:text-white transition-colors duration-150 p-2 rounded-full hover:bg-white/10 cursor-pointer"
                        aria-label="Fechar"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="welcome-modal-stagger flex items-center gap-2.5 mb-7">
                        <img
                            src={getAssetUrl('/assets/borboleta-v2.webp')}
                            alt="Borboleta Meraki"
                            className="w-7 h-7 object-contain animate-butterfly-flight brightness-0 invert"
                        />
                        <span className="text-[#C6A76A] text-[10px] uppercase font-bold tracking-[0.4em]">
                            {config.eyebrow}
                        </span>
                    </div>

                    <h2 className="welcome-modal-stagger font-heading text-5xl text-white leading-[1.05] mb-3">
                        {config.headline} <span className="italic font-light text-white/80">{config.headlineItalic}</span>
                    </h2>
                    <p className="welcome-modal-stagger font-heading text-xl text-white/70 mb-8">
                        {config.highlight} <span className="italic text-[#C6A76A]">{config.highlightItalic}</span>
                    </p>

                    <div className="welcome-modal-stagger mb-9">
                        <div
                            className="font-heading text-8xl leading-none text-[#C6A76A] tracking-tight"
                            style={{ textShadow: '0 8px 40px rgba(198, 167, 106, 0.35)' }}
                        >
                            {config.discountText}
                        </div>
                        <p className="text-white/45 text-[11px] tracking-[0.15em] uppercase mt-3">{config.discountSubtext}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="welcome-modal-stagger space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="Nome"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-transparent border-b border-white/20 py-2.5 text-sm outline-none focus:border-[#C6A76A] transition-colors duration-200 text-white placeholder:text-white/35"
                            />
                            <input
                                type="tel"
                                placeholder="+55 (00) 00000-0000"
                                required
                                value={phone}
                                onChange={(e) => setPhone(maskPhone(e.target.value))}
                                className="w-full bg-transparent border-b border-white/20 py-2.5 text-sm outline-none focus:border-[#C6A76A] transition-colors duration-200 text-white placeholder:text-white/35"
                            />
                        </div>

                        <input
                            type="email"
                            placeholder="Email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-transparent border-b border-white/20 py-2.5 text-sm outline-none focus:border-[#C6A76A] transition-colors duration-200 text-white placeholder:text-white/35"
                        />

                        <label className="flex items-start gap-3 cursor-pointer select-none pt-1">
                            <input
                                type="checkbox"
                                checked={accepted}
                                onChange={(e) => setAccepted(e.target.checked)}
                                className="mt-0.5 accent-[#C6A76A] w-3.5 h-3.5 rounded"
                            />
                            <span className="text-white/40 text-[11px] leading-relaxed">
                                Aceito as <span className="underline hover:text-white transition-colors duration-150">políticas de privacidade</span>
                            </span>
                        </label>

                        <button
                            type="submit"
                            className="w-full py-4 bg-[#C6A76A] hover:bg-[#d4b87d] text-[#5A2E34] text-xs font-bold uppercase tracking-[0.25em] rounded-full transition-all duration-200 hover:scale-[1.015] active:scale-[0.99] cursor-pointer"
                        >
                            Quero meu desconto
                        </button>
                    </form>

                    <a
                        href={`https://instagram.com/${(config.instagramHandle || '').replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="welcome-modal-stagger mt-7 inline-flex items-center gap-2 text-white/35 hover:text-white transition-colors duration-150 text-[11px] font-semibold tracking-wider w-fit"
                    >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                        </svg>
                        <span>{config.instagramHandle}</span>
                    </a>
                </div>

                {/* Image panel */}
                <div className="relative flex-1 min-h-[560px]">
                    <img
                        src={getAssetUrl(config.desktopImage)}
                        alt="Meraki Femme"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div
                        className="absolute inset-0"
                        style={{ background: 'linear-gradient(105deg, #5A2E34 0%, rgba(90,46,52,0.55) 16%, rgba(90,46,52,0) 40%)' }}
                    />
                </div>
            </div>

            {/* ═══ MOBILE ═══ */}
            <div
                data-open={isOpen}
                className="welcome-modal-panel flex md:hidden relative w-full max-w-sm bg-[#5A2E34] text-white rounded-[22px] overflow-hidden shadow-2xl z-10 border border-[#C6A76A]/15 flex-col max-h-[92vh]"
            >
                <div className="welcome-modal-grain absolute inset-0 pointer-events-none z-0" />

                <div className="relative h-[104px] shrink-0">
                    <img
                        src={getAssetUrl(config.mobileImage)}
                        alt="Meraki Femme"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div
                        className="absolute inset-0"
                        style={{ background: 'linear-gradient(to bottom, rgba(90,46,52,0.15) 0%, #5A2E34 96%)' }}
                    />
                    <button
                        onClick={handleClose}
                        className="absolute top-3 right-3 text-white/80 bg-black/30 hover:bg-black/50 transition-colors duration-150 p-1.5 rounded-full cursor-pointer"
                        aria-label="Fechar"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="relative px-6 pb-6 pt-3 overflow-y-auto">
                    <div className="welcome-modal-stagger flex items-center justify-center gap-2 mb-3">
                        <img
                            src={getAssetUrl('/assets/borboleta-v2.webp')}
                            alt="Borboleta Meraki"
                            className="w-5 h-5 object-contain animate-butterfly-flight brightness-0 invert"
                        />
                        <span className="text-[#C6A76A] text-[9px] uppercase font-bold tracking-[0.35em]">
                            {config.eyebrow}
                        </span>
                    </div>

                    <h2 className="welcome-modal-stagger font-heading text-2xl text-white leading-tight text-center mb-1">
                        {config.headline} <span className="italic font-light text-white/80">{config.headlineItalic}</span>
                    </h2>
                    <p className="welcome-modal-stagger font-heading text-sm text-white/60 text-center mb-5">
                        {config.highlight} <span className="italic text-[#C6A76A]">{config.highlightItalic}</span>
                    </p>

                    <div className="welcome-modal-stagger text-center mb-6">
                        <div
                            className="font-heading text-5xl leading-none text-[#C6A76A]"
                            style={{ textShadow: '0 6px 28px rgba(198, 167, 106, 0.3)' }}
                        >
                            {config.discountText}
                        </div>
                        <p className="text-white/45 text-[9px] tracking-[0.1em] uppercase mt-2">{config.discountSubtext}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="welcome-modal-stagger space-y-3.5">
                        <input
                            type="text"
                            placeholder="Nome"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#C6A76A] transition-colors duration-200 text-white placeholder:text-white/35"
                        />
                        <input
                            type="tel"
                            placeholder="+55 (00) 00000-0000"
                            required
                            value={phone}
                            onChange={(e) => setPhone(maskPhone(e.target.value))}
                            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#C6A76A] transition-colors duration-200 text-white placeholder:text-white/35"
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#C6A76A] transition-colors duration-200 text-white placeholder:text-white/35"
                        />

                        <label className="flex items-start gap-2.5 cursor-pointer select-none py-0.5">
                            <input
                                type="checkbox"
                                checked={accepted}
                                onChange={(e) => setAccepted(e.target.checked)}
                                className="mt-0.5 accent-[#C6A76A] w-3.5 h-3.5 rounded"
                            />
                            <span className="text-white/40 text-[10px] leading-relaxed">
                                Aceito as <span className="underline">políticas de privacidade</span>
                            </span>
                        </label>

                        <button
                            type="submit"
                            className="w-full py-3.5 bg-[#C6A76A] hover:bg-[#d4b87d] text-[#5A2E34] text-[11px] font-bold uppercase tracking-[0.2em] rounded-full transition-all duration-200 active:scale-[0.98] cursor-pointer"
                        >
                            Quero meu desconto
                        </button>
                    </form>

                    <a
                        href={`https://instagram.com/${(config.instagramHandle || '').replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="welcome-modal-stagger mt-5 flex items-center justify-center gap-2 text-white/35 hover:text-white transition-colors duration-150 text-[10px] font-semibold tracking-wider"
                    >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                        </svg>
                        <span>{config.instagramHandle}</span>
                    </a>
                </div>
            </div>
        </div>
    )
}
