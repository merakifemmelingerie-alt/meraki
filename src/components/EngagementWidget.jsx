import { useState, useEffect } from 'react'
import { submitSuggestion, getPolls, submitPollVote, getPollVotes, submitProductRequest } from '../services/database.js'

export default function EngagementWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [activeTab, setActiveTab] = useState('suggestions') // 'suggestions' | 'polls' | 'request'
    const [submitting, setSubmitting] = useState(false)
    const [feedbackMsg, setFeedbackMsg] = useState('')

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
        if (isOpen) {
            loadPollsData()
        }
    }, [isOpen])

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
            setTimeout(() => setFeedbackMsg(''), 4000)
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
            setTimeout(() => setFeedbackMsg(''), 4000)
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

    // Calculate poll percentage
    const votesForCurrentPoll = (selectedPoll && pollVotesMap[selectedPoll.id]) || []
    const totalVotes = votesForCurrentPoll.length

    return (
        <>
            {/* Floating Trigger Button */}
            <div className="fixed bottom-6 left-6 z-[9000]">
                <button
                    onClick={() => setIsOpen(true)}
                    className="group flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-[#7A3E4A] to-[#9A5060] text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-2xl hover:scale-105 transition-all duration-300 border border-white/20"
                >
                    <span className="text-base animate-bounce">💬</span>
                    <span className="hidden sm:inline">Sugestões & Pedidos</span>
                    <span className="sm:hidden">Sugestões</span>
                </button>
            </div>

            {/* Modal Dialog */}
            {isOpen && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div 
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
                    />

                    {/* Modal Window */}
                    <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden z-10 border border-[#E8E0D8] animate-[fadeInUp_300ms_ease-out] flex flex-col max-h-[90vh]">
                        
                        {/* Header */}
                        <div className="bg-gradient-to-r from-[#7A3E4A] to-[#5B6E57] text-white p-5 flex items-center justify-between">
                            <div>
                                <h3 className="font-heading text-lg font-bold tracking-wider uppercase">Central da Cliente</h3>
                                <p className="text-[11px] text-white/80 font-medium">Sua opinião constrói as próximas coleções da Meraki Femme</p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/40 transition-colors cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex border-b border-gray-100 bg-[#FAF9F5]">
                            <button
                                onClick={() => { setActiveTab('suggestions'); setFeedbackMsg(''); }}
                                className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
                                    activeTab === 'suggestions'
                                        ? 'border-[#7A3E4A] text-[#7A3E4A] bg-white'
                                        : 'border-transparent text-gray-500 hover:text-gray-900'
                                }`}
                            >
                                💬 Sugestões
                            </button>
                            <button
                                onClick={() => { setActiveTab('polls'); setFeedbackMsg(''); }}
                                className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
                                    activeTab === 'polls'
                                        ? 'border-[#7A3E4A] text-[#7A3E4A] bg-white'
                                        : 'border-transparent text-gray-500 hover:text-gray-900'
                                }`}
                            >
                                📊 Enquetes
                            </button>
                            <button
                                onClick={() => { setActiveTab('request'); setFeedbackMsg(''); }}
                                className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
                                    activeTab === 'request'
                                        ? 'border-[#7A3E4A] text-[#7A3E4A] bg-white'
                                        : 'border-transparent text-gray-500 hover:text-gray-900'
                                }`}
                            >
                                🛍️ Pedir Produto
                            </button>
                        </div>

                        {/* Feedback Banner */}
                        {feedbackMsg && (
                            <div className="p-3 bg-[#FAF9F5] text-[#7A3E4A] text-xs font-bold text-center border-b border-[#E8E0D8]">
                                {feedbackMsg}
                            </div>
                        )}

                        {/* Tab Contents */}
                        <div className="p-6 overflow-y-auto flex-1">
                            
                            {/* TAB 1: SUGGESTIONS */}
                            {activeTab === 'suggestions' && (
                                <form onSubmit={handleSuggestionSubmit} className="space-y-4">
                                    <p className="text-xs text-gray-600">
                                        Escreva abaixo suas ideias, desejos de cores ou modelos que você gostaria de ver na Meraki Femme!
                                    </p>
                                    
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Seu Nome (Opcional)</label>
                                        <input
                                            type="text"
                                            value={sugName}
                                            onChange={e => setSugName(e.target.value)}
                                            placeholder="Ex: Maria Silva"
                                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#7A3E4A]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">WhatsApp para Contato (Opcional)</label>
                                        <input
                                            type="tel"
                                            value={sugPhone}
                                            onChange={e => setSugPhone(e.target.value)}
                                            placeholder="(11) 99999-9999"
                                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#7A3E4A]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Categoria da Sugestão</label>
                                        <select
                                            value={sugCategory}
                                            onChange={e => setSugCategory(e.target.value)}
                                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#7A3E4A] bg-white"
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
                                            rows={4}
                                            value={sugMessage}
                                            onChange={e => setSugMessage(e.target.value)}
                                            placeholder="Ex: 'Gostaria muito que tivesse conjuntos na cor vinho e verde esmeralda no tamanho GG!'"
                                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#7A3E4A]"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full py-3 bg-[#7A3E4A] text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#5B6E57] transition-colors disabled:opacity-50"
                                    >
                                        {submitting ? 'Enviando...' : 'Enviar Sugestão'}
                                    </button>
                                </form>
                            )}

                            {/* TAB 2: POLLS */}
                            {activeTab === 'polls' && (
                                <div>
                                    {polls.length === 0 ? (
                                        <div className="text-center py-8 text-xs text-gray-500">
                                            Nenhuma enquete ativa no momento. Volte em breve!
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {/* Poll selector if multiple */}
                                            {polls.length > 1 && (
                                                <div className="flex gap-2 overflow-x-auto pb-2">
                                                    {polls.map((p, idx) => (
                                                        <button
                                                            key={p.id}
                                                            onClick={() => {
                                                                setSelectedPoll(p)
                                                                fetchVotesForPoll(p.id)
                                                            }}
                                                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
                                                                selectedPoll?.id === p.id
                                                                    ? 'bg-[#7A3E4A] text-white'
                                                                    : 'bg-gray-100 text-gray-600'
                                                            }`}
                                                        >
                                                            Enquete #{idx + 1}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {selectedPoll && (
                                                <div className="bg-[#FAF9F5] border border-[#E8E0D8] rounded-2xl p-5 space-y-4">
                                                    <h4 className="font-heading text-sm font-bold text-[#1A1A1A]">
                                                        {selectedPoll.question}
                                                    </h4>

                                                    {/* If voted or results view */}
                                                    {hasVotedPoll ? (
                                                        <div className="space-y-3 pt-2">
                                                            <p className="text-[10px] font-bold text-[#5B6E57] uppercase tracking-wider">
                                                                ✅ Você já votou nesta enquete. Resultados atuais ({totalVotes} votos):
                                                            </p>

                                                            {Array.isArray(selectedPoll.options) && selectedPoll.options.map(opt => {
                                                                const count = votesForCurrentPoll.filter(v => v.option_id === opt.id).length
                                                                const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
                                                                return (
                                                                    <div key={opt.id} className="space-y-1">
                                                                        <div className="flex justify-between text-xs font-semibold text-gray-700">
                                                                            <span>{opt.text}</span>
                                                                            <span>{pct}% ({count})</span>
                                                                        </div>
                                                                        <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
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
                                                        /* Voting Form */
                                                        <form onSubmit={handleVoteSubmit} className="space-y-3">
                                                            <div className="space-y-2">
                                                                {Array.isArray(selectedPoll.options) && selectedPoll.options.map(opt => (
                                                                    <label
                                                                        key={opt.id}
                                                                        className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
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
                                                                            className="accent-[#7A3E4A]"
                                                                        />
                                                                        <span>{opt.text}</span>
                                                                    </label>
                                                                ))}
                                                            </div>

                                                            {selectedPoll.allow_custom_text && (
                                                                <div>
                                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                                                        Outra opção / Comentário (Opcional):
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        value={customText}
                                                                        onChange={e => setCustomText(e.target.value)}
                                                                        placeholder="Digite sua resposta personalizada..."
                                                                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#7A3E4A]"
                                                                    />
                                                                </div>
                                                            )}

                                                            <button
                                                                type="submit"
                                                                disabled={submitting || (!selectedOption && !customText.trim())}
                                                                className="w-full py-2.5 bg-[#7A3E4A] text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#5B6E57] transition-colors disabled:opacity-50"
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
                                <form onSubmit={handleProductRequestSubmit} className="space-y-4">
                                    <p className="text-xs text-gray-600">
                                        Não encontrou o modelo que procurava? Faça uma solicitação especial de compra!
                                    </p>

                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Seu Nome *</label>
                                        <input
                                            required
                                            type="text"
                                            value={reqName}
                                            onChange={e => setReqName(e.target.value)}
                                            placeholder="Ex: Ana Paula"
                                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#7A3E4A]"
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
                                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#7A3E4A]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Nome do Produto ou Tipo de Peça *</label>
                                        <input
                                            required
                                            type="text"
                                            value={reqProdName}
                                            onChange={e => setReqProdName(e.target.value)}
                                            placeholder="Ex: Corset de Renda Vinho, Body Manga Longa, etc."
                                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#7A3E4A]"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Cor Desejada</label>
                                            <input
                                                type="text"
                                                value={reqColor}
                                                onChange={e => setReqColor(e.target.value)}
                                                placeholder="Ex: Vermelho, Preto"
                                                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#7A3E4A]"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Tamanho</label>
                                            <select
                                                value={reqSize}
                                                onChange={e => setReqSize(e.target.value)}
                                                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#7A3E4A] bg-white"
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
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Faixa de Preço Desejada</label>
                                        <select
                                            value={reqPriceRange}
                                            onChange={e => setReqPriceRange(e.target.value)}
                                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#7A3E4A] bg-white"
                                        >
                                            <option>Até R$ 99</option>
                                            <option>Até R$ 150</option>
                                            <option>De R$ 150 a R$ 250</option>
                                            <option>Acima de R$ 250</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Foto de Referência (Opcional)</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handlePhotoChange}
                                            className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#7A3E4A]/10 file:text-[#7A3E4A] cursor-pointer"
                                        />
                                        {reqPhotoPreview && (
                                            <div className="mt-2 w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
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
                                            placeholder="Detalhes sobre tecido, bojo, alça, etc."
                                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#7A3E4A]"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full py-3 bg-[#7A3E4A] text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#5B6E57] transition-colors disabled:opacity-50"
                                    >
                                        {submitting ? 'Registrando Pedido...' : 'Enviar Solicitação de Peça'}
                                    </button>
                                </form>
                            )}

                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
