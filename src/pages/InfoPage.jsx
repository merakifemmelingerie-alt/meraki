import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import BenefitsBar from '../components/BenefitsBar.jsx'
import Footer from '../components/Footer.jsx'
import { getAssetUrl } from '../utils/assets.js'
import WhatsAppButton from '../components/WhatsAppButton.jsx'

export default function InfoPage({ tab: propTab }) {
    const { tab: urlTab } = useParams()
    const [activeTab, setActiveTab] = useState(propTab || urlTab || 'story')
    const [wishlist, setWishlist] = useState([])
    const [products, setProducts] = useState([])
    const [cartCount, setCartCount] = useState(0)
    const [wishlistCount, setWishlistCount] = useState(0)
    const [searchOpen, setSearchOpen] = useState(false)
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [storeConfig, setStoreConfig] = useState({
        whatsapp: '5511999999999',
        sac_phone: '(11) 2388-0403',
        address: 'Avenida Alfredo Nasser, Qd. 14, Lt. 05 - Centro, Bonfinópolis - GO, CEP: 75195-000'
    })
    const [customPages, setCustomPages] = useState(() => {
        try {
            const stored = localStorage.getItem('meraki_pages_content')
            if (stored) return JSON.parse(stored)
        } catch {}
        return {}
    })

    const [customPagesList, setCustomPagesList] = useState(() => {
        try {
            const stored = localStorage.getItem('meraki_custom_pages_list')
            if (stored) return JSON.parse(stored)
        } catch {}
        return []
    })

    const [deletedPages, setDeletedPages] = useState(() => {
        try {
            const stored = localStorage.getItem('meraki_deleted_pages')
            if (stored) return JSON.parse(stored)
        } catch {}
        return []
    })

    // Sync active tab with route param or prop
    useEffect(() => {
        if (propTab) {
            setActiveTab(propTab)
        } else if (urlTab) {
            setActiveTab(urlTab)
        }
    }, [urlTab, propTab])

    // Load wishlist, products, cart counts, and pages content
    useEffect(() => {
        const loadPages = () => {
            try {
                const storedPages = localStorage.getItem('meraki_pages_content')
                if (storedPages) setCustomPages(JSON.parse(storedPages))
                const storedDeleted = localStorage.getItem('meraki_deleted_pages')
                if (storedDeleted) setDeletedPages(JSON.parse(storedDeleted))
                const storedCustom = localStorage.getItem('meraki_custom_pages_list')
                if (storedCustom) setCustomPagesList(JSON.parse(storedCustom))
            } catch {}
        }
        loadPages()
        window.addEventListener('pagesContentUpdated', loadPages)
        window.addEventListener('storage', loadPages)

        const storedWishlist = JSON.parse(localStorage.getItem('meraki_wishlist') || '[]')
        setWishlist(storedWishlist)
        setWishlistCount(storedWishlist.length)

        const storedProducts = JSON.parse(localStorage.getItem('meraki_products') || '[]')
        setProducts(storedProducts.filter(p => p && p.name))

        const storedCart = JSON.parse(localStorage.getItem('meraki_cart') || '[]')
        setCartCount(storedCart.reduce((acc, item) => acc + item.quantity, 0))

        const config = JSON.parse(localStorage.getItem('meraki_store_config'))
        if (config) {
            setStoreConfig(config)
            if (config.pages_content) setCustomPages(config.pages_content)
            if (config.deleted_pages) setDeletedPages(config.deleted_pages)
            if (config.custom_pages_list) setCustomPagesList(config.custom_pages_list)
        }

        return () => {
            window.removeEventListener('pagesContentUpdated', loadPages)
            window.removeEventListener('storage', loadPages)
        }
    }, [])

    const handleRemoveFromWishlist = (productId) => {
        const updated = wishlist.filter(id => id !== productId)
        setWishlist(updated)
        setWishlistCount(updated.length)
        localStorage.setItem('meraki_wishlist', JSON.stringify(updated))
    }

    const handleAddToCart = (product) => {
        const storedCart = JSON.parse(localStorage.getItem('meraki_cart') || '[]')
        const existing = storedCart.find(item => item.id === product.id)
        
        if (existing) {
            existing.quantity += 1
        } else {
            storedCart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: Array.isArray(product.image) ? product.image[0] : product.image,
                quantity: 1,
                size: product.sizes ? (typeof product.sizes === 'string' ? product.sizes.split(',')[0].trim() : product.sizes[0]) : 'U'
            })
        }
        
        localStorage.setItem('meraki_cart', JSON.stringify(storedCart))
        setCartCount(storedCart.reduce((acc, item) => acc + item.quantity, 0))
        window.dispatchEvent(new Event('cartUpdated'))
    }

    // Dynamically combine custom pages from customPagesList & customPages content
    const allCustomSections = useMemo(() => {
        const standardIds = ['story', 'revenda', 'connect', 'wishlist', 'security', 'payment', 'delivery', 'returns', 'withdrawal', 'privacy', 'promotional-rules', 'stores']
        const pageKeys = Object.keys(customPages || {})
        const listFromContent = []
        for (const key of pageKeys) {
            if (!standardIds.includes(key) && !customPagesList.some(p => p.id === key)) {
                const item = customPages[key]
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
    }, [customPages, customPagesList])

    // List of tabs/sections
    const masterSections = [
        { id: 'story', label: 'História', category: 'Sobre' },
        { id: 'revenda', label: 'Seja um Revendedor', category: 'Sobre' },
        { id: 'connect', label: 'Conecte-se', category: 'Sobre' },
        { id: 'wishlist', label: 'Favoritos (Wishlist)', category: 'Conta' },
        { id: 'security', label: 'Compra Segura', category: 'Atendimento' },
        { id: 'payment', label: 'Formas de Pagamento', category: 'Atendimento' },
        { id: 'delivery', label: 'Entrega e Frete', category: 'Atendimento' },
        { id: 'returns', label: 'Política de Troca', category: 'Atendimento' },
        { id: 'withdrawal', label: 'Direito de Arrependimento', category: 'Atendimento' },
        { id: 'privacy', label: 'Política de Privacidade', category: 'Atendimento' },
        { id: 'promotional-rules', label: 'Regras Promocionais', category: 'Atendimento' },
        { id: 'stores', label: 'Nossas Lojas', category: 'Lojas' },
        ...allCustomSections
    ]

    const sections = masterSections
        .filter(s => !deletedPages.includes(s.id))
        .map(s => {
            const custom = customPages[s.id]
            if (custom && custom.title) {
                return { ...s, label: custom.title }
            }
            return s
        })

    // Content definitions
    const renderContent = () => {
        const custom = customPages[activeTab]
        if (custom && custom.content) {
            const isHtml = /<[a-z][\s\S]*>/i.test(custom.content)
            return (
                <div className="space-y-6 animate-[fadeIn_200ms_ease-out]">
                    <h2 className="text-2xl font-bold text-gray-900 border-b pb-4">
                        {custom.title || sections.find(s => s.id === activeTab)?.label}
                    </h2>
                    {isHtml ? (
                        <div 
                            className="prose prose-stone max-w-none text-sm leading-relaxed text-gray-600 space-y-4"
                            dangerouslySetInnerHTML={{ __html: custom.content }}
                        />
                    ) : (
                        custom.content.split('\n\n').filter(Boolean).map((p, idx) => (
                            <p key={idx} className="text-sm leading-relaxed text-gray-600 whitespace-pre-line">
                                {p}
                            </p>
                        ))
                    )}
                </div>
            )
        }

        switch (activeTab) {
            case 'story':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 border-b pb-4">Nossa História</h2>
                        <p className="text-sm leading-relaxed text-gray-600">
                            A <strong className="text-[#7A3E4A]">Meraki</strong> nasceu do desejo de celebrar a beleza autêntica e a sofisticação da mulher moderna. Fundada em 2023, nossa marca tem como propósito criar lingeries que oferecem o equilíbrio perfeito entre sensualidade, conforto e qualidade excepcional.
                        </p>
                        <p className="text-sm leading-relaxed text-gray-600">
                            O termo grego <em>"Meraki"</em> significa fazer algo com alma, criatividade ou amor; colocar uma parte de si em tudo o que faz. Essa filosofia está presente em cada detalhe de nosso processo: desde a escolha cuidadosa das rendas francesas de toque macio até o design das costuras e acabamentos manuais de luxo.
                        </p>
                        <blockquote className="border-l-4 border-[#7A3E4A] pl-4 italic text-sm text-gray-500 my-4 bg-gray-50 py-3 rounded-r-md">
                            "Acreditamos que a primeira camada de roupa que uma mulher veste tem o poder de transformar como ela se sente por fora e por dentro."
                        </blockquote>
                        <p className="text-sm leading-relaxed text-gray-600">
                            Hoje, contamos com ateliê próprio e coleções exclusivas criadas para abraçar a diversidade dos corpos femininos com caimento impecável e modelagem inteligente.
                        </p>
                    </div>
                )
            case 'revenda':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 border-b pb-4">Seja um Revendedor</h2>
                        <p className="text-sm leading-relaxed text-gray-600">
                            Aumente sua renda revendendo lingeries premium de altíssima aceitação. O programa de revendedoras da <strong className="text-[#7A3E4A]">Meraki</strong> foi desenvolvido para quem busca flexibilidade de horários, independência financeira e um produto com design autoral diferenciado.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
                                <h3 className="text-xs font-bold text-[#7A3E4A] uppercase tracking-wider mb-2">Margens de Lucro</h3>
                                <p className="text-xs text-gray-500 leading-relaxed">Condições comerciais e descontos progressivos atrativos para compras no atacado.</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
                                <h3 className="text-xs font-bold text-[#7A3E4A] uppercase tracking-wider mb-2">Fotos & Catálogos</h3>
                                <p className="text-xs text-gray-500 leading-relaxed">Acesso completo a materiais fotográficos de alta qualidade para divulgação nas suas redes sociais.</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
                                <h3 className="text-xs font-bold text-[#7A3E4A] uppercase tracking-wider mb-2">Sem Burocracia</h3>
                                <p className="text-xs text-gray-500 leading-relaxed">Pedido mínimo inicial reduzido e reposição rápida de peças conforme a sua demanda.</p>
                            </div>
                        </div>
                        <p className="text-sm leading-relaxed text-gray-600">
                            Para receber nosso catálogo de atacado e a tabela de valores de revenda, envie um e-mail para <span className="text-[#7A3E4A] font-bold">revenda@merakistore.com.br</span> ou entre em contato pelo nosso WhatsApp de atendimento comercial.
                        </p>
                    </div>
                )
            case 'connect':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 border-b pb-4">Conecte-se</h2>
                        <p className="text-sm leading-relaxed text-gray-600">
                            Acompanhe de perto as nossas novidades, coleções exclusivas e bastidores da marca em nossos canais oficiais de comunicação.
                        </p>
                        <div className="space-y-4 my-6">
                            <div className="flex items-center gap-3 text-sm text-gray-650">
                                <span className="w-8 h-8 rounded-full bg-[#7A3E4A]/10 text-[#7A3E4A] flex items-center justify-center font-bold">IG</span>
                                <div>
                                    <p className="font-bold text-gray-800">Instagram</p>
                                    <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-[#7A3E4A] hover:underline text-xs">@merakistore.oficial</a>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-650">
                                <span className="w-8 h-8 rounded-full bg-[#7A3E4A]/10 text-[#7A3E4A] flex items-center justify-center font-bold">WA</span>
                                <div>
                                    <p className="font-bold text-gray-800">WhatsApp VIP</p>
                                    <a href="https://wa.me/551123880403" className="text-[#7A3E4A] hover:underline text-xs">(11) 2388-0403</a>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-650">
                                <span className="w-8 h-8 rounded-full bg-[#7A3E4A]/10 text-[#7A3E4A] flex items-center justify-center font-bold">EM</span>
                                <div>
                                    <p className="font-bold text-gray-800">Atendimento Geral</p>
                                    <a href="mailto:contato@merakistore.com.br" className="text-[#7A3E4A] hover:underline text-xs">contato@merakistore.com.br</a>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            case 'security':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 border-b pb-4">Compra Segura</h2>
                        <p className="text-sm leading-relaxed text-gray-600">
                            Para nós da Meraki, a segurança dos seus dados pessoais e de pagamento é prioridade absoluta. Investimos nas melhores tecnologias de criptografia do mercado para proporcionar a você uma experiência de compra tranquila e protegida.
                        </p>
                        <h3 className="text-sm font-bold text-[#7A3E4A] uppercase tracking-wider mt-4">Nossas Certificações</h3>
                        <ul className="list-disc pl-5 text-xs text-gray-650 space-y-2">
                            <li><strong>Criptografia SSL (Secure Sockets Layer):</strong> Protege e codifica toda a comunicação de dados durante as transações financeiras e preenchimento de senhas.</li>
                            <li><strong>Certificado Let's Encrypt:</strong> Garante a autenticidade e a criptografia ponto a ponto de ponta em todas as conexões da plataforma.</li>
                            <li><strong>Proteção Antifraude Integrada:</strong> Análise de segurança automática com validação instantânea dos meios de pagamento.</li>
                        </ul>
                    </div>
                )
            case 'payment':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 border-b pb-4">Formas de Pagamento</h2>
                        <p className="text-sm leading-relaxed text-gray-600">
                            Disponibilizamos formas de pagamento flexíveis e seguras para facilitar o processo de compra das suas lingeries prediletas.
                        </p>
                        <div className="space-y-4 my-6">
                            <div className="p-4 rounded-xl border border-gray-150 bg-[#FAF9F5]">
                                <h3 className="text-xs font-bold text-[#7A3E4A] uppercase tracking-wider mb-2">Cartão de Crédito</h3>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    Aceitamos as bandeiras Visa, Mastercard, Elo, American Express e Diners Club. Você pode parcelar suas compras em até <strong>12x sem juros</strong>.
                                </p>
                            </div>
                            <div className="p-4 rounded-xl border border-gray-150 bg-[#FAF9F5]">
                                <h3 className="text-xs font-bold text-[#7A3E4A] uppercase tracking-wider mb-2">Pix (Comunicação Rápida)</h3>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    Pagamentos via Pix são processados em tempo real, agilizando a expedição e o envio imediato da sua compra. Aproveite campanhas de <strong>10% OFF</strong> ativas na primeira compra.
                                </p>
                            </div>
                        </div>
                    </div>
                )
            case 'delivery':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 border-b pb-4">Entrega e Frete</h2>
                        <p className="text-sm leading-relaxed text-gray-600">
                            Entregamos em todo o Brasil por meio de transportadoras homologadas e dos Correios, com códigos de rastreamento enviados diretamente ao seu e-mail após a postagem.
                        </p>
                        <h3 className="text-sm font-bold text-[#7A3E4A] uppercase tracking-wider mt-4">Condições Especiais</h3>
                        <ul className="list-disc pl-5 text-xs text-gray-650 space-y-2">
                            <li><strong>Frete Grátis:</strong> Disponível nas compras acima de <strong>R$ 299,90</strong> para estados do Centro-Oeste.</li>
                            <li><strong>Prazo de Expedição:</strong> Pedidos aprovados são separados, revisados e postados em até 24 horas úteis.</li>
                            <li><strong>Opções de Envio:</strong> Modalidades Sedex (Expressa) e PAC (Normal), cotadas no fechamento do carrinho.</li>
                        </ul>
                    </div>
                )
            case 'returns':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 border-b pb-4">Política de Troca</h2>
                        <p className="text-sm leading-relaxed text-gray-600">
                            Queremos que você se sinta plenamente satisfeita com a sua lingerie Meraki. Por se tratar de peças íntimas e por questões de higiene e saúde, <strong>não realizamos devoluções ou reembolsos</strong>, mas oferecemos um processo de troca seguro e descomplicado.
                        </p>
                        <h3 className="text-sm font-bold text-[#7A3E4A] uppercase tracking-wider mt-4">Regras de Troca</h3>
                        <ul className="list-disc pl-5 text-xs text-gray-650 space-y-2">
                            <li><strong>Prazo de Solicitação:</strong> Até <strong>7 dias corridos</strong> após a entrega do produto, contados conforme o rastreamento da transportadora.</li>
                            <li><strong>Condições da Peça:</strong> Os produtos não podem apresentar qualquer sinal de uso, prova inadequada, lavagem, manchas, odores ou alterações e devem conter a etiqueta original fixada.</li>
                            <li><strong>Troca por tamanho ou modelo:</strong> O frete de retorno do produto para troca é custeado pela Meraki por meio de código de autorização de postagem reversa na primeira troca.</li>
                        </ul>
                    </div>
                )
            case 'withdrawal':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 border-b pb-4">Direito de Arrependimento</h2>
                        <p className="text-sm leading-relaxed text-gray-600">
                            De acordo com o artigo 49 do Código de Defesa do Consumidor brasileiro, nas compras realizadas fora do estabelecimento físico (via internet), o cliente possui o direito de arrependimento e cancelamento da compra.
                        </p>
                        <h3 className="text-sm font-bold text-[#7A3E4A] uppercase tracking-wider mt-4">Procedimento</h3>
                        <ul className="list-disc pl-5 text-xs text-gray-650 space-y-2">
                            <li>O arrependimento deve ser formalizado em até <strong>7 dias corridos</strong> a partir do recebimento da encomenda.</li>
                            <li>Após o recebimento e análise de controle de qualidade das lingeries em nosso ateliê, o reembolso do valor total pago é realizado em até 5 dias úteis no caso de Pix, ou estornado em até duas faturas no caso de cartão de crédito.</li>
                        </ul>
                    </div>
                )
            case 'privacy':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 border-b pb-4">Política de Privacidade</h2>
                        <p className="text-sm leading-relaxed text-gray-600">
                            Esta Política de Privacidade descreve como tratamos e protegemos as suas informações cadastrais e dados de navegação ao interagir em nossa plataforma digital, seguindo rigorosamente a <strong>Lei Geral de Proteção de Dados (LGPD)</strong>.
                        </p>
                        <h3 className="text-sm font-bold text-[#7A3E4A] uppercase tracking-wider mt-4">Segurança e Compartilhamento</h3>
                        <ul className="list-disc pl-5 text-xs text-gray-650 space-y-2">
                            <li>Utilizamos seus dados cadastrais (Nome, CPF, Endereço) unicamente para processamento e emissão de notas fiscais dos seus pedidos.</li>
                            <li>Nunca comercializamos ou expomos dados pessoais a terceiros estranhos ao processo de entrega ou processamento bancário.</li>
                            <li>Você pode solicitar a alteração ou exclusão definitiva do seu cadastro da base de dados enviando solicitação formal aos nossos canais de suporte.</li>
                        </ul>
                    </div>
                )
            case 'promotional-rules':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 border-b pb-4">Regras Promocionais</h2>
                        <p className="text-sm leading-relaxed text-gray-600">
                            Para garantir a transparência de nossas ofertas e campanhas, listamos abaixo as diretrizes gerais de aplicação de cupons, descontos e combos.
                        </p>
                        <ul className="list-disc pl-5 text-xs text-gray-650 space-y-2">
                            <li><strong>Cupons de Desconto:</strong> Não são cumulativos. Apenas um cupom pode ser inserido por pedido no fechamento da compra.</li>
                            <li><strong>Preços Promocionais:</strong> Preços destacados ou riscados em promoção são válidos por tempo limitado ou enquanto durarem os estoques do lote.</li>
                            <li><strong>Frete Grátis:</strong> Atingindo o valor mínimo de R$ 299,90 após a dedução de todos os descontos promocionais de cupons.</li>
                        </ul>
                    </div>
                )
            case 'stores':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 border-b pb-4">Nosso Showroom</h2>
                        <p className="text-sm leading-relaxed text-gray-600">
                            Venha viver a experiência Meraki presencialmente e desfrutar de um atendimento personalizado em nosso showroom exclusivo em Bonfinópolis.
                        </p>
                        <div className="max-w-md my-6">
                            <div className="p-5 rounded-xl border border-gray-150 bg-white shadow-2xs">
                                <h3 className="text-sm font-bold text-gray-800 mb-1">Showroom Meraki Bonfinópolis</h3>
                                <p className="text-xs text-gray-550 leading-relaxed mb-3">{storeConfig.address}</p>
                                <span className="text-[10px] text-[#7A3E4A] font-bold uppercase tracking-wider">Telefone/WhatsApp: {storeConfig.sac_phone}</span>
                            </div>
                        </div>
                    </div>
                )
            case 'wishlist':
                const wishlistedProducts = products.filter(p => wishlist.includes(p.id))
                return (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b pb-4">
                            <h2 className="text-2xl font-bold text-gray-900">Meus Favoritos</h2>
                            <span className="text-xs font-semibold text-gray-400">({wishlistedProducts.length} itens salvos)</span>
                        </div>
                        {wishlistedProducts.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-xl border border-gray-100 shadow-2xs">
                                <svg className="w-10 h-10 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                <p className="text-sm text-gray-500 mb-4">Você ainda não adicionou produtos aos seus favoritos.</p>
                                <Link to="/" className="inline-block bg-[#7A3E4A] text-white px-6 py-2.5 rounded-xs text-xs font-bold uppercase tracking-wider hover:bg-[#63303a] transition-all">Ver Coleção</Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                {wishlistedProducts.map(p => {
                                    const img = Array.isArray(p.image) ? p.image[0] : p.image
                                    return (
                                        <div key={p.id} className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-2xs flex flex-col group relative">
                                            {/* Remove from wishlist */}
                                            <button 
                                                onClick={() => handleRemoveFromWishlist(p.id)}
                                                className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-[#7A3E4A] hover:bg-gray-50 transition-all focus:outline-none"
                                            >
                                                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                                </svg>
                                            </button>

                                            <div className="aspect-[3/4] overflow-hidden bg-gray-50">
                                                <img 
                                                    src={getAssetUrl(img || '/placeholder.jpg')} 
                                                    alt={p.name} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" 
                                                />
                                            </div>
                                            <div className="p-4 flex-grow flex flex-col justify-between">
                                                <div>
                                                    <h3 className="text-xs font-bold text-gray-800 leading-snug line-clamp-1 mb-1">{p.name}</h3>
                                                    <p className="text-xs text-gray-900 font-bold">{formatPrice(p.price)}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleAddToCart(p)}
                                                    className="w-full bg-[#7A3E4A] hover:bg-[#63303a] text-white text-[10px] font-bold uppercase tracking-wider py-2 rounded-xs mt-3.5 transition-colors"
                                                >
                                                    Adicionar à sacola
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )
            default:
                return null
        }
    }

    const formatPrice = (price) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)

    return (
        <div className="bg-[#FCFAFA] min-h-screen flex flex-col font-sans">
            <Header cartCount={cartCount} wishlistCount={wishlistCount} onSearchOpen={() => setSearchOpen(true)} />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full py-8 flex-grow">
                {/* Mobile Dropdown Navigator (Custom Premium Dropdown) */}
                <div className="block md:hidden mb-6 relative">
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="w-full bg-[#FDF8F6] border border-[#7A3E4A]/10 rounded-2xl px-5 py-4 text-left text-xs font-bold uppercase tracking-widest text-[#7A3E4A] flex items-center justify-between shadow-xs transition-all hover:bg-[#FDF3F2] cursor-pointer"
                    >
                        <span>{sections.find(s => s.id === activeTab)?.label || 'Selecione uma seção'}</span>
                        <svg className={`w-4 h-4 text-[#7A3E4A] transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    
                    {dropdownOpen && (
                        <>
                            {/* Backdrop to close */}
                            <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)}></div>
                            
                            {/* Options List */}
                            <ul className="absolute top-[calc(100%+8px)] left-0 right-0 z-20 bg-white border border-gray-100 rounded-2xl shadow-premium p-2.5 max-h-[300px] overflow-y-auto space-y-1 animate-[fadeInUp_200ms_ease-out]">
                                {sections.map(s => {
                                    const isActive = s.id === activeTab
                                    return (
                                        <li key={s.id}>
                                            <button
                                                onClick={() => {
                                                    setActiveTab(s.id)
                                                    setDropdownOpen(false)
                                                }}
                                                className={`w-full text-left px-4 py-3 rounded-xl text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-between cursor-pointer ${
                                                    isActive 
                                                        ? 'bg-[#7A3E4A]/5 text-[#7A3E4A]' 
                                                        : 'text-gray-600 hover:bg-gray-50'
                                                }`}
                                            >
                                                <span>{s.label}</span>
                                                {isActive && (
                                                    <svg className="w-3.5 h-3.5 text-[#7A3E4A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </button>
                                        </li>
                                    )
                                })}
                            </ul>
                        </>
                    )}
                </div>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                    
                    {/* Left Sidebar Navigator (Desktop) */}
                    <aside className="hidden md:block md:col-span-3 bg-white rounded-xl p-5 border border-gray-100 shadow-2xs space-y-6">
                        {['Sobre', 'Conta', 'Atendimento', 'Lojas'].map(cat => {
                            const catTabs = sections.filter(s => s.category === cat)
                            if (catTabs.length === 0) return null
                            return (
                                <div key={cat} className="space-y-2.5">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-1.5">{cat}</h3>
                                    <ul className="flex flex-col gap-1.5">
                                        {catTabs.map(tab => (
                                            <li key={tab.id}>
                                                <button
                                                    onClick={() => setActiveTab(tab.id)}
                                                    className={`w-full text-left text-xs py-2 px-3 rounded-lg font-semibold transition-all ${activeTab === tab.id ? 'bg-[#7A3E4A]/10 text-[#7A3E4A]' : 'text-gray-600 hover:bg-gray-50'}`}
                                                >
                                                    {tab.label}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )
                        })}
                    </aside>

                    {/* Right Dynamic Content Box */}
                    <main className="md:col-span-9 bg-white rounded-xl p-6 sm:p-8 border border-gray-100 shadow-2xs min-h-[60vh]">
                        {renderContent()}
                    </main>
                </div>
            </div>

            <BenefitsBar />
            <Footer />
            <WhatsAppButton />
        </div>
    )
}
