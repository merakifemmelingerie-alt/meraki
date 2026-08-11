import { Link } from 'react-router-dom'

function Icon({ path, className = 'w-5 h-5' }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d={path} />
        </svg>
    )
}

function StatusBadge({ status }) {
    const map = {
        'Pago':      'bg-emerald-50 text-emerald-700 border-emerald-200',
        'Enviado':   'bg-sky-50 text-sky-700 border-sky-200',
        'Entregue':  'bg-[#7A3E4A]/10 text-[#7A3E4A] border-[#7A3E4A]/20',
        'Cancelado': 'bg-red-50 text-red-600 border-red-200',
        'Pendente':  'bg-amber-50 text-amber-700 border-amber-200',
    }
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${map[status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
            {status}
        </span>
    )
}

export default function DashboardSection({
    adminName = 'Admin',
    totalSales = 0,
    ticketMedio = 0,
    stats = {},
    orders = [],
    products = [],
    coupons = [],
    setActiveSection,
    getProductImage
}) {
    return (
        <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-white border border-[#EEEEEE] shadow-sm flex items-center justify-between">
                <div className="relative z-10 space-y-1">
                    <span className="text-[10px] font-bold text-[#C6A76A] uppercase tracking-[0.2em]">Bem-vinda de volta 👋</span>
                    <h2 className="text-xl md:text-2xl font-black text-[#7A3E4A] tracking-tight">{adminName}</h2>
                    <p className="text-xs text-gray-500 font-medium">Aqui está um resumo das métricas e do desempenho do seu negócio hoje.</p>
                </div>
                <div className="hidden md:block shrink-0 pr-2">
                    <div className="w-12 h-12 rounded-xl bg-[#7A3E4A]/5 flex items-center justify-center border border-[#7A3E4A]/10">
                        <Icon path="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" className="w-5 h-5 text-[#7A3E4A]" />
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        label: 'Faturamento',
                        value: totalSales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                        icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
                        gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50', text: 'text-emerald-600', sub: 'Pedidos pagos'
                    },
                    {
                        label: 'Ticket Médio',
                        value: ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
                        gradient: 'from-[#7A3E4A] to-[#9A5060]', bg: 'bg-[#7A3E4A]/10', text: 'text-[#7A3E4A]', sub: 'Por venda'
                    },
                    {
                        label: 'Pedidos',
                        value: stats.orders,
                        icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
                        gradient: 'from-sky-500 to-blue-600', bg: 'bg-sky-50', text: 'text-sky-600', sub: 'Total de pedidos'
                    },
                    {
                        label: 'Clientes',
                        value: stats.customers,
                        icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z',
                        gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-600', sub: 'Cadastrados'
                    },
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 border border-[#EEEEEE] hover:border-[#7A3E4A]/20 hover:shadow-lg hover:shadow-[#7A3E4A]/5 transition-all group">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                                <Icon path={stat.icon} className={`w-5 h-5 ${stat.text}`} />
                            </div>
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className="text-xl font-black text-gray-900 leading-none">{stat.value}</p>
                        <p className="text-[10px] text-gray-400 font-medium mt-1">{stat.sub}</p>
                    </div>
                ))}
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <div className="bg-white rounded-2xl border border-[#EEEEEE] overflow-hidden">
                    <div className="flex items-center justify-between p-5 border-b border-[#EEEEEE]">
                        <div>
                            <h3 className="text-sm font-black text-gray-900">Vendas Recentes</h3>
                            <p className="text-[10px] text-gray-400 font-medium">Últimos pedidos recebidos</p>
                        </div>
                        <button
                            onClick={() => setActiveSection('orders')}
                            className="text-[10px] font-bold text-[#7A3E4A] hover:text-[#9A5060] uppercase tracking-wider cursor-pointer px-3 py-1.5 rounded-lg hover:bg-[#7A3E4A]/5 transition-all"
                        >
                            Ver todos →
                        </button>
                    </div>
                    <div className="divide-y divide-[#F5F5F5]">
                        {(orders || []).slice(0, 5).map(o => (
                            <div key={o.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-[#FAF9F5] transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7A3E4A]/10 to-[#C6A76A]/10 flex items-center justify-center text-[10px] font-black text-[#7A3E4A]">
                                        {o.customerName?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-800 leading-tight">{o.customerName}</p>
                                        <p className="text-[10px] text-gray-400 font-medium">{new Date(o.created_at).toLocaleDateString('pt-BR')} • {o.items?.length} itens</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-gray-900">{o.total?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                    <StatusBadge status={o.status} />
                                </div>
                            </div>
                        ))}
                        {(!orders || orders.length === 0) && (
                            <div className="py-12 text-center">
                                <Icon path="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                                <p className="text-xs text-gray-400 font-medium">Nenhuma venda ainda</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Catalog Summary */}
                <div className="bg-white rounded-2xl border border-[#EEEEEE] overflow-hidden">
                    <div className="flex items-center justify-between p-5 border-b border-[#EEEEEE]">
                        <div>
                            <h3 className="text-sm font-black text-gray-900">Resumo do Catálogo</h3>
                            <p className="text-[10px] text-gray-400 font-medium">Seus produtos ativos</p>
                        </div>
                        <button
                            onClick={() => setActiveSection('products')}
                            className="text-[10px] font-bold text-[#7A3E4A] hover:text-[#9A5060] uppercase tracking-wider cursor-pointer px-3 py-1.5 rounded-lg hover:bg-[#7A3E4A]/5 transition-all"
                        >
                            Gerenciar →
                        </button>
                    </div>
                    <div className="p-5 space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Produtos', value: stats.products || 0 },
                                { label: 'Categorias', value: [...new Set((products || []).filter(p => p && p.category).map(p => typeof p.category === 'object' ? p.category.name : p.category))].filter(Boolean).length },
                                { label: 'Cupons', value: (coupons || []).length },
                            ].map((item, i) => (
                                <div key={i} className="p-3 rounded-xl bg-[#FAF9F5] text-center border border-[#EEEEEE]">
                                    <p className="text-lg font-black text-[#7A3E4A]">{item.value}</p>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</p>
                                </div>
                            ))}
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Produtos em Destaque</p>
                            <div className="space-y-2">
                                {(products || []).filter(p => p && p.name).slice(0, 4).map(p => (
                                    <div key={p.id || p.name} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#FAF9F5] transition-colors">
                                        <div className="w-8 h-11 rounded-lg overflow-hidden border border-[#EEEEEE] shrink-0 bg-gray-50">
                                            <img src={getProductImage(p)} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-gray-800 truncate">{p.name}</p>
                                            <p className="text-[10px] text-gray-400 font-medium">{typeof p.category === 'object' && p.category !== null ? p.category.name : p.category}</p>
                                        </div>
                                        <span className="text-xs font-black text-[#7A3E4A] shrink-0">R$ {p.price?.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
