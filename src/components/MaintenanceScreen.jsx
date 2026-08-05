import { useState } from 'react'
import { supabase } from '../services/supabase.js'

export default function MaintenanceScreen({ config }) {
    const [phone, setPhone] = useState('')
    const [name, setName] = useState('')
    const [submitted, setSubmitted] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const title = config?.maintenance_title || config?.maintenanceTitle || 'Estamos Preparando uma Nova Coleção Exclusiva ✨'
    const message = config?.maintenance_message || config?.maintenanceMessage || 'Em breve nosso site estará online com lançamentos apaixonantes e peças de tirar o fôlego. Deixe seu WhatsApp para receber o aviso em primeira mão!'
    const eta = config?.maintenance_eta || config?.maintenanceEta || 'Em breve'

    const handleSubscribe = async (e) => {
        e.preventDefault()
        if (!phone.trim()) return
        setSubmitting(true)

        try {
            // Save lead to Supabase profiles or leads table if exists, or local storage
            await supabase.from('marketing_leads').insert([
                { phone, name, source: 'maintenance_page', created_at: new Date().toISOString() }
            ]).catch(() => {})

            // Store locally as backup
            const savedLeads = JSON.parse(localStorage.getItem('meraki_maintenance_leads') || '[]')
            savedLeads.push({ phone, name, date: new Date().toISOString() })
            localStorage.setItem('meraki_maintenance_leads', JSON.stringify(savedLeads))

            setSubmitted(true)
        } catch (err) {
            console.error(err)
            setSubmitted(true)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen w-full bg-[#1F0E13] text-white flex flex-col items-center justify-between relative overflow-hidden font-sans selection:bg-[#C6A76A] selection:text-white">
            {/* Background Decorative Gradients & Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-[#7A3E4A]/40 via-[#9A5060]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#C6A76A]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#7A3E4A]/20 rounded-full blur-3xl pointer-events-none" />

            {/* Header / Logo */}
            <header className="pt-10 z-10 text-center">
                <div className="inline-flex flex-col items-center group">
                    <img 
                        src="/assets/logo-meraki.png" 
                        alt="Meraki Femme" 
                        className="h-14 sm:h-16 w-auto object-contain drop-shadow-[0_10px_20px_rgba(122,62,74,0.4)] transition-transform duration-700 hover:scale-105"
                        onError={(e) => {
                            e.target.style.display = 'none'
                            const fb = document.getElementById('fallback-logo')
                            if (fb) fb.style.display = 'block'
                        }}
                    />
                    <span id="fallback-logo" className="hidden text-2xl font-serif font-black tracking-widest text-[#C6A76A] uppercase">
                        MERAKI FEMME
                    </span>
                    <span className="text-[9px] uppercase tracking-[0.3em] text-[#C6A76A] font-medium mt-2">
                        Lingerie de Luxo & Alta Autoestima
                    </span>
                </div>
            </header>

            {/* Main Content Card */}
            <main className="my-auto py-12 px-6 max-w-xl text-center z-10 space-y-8">
                {/* Badge Status */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-[#C6A76A]/30 backdrop-blur-md text-[#C6A76A] text-[11px] font-extrabold uppercase tracking-widest animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-[#C6A76A]" />
                    {eta ? `Previsão: ${eta}` : 'Manutenção Programada'}
                </div>

                {/* Title & Message */}
                <div className="space-y-4">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black tracking-tight text-white leading-tight">
                        {title}
                    </h1>
                    <p className="text-sm sm:text-base text-gray-300 font-light leading-relaxed max-w-lg mx-auto">
                        {message}
                    </p>
                </div>

                {/* Lead Capture Form */}
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl shadow-2xl max-w-md mx-auto space-y-4">
                    {!submitted ? (
                        <form onSubmit={handleSubscribe} className="space-y-3">
                            <p className="text-xs font-bold text-[#C6A76A] uppercase tracking-wider">
                                🎁 Seja a primeira a saber & receba um Cupom VIP
                            </p>
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Seu nome (opcional)"
                                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-400 outline-none focus:border-[#C6A76A] transition-all"
                                />
                                <input
                                    type="tel"
                                    required
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    placeholder="Seu WhatsApp com DDD (ex: 11999998888)"
                                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-400 outline-none focus:border-[#C6A76A] transition-all"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3.5 bg-gradient-to-r from-[#7A3E4A] via-[#9A5060] to-[#C6A76A] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:shadow-lg hover:shadow-[#7A3E4A]/40 transition-all cursor-pointer disabled:opacity-50"
                            >
                                {submitting ? 'Cadastrando...' : 'Quero Ser Avisada no WhatsApp ✨'}
                            </button>
                        </form>
                    ) : (
                        <div className="py-4 space-y-2 text-center animate-fade-in">
                            <div className="w-12 h-12 rounded-full bg-[#C6A76A]/20 text-[#C6A76A] flex items-center justify-center mx-auto text-xl font-bold">
                                ✓
                            </div>
                            <p className="text-sm font-bold text-white">Cadastro Realizado com Sucesso!</p>
                            <p className="text-xs text-gray-300">Assim que a nova coleção for ao ar, enviaremos o seu convite VIP no WhatsApp.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="pb-8 text-center text-[10px] text-gray-500 z-10 space-y-2">
                <p>© {new Date().getFullYear()} Meraki Femme Lingerie. Todos os direitos reservados.</p>
                <div>
                    <a
                        href="#/admin"
                        className="text-gray-600 hover:text-[#C6A76A] transition-colors underline font-medium"
                    >
                        Área Administrativa (Acesso Restrito)
                    </a>
                </div>
            </footer>
        </div>
    )
}
