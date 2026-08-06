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
    const [searchOpen, setSearchOpen] = useState(false)

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
        // Load counts
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
            setFeedbackMsg('✨ Sua sugestão foi enviada com sucesso para nossa equipe! Muito obrigada.')
            setSugMessage('')
            setTimeout(() => setFeedbackMsg(''), 5000)
        } else {
            setFeedbackMsg('❌ Erro ao enviar. Tente novamente.')
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
            setFeedbackMsg('📊 Voto computado com sucesso! Obrigada pela participação.')
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
            setFeedbackMsg('🛍️ Sua solicitação foi registrada! Avisaremos você assim que o produto estiver disponível.')
            setReqProdName('')
            setReqDesc('')
            setReqPhotoFile(null)
            setReqPhotoPreview('')
            setTimeout(() => setFeedbackMsg(''), 5000)
        } else {
            setFeedbackMsg('❌ Ocorreu um erro ao enviar seu pedido. Tente novamente.')
        }
    }

    const votesForCurrentPoll = (selectedPoll && pollVotesMap[selectedPoll.id]) || []
    const totalVotes = votesForCurrentPoll.length

    return (
        <div className="min-h-screen bg-[#FAF9F5] flex flex-col font-sans">
            <Header
                cartCount={cartCount}
                wishlistCount={wishlistCount}
                onSearchOpen={() => setSearchOpen(true)}
            />

            {/* Hero Section */}
            <section className="bg-gradient-to-r from-[#7A3E4A] via-[#9A5060] to-[#5B6E57] text-white py-12 md:py-16 px-4">
                <div className="max-w-4xl mx-auto text-center space-y-4">
                    <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.25em] border border-white/30">
                        Espaço Interativo
                    </span>
                    <h1 className="font-heading text-3xl md:text-5xl font-extrabold tracking-wider uppercase">
                        Central da Cliente Meraki
                    </h1>
                    <p className="text-sm md:text-base text-white/90 max-w-2xl mx-auto font-medium">
                        Sua opinião molda nossas próximas coleções. Envie sugestões, participe das enquetes ou solicite produtos exclusivos!
                    </p>
                </div>
            </section>

            {/* Main Content Area */}
            <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-10 -mt-6">
                
                {/* Navigation Tabs */}
                <div className="bg-white rounded-2xl shadow-xl p-2 border border-[#E8E0D8] flex flex-wrap gap-2 mb-8">
                    <button
                        onClick={() => { setActiveTab('suggestions'); setFeedbackMsg(''); }}
                        className={`flex-1 py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                            activeTab === 'suggestions'
                                ? 'bg-gradient-to-r from-[#7A3E4A] to-[#9A5060] text-white shadow-md'
                                : 'bg-transparent text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        💬 Mural de Sugestões
                    </button>
                    <button
                        onClick={() => { setActiveTab('polls'); setFeedbackMsg(''); }}
                        className={`flex-1 py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                            activeTab === 'polls'
                                ? 'bg-gradient-to-r from-[#7A3E4A] to-[#9A5060] text-white shadow-md'
                                : 'bg-transparent text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        📊 Enquetes & Votação
                    </button>
                    <button
                        onClick={() => { setActiveTab('request'); setFeedbackMsg(''); }}
                        className={`flex-1 py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                            activeTab === 'request'
                                ? 'bg-gradient-to-r from-[#7A3E4A] to-[#9A5060] text-white shadow-md'
                                : 'bg-transparent text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        🛍️ Encomendar Produto
                    </button>
                </div>

                {/* Feedback Notification */}
                {feedbackMsg && (
                    <div className="mb-6 p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold text-center shadow-xs animate-[fadeIn_200ms_ease-out]">
                        {feedbackMsg}
                    </div>
                )}

                {/* Tab Card Container */}
                <div className="bg-white rounded-3xl p-6 md:p-10 shadow-xl border border-[#E8E0D8]">
                    
                    {/* TAB 1: SUGGESTIONS */}
                    {activeTab === 'suggestions' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="font-heading text-xl font-bold text-[#1A1A1A] uppercase tracking-wider">
                                    💬 Escreva sua Sugestão
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">
                                    Conte para nossa equipe qual modelo, cor ou tamanho você adoraria ver em nosso catálogo!
                                </p>
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
                                    className="w-full py-4 bg-[#7A3E4A] text-white font-bold text-xs uppercase tracking-wider rounded-2xl hover:bg-[#5B6E57] transition-all shadow-lg shadow-[#7A3E4A]/20 cursor-pointer disabled:opacity-50"
                                >
                                    {submitting ? 'Enviando Sugestão...' : 'Enviar Sugestão'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* TAB 2: POLLS */}
                    {activeTab === 'polls' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="font-heading text-xl font-bold text-[#1A1A1A] uppercase tracking-wider">
                                    📊 Enquetes da Coleção
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">
                                    Vote nas opções e ajude nossa equipe a escolher os próximos lançamentos!
                                </p>
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
                                                            ? 'bg-[#7A3E4A] text-white shadow-md'
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
                                            <h3 className="font-heading text-lg font-bold text-[#1A1A1A]">
                                                {selectedPoll.question}
                                            </h3>

                                            {hasVotedPoll ? (
                                                <div className="space-y-4">
                                                    <p className="text-xs font-bold text-[#5B6E57] uppercase tracking-wider">
                                                        ✅ Você já votou nesta enquete. Resultados atuais ({totalVotes} votos):
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
                                                                        className="h-full bg-gradient-to-r from-[#7A3E4A] to-[#9A5060] rounded-full transition-all duration-500" 
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
                                                                        ? 'border-[#7A3E4A] bg-[#7A3E4A]/10 text-[#7A3E4A] shadow-xs'
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
                            <div>
                                <h2 className="font-heading text-xl font-bold text-[#1A1A1A] uppercase tracking-wider">
                                    🛍️ Encomende um Produto Específico
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">
                                    Procurando um produto específico ou foto de inspiração? Faça sua solicitação para trazermos até você!
                                </p>
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
                                    className="w-full py-4 bg-[#7A3E4A] text-white font-bold text-xs uppercase tracking-wider rounded-2xl hover:bg-[#5B6E57] transition-all shadow-lg shadow-[#7A3E4A]/20 cursor-pointer disabled:opacity-50"
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
