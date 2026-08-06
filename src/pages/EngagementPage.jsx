import { useState, useEffect } from 'react'
import Header from '../components/Header.jsx'
import BenefitsBar from '../components/BenefitsBar.jsx'
import Footer from '../components/Footer.jsx'
import WhatsAppButton from '../components/WhatsAppButton.jsx'
import { submitSuggestion, getPolls, submitPollVote, getPollVotes, submitProductRequest } from '../services/database.js'

export default function EngagementPage() {
    const [activeTab, setActiveTab] = useState('suggestions') // 'suggestions' | 'polls' | 'request'
    const [submitting, setSubmitting] = useState(false)
    const [feedbackMsg, setFeedbackMsg] = useState('')

    // Header State
    const [cartCount, setCartCount] = useState(0)
    const [wishlistCount, setWishlistCount] = useState(0)

    // 1. Suggestions Form State
    const [sugName, setSugName] = useState('')
    const [sugPhone, setSugPhone] = useState('')
    const [sugCategory, setSugCategory] = useState('Novos Modelos')
    const [sugMessage, setSugMessage] = useState('')

    // 2. Polls State
    const [polls, setPolls] = useState([])
    const [selectedPoll, setSelectedPoll] = useState(null)
    const [selectedOption, setSelectedOption] = useState('')
    const [customText, setCustomText] = useState('')
    const [pollVotesMap, setPollVotesMap] = useState({})
    const [hasVotedPoll, setHasVotedPoll] = useState(false)

    // 3. Product Request State
    const [reqName, setReqName] = useState('')
    const [reqPhone, setReqPhone] = useState('')
    const [reqProdName, setReqProdName] = useState('')
    const [reqDesc, setReqDesc] = useState('')
    const [reqPhotoFile, setReqPhotoFile] = useState(null)
    const [reqPhotoPreview, setReqPhotoPreview] = useState('')
    const [reqColor, setReqColor] = useState('')
    const [reqSize, setReqSize] = useState('M')
    const [reqPriceRange, setReqPriceRange] = useState('Até R$ 150')

    useEffect(() => {
        try {
            const savedCart = JSON.parse(localStorage.getItem('meraki_cart') || '[]')
            setCartCount(savedCart.reduce((sum, item) => sum + (item.quantity || 1), 0))
            const savedWishlist = JSON.parse(localStorage.getItem('meraki_wishlist') || '[]')
            setWishlistCount(savedWishlist.length)
        } catch {}

        loadPollsData()
    }, [])

    const loadPollsData = async () => {
        const { data } = await getPolls()
        const activePolls = (data || []).filter(p => p.active)
        setPolls(activePolls)
        if (activePolls.length > 0) {
            const current = activePolls[0]
            setSelectedPoll(current)
            fetchVotesForPoll(current.id)
        }
    }

    const fetchVotesForPoll = async (pollId) => {
        const { data: votes } = await getPollVotes(pollId)
        setPollVotesMap(prev => ({ ...prev, [pollId]: votes || [] }))

        const anonId = localStorage.getItem('meraki_user_anon_id')
        if (anonId && votes?.some(v => v.user_identifier === anonId)) {
            setHasVotedPoll(true)
        } else {
            setHasVotedPoll(false)
        }
    }

    const handleSuggestionSubmit = async (e) => {
        e.preventDefault()
        if (!sugMessage.trim()) return

        setSubmitting(true)
        setFeedbackMsg('')

        const res = await submitSuggestion({
            customer_name: sugName.trim(),
            customer_phone: sugPhone.trim(),
            category: sugCategory,
            message: sugMessage.trim()
        })

        setSubmitting(false)
        if (!res.error) {
            setFeedbackMsg('Sua sugestão foi enviada com sucesso para nossa equipe! Muito obrigada.')
            setSugMessage('')
            setTimeout(() => setFeedbackMsg(''), 5000)
        } else {
            setFeedbackMsg('Erro ao enviar. Tente novamente.')
        }
    }

    const handleVoteSubmit = async (e) => {
        e.preventDefault()
        if (!selectedPoll || (!selectedOption && !customText.trim())) return

        setSubmitting(true)
        let anonId = localStorage.getItem('meraki_user_anon_id')
        if (!anonId) {
            anonId = 'user_' + Math.random().toString(36).substring(2, 10)
            localStorage.setItem('meraki_user_anon_id', anonId)
        }

        const res = await submitPollVote({
            poll_id: selectedPoll.id,
            option_id: selectedOption,
            custom_text: customText.trim(),
            user_identifier: anonId
        })

        setSubmitting(false)
        if (!res.error) {
            setHasVotedPoll(true)
            fetchVotesForPoll(selectedPoll.id)
            setFeedbackMsg('Voto computado com sucesso! Obrigada pela participação.')
            setTimeout(() => setFeedbackMsg(''), 5000)
        }
    }

    const handlePhotoChange = (e) => {
        const file = e.target.files?.[0]
        if (file) {
            setReqPhotoFile(file)
            setReqPhotoPreview(URL.createObjectURL(file))
        }
    }

    const handleProductRequestSubmit = async (e) => {
        e.preventDefault()
        if (!reqProdName.trim() || !reqPhone.trim()) return

        setSubmitting(true)
        setFeedbackMsg('')

        const res = await submitProductRequest({
            customer_name: reqName.trim() || 'Cliente Meraki',
            customer_phone: reqPhone.trim(),
            product_name: reqProdName.trim(),
            description: reqDesc.trim(),
            photo_file: reqPhotoFile,
            color: reqColor,
            size: reqSize,
            price_range: reqPriceRange
        })

        setSubmitting(false)
        if (!res.error) {
            setFeedbackMsg('Sua solicitação foi registrada com sucesso! Avisaremos você assim que o produto estiver disponível.')
            setReqProdName('')
            setReqDesc('')
            setReqPhotoFile(null)
            setReqPhotoPreview('')
            setTimeout(() => setFeedbackMsg(''), 5000)
        } else {
            setFeedbackMsg('Ocorreu um erro ao enviar seu pedido. Tente novamente.')
        }
    }

    const votesForCurrentPoll = (selectedPoll && pollVotesMap[selectedPoll.id]) || []
    const totalVotes = votesForCurrentPoll.length

    return (
        <div className="min-h-screen bg-[#FAF9F5] flex flex-col font-sans">
            <Header
                cartCount={cartCount}
                wishlistCount={wishlistCount}
                onSearchOpen={() => {}}
            />

            {/* Top Brand Header with Official Meraki Styling */}
            <section className="bg-[#FAF9F5] border-b border-[#E8E0D8] py-10 md:py-14 px-4 text-center">
                <div className="max-w-4xl mx-auto space-y-4">
                    {/* Official Meraki Logo & Animated Butterfly */}
                    <div className="flex flex-col items-center justify-center gap-2 mb-1">
                        <img 
                            src="/assets/borboleta-v2.webp" 
                            alt="Borboleta Meraki" 
                            className="w-10 h-10 md:w-12 md:h-12 object-contain animate-butterfly-flight"
                        />
                        <div className="flex flex-col items-center leading-none text-center">
                            <span className="font-heading tracking-[0.25em] text-[22px] md:text-[26px] font-black uppercase text-[#1A1A1A] antialiased">
                                MERAKI
                            </span>
                            <span className="text-[9px] md:text-[10px] uppercase tracking-[0.48em] text-[#7A3E4A] font-extrabold mt-1 ml-[0.48em] antialiased">
                                ---- FEMME ----
                            </span>
                        </div>
                    </div>

                    {/* Subtitle Line */}
                    <div className="pt-2">
                        <span className="text-[10px] md:text-[11px] uppercase tracking-[0.3em] text-[#C6A76A] font-extrabold font-heading">
                            ESPAÇO INTERATIVO DA CLIENTE
                        </span>
                    </div>

                    <h1 className="font-heading text-2xl md:text-4xl font-extrabold tracking-wider uppercase text-[#1A1A1A]">
                        Central da Cliente Meraki
                    </h1>

                    <p className="text-xs md:text-sm text-gray-600 max-w-2xl mx-auto font-medium leading-relaxed">
                        Sua opinião molda nossas próximas coleções. Envie sugestões, participe das enquetes ou solicite produtos exclusivos com atendimento dedicado.
                    </p>
                </div>
            </section>

            {/* Main Content Area */}
            <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
                
                {/* Navigation Tabs with Monochromatic SVG Icons */}
                <div className="bg-white rounded-2xl shadow-sm p-1.5 border border-[#E8E0D8] flex flex-wrap gap-1.5 mb-8">
                    <button
                        onClick={() => { setActiveTab('suggestions'); setFeedbackMsg(''); }}
                        className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                            activeTab === 'suggestions'
                                ? 'bg-[#7A3E4A] text-white shadow-xs'
                                : 'bg-transparent text-gray-600 hover:bg-[#FAF9F5]'
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>Mural de Sugestões</span>
                    </button>

                    <button
                        onClick={() => { setActiveTab('polls'); setFeedbackMsg(''); }}
                        className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                            activeTab === 'polls'
                                ? 'bg-[#7A3E4A] text-white shadow-xs'
                                : 'bg-transparent text-gray-600 hover:bg-[#FAF9F5]'
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span>Enquetes & Votação</span>
                    </button>

                    <button
                        onClick={() => { setActiveTab('request'); setFeedbackMsg(''); }}
                        className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                            activeTab === 'request'
                                ? 'bg-[#7A3E4A] text-white shadow-xs'
                                : 'bg-transparent text-gray-600 hover:bg-[#FAF9F5]'
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <span>Encomendar Produto</span>
                    </button>
                </div>

                {/* Feedback Banner */}
                {feedbackMsg && (
                    <div className="mb-6 p-4 bg-[#7A3E4A]/10 text-[#7A3E4A] border border-[#7A3E4A]/20 rounded-2xl text-xs font-bold text-center shadow-xs animate-[fadeIn_200ms_ease-out]">
                        {feedbackMsg}
                    </div>
                )}

                {/* Main Card Container */}
                <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-[#E8E0D8]">
                    
                    {/* TAB 1: SUGGESTIONS */}
                    {activeTab === 'suggestions' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <span className="w-9 h-9 rounded-xl bg-[#7A3E4A]/10 text-[#7A3E4A] flex items-center justify-center shrink-0">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </span>
                                <div>
                                    <h2 className="font-heading text-lg md:text-xl font-bold text-[#1A1A1A] uppercase tracking-wider">
                                        Escreva sua Sugestão
                                    </h2>
                                    <p className="text-xs text-gray-500 font-medium">
                                        Conte para nossa equipe qual modelo, cor ou tamanho você adoraria ver em nosso catálogo!
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleSuggestionSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Seu Nome (Opcional)</label>
                                        <input
                                            type="text"
                                            value={sugName}
                                            onChange={e => setSugName(e.target.value)}
                                            placeholder="Ex: Maria Silva"
                                            className="w-full px-4 py-3 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#7A3E4A] bg-[#FAF9F5]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">WhatsApp para Contato (Opcional)</label>
                                        <input
                                            type="tel"
                                            value={sugPhone}
                                            onChange={e => setSugPhone(e.target.value)}
                                            placeholder="(11) 99999-9999"
                                            className="w-full px-4 py-3 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#7A3E4A] bg-[#FAF9F5]"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Categoria da Sugestão</label>
                                    <select
                                        value={sugCategory}
                                        onChange={e => setSugCategory(e.target.value)}
                                        className="w-full px-4 py-3 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#7A3E4A] bg-[#FAF9F5]"
                                    >
                                        <option>Cores Desejadas</option>
                                        <option>Mais Opções Plus Size</option>
                                        <option>Novos Modelos de Lingerie</option>
                                        <option>Camisolas & Noite</option>
                                        <option>Linha Sexy & Fantasias</option>
                                        <option>Outros</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Sua Mensagem / Sugestão *</label>
                                    <textarea
                                        required
                                        rows={5}
                                        value={sugMessage}
                                        onChange={e => setSugMessage(e.target.value)}
                                        placeholder="Ex: 'Gostaria muito que tivesse conjuntos na cor vinho e verde esmeralda no tamanho GG!'"
                                        className="w-full px-4 py-3 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#7A3E4A] bg-[#FAF9F5]"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-4 bg-[#7A3E4A] text-white font-bold text-xs uppercase tracking-wider rounded-2xl hover:bg-[#5B6E57] transition-all shadow-md cursor-pointer disabled:opacity-50"
                                >
                                    {submitting ? 'Enviando Sugestão...' : 'Enviar Sugestão'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* TAB 2: POLLS */}
                    {activeTab === 'polls' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <span className="w-9 h-9 rounded-xl bg-[#7A3E4A]/10 text-[#7A3E4A] flex items-center justify-center shrink-0">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </span>
                                <div>
                                    <h2 className="font-heading text-lg md:text-xl font-bold text-[#1A1A1A] uppercase tracking-wider">
                                        Enquetes da Coleção
                                    </h2>
                                    <p className="text-xs text-gray-500 font-medium">
                                        Vote nas opções e ajude nossa equipe a escolher os próximos lançamentos!
                                    </p>
                                </div>
                            </div>

                            {polls.length === 0 ? (
                                <div className="text-center py-12 text-xs text-gray-500 bg-[#FAF9F5] rounded-2xl border border-gray-200">
                                    Nenhuma enquete ativa no momento. Volte em breve para novos lançamentos!
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {polls.length > 1 && (
                                        <div className="flex gap-2 overflow-x-auto pb-2">
                                            {polls.map((p, idx) => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => {
                                                        setSelectedPoll(p)
                                                        fetchVotesForPoll(p.id)
                                                    }}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                                                        selectedPoll?.id === p.id
                                                            ? 'bg-[#7A3E4A] text-white shadow-xs'
                                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                                >
                                                    Enquete #{idx + 1}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {selectedPoll && (
                                        <div className="bg-[#FAF9F5] border border-[#E8E0D8] rounded-2xl p-6 md:p-8 space-y-6">
                                            <h3 className="font-heading text-base md:text-lg font-bold text-[#1A1A1A]">
                                                {selectedPoll.question}
                                            </h3>

                                            {hasVotedPoll ? (
                                                <div className="space-y-4">
                                                    <p className="text-xs font-bold text-[#5B6E57] uppercase tracking-wider">
                                                        Você já votou nesta enquete. Resultados atuais ({totalVotes} votos):
                                                    </p>

                                                    {Array.isArray(selectedPoll.options) && selectedPoll.options.map(opt => {
                                                        const count = votesForCurrentPoll.filter(v => v.option_id === opt.id).length
                                                        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
                                                        return (
                                                            <div key={opt.id} className="space-y-1.5">
                                                                <div className="flex justify-between text-xs font-semibold text-gray-800">
                                                                    <span>{opt.text}</span>
                                                                    <span className="font-bold text-[#7A3E4A]">{pct}% ({count} votos)</span>
                                                                </div>
                                                                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                                                    <div 
                                                                        className="h-full bg-[#7A3E4A] rounded-full transition-all duration-500" 
                                                                        style={{ width: `${pct}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            ) : (
                                                <form onSubmit={handleVoteSubmit} className="space-y-4">
                                                    <div className="space-y-3">
                                                        {Array.isArray(selectedPoll.options) && selectedPoll.options.map(opt => (
                                                            <label
                                                                key={opt.id}
                                                                className={`flex items-center gap-4 p-4 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                                                                    selectedOption === opt.id
                                                                        ? 'border-[#7A3E4A] bg-[#7A3E4A]/10 text-[#7A3E4A]'
                                                                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                                                }`}
                                                            >
                                                                <input
                                                                    type="radio"
                                                                    name="poll_option"
                                                                    value={opt.id}
                                                                    checked={selectedOption === opt.id}
                                                                    onChange={() => setSelectedOption(opt.id)}
                                                                    className="accent-[#7A3E4A] w-4 h-4"
                                                                />
                                                                <span>{opt.text}</span>
                                                            </label>
                                                        ))}
                                                    </div>

                                                    {selectedPoll.allow_custom_text && (
                                                        <div className="pt-2">
                                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                                                Ou escreva sua sugestão de resposta:
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={customText}
                                                                onChange={e => setCustomText(e.target.value)}
                                                                placeholder="Digite sua resposta personalizada..."
                                                                className="w-full px-4 py-3 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#7A3E4A] bg-white"
                                                            />
                                                        </div>
                                                    )}

                                                    <button
                                                        type="submit"
                                                        disabled={submitting || (!selectedOption && !customText.trim())}
                                                        className="w-full py-3.5 bg-[#7A3E4A] text-white font-bold text-xs uppercase tracking-wider rounded-2xl hover:bg-[#5B6E57] transition-all shadow-md cursor-pointer disabled:opacity-50"
                                                    >
                                                        {submitting ? 'Votando...' : 'Confirmar Voto'}
                                                    </button>
                                                </form>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 3: PRODUCT REQUEST */}
                    {activeTab === 'request' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <span className="w-9 h-9 rounded-xl bg-[#7A3E4A]/10 text-[#7A3E4A] flex items-center justify-center shrink-0">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                </span>
                                <div>
                                    <h2 className="font-heading text-lg md:text-xl font-bold text-[#1A1A1A] uppercase tracking-wider">
                                        Encomende um Produto Específico
                                    </h2>
                                    <p className="text-xs text-gray-500 font-medium">
                                        Procurando um produto específico ou foto de inspiração? Faça sua solicitação para trazermos até você!
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleProductRequestSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Seu Nome *</label>
                                        <input
                                            required
                                            type="text"
                                            value={reqName}
                                            onChange={e => setReqName(e.target.value)}
                                            placeholder="Ex: Ana Paula"
                                            className="w-full px-4 py-3 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#7A3E4A] bg-[#FAF9F5]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Seu WhatsApp *</label>
                                        <input
                                            required
                                            type="tel"
                                            value={reqPhone}
                                            onChange={e => setReqPhone(e.target.value)}
                                            placeholder="(11) 99999-9999"
                                            className="w-full px-4 py-3 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#7A3E4A] bg-[#FAF9F5]"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Nome da Peça ou Descrição do Modelo *</label>
                                    <input
                                        required
                                        type="text"
                                        value={reqProdName}
                                        onChange={e => setReqProdName(e.target.value)}
                                        placeholder="Ex: Corset de Renda Vinho, Body Manga Longa, etc."
                                        className="w-full px-4 py-3 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#7A3E4A] bg-[#FAF9F5]"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Cor Desejada</label>
                                        <input
                                            type="text"
                                            value={reqColor}
                                            onChange={e => setReqColor(e.target.value)}
                                            placeholder="Ex: Vermelho, Preto"
                                            className="w-full px-4 py-3 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#7A3E4A] bg-[#FAF9F5]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Tamanho</label>
                                        <select
                                            value={reqSize}
                                            onChange={e => setReqSize(e.target.value)}
                                            className="w-full px-4 py-3 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#7A3E4A] bg-[#FAF9F5]"
                                        >
                                            <option>P</option>
                                            <option>M</option>
                                            <option>G</option>
                                            <option>GG</option>
                                            <option>EG (Plus)</option>
                                            <option>G1</option>
                                            <option>G2</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Faixa de Preço Desejada</label>
                                        <select
                                            value={reqPriceRange}
                                            onChange={e => setReqPriceRange(e.target.value)}
                                            className="w-full px-4 py-3 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#7A3E4A] bg-[#FAF9F5]"
                                        >
                                            <option>Até R$ 99</option>
                                            <option>Até R$ 150</option>
                                            <option>De R$ 150 a R$ 250</option>
                                            <option>Acima de R$ 250</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Foto de Referência (Opcional)</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                        className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#7A3E4A]/10 file:text-[#7A3E4A] cursor-pointer"
                                    />
                                    {reqPhotoPreview && (
                                        <div className="mt-3 w-24 h-24 rounded-xl overflow-hidden border border-gray-200">
                                            <img src={reqPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Detalhes Adicionais</label>
                                    <textarea
                                        rows={3}
                                        value={reqDesc}
                                        onChange={e => setReqDesc(e.target.value)}
                                        placeholder="Detalhes sobre tecido, bojo, alça, caimento..."
                                        className="w-full px-4 py-3 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#7A3E4A] bg-[#FAF9F5]"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-4 bg-[#7A3E4A] text-white font-bold text-xs uppercase tracking-wider rounded-2xl hover:bg-[#5B6E57] transition-all shadow-md cursor-pointer disabled:opacity-50"
                                >
                                    {submitting ? 'Registrando Pedido...' : 'Enviar Solicitação de Peça'}
                                </button>
                            </form>
                        </div>
                    )}

                </div>
            </main>

            <BenefitsBar />
            <Footer />
            <WhatsAppButton />
        </div>
    )
}
