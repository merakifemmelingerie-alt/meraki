import { useState, useEffect } from 'react'

export default function Footer() {
    const [butterflySrc, setButterflySrc] = useState('/assets/borboleta-v2.webp')
    const [config, setConfig] = useState({
        sac_phone: '(11) 2388-0403',
        address: 'Avenida Alfredo Nasser, Qd. 14, Lt. 05 - Centro, Bonfinópolis - GO, CEP: 75195-000',
        cnpj: '57.484.768/0064-89',
        razao_social: 'Meraki Comércio de Vestuário Ltda'
    })

    const [deletedPages, setDeletedPages] = useState(() => {
        try {
            const stored = localStorage.getItem('meraki_deleted_pages')
            if (stored) return JSON.parse(stored)
        } catch {}
        return []
    })

    const [customPagesList, setCustomPagesList] = useState(() => {
        try {
            const stored = localStorage.getItem('meraki_custom_pages_list')
            if (stored) return JSON.parse(stored)
        } catch {}
        return []
    })

    const [customPagesContent, setCustomPagesContent] = useState(() => {
        try {
            const stored = localStorage.getItem('meraki_pages_content')
            if (stored) return JSON.parse(stored)
        } catch {}
        return {}
    })

    useEffect(() => {
        const loadConfig = () => {
            try {
                const storedDeleted = localStorage.getItem('meraki_deleted_pages')
                if (storedDeleted) setDeletedPages(JSON.parse(storedDeleted))
                const storedCustom = localStorage.getItem('meraki_custom_pages_list')
                if (storedCustom) setCustomPagesList(JSON.parse(storedCustom))
                const storedContent = localStorage.getItem('meraki_pages_content')
                if (storedContent) setCustomPagesContent(JSON.parse(storedContent))

                const stored = JSON.parse(localStorage.getItem('meraki_store_config'))
                if (stored) {
                    if (stored.deleted_pages) setDeletedPages(stored.deleted_pages)
                    if (stored.custom_pages_list) setCustomPagesList(stored.custom_pages_list)
                    if (stored.pages_content) setCustomPagesContent(stored.pages_content)
                    setConfig({
                        sac_phone: stored.sac_phone || '(11) 2388-0403',
                        address: stored.address || 'Avenida Alfredo Nasser, Qd. 14, Lt. 05 - Centro, Bonfinópolis - GO, CEP: 75195-000',
                        cnpj: stored.cnpj || '57.484.768/0064-89',
                        razao_social: stored.razao_social || 'Meraki Comércio de Vestuário Ltda'
                    })
                }
            } catch (e) {
                console.error(e)
            }
        }
        loadConfig()
        window.addEventListener('pagesContentUpdated', loadConfig)
        window.addEventListener('storeConfigUpdated', loadConfig)
        window.addEventListener('storage', loadConfig)
        return () => {
            window.removeEventListener('pagesContentUpdated', loadConfig)
            window.removeEventListener('storeConfigUpdated', loadConfig)
            window.removeEventListener('storage', loadConfig)
        }
    }, [])

    useEffect(() => {
        const img = new Image()
        img.src = '/assets/borboleta-v2.webp'
        img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext('2d')
            if (ctx) {
                ctx.drawImage(img, 0, 0)
                try {
                    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                    const data = imgData.data
                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i]
                        const g = data[i+1]
                        const b = data[i+2]
                        if (r > 185 && g > 185 && b > 185) {
                            data[i+3] = 0
                        }
                    }
                    ctx.putImageData(imgData, 0, 0)
                    setButterflySrc(canvas.toDataURL())
                } catch (e) {
                    console.error("Erro ao remover fundo:", e)
                }
            }
        }
    }, [])

    const allCustomPages = (() => {
        const standardIds = ['story', 'revenda', 'connect', 'wishlist', 'security', 'payment', 'delivery', 'returns', 'withdrawal', 'privacy', 'promotional-rules', 'stores']
        const pageKeys = Object.keys(customPagesContent || {})
        const listFromContent = []
        for (const key of pageKeys) {
            if (!standardIds.includes(key) && !customPagesList.some(p => p.id === key)) {
                const item = customPagesContent[key]
                if (item && (item.title || item.content)) {
                    listFromContent.push({
                        id: key,
                        label: item.title || key,
                        category: item.category || 'Atendimento',
                        isCustom: true
                    })
                }
            }
        }
        return [...customPagesList, ...listFromContent]
    })()

    const customSobre = allCustomPages.filter(p => p.category === 'Sobre').map(p => ({ id: p.id, href: `#/info/${p.id}`, label: p.label }))
    const customAtendimento = allCustomPages.filter(p => p.category === 'Atendimento').map(p => ({ id: p.id, href: `#/info/${p.id}`, label: p.label }))
    const customStores = allCustomPages.filter(p => p.category === 'Lojas').map(p => ({ id: p.id, href: `#/info/${p.id}`, label: p.label }))

    const mapLinkTitle = (l) => {
        const customTitle = customPagesContent[l.id]?.title
        return customTitle ? { ...l, label: customTitle } : l
    }

    const sobreLinks = [
        { id: 'story', href: '#/story', label: 'História' },
        { id: 'interaja', href: '#/interaja', label: '💬 Sugestões & Pedidos' },
        { id: 'revenda', href: '#/revenda', label: 'Seja um revendedor' },
        { id: 'connect', href: '#/connect', label: 'Conecte-se' },
        ...customSobre
    ].filter(l => !deletedPages.includes(l.id)).map(mapLinkTitle)

    const atendimentoLinks = [
        { id: 'security', href: '#/security', label: 'Compra Segura' },
        { id: 'payment', href: '#/payment', label: 'Formas de Pagamento' },
        { id: 'delivery', href: '#/delivery', label: 'Entrega e Frete' },
        { id: 'returns', label: 'Política de Troca', href: '#/returns' },
        { id: 'withdrawal', href: '#/withdrawal', label: 'Direito de Arrependimento' },
        { id: 'privacy', href: '#/privacy', label: 'Política de Privacidade' },
        { id: 'promotional-rules', href: '#/promotional-rules', label: 'Regras promocionais' },
        ...customAtendimento
    ].filter(l => !deletedPages.includes(l.id)).map(mapLinkTitle)

    const storesLinks = [
        { id: 'stores', href: '#/stores', label: 'Encontre a loja mais próxima' },
        ...customStores
    ].filter(l => !deletedPages.includes(l.id)).map(mapLinkTitle)

    return (
        <footer className="bg-[#FAF9F5] pt-16 pb-12 text-gray-600 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                
                {/* Center Brand Text Logo */}
                <div className="flex justify-center mb-10">
                    <a 
                        href="#/" 
                        className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1A1A1A] hover:text-[#7A3E4A] transition-colors inline-flex flex-col items-center justify-center gap-1"
                    >
                        <img 
                            src={butterflySrc} 
                            alt="Borboleta Meraki" 
                            className={`w-9 h-9 md:w-11 md:h-11 object-contain animate-butterfly-flight transition-opacity duration-200 ${
                                butterflySrc.startsWith('data:') ? 'opacity-100' : 'opacity-0'
                            }`}
                        />
                        <div className="flex flex-col items-center leading-none text-center">
                            <span className="font-heading tracking-[0.25em] text-[20px] md:text-[25px] lg:text-[28px] font-black uppercase antialiased">MERAKI</span>
                            <span className="text-[9px] md:text-[10px] lg:text-[11px] uppercase tracking-[0.48em] text-[#7A3E4A] font-extrabold mt-1 ml-[0.48em] antialiased">---- FEMME ----</span>
                        </div>
                    </a>
                </div>

                {/* Grid Links Section */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                    {/* Column 1: Sobre */}
                    {sobreLinks.length > 0 && (
                        <div>
                            <h4 className="font-heading text-xs font-bold tracking-widest text-[#7A3E4A] mb-4 uppercase">Sobre</h4>
                            <ul className="flex flex-col gap-2 text-xs text-gray-500 font-medium">
                                {sobreLinks.map(l => (
                                    <li key={l.id}><a href={l.href} className="hover:text-[#7A3E4A] transition-colors">{l.label}</a></li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Column 2: Conta */}
                    <div>
                        <h4 className="font-heading text-xs font-bold tracking-widest text-[#7A3E4A] mb-4 uppercase">Conta</h4>
                        <ul className="flex flex-col gap-2 text-xs text-gray-500 font-medium">
                            <li><a href="#/login" className="hover:text-[#7A3E4A] transition-colors">Login</a></li>
                            <li><a href="#/account" className="hover:text-[#7A3E4A] transition-colors">Minha Conta</a></li>
                            <li><a href="#/orders" className="hover:text-[#7A3E4A] transition-colors">Meus pedidos</a></li>
                            <li><a href="#/wishlist" className="hover:text-[#7A3E4A] transition-colors">Wishlist</a></li>
                        </ul>
                    </div>

                    {/* Column 3: Atendimento */}
                    {atendimentoLinks.length > 0 && (
                        <div>
                            <h4 className="font-heading text-xs font-bold tracking-widest text-[#7A3E4A] mb-4 uppercase">Atendimento</h4>
                            <ul className="flex flex-col gap-2 text-xs text-gray-500 font-medium">
                                {atendimentoLinks.map(l => (
                                    <li key={l.id}><a href={l.href} className="hover:text-[#7A3E4A] transition-colors">{l.label}</a></li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Column 4: Nossas Lojas */}
                    {storesLinks.length > 0 && (
                        <div>
                            <h4 className="font-heading text-xs font-bold tracking-widest text-[#7A3E4A] mb-4 uppercase">Nossas Lojas</h4>
                            <ul className="flex flex-col gap-2 text-xs text-gray-500 font-medium">
                                {storesLinks.map(l => (
                                    <li key={l.id}><a href={l.href} className="hover:text-[#7A3E4A] transition-colors">{l.label}</a></li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Social and SAC Info */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-5 border-t border-gray-200/50 mb-6">
                    {/* Social networks */}
                    <div className="flex items-center gap-4 text-xs font-bold tracking-widest text-gray-400">
                        <span className="uppercase text-[9px] tracking-wider font-semibold">Redes Sociais</span>
                        <div className="flex items-center gap-4 text-gray-550">
                            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-[#7A3E4A] transition-colors" aria-label="Instagram">
                                <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0 3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/>
                                    <path d="M12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8z" />
                                    <circle cx="18.406" cy="5.594" r="1.44" />
                                </svg>
                            </a>
                            <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="hover:text-[#7A3E4A] transition-colors" aria-label="TikTok">
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.19.98 1.13 2.37 1.86 3.86 2.05v3.91c-1.39-.02-2.76-.41-3.92-1.21-.49-.34-.93-.76-1.3-1.24v6.86c0 1.29-.26 2.56-.78 3.73-.83 1.77-2.39 3.07-4.25 3.54-1.42.36-2.92.3-4.3-.18-1.54-.53-2.86-1.6-3.61-3.05-.85-1.63-.99-3.56-.37-5.28.66-1.74 2.16-3.04 3.99-3.5 1.09-.27 2.23-.22 3.29.13v4.02c-.89-.35-1.9-.3-2.72.18-.75.44-1.26 1.23-1.39 2.09-.16 1.03.26 2.08 1.07 2.7.75.58 1.73.74 2.62.42.86-.31 1.54-1.07 1.75-1.97.06-.27.09-.55.09-.83V.02z"/>
                                </svg>
                            </a>
                            <a href="https://youtube.com" target="_blank" rel="noreferrer" className="hover:text-[#7A3E4A] transition-colors" aria-label="YouTube">
                                <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                                    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.107C19.52 3.5 12 3.5 12 3.5s-7.519 0-9.388.556a3.002 3.002 0 0 0-2.11 2.107C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.107C4.482 20.5 12 20.5 12 20.5s7.52 0 9.388-.556a3.002 3.002 0 0 0 2.11-2.107C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                </svg>
                            </a>
                            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-[#7A3E4A] transition-colors" aria-label="Facebook">
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* SAC Service */}
                    <div className="text-[10px] tracking-wider text-gray-400 font-semibold uppercase">
                        SAC <span className="text-gray-550 font-bold ml-1.5">{config.sac_phone}</span>
                    </div>
                </div>

                {/* Payments and Security Badges */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-5 pb-8 text-xs text-gray-400 border-t border-b border-gray-200/50 mb-8">
                    {/* Payment systems */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                        <span className="uppercase text-[9px] tracking-wider font-semibold shrink-0">Formas de Pagamento</span>
                        <div className="flex flex-wrap items-center justify-center gap-5">
                            {/* Pix */}
                            <div className="flex items-center gap-1.5 text-gray-500 select-none">
                                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                    <path d="M12 2L2 12l10 10 10-10L12 2zm7.07 10L12 19.07 4.93 12 12 4.93 19.07 12z" />
                                    <path d="M12 8.5L8.5 12l3.5 3.5 3.5-3.5-3.5-3.5z" />
                                </svg>
                                <span className="text-[11px] font-sans font-bold tracking-wider uppercase">PIX</span>
                            </div>
                            
                            {/* Visa */}
                            <span className="text-sm font-sans italic font-black text-gray-500 tracking-tighter leading-none select-none">VISA</span>
                            
                            {/* Mastercard */}
                            <div className="flex items-center gap-1.5 select-none">
                                <div className="flex -space-x-1.5">
                                    <div className="w-3.5 h-3.5 rounded-full bg-gray-400 opacity-60" />
                                    <div className="w-3.5 h-3.5 rounded-full bg-gray-500 opacity-75 mix-blend-multiply" />
                                </div>
                                <span className="text-[10px] font-sans font-bold text-gray-500 tracking-tighter uppercase">mastercard</span>
                            </div>

                            {/* Elo */}
                            <span className="text-[11px] font-sans italic font-black tracking-widest text-gray-500 select-none">elo</span>
                            
                            {/* Amex */}
                            <span className="text-[9px] font-sans font-bold tracking-tighter text-gray-500 border border-gray-300 px-1 py-0.2 rounded-xs select-none">AMEX</span>

                            {/* Diners */}
                            <span className="text-[8px] font-sans font-extrabold tracking-tight text-gray-450 uppercase select-none">Diners Club</span>

                            {/* Hipercard */}
                            <span className="text-[9px] font-sans italic font-black text-white bg-gray-400 px-1 py-0.2 rounded-xs select-none">hiper</span>
                        </div>
                    </div>

                    {/* Security */}
                    <div className="flex items-center gap-3 shrink-0">
                        <span className="uppercase text-[9px] tracking-wider font-semibold">Segurança</span>
                        <div className="flex items-center gap-1.5 text-gray-550 bg-transparent px-1 py-0.5 rounded-sm">
                            <svg className="w-3.5 h-3.5 fill-current text-gray-450" viewBox="0 0 24 24">
                                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                            </svg>
                            <span className="text-[9px] font-sans font-semibold tracking-wider text-gray-500">Let's Encrypt</span>
                        </div>
                    </div>
                </div>

                {/* Footer Legal & Copyright */}
                <div className="text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-gray-400 font-light">
                    <p className="leading-relaxed max-w-2xl">
                        Horário de Atendimento: De segunda à sexta-feira, das 8h30 às 17h30, exceto feriados | {config.address} | {config.razao_social || 'Meraki Comércio de Vestuário Ltda'} - CNPJ: {config.cnpj}
                    </p>
                    <p className="shrink-0">
                        © Meraki 2026 - Todos os direitos reservados
                    </p>
                </div>
            </div>
        </footer>
    )
}
