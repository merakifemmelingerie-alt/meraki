import { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from '../../services/supabase.js'
import { getAssetUrl } from '../../utils/assets.js'
import MediaDisplay from '../MediaDisplay.jsx'
import { getMarketingConfig, updateMarketingConfig, getMarketingLogs, getAbandonedCarts, processMarketingAutomations, broadcastNewCollection } from '../../services/marketing.js'

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

// ─── SECTION 2: PRODUCTS ──────────────────────────────────────────────────────
export function ProductsSection({
    productsLoading,
    filteredProducts,
    searchQuery,
    setSearchQuery,
    setModal,
    setDeleteModal,
    paginatedProducts,
    getProductImage,
    sectionLabel,
    renderPagination,
    pPage,
    setPPage
}) {
    return (
        <div className="space-y-5">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Buscar produtos..."
                        className="w-full pl-10 pr-4 py-3 bg-white border border-[#EEEEEE] rounded-xl text-sm outline-none focus:border-[#7A3E4A] focus:ring-2 focus:ring-[#7A3E4A]/10 transition-all"
                    />
                </div>
                <button
                    onClick={() => setModal({ open: true, editing: null })}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#7A3E4A] to-[#9A5060] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:shadow-lg hover:shadow-[#7A3E4A]/30 transition-all cursor-pointer whitespace-nowrap"
                >
                    <Icon path="M12 4v16m8-8H4" className="w-4 h-4" />
                    Novo Produto
                </button>
            </div>

            {productsLoading ? (
                <div className="flex justify-center py-16">
                    <div className="w-10 h-10 rounded-full border-2 border-[#7A3E4A]/20 border-t-[#7A3E4A] animate-spin" />
                </div>
            ) : filteredProducts.length > 0 ? (
                <>
                    {/* Desktop Table */}
                    <div className="hidden md:block bg-white rounded-2xl border border-[#EEEEEE] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-[#F5F5F5]">
                                        {['Produto', 'Categoria', 'Preço Venda', 'Custo (CMV)', 'Margem Bruta', 'Estoque', 'Seção', ''].map((h, i) => (
                                            <th key={i} className={`px-5 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest ${i === 7 ? 'text-right' : ''}`}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F8F8F8]">
                                    {paginatedProducts.filter(p => p && p.name).map(p => {
                                        const price = Number(p.price) || 0
                                        const cost = Number(p.cost_price || p.costPrice) || 0
                                        const margin = price > 0 ? (((price - cost) / price) * 100).toFixed(1) : 0

                                        return (
                                            <tr key={p.id} className="hover:bg-[#FAF9F5] transition-colors group">
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-14 bg-gray-50 rounded-xl overflow-hidden border border-[#EEEEEE] shrink-0">
                                                            <img src={getProductImage(p)} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                        <span className="text-sm font-bold text-gray-900">{p.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 text-xs text-gray-500 font-semibold">{typeof p.category === 'object' && p.category !== null ? p.category.name : p.category}</td>
                                                <td className="px-5 py-3">
                                                    <span className="text-sm font-black text-[#7A3E4A]">R$ {price.toFixed(2)}</span>
                                                </td>
                                                <td className="px-5 py-3">
                                                    {cost > 0 ? (
                                                        <span className="text-xs font-bold text-gray-700">R$ {cost.toFixed(2)}</span>
                                                    ) : (
                                                        <span className="text-[11px] text-gray-400 font-medium italic">Estimado (35%)</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                                                        cost > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                        {margin}%
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-xs text-gray-500 font-bold">{p.stock !== undefined ? p.stock : 10} un</td>
                                                <td className="px-5 py-3">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#7A3E4A]/10 text-[#7A3E4A]">
                                                        {sectionLabel(p.section)}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => setModal({ open: true, editing: p.id })} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#7A3E4A] hover:bg-[#7A3E4A]/10 rounded-lg transition-colors cursor-pointer">Editar</button>
                                                        <button onClick={() => setDeleteModal({ open: true, product: p })} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">Excluir</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3">
                        {paginatedProducts.filter(p => p && p.name).map(p => {
                            const price = Number(p.price) || 0
                            const cost = Number(p.cost_price || p.costPrice) || 0
                            const margin = price > 0 ? (((price - cost) / price) * 100).toFixed(1) : 0

                            return (
                                <div key={p.id} className="bg-white rounded-2xl border border-[#EEEEEE] p-4 flex items-center gap-4">
                                    <div className="w-14 h-18 bg-gray-50 rounded-xl overflow-hidden border border-[#EEEEEE] shrink-0">
                                        <img src={getProductImage(p)} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">{p.name}</p>
                                        <p className="text-[10px] text-gray-400 font-medium mb-1">
                                            {typeof p.category === 'object' && p.category !== null ? p.category.name : p.category} • Est: {p.stock !== undefined ? p.stock : 10} un
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-base font-black text-[#7A3E4A]">R$ {price.toFixed(2)}</span>
                                            {cost > 0 && <span className="text-xs text-gray-500">Custo: R$ {cost.toFixed(2)} ({margin}%)</span>}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 shrink-0">
                                        <button onClick={() => setModal({ open: true, editing: p.id })} className="px-3 py-1.5 bg-[#7A3E4A]/10 text-[#7A3E4A] rounded-lg text-[10px] font-bold uppercase tracking-wider">Editar</button>
                                        <button onClick={() => setDeleteModal({ open: true, product: p })} className="px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-[10px] font-bold uppercase tracking-wider">Excluir</button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Pagination Controls */}
                    {renderPagination(pPage, filteredProducts.length, setPPage)}
                </>
            ) : (
                <div className="bg-white rounded-2xl border border-[#EEEEEE] py-16 text-center">
                    <Icon path="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm font-bold text-gray-600 mb-1">Nenhum produto encontrado</p>
                    <p className="text-xs text-gray-400">Tente ajustar sua busca ou adicione um novo produto.</p>
                </div>
            )}
        </div>
    )
}

// ─── SECTION 3: ORDERS ────────────────────────────────────────────────────────
export function OrdersSection({
    orders,
    paginatedOrders,
    handleStatusChange,
    setSelectedOrder,
    renderPagination,
    oPage,
    setOPage
}) {
    return (
        <div className="space-y-5">
            {orders.length > 0 ? (
                <>
                    {/* Desktop Table */}
                    <div className="hidden md:block bg-white rounded-2xl border border-[#EEEEEE] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-[#F5F5F5]">
                                        {['Pedido', 'Cliente', 'Data', 'Total', 'Status', ''].map((h, i) => (
                                            <th key={i} className={`px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest ${i === 5 ? 'text-right' : ''}`}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F8F8F8]">
                                    {paginatedOrders.map(order => (
                                        <tr key={order.id} className="hover:bg-[#FAF9F5] transition-colors">
                                            <td className="px-6 py-4 font-mono text-xs font-bold text-gray-500">#{order.id?.slice(-6)}</td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-gray-800">{order.customerName}</p>
                                                <p className="text-[10px] text-gray-400">{order.customerEmail}</p>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-gray-500 font-medium">{new Date(order.created_at).toLocaleDateString('pt-BR')}</td>
                                            <td className="px-6 py-4 text-sm font-black text-[#7A3E4A]">{order.total?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={order.status}
                                                    onChange={e => handleStatusChange(order.id, e.target.value)}
                                                    className="text-[10px] font-bold border rounded-full px-3 py-1.5 outline-none cursor-pointer bg-white transition-all border-[#EEEEEE]"
                                                >
                                                    {['Pendente', 'Pago', 'Enviado', 'Entregue', 'Cancelado'].map(s => <option key={s}>{s}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => setSelectedOrder(order)} className="px-4 py-2 bg-[#7A3E4A]/10 hover:bg-[#7A3E4A] text-[#7A3E4A] hover:text-white text-[10px] font-bold rounded-xl transition-all cursor-pointer uppercase tracking-wider">
                                                    Detalhes
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3">
                        {paginatedOrders.map(order => (
                            <div key={order.id} className="bg-white rounded-2xl border border-[#EEEEEE] p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{order.customerName}</p>
                                        <p className="text-[10px] text-gray-400">{order.customerEmail}</p>
                                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">#{order.id?.slice(-6)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-base font-black text-[#7A3E4A]">{order.total?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                        <p className="text-[10px] text-gray-400">{new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-[#F5F5F5]">
                                    <select
                                        value={order.status}
                                        onChange={e => handleStatusChange(order.id, e.target.value)}
                                        className="text-[10px] font-bold border border-[#EEEEEE] rounded-xl px-3 py-2 outline-none cursor-pointer bg-white"
                                    >
                                        {['Pendente', 'Pago', 'Enviado', 'Entregue', 'Cancelado'].map(s => <option key={s}>{s}</option>)}
                                    </select>
                                    <button onClick={() => setSelectedOrder(order)} className="px-4 py-2 bg-[#7A3E4A] text-white text-[10px] font-bold rounded-xl cursor-pointer">Ver Detalhes</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {renderPagination(oPage, orders.length, setOPage)}
                </>
            ) : (
                <div className="bg-white rounded-2xl border border-[#EEEEEE] py-20 text-center">
                    <Icon path="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm font-bold text-gray-600 mb-1">Nenhum pedido registrado</p>
                    <p className="text-xs text-gray-400">Os pedidos dos clientes aparecerão aqui.</p>
                </div>
            )}
        </div>
    )
}

// ─── SECTION 4: COUPONS ───────────────────────────────────────────────────────
export function CouponsSection({
    coupons,
    paginatedCoupons,
    setCouponModal,
    handleOpenCreateCoupon,
    handleOpenEditCoupon,
    handleDeleteCoupon,
    renderPagination,
    cpPage,
    setCpPage
}) {
    const onNewCouponClick = handleOpenCreateCoupon || (() => setCouponModal(true))

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-black text-gray-900">Cupons Ativos</h2>
                    <p className="text-[10px] text-gray-400 font-medium">{coupons.length} cupom{coupons.length !== 1 ? 's' : ''} cadastrado{coupons.length !== 1 ? 's' : ''}</p>
                </div>
                <button onClick={onNewCouponClick} className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#7A3E4A] to-[#9A5060] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:shadow-lg hover:shadow-[#7A3E4A]/30 transition-all cursor-pointer">
                    <Icon path="M12 4v16m8-8H4" className="w-4 h-4" /> Criar Cupom
                </button>
            </div>

            {coupons.length > 0 ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {paginatedCoupons.map(cp => (
                            <div key={cp.id} className="bg-white rounded-2xl border border-[#EEEEEE] overflow-hidden hover:border-[#C6A76A]/40 hover:shadow-md transition-all group">
                                <div className="p-5" style={{ background: 'linear-gradient(135deg, #FAF9F5, #F5EEE9)' }}>
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-[#C6A76A]/15 flex items-center justify-center">
                                             <Icon path="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" className="w-5 h-5 text-[#C6A76A]" />
                                        </div>
                                        <span className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-[#7A3E4A]/10 text-[#7A3E4A] uppercase tracking-wider">
                                             {cp.type === 'percentage' ? 'Porcentagem' : 'Fixo'}
                                        </span>
                                    </div>
                                    <p className="text-lg font-black text-gray-900 tracking-wider uppercase mb-1">{cp.code}</p>
                                    <p className="text-2xl font-black text-[#7A3E4A]">
                                         {cp.type === 'percentage' ? `${cp.value}%` : `R$ ${cp.value?.toFixed(2)}`}
                                         <span className="text-xs font-semibold text-gray-400 ml-1">de desconto</span>
                                    </p>
                                </div>
                                <div className="px-5 py-3 border-t border-[#EEEEEE] flex items-center justify-between">
                                    <p className="text-[10px] text-gray-400 font-medium">
                                         Mínimo: <span className="font-bold text-gray-600">R$ {cp.minPurchase?.toFixed(2)}</span>
                                    </p>
                                    <div className="flex items-center gap-1.5">
                                        {handleOpenEditCoupon && (
                                            <button onClick={() => handleOpenEditCoupon(cp)} className="text-[10px] font-bold text-[#C6A76A] hover:text-[#7A3E4A] uppercase tracking-wider cursor-pointer px-2.5 py-1 rounded-lg hover:bg-[#C6A76A]/10 transition-all flex items-center gap-1">
                                                <Icon path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" className="w-3 h-3" />
                                                Editar
                                            </button>
                                        )}
                                        <button onClick={() => handleDeleteCoupon(cp.id)} className="text-[10px] font-bold text-red-400 hover:text-red-600 uppercase tracking-wider cursor-pointer px-2 py-1 rounded-lg hover:bg-red-50 transition-all">
                                             Remover
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {renderPagination(cpPage, coupons.length, setCpPage)}
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-[#EEEEEE] py-20 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#C6A76A]/10 flex items-center justify-center mx-auto mb-4">
                        <Icon path="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" className="w-7 h-7 text-[#C6A76A]" />
                    </div>
                    <p className="text-sm font-bold text-gray-600 mb-1">Nenhum cupom cadastrado</p>
                    <p className="text-xs text-gray-400">Crie cupons para aumentar suas vendas.</p>
                </div>
            )}
        </div>
    )
}

export function BannersSection({
    banners,
    setBannerModal,
    getAssetUrl,
    compressImage,
    uploadMultipleImages,
    handleUpdateBannerImage,
    handleUpdateBannerMobileImage,
    handleDeleteBanner,
    updateStoreConfig
}) {
    const [activeTransition, setActiveTransition] = useState(() => {
        try {
            const config = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
            return config.bannerTransition || 'shatter'
        } catch { return 'shatter' }
    })

    const TRANSITIONS = [
        {
            id: 'shatter',
            label: 'Estilhaçar',
            description: 'Pedaços voam para fora',
            preview: (
                <div className="relative w-full h-full overflow-hidden rounded-lg bg-gradient-to-br from-[#7A3E4A]/20 to-[#C6A76A]/20 flex items-center justify-center">
                    <div className="grid grid-cols-4 grid-rows-3 gap-0.5 w-10 h-8 opacity-70">
                        {Array.from({length:12}).map((_,i) => (
                            <div key={i} className="bg-[#7A3E4A] rounded-[1px]" style={{animation:`shatterPreview${i % 4} 2s ease-in-out infinite`, animationDelay:`${i*0.08}s`}} />
                        ))}
                    </div>
                    <span className="absolute bottom-1 left-0 right-0 text-center text-[8px] font-black text-[#7A3E4A] uppercase tracking-wider">💥 Estilhaçar</span>
                </div>
            )
        },
        {
            id: 'fade',
            label: 'Fade',
            description: 'Dissolve suavemente',
            preview: (
                <div className="relative w-full h-full overflow-hidden rounded-lg flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#7A3E4A]/80 to-[#C6A76A]/80" style={{animation:'fadePrev 2s ease-in-out infinite'}} />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#C6A76A]/80 to-[#7A3E4A]/80" style={{animation:'fadeNext 2s ease-in-out infinite'}} />
                    <span className="relative z-10 text-[8px] font-black text-white uppercase tracking-wider drop-shadow">🌫️ Fade</span>
                </div>
            )
        },
        {
            id: 'slideLeft',
            label: 'Deslizar →',
            description: 'Desliza horizontalmente',
            preview: (
                <div className="relative w-full h-full overflow-hidden rounded-lg flex items-center justify-center bg-gray-100">
                    <div className="absolute inset-0 flex">
                        <div className="w-1/2 h-full bg-gradient-to-r from-[#7A3E4A] to-[#9A5060]" style={{animation:'slideLeftPrev 2s ease-in-out infinite'}} />
                        <div className="w-1/2 h-full bg-gradient-to-r from-[#C6A76A] to-[#D4B878]" style={{animation:'slideLeftNext 2s ease-in-out infinite'}} />
                    </div>
                    <span className="relative z-10 text-[8px] font-black text-white uppercase tracking-wider drop-shadow">➡️ Deslizar</span>
                </div>
            )
        },
        {
            id: 'slideUp',
            label: 'Deslizar ↑',
            description: 'Sobe de baixo para cima',
            preview: (
                <div className="relative w-full h-full overflow-hidden rounded-lg flex items-center justify-center bg-gray-100">
                    <div className="absolute inset-0 flex flex-col">
                        <div className="h-1/2 w-full bg-gradient-to-b from-[#7A3E4A] to-[#9A5060]" style={{animation:'slideUpPrev 2s ease-in-out infinite'}} />
                        <div className="h-1/2 w-full bg-gradient-to-b from-[#C6A76A] to-[#D4B878]" style={{animation:'slideUpNext 2s ease-in-out infinite'}} />
                    </div>
                    <span className="relative z-10 text-[8px] font-black text-white uppercase tracking-wider drop-shadow">⬆️ Deslizar Cima</span>
                </div>
            )
        },
        {
            id: 'zoom',
            label: 'Zoom',
            description: 'Zoom de entrada suave',
            preview: (
                <div className="relative w-full h-full overflow-hidden rounded-lg flex items-center justify-center bg-gradient-to-br from-[#7A3E4A] to-[#C6A76A]">
                    <div className="w-8 h-6 rounded bg-white/30" style={{animation:'zoomPrev 2s ease-in-out infinite'}} />
                    <span className="absolute bottom-1 left-0 right-0 text-center text-[8px] font-black text-white uppercase tracking-wider">🔍 Zoom</span>
                </div>
            )
        },
        {
            id: 'flip',
            label: 'Virar',
            description: 'Vira como uma página',
            preview: (
                <div className="relative w-full h-full overflow-hidden rounded-lg flex items-center justify-center" style={{perspective:'200px'}}>
                    <div className="w-10 h-7 rounded bg-gradient-to-r from-[#7A3E4A] to-[#C6A76A]" style={{animation:'flipPrev 2s ease-in-out infinite', transformStyle:'preserve-3d'}} />
                    <span className="absolute bottom-1 left-0 right-0 text-center text-[8px] font-black text-[#7A3E4A] uppercase tracking-wider">🔄 Virar</span>
                </div>
            )
        }
    ]

    const saveTransition = async (id) => {
        setActiveTransition(id)
        const config = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
        const updated = { ...config, bannerTransition: id }
        localStorage.setItem('meraki_store_config', JSON.stringify(updated))
        window.dispatchEvent(new Event('storeConfigUpdated'))
        if (updateStoreConfig) {
            await updateStoreConfig({ banner_transition: id })
        }
    }

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-black text-gray-900">Banners do Carrossel</h2>
                    <p className="text-[10px] text-gray-400 font-medium">
                        {banners.length} banner{banners.length !== 1 ? 's' : ''} ativo{banners.length !== 1 ? 's' : ''} • <span className="text-[#C6A76A] font-bold">Responsivo (Desktop + Mobile)</span>
                    </p>
                </div>
                <button onClick={() => setBannerModal(true)} className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#7A3E4A] to-[#9A5060] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:shadow-lg hover:shadow-[#7A3E4A]/30 transition-all cursor-pointer">
                    <Icon path="M12 4v16m8-8H4" className="w-4 h-4" /> Adicionar Banner
                </button>
            </div>

            {/* ─── Transition Selector ──────────────────────────────────────────── */}
            <style>{`
                @keyframes fadePrev { 0%,100%{opacity:1} 50%{opacity:0} }
                @keyframes fadeNext { 0%,100%{opacity:0} 50%{opacity:1} }
                @keyframes slideLeftPrev { 0%,100%{transform:translateX(0)} 50%{transform:translateX(-100%)} }
                @keyframes slideLeftNext { 0%,100%{transform:translateX(100%)} 50%{transform:translateX(0)} }
                @keyframes slideUpPrev { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-100%)} }
                @keyframes slideUpNext { 0%,100%{transform:translateY(100%)} 50%{transform:translateY(0)} }
                @keyframes zoomPrev { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.4);opacity:0} }
                @keyframes flipPrev { 0%,100%{transform:rotateY(0deg)} 50%{transform:rotateY(90deg)} }
            `}</style>
            <div className="bg-white p-5 rounded-2xl border border-[#EEEEEE] space-y-4">
                <div>
                    <h4 className="text-[10px] font-black text-[#7A3E4A] uppercase tracking-widest">Efeito de Transição do Banner</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">Escolha como os banners mudam entre si. Clique para selecionar.</p>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {TRANSITIONS.map(t => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => saveTransition(t.id)}
                            className={`relative flex flex-col rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer group ${
                                activeTransition === t.id
                                    ? 'border-[#7A3E4A] shadow-lg shadow-[#7A3E4A]/20 scale-[1.03]'
                                    : 'border-[#EEEEEE] hover:border-[#7A3E4A]/40 hover:scale-[1.02]'
                            }`}
                        >
                            {/* Animated preview */}
                            <div className="aspect-[4/3] w-full bg-gray-50 relative">
                                {t.preview}
                            </div>
                            {/* Label */}
                            <div className={`py-2 px-1 text-center text-[9px] font-black uppercase tracking-wider transition-colors ${
                                activeTransition === t.id ? 'bg-[#7A3E4A] text-white' : 'bg-white text-gray-500'
                            }`}>
                                {t.label}
                            </div>
                            {/* Active checkmark */}
                            {activeTransition === t.id && (
                                <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#7A3E4A] rounded-full flex items-center justify-center">
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
                <p className="text-[10px] text-[#7A3E4A] font-semibold">
                    ✓ Ativo: <span className="font-black">{TRANSITIONS.find(t => t.id === activeTransition)?.label}</span> — {TRANSITIONS.find(t => t.id === activeTransition)?.description}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {banners.map(bn => (
                    <div key={bn.id} className="bg-white rounded-2xl border border-[#EEEEEE] overflow-hidden hover:border-[#7A3E4A]/20 hover:shadow-lg transition-all group p-4 space-y-4">
                        {/* Previews: Widescreen Desktop + Vertical Mobile side-by-side */}
                        <div className="grid grid-cols-3 gap-3">
                            {/* Desktop preview (2/3 width) */}
                            <div className="col-span-2 space-y-1">
                                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Desktop (Foto/Vídeo/GIF)</span>
                                <div className="aspect-[16/7] bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex items-center justify-center relative">
                                    {bn.image ? (
                                        <MediaDisplay src={bn.image} alt={bn.alt} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center p-2 text-[8px] text-gray-300 font-bold">Sem mídia desktop</div>
                                    )}
                                </div>
                            </div>
                            {/* Mobile preview (1/3 width) */}
                            <div className="col-span-1 space-y-1">
                                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Mobile (Foto/Vídeo/GIF)</span>
                                <div className="aspect-[4/5] bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex items-center justify-center relative">
                                    {bn.mobile_image ? (
                                        <MediaDisplay src={bn.mobile_image} alt={bn.alt} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center p-2 text-[8px] text-gray-300 font-bold">Sem mídia mobile</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 pt-2 border-t border-[#EEEEEE]/60">
                            <div className="flex justify-between items-start gap-2">
                                <div>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Texto Alternativo (Alt)</p>
                                    <p className="text-xs font-semibold text-gray-700 truncate max-w-[200px]">{bn.alt}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-bold text-[#C6A76A] uppercase tracking-widest">Link de Destino</p>
                                    <p className="text-[10px] font-bold text-gray-500 truncate max-w-[120px]">{bn.link}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {/* Change Desktop Image/Video/GIF */}
                                <div>
                                    <button
                                        onClick={() => document.getElementById(`change-banner-desk-${bn.id}`).click()}
                                        className="w-full py-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer text-center"
                                    >
                                        Mídia Desktop 🎥/🖼️
                                    </button>
                                    <p className="text-[8px] text-gray-400 text-center mt-1">(Foto, GIF ou Vídeo MP4/WebM)</p>
                                    <input 
                                        id={`change-banner-desk-${bn.id}`}
                                        type="file" 
                                        accept="image/*,video/*,.gif,.mp4,.webm,.mov" 
                                        onChange={async (e) => {
                                            if (e.target.files?.[0]) {
                                                const { urls } = await uploadMultipleImages([e.target.files[0]])
                                                if (urls?.[0]) {
                                                    handleUpdateBannerImage(bn.id, urls[0])
                                                }
                                            }
                                        }}
                                        className="hidden" 
                                    />
                                </div>

                                {/* Change Mobile Image/Video/GIF */}
                                <div>
                                    <button
                                        onClick={() => document.getElementById(`change-banner-mob-${bn.id}`).click()}
                                        className="w-full py-2 rounded-xl bg-[#7A3E4A]/10 text-[#7A3E4A] hover:bg-[#7A3E4A]/20 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer text-center"
                                    >
                                        Mídia Mobile 🎥/🖼️
                                    </button>
                                    <p className="text-[8px] text-[#7A3E4A] text-center mt-1">(Foto, GIF ou Vídeo MP4/WebM)</p>
                                    <input 
                                        id={`change-banner-mob-${bn.id}`}
                                        type="file" 
                                        accept="image/*,video/*,.gif,.mp4,.webm,.mov" 
                                        onChange={async (e) => {
                                            if (e.target.files?.[0]) {
                                                const { urls } = await uploadMultipleImages([e.target.files[0]])
                                                if (urls?.[0]) {
                                                    handleUpdateBannerMobileImage(bn.id, urls[0])
                                                }
                                            }
                                        }}
                                        className="hidden" 
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => handleDeleteBanner(bn.id)}
                                className="w-full py-2 rounded-xl border border-red-100 text-red-400 hover:bg-red-50 hover:text-red-600 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                            >
                                Remover Banner
                            </button>
                        </div>
                    </div>
                ))}
                {banners.length === 0 && (
                    <div className="col-span-full bg-white rounded-2xl border border-[#EEEEEE] py-20 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-[#7A3E4A]/5 flex items-center justify-center mx-auto mb-4">
                            <Icon path="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-7 h-7 text-[#7A3E4A]/40" />
                        </div>
                        <p className="text-sm font-bold text-gray-600 mb-1">Nenhum banner personalizado</p>
                        <p className="text-xs text-gray-400">O site está usando os banners padrão.</p>
                    </div>
                )}
            </div>
        </div>
    )
}


// ─── SECTION 6: PROMO COMBO CONFIG ────────────────────────────────────────────
export function PromoComboSection({
    promoCombo,
    setPromoCombo,
    saving,
    setSaving,
    compressImage,
    uploadMultipleImages,
    getAssetUrl,
    updateStoreConfig
}) {
    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-sm font-black text-gray-900">Promoção de Combos (Home)</h2>
                <p className="text-[10px] text-gray-400 font-medium font-sans">Configure o banner de promoção destacado na página inicial.</p>
            </div>

            <div className="bg-white rounded-2xl border border-[#EEEEEE] p-5">
                <form 
                    onSubmit={async (e) => {
                        e.preventDefault()
                        const form = e.target
                        const title = form.promoTitle.value.trim()
                        const price2Items = parseFloat(form.promoPrice2Items.value) || 139
                        const price3Items = parseFloat(form.promoPrice3Items.value) || 169
                        const subtitle = form.promoSubtitle.value.trim()
                        const query = form.promoQuery.value.trim()
                        const visible = form.promoVisible.checked
                        const files = form.promoImage.files

                        setSaving(true)
                        let imageUrl = promoCombo.image
                        if (files?.[0]) {
                            const compressedFile = await compressImage(files[0], 1600)
                            const { urls } = await uploadMultipleImages([compressedFile])
                            if (urls?.[0]) imageUrl = urls[0]
                        }

                        const updated = {
                            title,
                            price2Items,
                            price3Items,
                            subtitle,
                            link: '/category/promo-combo',
                            query,
                            image: imageUrl,
                            visible
                        }
                        setPromoCombo(updated)
                        localStorage.setItem('meraki_promo_combo', JSON.stringify(updated))
                        if (updateStoreConfig) {
                            await updateStoreConfig({ promoCombo: updated })
                        }
                        window.dispatchEvent(new Event('promoComboUpdated'))
                        setSaving(false)
                        alert('Promoção atualizada com sucesso!')
                    }}
                    className="space-y-4"
                >
                    <div className="p-4 bg-[#FAF9F5] rounded-xl border border-[#EEEEEE]">
                        <label className="flex items-center gap-2.5 cursor-pointer">
                            <input
                                type="checkbox"
                                name="promoVisible"
                                defaultChecked={promoCombo.visible !== false}
                                className="w-4 h-4 text-[#7A3E4A] focus:ring-[#7A3E4A] border-gray-300 rounded cursor-pointer"
                            />
                            <span className="text-xs font-bold text-[#7A3E4A] uppercase tracking-wider">Exibir Seção de Combo/Promoção na Home</span>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Título do Combo</label>
                            <input type="text" name="promoTitle" defaultValue={promoCombo.title} required className="w-full px-3 py-2 border border-[#EEEEEE] rounded-xl text-xs outline-none" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Palavra-chave de Filtro (Ex: sutiã)</label>
                            <input type="text" name="promoQuery" defaultValue={promoCombo.query} className="w-full px-3 py-2 border border-[#EEEEEE] rounded-xl text-xs outline-none" />
                        </div>
                    </div>

                    <div className="p-4 bg-[#FAF9F5] rounded-xl border border-[#EEEEEE] space-y-3">
                        <p className="text-[10px] font-bold text-[#7A3E4A] uppercase tracking-wider">Preços do Combo — Digite apenas o valor em R$</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Preço do Combo de 2 Peças (R$)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">R$</span>
                                    <input
                                        type="number"
                                        name="promoPrice2Items"
                                        step="0.01"
                                        min="0"
                                        defaultValue={promoCombo.price2Items ?? 139}
                                        required
                                        className="w-full pl-8 pr-3 py-2 border border-[#EEEEEE] focus:border-[#7A3E4A] focus:ring-2 focus:ring-[#7A3E4A]/10 rounded-xl text-sm font-bold outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Preço do Combo de 3 Peças (R$)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">R$</span>
                                    <input
                                        type="number"
                                        name="promoPrice3Items"
                                        step="0.01"
                                        min="0"
                                        defaultValue={promoCombo.price3Items ?? 169}
                                        required
                                        className="w-full pl-8 pr-3 py-2 border border-[#EEEEEE] focus:border-[#7A3E4A] focus:ring-2 focus:ring-[#7A3E4A]/10 rounded-xl text-sm font-bold outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Descrição / Subtítulo</label>
                            <input type="text" name="promoSubtitle" defaultValue={promoCombo.subtitle} required className="w-full px-3 py-2 border border-[#EEEEEE] rounded-xl text-xs outline-none" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Upload de Imagem</label>
                            <input type="file" name="promoImage" accept="image/*,video/*,.gif,.mp4,.webm,.mov" className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#7A3E4A]/10 file:text-[#7A3E4A] hover:file:bg-[#7A3E4A]/20 cursor-pointer" />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-2">
                        {promoCombo.image && (
                            <div className="w-24 h-24 rounded-lg overflow-hidden border border-[#EEEEEE] bg-gray-50 flex items-center justify-center">
                                <img src={getAssetUrl(promoCombo.image)} alt="Preview" className="max-w-full max-h-full object-contain" />
                            </div>
                        )}
                        <button type="submit" disabled={saving} className="px-5 py-3 bg-[#7A3E4A] hover:bg-[#603039] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-50 self-end">
                            Salvar Alterações
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ─── SECTION 7: EDITORIAL CONFIG ──────────────────────────────────────────────
export function EditorialSection({
    editorial,
    setEditorial,
    saving,
    setSaving,
    compressImage,
    uploadMultipleImages,
    getAssetUrl,
    updateStoreConfig
}) {
    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-sm font-black text-gray-900">Manifesto Editorial</h2>
                <p className="text-[10px] text-gray-400 font-medium font-sans">Altere a imagem e as frases da seção do manifesto editorial na Home page.</p>
            </div>

            <div className="bg-white rounded-2xl border border-[#EEEEEE] p-5">
                <form 
                    onSubmit={async (e) => {
                        e.preventDefault()
                        const form = e.target
                        const label = form.edLabel.value.trim()
                        const title = form.edTitle.value.trim()
                        const description = form.edDescription.value.trim()
                        const buttonText = form.edButtonText.value.trim()
                        const files = form.edImage.files

                        setSaving(true)
                        let imageUrl = editorial.image
                        if (files?.[0]) {
                            const compressedFile = await compressImage(files[0], 1600)
                            const { urls } = await uploadMultipleImages([compressedFile])
                            if (urls?.[0]) imageUrl = urls[0]
                        }

                        const updated = {
                            label,
                            title,
                            description,
                            buttonText,
                            buttonLink: '/story',
                            image: imageUrl
                        }
                        setEditorial(updated)
                        localStorage.setItem('meraki_editorial', JSON.stringify(updated))
                        if (updateStoreConfig) {
                            await updateStoreConfig({ editorial: updated })
                        }
                        window.dispatchEvent(new Event('editorialUpdated'))
                        setSaving(false)
                        alert('Manifesto Editorial atualizado com sucesso!')
                    }}
                    className="space-y-4"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Etiqueta / Tag (Pequena)</label>
                            <input type="text" name="edLabel" defaultValue={editorial.label} required className="w-full px-3 py-2 border border-[#EEEEEE] rounded-xl text-xs outline-none" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Título do Manifesto</label>
                            <input type="text" name="edTitle" defaultValue={editorial.title} required className="w-full px-3 py-2 border border-[#EEEEEE] rounded-xl text-xs outline-none" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Texto de Descrição</label>
                        <textarea name="edDescription" rows="3" defaultValue={editorial.description} required className="w-full px-3 py-2 border border-[#EEEEEE] rounded-xl text-xs outline-none resize-none" />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Texto do Botão</label>
                        <input type="text" name="edButtonText" defaultValue={editorial.buttonText} required className="w-full px-3 py-2 border border-[#EEEEEE] rounded-xl text-xs outline-none" />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Upload de Imagem</label>
                        <input type="file" name="edImage" accept="image/*,video/*,.gif,.mp4,.webm,.mov" className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#7A3E4A]/10 file:text-[#7A3E4A] hover:file:bg-[#7A3E4A]/20 cursor-pointer" />
                    </div>

                    <div className="flex gap-4 pt-2">
                        {editorial.image && (
                            <div className="w-24 h-24 rounded-lg overflow-hidden border border-[#EEEEEE]">
                                <img src={getAssetUrl(editorial.image)} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                        )}
                        <button type="submit" disabled={saving} className="px-5 py-3 bg-[#7A3E4A] hover:bg-[#603039] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-50 self-end">
                            Salvar Alterações
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ─── SECTION 8: CATEGORIES ────────────────────────────────────────────────────
export function CategoriesSection({
    categories,
    setCategories,
    saving,
    setSaving,
    compressImage,
    uploadMultipleImages,
    getAssetUrl,
    homepageCategories = [],
    setHomepageCategories,
    saveHomepageCategoriesToConfig
}) {
    const [editingIndex, setEditingIndex] = useState(null)
    const [catName, setCatName] = useState('')
    const [catGroup, setCatGroup] = useState('Lingerie')
    const [catDescription, setCatDescription] = useState('')

    const [catSubtitle, setCatSubtitle] = useState('')
    const [catImageUrl, setCatImageUrl] = useState('')

    const [editingHomeIdx, setEditingHomeIdx] = useState(null)
    const [homeCatName, setHomeCatName] = useState('')
    const [homeCatDescription, setHomeCatDescription] = useState('')
    const [homeCatLink, setHomeCatLink] = useState('')

    const [defaultCategoryImage, setDefaultCategoryImage] = useState(() => {
        const stored = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
        return stored.default_category_image || categories?.[0]?.image || '/assets/categories/cat-sexy.jpg'
    })

    // Subcategory style filters state
    const slugifyCat = (name) => (name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/[\s-]+/g, '-')

    const [categoryStylesMap, setCategoryStylesMap] = useState(() => {
        try {
            const stored = localStorage.getItem('meraki_category_styles')
            if (stored) return JSON.parse(stored)
        } catch {}
        return {
            'linha-sexy': [
                { id: 'bodys', name: 'Bodys', image: '/assets/categories/cat-sexy.jpg' },
                { id: 'corsets', name: 'Corsets', image: '/assets/categories/cat-noite.jpg' },
                { id: 'conjuntos-sexy', name: 'Conjuntos Sexy', image: '/assets/categories/cat-conjuntos.jpg' },
                { id: 'acessorios', name: 'Acessórios', image: '/assets/categories/cat-plus.jpg' }
            ],
            'conjuntos': [
                { id: 'cobertura-total', name: 'Cobertura Total', image: '/assets/categories/cat-conjuntos.jpg' },
                { id: 'meia-taca', name: 'Meia Taça', image: '/assets/categories/cat-noite.jpg' },
                { id: 'triangulo', name: 'Triângulo', image: '/assets/categories/cat-sexy.jpg' },
                { id: 'sem-alca', name: 'Sem Alça', image: '/assets/categories/cat-plus.jpg' },
                { id: 'top', name: 'Top', image: '/assets/categories/cat-conjuntos.jpg' },
                { id: 'balconet', name: 'Balconet', image: '/assets/categories/cat-noite.jpg' }
            ],
            'camisolas-babydolls': [
                { id: 'robes', name: 'Robes', image: '/assets/categories/cat-noite.jpg' },
                { id: 'pijamas', name: 'Pijamas', image: '/assets/categories/cat-conjuntos.jpg' },
                { id: 'camisolas', name: 'Camisolas', image: '/assets/categories/cat-sexy.jpg' },
                { id: 'baby-dolls', name: 'Baby Dolls', image: '/assets/categories/cat-plus.jpg' }
            ],
            'plus-size': [
                { id: 'sustentacao', name: 'Sustentação', image: '/assets/categories/cat-plus.jpg' },
                { id: 'modeladores', name: 'Modeladores', image: '/assets/categories/cat-conjuntos.jpg' },
                { id: 'camisolas-plus', name: 'Camisolas Plus', image: '/assets/categories/cat-noite.jpg' },
                { id: 'rendas', name: 'Rendas', image: '/assets/categories/cat-sexy.jpg' }
            ]
        }
    })

    const [activeCatForStyles, setActiveCatForStyles] = useState(null)
    const [editingStyleIndex, setEditingStyleIndex] = useState(null)
    const [styleName, setStyleName] = useState('')
    const [styleImage, setStyleImage] = useState('')

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
        if (stored.default_category_image) {
            setDefaultCategoryImage(stored.default_category_image)
        } else if (categories && categories.length > 0 && categories[0]?.image) {
            setDefaultCategoryImage(categories[0].image)
        }
    }, [categories])

    const resetForm = () => {
        setEditingIndex(null)
        setCatName('')
        setCatGroup('Lingerie')
        setCatSubtitle('')
        setCatDescription('')
        setCatImageUrl('')
    }

    const saveCategoryStylesMap = (updatedMap) => {
        setCategoryStylesMap(updatedMap)
        localStorage.setItem('meraki_category_styles', JSON.stringify(updatedMap))
        try {
            const storedConfig = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
            const newConfig = { ...storedConfig, id: 'default', category_styles: updatedMap }
            localStorage.setItem('meraki_store_config', JSON.stringify(newConfig))
        } catch (err) {
            console.error(err)
        }
        window.dispatchEvent(new Event('categoryStylesUpdated'))
        window.dispatchEvent(new Event('storeConfigUpdated'))
    }

    const currentCategoryStyles = useMemo(() => {
        if (!activeCatForStyles) return []
        const slugKey = slugifyCat(activeCatForStyles)
        return categoryStylesMap[slugKey] || categoryStylesMap[activeCatForStyles] || []
    }, [activeCatForStyles, categoryStylesMap])

    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-sm font-black text-gray-900">Categorias da Loja</h2>
                <p className="text-[10px] text-gray-400 font-medium">{categories.length} categoria{categories.length !== 1 ? 's' : ''} cadastrada{categories.length !== 1 ? 's' : ''}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Formulário de Cadastro/Edição */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-[#EEEEEE] p-5">
                    <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4">
                        {editingIndex !== null ? 'Editar Categoria' : 'Nova Categoria'}
                    </h3>
                    <form 
                        onSubmit={async (e) => {
                            e.preventDefault()
                            const form = e.target
                            const name = catName.trim()
                            const group = catGroup
                            const subtitle = catSubtitle.trim()
                            const description = catDescription.trim()
                            const files = form.catImage.files
                            
                            if (!name) return
                            setSaving(true)
                            
                            let imageUrl = catImageUrl.trim()
                            if (files?.[0]) {
                                const compressedFile = await compressImage(files[0], 1200)
                                const { urls } = await uploadMultipleImages([compressedFile])
                                if (urls?.[0]) imageUrl = urls[0]
                            }
                            if (!imageUrl && editingIndex !== null) {
                                imageUrl = categories[editingIndex].image || '/placeholder.jpg'
                            }
                            if (!imageUrl) imageUrl = '/placeholder.jpg'

                            const catObj = { name, group, subtitle, description, image: imageUrl }
                            
                            let updated
                            if (editingIndex !== null) {
                                updated = categories.map((c, i) => i === editingIndex ? catObj : c)
                            } else {
                                updated = [...categories, catObj]
                            }
                            
                            setCategories(updated)
                            localStorage.setItem('meraki_categories', JSON.stringify(updated))
                            try {
                                const storedConfig = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
                                const newConfig = { ...storedConfig, id: 'default', categories_data: updated }
                                localStorage.setItem('meraki_store_config', JSON.stringify(newConfig))
                            } catch (err) {}
                            window.dispatchEvent(new Event('categoriesUpdated'))
                            window.dispatchEvent(new Event('storeConfigUpdated'))
                            form.reset()
                            resetForm()
                            setSaving(false)
                        }}
                        className="space-y-4"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Nome da Categoria</label>
                                <input 
                                    type="text" 
                                    name="catName" 
                                    required 
                                    value={catName}
                                    onChange={e => setCatName(e.target.value)}
                                    placeholder="Ex: Lingerie Luxo" 
                                    className="w-full px-3 py-2 border border-[#EEEEEE] rounded-xl text-xs outline-none" 
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Grupo do Mega Menu</label>
                                <select 
                                    name="catGroup" 
                                    value={catGroup}
                                    onChange={e => setCatGroup(e.target.value)}
                                    className="w-full px-3 py-2 border border-[#EEEEEE] rounded-xl text-xs outline-none bg-white"
                                >
                                    <option value="Lingerie">Lingerie</option>
                                    <option value="Noite & Especiais">Noite & Especiais</option>
                                    <option value="Destaques">Destaques</option>
                                    <option value="Sensual">Sensual</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Imagem de Capa (Arquivo)</label>
                                <input type="file" name="catImage" accept="image/*,video/*,.gif,.mp4,.webm,.mov" className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#7A3E4A]/10 file:text-[#7A3E4A] hover:file:bg-[#7A3E4A]/20 cursor-pointer" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wider">URL da Imagem (Opções / Link)</label>
                                <input 
                                    type="text" 
                                    value={catImageUrl}
                                    onChange={e => setCatImageUrl(e.target.value)}
                                    placeholder="https://... ou selecione um arquivo ao lado" 
                                    className="w-full px-3 py-2 border border-[#EEEEEE] rounded-xl text-xs outline-none bg-gray-50/50" 
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-[#C6A76A] mb-1 uppercase tracking-wider font-extrabold">Subtítulo Dourado / Frase Topo</label>
                                <input 
                                    type="text" 
                                    name="catSubtitle" 
                                    value={catSubtitle}
                                    onChange={e => setCatSubtitle(e.target.value)}
                                    placeholder="Ex: Peças sensuais e sofisticadas" 
                                    className="w-full px-3 py-2 border border-[#C6A76A]/40 rounded-xl text-xs outline-none bg-[#FAF6F0]/40 focus:bg-white" 
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Descrição / Frase Principal</label>
                                <input 
                                    type="text" 
                                    name="catDescription" 
                                    value={catDescription}
                                    onChange={e => setCatDescription(e.target.value)}
                                    placeholder="Ex: Transparências artísticas, rendas..." 
                                    className="w-full px-3 py-2 border border-[#EEEEEE] rounded-xl text-xs outline-none" 
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" disabled={saving} className="px-5 py-3 bg-[#7A3E4A] hover:bg-[#603039] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-50">
                                {editingIndex !== null ? 'Salvar Alterações' : 'Cadastrar Categoria'}
                            </button>
                            {editingIndex !== null && (
                                <button 
                                    type="button" 
                                    onClick={resetForm}
                                    className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                                >
                                    Cancelar
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Imagem Padrão do Menu */}
                <div className="bg-white rounded-2xl border border-[#EEEEEE] p-5 flex flex-col justify-between">
                    <div>
                        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Imagem Padrão do Menu</h3>
                        <p className="text-[10px] text-gray-400 font-semibold mb-4 leading-relaxed">
                            Esta imagem será exibida no painel do Mega Menu quando nenhuma categoria estiver sendo selecionada com o cursor.
                        </p>
                        
                        <div className="w-full h-32 rounded-xl overflow-hidden border border-[#EEEEEE] bg-gray-50 mb-4 relative group">
                            <MediaDisplay src={defaultCategoryImage} alt="Imagem Padrão do Menu" className="w-full h-full object-cover" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <input 
                            type="file" 
                            accept="image/*,video/*,.gif,.mp4,.webm,.mov" 
                            id="defaultCatImageInput"
                            onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                setSaving(true)
                                try {
                                    const compressed = await compressImage(file, 1200)
                                    const { urls } = await uploadMultipleImages([compressed])
                                    if (urls?.[0]) {
                                        const stored = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
                                        const newConfig = { ...stored, id: 'default', default_category_image: urls[0] }
                                        localStorage.setItem('meraki_store_config', JSON.stringify(newConfig))
                                        
                                        try {
                                            const currentStyle = JSON.parse(localStorage.getItem('meraki_topbar_style') || '{"bgColor": "#C6A76A", "textColor": "#FFFFFF"}')
                                            const newStyle = { ...currentStyle, default_category_image: urls[0] }
                                            localStorage.setItem('meraki_topbar_style', JSON.stringify(newStyle))
                                        } catch (err) {
                                            console.error(err)
                                        }
                                        
                                        window.dispatchEvent(new Event('storeConfigUpdated'))
                                        setDefaultCategoryImage(urls[0])
                                    }
                                } catch (err) {
                                    console.error(err)
                                }
                                setSaving(false)
                            }}
                            className="hidden" 
                        />
                        <button 
                            type="button" 
                            disabled={saving}
                            onClick={() => document.getElementById('defaultCatImageInput').click()}
                            className="w-full py-3 bg-[#7A3E4A]/10 hover:bg-[#7A3E4A]/15 text-[#7A3E4A] text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center disabled:opacity-50"
                        >
                            Alterar Imagem Padrão
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {categories.map((cat, idx) => {
                    const cName = typeof cat === 'object' ? cat.name : cat
                    const cDesc = typeof cat === 'object' ? cat.description : 'Coleção Meraki'
                    const cSub = typeof cat === 'object' ? cat.subtitle : ''
                    const cImage = typeof cat === 'object' ? cat.image : '/placeholder.jpg'
                    const cGroup = typeof cat === 'object' ? cat.group : 'Lingerie'
                    const slugKey = slugifyCat(cName)
                    const stylesCount = (categoryStylesMap[slugKey] || categoryStylesMap[cName] || []).length

                    return (
                        <div key={idx} className="bg-white rounded-2xl border border-[#EEEEEE] overflow-hidden hover:border-[#7A3E4A]/20 hover:shadow-lg transition-all group flex flex-col justify-between">
                            <div className="flex gap-4 p-4">
                                <div className="w-14 h-14 rounded-xl overflow-hidden border border-[#EEEEEE] shrink-0 bg-gray-50">
                                    <img src={getAssetUrl(cImage)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-gray-800 truncate">{cName}</p>
                                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">{cGroup}</p>
                                    {cSub && <p className="text-[9px] font-bold text-[#C6A76A] uppercase tracking-wider truncate mb-1">{cSub}</p>}
                                    <p className="text-[10px] text-gray-400 leading-relaxed line-clamp-2">{cDesc}</p>
                                </div>
                            </div>
                            <div className="px-4 py-2.5 border-t border-[#F8F8F8] flex items-center justify-between gap-2 bg-[#FAF9F5]">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveCatForStyles(cName)
                                        setEditingStyleIndex(null)
                                        setStyleName('')
                                        setStyleImage('')
                                    }}
                                    className="text-[9px] font-bold text-[#7A3E4A] hover:bg-[#7A3E4A]/10 uppercase tracking-wider cursor-pointer px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5"
                                >
                                    <span>🎨</span> Estilos ({stylesCount})
                                </button>
                                <div className="flex gap-1">
                                    <button 
                                        onClick={() => {
                                            setEditingIndex(idx)
                                            setCatName(cName)
                                            setCatGroup(cGroup)
                                            setCatSubtitle(cSub || '')
                                            setCatDescription(cDesc)
                                            setCatImageUrl(cImage)
                                            window.scrollTo({ top: 0, behavior: 'smooth' })
                                        }}
                                        className="text-[9px] font-bold text-[#C6A76A] hover:text-[#b09054] uppercase tracking-widest cursor-pointer px-2 py-1 rounded-lg hover:bg-[#C6A76A]/10 transition-all"
                                    >
                                        Editar
                                    </button>
                                    <button 
                                        onClick={() => {
                                            const updated = categories.filter((_, i) => i !== idx)
                                            setCategories(updated)
                                            localStorage.setItem('meraki_categories', JSON.stringify(updated))
                                            window.dispatchEvent(new Event('categoriesUpdated'))
                                            if (editingIndex === idx) resetForm()
                                        }}
                                        className="text-[9px] font-bold text-red-400 hover:text-red-600 uppercase tracking-widest cursor-pointer px-2 py-1 rounded-lg hover:bg-red-50 transition-all"
                                    >
                                        Excluir
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Modal de Gerenciamento dos Estilos de Filtragem */}
            {activeCatForStyles && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto relative animate-[fadeIn_200ms_ease-out]">
                        <div className="flex items-center justify-between border-b border-[#F5F5F5] pb-4">
                            <div>
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                    <span>🎨</span> Estilos de Filtragem ("Filtre por Estilo")
                                </h3>
                                <p className="text-xs text-[#7A3E4A] font-bold mt-0.5">
                                    Categoria: {activeCatForStyles}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setActiveCatForStyles(null)
                                    setEditingStyleIndex(null)
                                    setStyleName('')
                                    setStyleImage('')
                                }}
                                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-all font-bold text-xs cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Lista de Estilos Atuais */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Estilos Cadastrados para esta Categoria ({currentCategoryStyles.length})</h4>
                            {currentCategoryStyles.length === 0 ? (
                                <div className="p-4 bg-gray-50 rounded-2xl text-center text-xs text-gray-400 font-medium">
                                    Nenhum estilo de filtragem cadastrado para esta categoria. Adicione um novo estilo no formulário abaixo!
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {currentCategoryStyles.map((st, sIdx) => (
                                        <div key={sIdx} className="flex items-center justify-between p-3 bg-[#FAF9F5] border border-[#EEEEEE] rounded-2xl gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-full border border-[#EEEEEE] overflow-hidden bg-white shrink-0 flex items-center justify-center">
                                                    <MediaDisplay src={st.image || '/placeholder.jpg'} alt="" className="w-full h-full object-cover" />
                                                </div>
                                                <span className="text-xs font-bold text-gray-800 truncate">{st.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingStyleIndex(sIdx)
                                                        setStyleName(st.name)
                                                        setStyleImage(st.image || '')
                                                    }}
                                                    className="text-[9px] font-bold text-[#C6A76A] hover:text-[#b09054] uppercase tracking-widest px-2 py-1 rounded-lg hover:bg-[#C6A76A]/10 cursor-pointer"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updatedList = currentCategoryStyles.filter((_, i) => i !== sIdx)
                                                        const catSlugKey = slugifyCat(activeCatForStyles)
                                                        const newMap = { ...categoryStylesMap, [catSlugKey]: updatedList, [activeCatForStyles]: updatedList }
                                                        saveCategoryStylesMap(newMap)
                                                        if (editingStyleIndex === sIdx) {
                                                            setEditingStyleIndex(null)
                                                            setStyleName('')
                                                            setStyleImage('')
                                                        }
                                                    }}
                                                    className="text-[9px] font-bold text-red-400 hover:text-red-600 uppercase tracking-widest px-2 py-1 rounded-lg hover:bg-red-50 cursor-pointer"
                                                >
                                                    Remover
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Formulário para Adicionar/Editar Estilo */}
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault()
                                if (!styleName.trim()) return
                                setSaving(true)
                                
                                let finalImg = styleImage || '/placeholder.jpg'
                                const fileInput = e.target.styleImageFile
                                if (fileInput?.files?.[0]) {
                                    try {
                                        const compressed = await compressImage(fileInput.files[0], 800)
                                        const { urls } = await uploadMultipleImages([compressed])
                                        if (urls?.[0]) finalImg = urls[0]
                                    } catch (err) {
                                        console.error(err)
                                    }
                                }

                                const newStyleObj = {
                                    id: slugifyCat(styleName),
                                    name: styleName.trim(),
                                    image: finalImg
                                }

                                const catSlugKey = slugifyCat(activeCatForStyles)
                                let currentList = categoryStylesMap[catSlugKey] || categoryStylesMap[activeCatForStyles] || []
                                
                                let updatedList
                                if (editingStyleIndex !== null) {
                                    updatedList = currentList.map((st, i) => i === editingStyleIndex ? newStyleObj : st)
                                } else {
                                    updatedList = [...currentList, newStyleObj]
                                }

                                const newMap = { ...categoryStylesMap, [catSlugKey]: updatedList, [activeCatForStyles]: updatedList }
                                saveCategoryStylesMap(newMap)

                                setStyleName('')
                                setStyleImage('')
                                setEditingStyleIndex(null)
                                if (fileInput) fileInput.value = ''
                                setSaving(false)
                            }}
                            className="bg-gray-50 p-5 rounded-2xl border border-[#EEEEEE] space-y-4"
                        >
                            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                {editingStyleIndex !== null ? 'Editar Estilo de Filtragem' : 'Adicionar Novo Estilo de Filtragem'}
                            </h4>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Nome do Estilo / Filtro</label>
                                    <input
                                        type="text"
                                        value={styleName}
                                        onChange={(e) => setStyleName(e.target.value)}
                                        placeholder="Ex: Bodys, Corsets, Renda, Croppeds..."
                                        className="w-full px-4 py-2.5 bg-white border border-[#EEEEEE] rounded-xl text-xs outline-none focus:border-[#7A3E4A]"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Imagem / Ícone Circular</label>
                                    <input
                                        type="file"
                                        name="styleImageFile"
                                        accept="image/*,video/*,.gif,.mp4,.webm,.mov"
                                        className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#7A3E4A]/10 file:text-[#7A3E4A] hover:file:bg-[#7A3E4A]/20 cursor-pointer"
                                    />
                                    {editingStyleIndex !== null && (
                                        <p className="text-[9px] text-gray-400 mt-1">Deixe em branco para manter a imagem atual</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                {editingStyleIndex !== null && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingStyleIndex(null)
                                            setStyleName('')
                                            setStyleImage('')
                                        }}
                                        className="px-4 py-2.5 bg-gray-200 text-gray-700 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-gray-300 transition-all cursor-pointer"
                                    >
                                        Cancelar Edição
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2.5 bg-[#7A3E4A] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#603039] transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {saving ? 'Salvando...' : (editingStyleIndex !== null ? 'Atualizar Estilo' : 'Adicionar Estilo')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Divisor */}
            <div className="h-px bg-[#EEEEEE] my-10" />

            {/* Categorias da Home */}
            <div className="space-y-5">
                <div>
                    <h2 className="text-sm font-black text-gray-900">Categorias em Destaque na Home</h2>
                    <p className="text-[10px] text-gray-400 font-medium">Estes são os 4 cartões com foto exibidos logo no início da página inicial (ex: Home, Categorias, Trocas, Ofertas).</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Formulário de Edição */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-[#EEEEEE] p-5">
                        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4">
                            {editingHomeIdx !== null ? 'Editar Cartão da Home' : 'Novo Cartão da Home'}
                        </h3>
                        <form 
                            onSubmit={async (e) => {
                                e.preventDefault()
                                const form = e.target
                                const name = homeCatName.trim()
                                const description = homeCatDescription.trim()
                                const link = homeCatLink.trim()
                                const files = form.homeCatImage.files
                                
                                if (!name) return
                                setSaving(true)
                                
                                let imageUrl = '/placeholder.jpg'
                                if (editingHomeIdx !== null) {
                                    imageUrl = homepageCategories[editingHomeIdx].image || '/placeholder.jpg'
                                }
                                
                                if (files?.[0]) {
                                    const compressedFile = await compressImage(files[0], 1200)
                                    const { urls } = await uploadMultipleImages([compressedFile])
                                    if (urls?.[0]) imageUrl = urls[0]
                                } else if (form.homeCatImageUrl?.value) {
                                    imageUrl = form.homeCatImageUrl.value.trim()
                                }
                                
                                const cardObj = { name, description, image: imageUrl, link }
                                
                                let updated
                                if (editingHomeIdx !== null) {
                                    updated = homepageCategories.map((c, i) => i === editingHomeIdx ? cardObj : c)
                                } else {
                                    updated = [...homepageCategories, cardObj]
                                }
                                
                                setHomepageCategories(updated)
                                await saveHomepageCategoriesToConfig(updated)
                                form.reset()
                                setEditingHomeIdx(null)
                                setHomeCatName('')
                                setHomeCatDescription('')
                                setHomeCatLink('')
                                setSaving(false)
                            }}
                            className="space-y-4"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Título do Cartão</label>
                                    <input 
                                        type="text" 
                                        name="homeCatName" 
                                        required 
                                        value={homeCatName}
                                        onChange={e => setHomeCatName(e.target.value)}
                                        placeholder="Ex: Lançamentos" 
                                        className="w-full px-3 py-2 border border-[#EEEEEE] rounded-xl text-xs outline-none" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Link de Redirecionamento</label>
                                    <input 
                                        type="text" 
                                        name="homeCatLink" 
                                        required 
                                        value={homeCatLink}
                                        onChange={e => setHomeCatLink(e.target.value)}
                                        placeholder="Ex: /category/novidades ou https://..." 
                                        className="w-full px-3 py-2 border border-[#EEEEEE] rounded-xl text-xs outline-none" 
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Fazer Upload da Imagem</label>
                                    <input type="file" name="homeCatImage" accept="image/*,video/*,.gif,.mp4,.webm,.mov" className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#7A3E4A]/10 file:text-[#7A3E4A] hover:file:bg-[#7A3E4A]/20 cursor-pointer" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Ou Link da Imagem (Opcional)</label>
                                    <input 
                                        type="text" 
                                        name="homeCatImageUrl" 
                                        placeholder="Ex: https://images.unsplash.com/..." 
                                        className="w-full px-3 py-2 border border-[#EEEEEE] rounded-xl text-xs outline-none" 
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Descrição / Subtítulo</label>
                                <input 
                                    type="text" 
                                    name="homeCatDescription" 
                                    value={homeCatDescription}
                                    onChange={e => setHomeCatDescription(e.target.value)}
                                    placeholder="Ex: Curadoria exclusiva das melhores peças" 
                                    className="w-full px-3 py-2 border border-[#EEEEEE] rounded-xl text-xs outline-none" 
                                />
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" disabled={saving} className="px-5 py-3 bg-[#7A3E4A] hover:bg-[#603039] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-50">
                                    {editingHomeIdx !== null ? 'Salvar Alterações' : 'Cadastrar Cartão'}
                                </button>
                                {editingHomeIdx !== null && (
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            setEditingHomeIdx(null)
                                            setHomeCatName('')
                                            setHomeCatDescription('')
                                            setHomeCatLink('')
                                        }}
                                        className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                                    >
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    <div className="bg-white rounded-2xl border border-[#EEEEEE] p-5">
                        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Dica de Layout</h3>
                        <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
                            O design do site foi otimizado para exibir exatamente **4 cartões** alinhados. Para manter o visual harmônico das 4 colunas na Home, recomendamos manter exatamente 4 itens cadastrados na lista.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {homepageCategories.map((card, idx) => (
                        <div key={idx} className="bg-white rounded-2xl border border-[#EEEEEE] overflow-hidden hover:border-[#7A3E4A]/20 hover:shadow-lg transition-all group flex flex-col justify-between">
                            <div className="flex gap-4 p-4">
                                <div className="w-14 h-14 rounded-xl overflow-hidden border border-[#EEEEEE] shrink-0 bg-gray-50">
                                    <img src={getAssetUrl(card.image)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-gray-800 truncate">{card.name}</p>
                                    <p className="text-[9px] text-[#7A3E4A] font-bold uppercase tracking-wider mb-1">{card.link}</p>
                                    <p className="text-[10px] text-gray-400 leading-relaxed line-clamp-2">{card.description}</p>
                                </div>
                            </div>
                            <div className="px-4 py-2 border-t border-[#F8F8F8] flex justify-end gap-2">
                                <button 
                                    onClick={() => {
                                        setEditingHomeIdx(idx)
                                        setHomeCatName(card.name)
                                        setHomeCatDescription(card.description)
                                        setHomeCatLink(card.link)
                                        window.scrollTo({ top: document.body.scrollHeight / 2, behavior: 'smooth' })
                                    }}
                                    className="text-[9px] font-bold text-[#C6A76A] hover:text-[#b09054] uppercase tracking-widest cursor-pointer px-2 py-1 rounded-lg hover:bg-[#C6A76A]/10 transition-all"
                                >
                                    Editar
                                </button>
                                <button 
                                    onClick={async () => {
                                        const updated = homepageCategories.filter((_, i) => i !== idx)
                                        setHomepageCategories(updated)
                                        await saveHomepageCategoriesToConfig(updated)
                                        if (editingHomeIdx === idx) {
                                            setEditingHomeIdx(null)
                                            setHomeCatName('')
                                            setHomeCatDescription('')
                                            setHomeCatLink('')
                                        }
                                    }}
                                    className="text-[9px] font-bold text-red-400 hover:text-red-600 uppercase tracking-widest cursor-pointer px-2 py-1 rounded-lg hover:bg-red-50 transition-all"
                                >
                                    Excluir
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ─── SECTION 9: CUSTOMERS & CRM ───────────────────────────────────────────────
export function CustomersSection({
    customers = [],
    orders = [],
    paginatedCustomers,
    renderPagination,
    cPage,
    setCPage
}) {
    const [subTab, setSubTab] = useState('todos') // 'todos' | 'vip' | 'aniversariantes' | 'inativos'
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCustomer, setSelectedCustomer] = useState(null)
    const [carts, setCarts] = useState([])
    const [visitsCount, setVisitsCount] = useState(() => {
        try {
            return parseInt(localStorage.getItem('meraki_store_visits') || '1')
        } catch { return 1 }
    })

    useEffect(() => {
        getAbandonedCarts().then(cts => setCarts(cts || [])).catch(() => {})
    }, [])

    // Process customer metrics (LTV, orders count, last order date)
    const enrichedCustomers = useMemo(() => {
        const now = new Date()
        const currentMonth = now.getMonth() // 0-11

        return customers.map(c => {
            const customerEmail = (c.email || '').toLowerCase().trim()
            const customerPhone = (c.phone || '').replace(/\D/g, '')

            // Match orders
            const custOrders = orders.filter(o => {
                const oEmail = (o.customerEmail || o.email || '').toLowerCase().trim()
                const oPhone = (o.customerPhone || o.phone || '').replace(/\D/g, '')
                return (customerEmail && oEmail === customerEmail) || (customerPhone && oPhone && oPhone === customerPhone)
            })

            const paidOrders = custOrders.filter(o => ['Pago', 'Enviado', 'Entregue'].includes(o.status))
            const ltv = paidOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
            const totalOrdersCount = custOrders.length

            // Last purchase date
            let lastOrderDate = null
            if (custOrders.length > 0) {
                const dates = custOrders.map(o => new Date(o.created_at || o.date)).filter(d => !isNaN(d))
                if (dates.length > 0) {
                    lastOrderDate = new Date(Math.max(...dates))
                }
            }

            // Inactivity check (90 days)
            let daysInactive = 999
            if (lastOrderDate) {
                daysInactive = Math.floor((now - lastOrderDate) / (1000 * 60 * 60 * 24))
            } else if (c.created_at) {
                daysInactive = Math.floor((now - new Date(c.created_at)) / (1000 * 60 * 60 * 24))
            }

            const isInactive = daysInactive >= 90
            const isVip = ltv >= 500 || paidOrders.length >= 3

            // Birthday check
            let isBirthdayMonth = false
            let birthMonth = null
            if (c.birth_date || c.birthday || c.nascimento) {
                const bDateStr = c.birth_date || c.birthday || c.nascimento
                const bDate = new Date(bDateStr)
                if (!isNaN(bDate)) {
                    birthMonth = bDate.getMonth()
                    if (birthMonth === currentMonth) isBirthdayMonth = true
                }
            }

            return {
                ...c,
                custOrders,
                paidOrders,
                ltv,
                totalOrdersCount,
                lastOrderDate,
                daysInactive,
                isInactive,
                isVip,
                isBirthdayMonth,
                birthMonth
            }
        })
    }, [customers, orders])

    // Filter customers based on search and subTab
    const filteredList = useMemo(() => {
        return enrichedCustomers.filter(c => {
            // Search filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase()
                const matchesName = (c.full_name || '').toLowerCase().includes(q)
                const matchesEmail = (c.email || '').toLowerCase().includes(q)
                const matchesPhone = (c.phone || '').includes(q)
                const matchesCpf = (c.cpf || '').includes(q)
                if (!matchesName && !matchesEmail && !matchesPhone && !matchesCpf) return false
            }

            if (subTab === 'vip') return c.isVip
            if (subTab === 'aniversariantes') return c.isBirthdayMonth
            if (subTab === 'inativos') return c.isInactive
            return true
        })
    }, [enrichedCustomers, searchQuery, subTab])

    // Commercial metrics calculations
    const paidOrdersCount = orders.filter(o => ['Pago', 'Enviado', 'Entregue'].includes(o.status)).length
    const conversionRate = visitsCount > 0 ? ((paidOrdersCount / Math.max(visitsCount, paidOrdersCount)) * 100).toFixed(1) : 0

    const totalCarts = carts.length
    const recoveredCarts = carts.filter(c => c.status === 'recovered').length
    const abandonedCarts = carts.filter(c => c.status === 'abandoned').length
    const cartRecoveryRate = (abandonedCarts + recoveredCarts) > 0 ? ((recoveredCarts / (abandonedCarts + recoveredCarts)) * 100).toFixed(1) : 0

    const totalLtvSum = enrichedCustomers.reduce((acc, c) => acc + c.ltv, 0)
    const avgLtv = enrichedCustomers.length > 0 ? (totalLtvSum / enrichedCustomers.length).toFixed(2) : '0.00'

    const vipCount = enrichedCustomers.filter(c => c.isVip).length
    const birthdayCount = enrichedCustomers.filter(c => c.isBirthdayMonth).length
    const inactiveCount = enrichedCustomers.filter(c => c.isInactive).length

    const iconPaths = {
        users: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
        vip: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
        heart: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
        clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
        chart: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
        cart: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z",
        phone: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z",
        bag: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
    }

    return (
        <div className="space-y-6">
            {/* Header com Indicadores Comerciais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-[#EEEEEE] shadow-2xs space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Icon path={iconPaths.chart} className="w-3.5 h-3.5 text-[#7A3E4A]" />
                        Taxa de Conversão
                    </span>
                    <div className="text-xl font-black text-gray-900">{conversionRate}%</div>
                    <p className="text-[10px] text-gray-500 font-medium">Visitas: {visitsCount} • Vendas: {paidOrdersCount}</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#EEEEEE] shadow-2xs space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Icon path={iconPaths.cart} className="w-3.5 h-3.5 text-[#C6A76A]" />
                        Recuperação de Carrinho
                    </span>
                    <div className="text-xl font-black text-gray-900">{cartRecoveryRate}%</div>
                    <p className="text-[10px] text-gray-500 font-medium">Recuperados: {recoveredCarts} / {abandonedCarts + recoveredCarts}</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#EEEEEE] shadow-2xs space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Icon path={iconPaths.bag} className="w-3.5 h-3.5 text-[#7A3E4A]" />
                        LTV Médio por Cliente
                    </span>
                    <div className="text-xl font-black text-[#7A3E4A]">R$ {avgLtv}</div>
                    <p className="text-[10px] text-gray-500 font-medium">Faturamento acumulado CRM</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#EEEEEE] shadow-2xs space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Icon path={iconPaths.users} className="w-3.5 h-3.5 text-gray-500" />
                        Base de Clientes (CRM)
                    </span>
                    <div className="text-xl font-black text-gray-900">{customers.length}</div>
                    <p className="text-[10px] text-gray-500 font-medium">VIPs: {vipCount} • Inativos: {inactiveCount}</p>
                </div>
            </div>

            {/* Filtros e Busca */}
            <div className="bg-white p-4 rounded-2xl border border-[#EEEEEE] space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    {/* Navegação por Sub-Abas */}
                    <div className="flex items-center gap-1.5 border-b sm:border-b-0 border-[#EEEEEE] overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                        {[
                            { id: 'todos', label: 'Todos os Clientes', count: enrichedCustomers.length },
                            { id: 'vip', label: 'Clientes VIP', count: vipCount },
                            { id: 'aniversariantes', label: 'Aniversariantes do Mês', count: birthdayCount },
                            { id: 'inativos', label: 'Clientes Inativos (90d+)', count: inactiveCount }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setSubTab(t.id)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                                    subTab === t.id
                                        ? 'bg-[#7A3E4A] text-white shadow-xs'
                                        : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
                                }`}
                            >
                                {t.label}
                                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                                    subTab === t.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                                }`}>
                                    {t.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Busca rápida */}
                    <div className="relative w-full sm:w-64">
                        <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Buscar nome, e-mail, CPF, tel..."
                            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:bg-white focus:border-[#7A3E4A]"
                        />
                    </div>
                </div>
            </div>

            {/* Tabela de Clientes */}
            {filteredList.length > 0 ? (
                <>
                    <div className="hidden md:block bg-white rounded-2xl border border-[#EEEEEE] overflow-hidden shadow-2xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-[#EEEEEE] text-[10px] uppercase tracking-wider text-gray-400 font-bold bg-[#FAF9F5]">
                                        <th className="px-5 py-3">Cliente / E-mail</th>
                                        <th className="px-5 py-3">Documento & WhatsApp</th>
                                        <th className="px-5 py-3 text-center">Compras</th>
                                        <th className="px-5 py-3 text-right">LTV (Gasto Total)</th>
                                        <th className="px-5 py-3 text-center">Perfil CRM</th>
                                        <th className="px-5 py-3 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#EEEEEE] text-xs">
                                    {filteredList.map(c => (
                                        <tr key={c.id} className="hover:bg-[#FAF9F5] transition-colors">
                                            <td className="px-5 py-3.5">
                                                <div className="font-bold text-gray-900">{c.full_name || 'Sem nome'}</div>
                                                <div className="text-[10px] text-gray-400 font-medium">{c.email}</div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="text-gray-700 font-medium">{c.cpf || 'Sem CPF'}</div>
                                                {c.phone ? (
                                                    <a
                                                        href={`https://wa.me/55${c.phone.replace(/\D/g, '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[10px] text-[#7A3E4A] hover:underline font-bold inline-flex items-center gap-1"
                                                    >
                                                        <Icon path={iconPaths.phone} className="w-3 h-3" />
                                                        {c.phone}
                                                    </a>
                                                ) : (
                                                    <div className="text-[10px] text-gray-400">Sem telefone</div>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-center font-bold text-gray-800">
                                                {c.paidOrders.length} pedido(s)
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-black text-[#7A3E4A]">
                                                R$ {c.ltv.toFixed(2)}
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <div className="flex flex-wrap items-center justify-center gap-1">
                                                    {c.isVip && (
                                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-[#C6A76A]/10 text-[#C6A76A] border border-[#C6A76A]/30">
                                                            ★ VIP
                                                        </span>
                                                    )}
                                                    {c.isBirthdayMonth && (
                                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-pink-50 text-pink-700 border border-pink-200">
                                                            🎂 Aniversariante
                                                        </span>
                                                    )}
                                                    {c.isInactive && (
                                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                            Inativo 90d
                                                        </span>
                                                    )}
                                                    {!c.isVip && !c.isBirthdayMonth && !c.isInactive && (
                                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-gray-100 text-gray-600">
                                                            Cliente
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <button
                                                    onClick={() => setSelectedCustomer(c)}
                                                    className="px-3 py-1.5 bg-[#7A3E4A] hover:bg-[#603039] text-white text-[10px] font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
                                                >
                                                    Ver Histórico Completo
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile List */}
                    <div className="md:hidden space-y-3">
                        {filteredList.map(c => (
                            <div key={c.id} className="bg-white rounded-2xl border border-[#EEEEEE] p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{c.full_name || 'Sem nome'}</p>
                                        <p className="text-[10px] text-gray-400">{c.email}</p>
                                    </div>
                                    <span className="text-xs font-black text-[#7A3E4A]">
                                        R$ {c.ltv.toFixed(2)}
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-1 pt-1">
                                    {c.isVip && <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-[#C6A76A]/10 text-[#C6A76A]">★ VIP</span>}
                                    {c.isBirthdayMonth && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-pink-50 text-pink-700">🎂 Aniversariante</span>}
                                    {c.isInactive && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700">Inativo 90d</span>}
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-[#EEEEEE] text-[10px]">
                                    <span className="text-gray-500 font-medium">{c.paidOrders.length} compra(s) realizada(s)</span>
                                    <button
                                        onClick={() => setSelectedCustomer(c)}
                                        className="px-3 py-1 bg-[#7A3E4A] text-white font-bold rounded-lg"
                                    >
                                        Histórico
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="bg-white rounded-2xl border border-[#EEEEEE] py-16 text-center">
                    <Icon path={iconPaths.users} className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-gray-600 mb-1">Nenhum cliente localizado</p>
                    <p className="text-xs text-gray-400">Tente ajustar o filtro ou o termo de busca.</p>
                </div>
            )}

            {/* MODAL: HISTÓRICO COMPLETO DO CLIENTE (CRM DETALHADO) */}
            {selectedCustomer && (
                <>
                    <div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm" onClick={() => setSelectedCustomer(null)} />
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[95] bg-white rounded-2xl shadow-2xl max-w-2xl w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-[#EEEEEE] bg-[#FAF9F5]">
                            <div>
                                <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                                    <Icon path={iconPaths.users} className="w-4 h-4 text-[#7A3E4A]" />
                                    Ficha CRM & Histórico Completo de Compras
                                </h3>
                                <p className="text-xs text-gray-500">{selectedCustomer.full_name} • {selectedCustomer.email}</p>
                            </div>
                            <button onClick={() => setSelectedCustomer(null)} className="w-8 h-8 rounded-xl bg-white hover:bg-gray-100 flex items-center justify-center cursor-pointer transition-colors border border-gray-200">
                                ✕
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Resumo do Perfil */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF9F5] p-4 rounded-xl border border-[#EEEEEE]">
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">LTV Acumulado</span>
                                    <span className="text-sm font-black text-[#7A3E4A]">R$ {selectedCustomer.ltv.toFixed(2)}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Total Pedidos</span>
                                    <span className="text-sm font-bold text-gray-900">{selectedCustomer.custOrders.length}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Ticket Médio</span>
                                    <span className="text-sm font-bold text-gray-900">
                                        R$ {selectedCustomer.paidOrders.length > 0 ? (selectedCustomer.ltv / selectedCustomer.paidOrders.length).toFixed(2) : '0.00'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Classificação</span>
                                    <span className="text-xs font-black text-[#C6A76A]">
                                        {selectedCustomer.isVip ? 'Cliente VIP ★' : 'Cliente Padrão'}
                                    </span>
                                </div>
                            </div>

                            {/* Informações Pessoais */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-b border-[#EEEEEE] pb-4">
                                <div><span className="font-bold text-gray-500">CPF:</span> <span className="text-gray-800 font-semibold">{selectedCustomer.cpf || 'Não informado'}</span></div>
                                <div><span className="font-bold text-gray-500">Telefone:</span> <span className="text-gray-800 font-semibold">{selectedCustomer.phone || 'Não informado'}</span></div>
                                <div><span className="font-bold text-gray-500">Cidade/UF:</span> <span className="text-gray-800 font-semibold">{selectedCustomer.city ? `${selectedCustomer.city} - ${selectedCustomer.state}` : 'Não informado'}</span></div>
                                <div><span className="font-bold text-gray-500">Data de Cadastro:</span> <span className="text-gray-800 font-semibold">{selectedCustomer.created_at ? new Date(selectedCustomer.created_at).toLocaleDateString('pt-BR') : 'N/A'}</span></div>
                            </div>

                            {/* Lista de Pedidos Realizados */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Histórico de Pedidos ({selectedCustomer.custOrders.length})</h4>

                                {selectedCustomer.custOrders.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic text-center py-6">Este cliente ainda não efetuou nenhum pedido.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {selectedCustomer.custOrders.map(order => (
                                            <div key={order.id} className="p-4 bg-white rounded-xl border border-[#EEEEEE] shadow-2xs space-y-3">
                                                <div className="flex items-center justify-between border-b border-[#EEEEEE] pb-2 text-xs">
                                                    <div>
                                                        <span className="font-black text-gray-900">Pedido #{String(order.id).slice(-6)}</span>
                                                        <span className="text-[10px] text-gray-400 ml-2">{new Date(order.created_at || order.date).toLocaleString('pt-BR')}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <StatusBadge status={order.status} />
                                                        <span className="font-black text-[#7A3E4A]">R$ {(Number(order.total) || 0).toFixed(2)}</span>
                                                    </div>
                                                </div>

                                                {/* Itens do Pedido */}
                                                <div className="space-y-2">
                                                    {Array.isArray(order.items) && order.items.map((item, idx) => (
                                                        <div key={idx} className="flex items-center justify-between text-xs text-gray-700 bg-[#FAF9F5] p-2 rounded-lg">
                                                            <div className="flex items-center gap-2">
                                                                {item.image && <img src={getAssetUrl(item.image)} alt="" className="w-8 h-8 rounded object-cover border border-gray-200" />}
                                                                <div>
                                                                    <div className="font-bold">{item.title || item.name}</div>
                                                                    <div className="text-[10px] text-gray-400">
                                                                        {item.selectedSize ? `Tam: ${item.selectedSize}` : ''} {item.selectedColor ? `• Cor: ${item.selectedColor}` : ''} • {item.quantity || 1}x
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="font-bold text-gray-900">
                                                                R$ {((Number(item.price) || 0) * (Number(item.quantity) || 1)).toFixed(2)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

// ─── SECTION 10: RETURNS ──────────────────────────────────────────────────────
export function ReturnsSection({
    returns,
    paginatedReturns,
    setSelectedReturn,
    renderPagination,
    rPage,
    setRPage
}) {
    return (
        <div className="space-y-5">
            {returns.length > 0 ? (
                <>
                    <div className="hidden md:block bg-white rounded-2xl border border-[#EEEEEE] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-[#F5F5F5]">
                                        {['Pedido', 'Cliente', 'Tipo', 'Data', 'Status', ''].map((h, i) => (
                                            <th key={i} className={`px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest ${i === 5 ? 'text-right' : ''}`}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F8F8F8]">
                                    {paginatedReturns.map(ret => (
                                        <tr key={ret.id} className="hover:bg-[#FAF9F5] transition-colors">
                                            <td className="px-6 py-4 font-mono text-xs font-bold text-gray-500">#{ret.orderId?.slice(-6)}</td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-gray-800">{ret.customerName}</p>
                                                <p className="text-[10px] text-gray-400">{ret.customerEmail}</p>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#7A3E4A]">{ret.type === 'refund' ? 'Reembolso' : 'Troca'}</td>
                                            <td className="px-6 py-4 text-xs text-gray-500 font-medium">{new Date(ret.created_at).toLocaleDateString('pt-BR')}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold ${
                                                    ret.status === 'Pendente' ? 'bg-amber-50 text-amber-700' :
                                                    ret.status === 'Aprovado' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                                }`}>
                                                    {ret.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => setSelectedReturn(ret)} className="px-4 py-2 bg-[#7A3E4A]/10 hover:bg-[#7A3E4A] text-[#7A3E4A] hover:text-white text-[10px] font-bold rounded-xl transition-all cursor-pointer uppercase tracking-wider">
                                                    Analisar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="md:hidden space-y-3">
                        {paginatedReturns.map(ret => (
                            <div key={ret.id} className="bg-white rounded-2xl border border-[#EEEEEE] p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{ret.customerName}</p>
                                        <p className="text-[10px] text-[#7A3E4A] font-bold uppercase tracking-wider">{ret.type === 'refund' ? 'Reembolso' : 'Troca'}</p>
                                    </div>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                        ret.status === 'Pendente' ? 'bg-amber-50 text-amber-700' :
                                        ret.status === 'Aprovado' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                    }`}>{ret.status}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-[#F5F5F5]">
                                    <span className="text-[10px] text-gray-400 font-mono">#{ret.orderId?.slice(-6)}</span>
                                    <button onClick={() => setSelectedReturn(ret)} className="px-4 py-2 bg-[#7A3E4A] text-white text-[10px] font-bold rounded-xl cursor-pointer">Analisar</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {renderPagination(rPage, returns.length, setRPage)}
                </>
            ) : (
                <div className="bg-white rounded-2xl border border-[#EEEEEE] py-20 text-center">
                    <Icon path="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm font-bold text-gray-600 mb-1">Nenhuma solicitação de troca</p>
                </div>
            )}
        </div>
    )
}

// ─── SECTION 8: STORE SETTINGS ────────────────────────────────────────────────
export function SettingsSection({ saving, setSaving, updateStoreConfig }) {
    const [config, setConfig] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
        } catch { return {} }
    })

    const [whatsapp, setWhatsapp] = useState(config.whatsapp || '551123880403')
    const [sacPhone, setSacPhone] = useState(config.sac_phone || '(11) 2388-0403')
    const [address, setAddress] = useState(config.address || 'Avenida Alfredo Nasser, Qd. 14, Lt. 05 - Centro, Bonfinópolis - GO, CEP: 75195-000')
    const [cnpj, setCnpj] = useState(config.cnpj || '57.484.768/0064-89')
    const [razaoSocial, setRazaoSocial] = useState(config.razao_social || 'Meraki Comércio de Vestuário Ltda')
    const [originCep, setOriginCep] = useState(config.origin_cep || '75195-000')
    const [metaPixelId, setMetaPixelId] = useState(config.meta_pixel_id || '')
    const [gaTrackingId, setGaTrackingId] = useState(config.ga_tracking_id || '')
    const [infinitepayHandle, setInfinitepayHandle] = useState(config.infinitepay_handle || 'nicolly_gomes')
    const [pixKey, setPixKey] = useState(() => {
        try {
            const stored = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
            return stored.pix_key || stored.pixKey || '57328371000114'
        } catch {
            return '57328371000114'
        }
    })

    const [rewardBar, setRewardBar] = useState(() => {
        try {
            const storedReward = JSON.parse(localStorage.getItem('meraki_reward_bar') || 'null')
            return storedReward || config.rewardBar || {
                enabled: true,
                target_type: 'value',
                target_value: 299.99,
                reward_type: 'frete_gratis',
                reward_title: 'Frete Grátis',
                success_message: 'Parabéns! Você ganhou Frete Grátis!'
            }
        } catch {
            return {
                enabled: true,
                target_type: 'value',
                target_value: 299.99,
                reward_type: 'frete_gratis',
                reward_title: 'Frete Grátis',
                success_message: 'Parabéns! Você ganhou Frete Grátis!'
            }
        }
    })
    const [message, setMessage] = useState('')

    // Password states
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [pwdMessage, setPwdMessage] = useState('')
    const [pwdError, setPwdError] = useState(false)

    // Sync with Supabase on mount
    useEffect(() => {
        const fetchDbConfig = async () => {
            try {
                const storedConfig = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
                let storedKey = storedConfig.pix_key || storedConfig.pixKey
                if (storedKey && (storedKey.includes('merakifemme') || storedKey.includes('merakimodafeminina'))) {
                    storedKey = '57328371000114'
                }
                if (storedKey && storedKey.trim()) {
                    setPixKey(storedKey.trim())
                }

                const { data } = await supabase.from('store_config').select('*').eq('id', 'default').maybeSingle()
                if (data) {
                    if (data.whatsapp) setWhatsapp(data.whatsapp)
                    if (data.sac_phone) setSacPhone(data.sac_phone)
                    if (data.address) setAddress(data.address)
                    if (data.cnpj) setCnpj(data.cnpj)
                    if (data.razao_social) setRazaoSocial(data.razao_social)
                    if (data.origin_cep) setOriginCep(data.origin_cep)
                    if (data.meta_pixel_id) setMetaPixelId(data.meta_pixel_id)
                    if (data.ga_tracking_id) setGaTrackingId(data.ga_tracking_id)
                    if (data.infinitepay_handle) setInfinitepayHandle(data.infinitepay_handle)
                    const dbKey = data.pix_key || data.pixkey
                    if (dbKey && String(dbKey).trim() && !dbKey.includes('merakifemme') && !dbKey.includes('merakimodafeminina')) {
                        setPixKey(String(dbKey).trim())
                    }
                }
            } catch (err) {
                console.warn('Erro ao carregar configuracoes do Supabase:', err)
            }
        }
        fetchDbConfig()
    }, [])

    const handlePasswordChange = async (e) => {
        e.preventDefault()
        setSaving?.(true)
        setPwdMessage('')
        setPwdError(false)
        if (newPassword !== confirmPassword) {
            setPwdMessage('As senhas não coincidem.')
            setPwdError(true)
            setSaving?.(false)
            return
        }
        if (newPassword.length < 6) {
            setPwdMessage('A senha deve ter no mínimo 6 caracteres.')
            setPwdError(true)
            setSaving?.(false)
            return
        }
        const { error } = await supabase.auth.updateUser({ password: newPassword })
        if (error) {
            setPwdMessage('Erro ao alterar senha: ' + error.message)
            setPwdError(true)
        } else {
            setPwdMessage('Senha de administrador atualizada com sucesso!')
            setNewPassword('')
            setConfirmPassword('')
            setTimeout(() => setPwdMessage(''), 3000)
        }
        setSaving?.(false)
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving?.(true)
        setMessage('')
        try {
            const updatedConfig = {
                ...config,
                id: 'default',
                whatsapp,
                sac_phone: sacPhone,
                address,
                cnpj,
                razao_social: razaoSocial,
                origin_cep: originCep,
                meta_pixel_id: metaPixelId,
                ga_tracking_id: gaTrackingId,
                infinitepay_handle: infinitepayHandle,
                pix_key: pixKey,
                pixkey: pixKey,
                reward_bar: rewardBar,
                rewardBar
            }
            localStorage.setItem('meraki_store_config', JSON.stringify(updatedConfig))
            localStorage.setItem('meraki_reward_bar', JSON.stringify(rewardBar))
            window.dispatchEvent(new Event('storeConfigUpdated'))
            
            if (updateStoreConfig) {
                await updateStoreConfig(updatedConfig)
            }
            setMessage('Configurações salvas com sucesso!')
            setTimeout(() => setMessage(''), 3000)
        } catch (err) {
            console.error(err)
        }
        setSaving?.(false)
    }

    const inputCls = "w-full px-4 py-3 bg-[#FAF9F5] border border-[#EEEEEE] rounded-xl text-sm outline-none focus:border-[#7A3E4A] focus:ring-2 focus:ring-[#7A3E4A]/10 transition-all font-medium"
    const labelCls = "block text-[10px] font-bold text-gray-700 mb-1.5 uppercase tracking-wider"

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-[#EEEEEE]">
                <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-1">Configurações Gerais da Loja</h3>
                    <p className="text-xs text-gray-400">Gerencie contatos, dados jurídicos do rodapé, pixels de anúncios, chave de pagamento e frete em um único lugar.</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {message && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl animate-[fadeIn_200ms_ease-out]">
                        ✓ {message}
                    </div>
                )}

                {/* 1. Dados Jurídicos & SAC */}
                <div className="bg-white p-6 rounded-2xl border border-[#EEEEEE] space-y-4">
                    <h4 className="text-xs font-black text-[#7A3E4A] uppercase tracking-wider flex items-center gap-2">
                        🏛️ Dados da Empresa & SAC (Rodapé)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Número do WhatsApp (Com DDD - Apenas Números)</label>
                            <input
                                type="text"
                                value={whatsapp}
                                onChange={(e) => setWhatsapp(e.target.value)}
                                className={inputCls}
                                required
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Telefone do SAC (Exibido formatado)</label>
                            <input
                                type="text"
                                value={sacPhone}
                                onChange={(e) => setSacPhone(e.target.value)}
                                className={inputCls}
                                required
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Razão Social</label>
                            <input
                                type="text"
                                value={razaoSocial}
                                onChange={(e) => setRazaoSocial(e.target.value)}
                                className={inputCls}
                                required
                            />
                        </div>
                        <div>
                            <label className={labelCls}>CNPJ da Empresa</label>
                            <input
                                type="text"
                                value={cnpj}
                                onChange={(e) => setCnpj(e.target.value)}
                                className={inputCls}
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelCls}>Endereço Completo do Showroom / Loja Física</label>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className={inputCls}
                                required
                            />
                        </div>
                        <div>
                            <label className={labelCls}>CEP de Origem (Saída dos Envios)</label>
                            <input
                                type="text"
                                value={originCep}
                                onChange={(e) => setOriginCep(e.target.value)}
                                className={inputCls}
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Marketing & Pixels */}
                <div className="bg-white p-6 rounded-2xl border border-[#EEEEEE] space-y-4">
                    <h4 className="text-xs font-black text-[#7A3E4A] uppercase tracking-wider flex items-center gap-2">
                        📊 Rastreamento & Marketing (Pixels)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>ID do Meta Pixel (Facebook / Instagram Ads)</label>
                            <input
                                type="text"
                                placeholder="Ex: 123456789012345"
                                value={metaPixelId}
                                onChange={(e) => setMetaPixelId(e.target.value)}
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>ID do Google Analytics 4 (GA4)</label>
                            <input
                                type="text"
                                placeholder="Ex: G-XXXXXXXXXX"
                                value={gaTrackingId}
                                onChange={(e) => setGaTrackingId(e.target.value)}
                                className={inputCls}
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Pagamento */}
                <div className="bg-white p-6 rounded-2xl border border-[#EEEEEE] space-y-4">
                    <h4 className="text-xs font-black text-[#7A3E4A] uppercase tracking-wider flex items-center gap-2">
                        💳 Gateway & Chave PIX de Pagamento
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>InfiniteTag / Handle da InfinitePay (Sem o $)</label>
                            <input
                                type="text"
                                value={infinitepayHandle}
                                onChange={(e) => setInfinitepayHandle(e.target.value)}
                                className={inputCls}
                                placeholder="nicolly_gomes"
                                required
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Chave PIX Oficial da Conta (E-mail, CNPJ, CPF ou EVP)</label>
                            <input
                                type="text"
                                value={pixKey}
                                onChange={(e) => setPixKey(e.target.value)}
                                className={inputCls}
                                placeholder="merakifemme.lingerie@gmail.com"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* 4. Barra de Progresso / Recompensas no Carrinho */}
                <div className="bg-white p-6 rounded-2xl border border-[#EEEEEE] space-y-4">
                    <div className="flex items-center justify-between border-b border-[#F5F5F5] pb-4">
                        <div>
                            <h4 className="text-xs font-black text-[#7A3E4A] uppercase tracking-wider flex items-center gap-2">
                                🎁 Barra de Progresso / Recompensas no Carrinho
                            </h4>
                            <p className="text-xs text-gray-400 mt-0.5">Configure metas de valor ou quantidade para liberar Frete Grátis, Brindes ou Descontos.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={rewardBar.enabled}
                                onChange={(e) => setRewardBar(prev => ({ ...prev, enabled: e.target.checked }))}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7A3E4A]"></div>
                            <span className="ml-2 text-xs font-bold text-gray-700">{rewardBar.enabled ? 'Ativada' : 'Desativada'}</span>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className={labelCls}>Tipo de Bônus / Recompensa</label>
                            <select
                                value={rewardBar.reward_type || 'frete_gratis'}
                                onChange={(e) => setRewardBar(prev => ({ 
                                    ...prev, 
                                    reward_type: e.target.value,
                                    reward_title: e.target.value === 'frete_gratis' ? 'Frete Grátis' : (e.target.value === 'brinde' ? 'Brinde Especial' : 'Desconto Especial')
                                }))}
                                className={inputCls}
                            >
                                <option value="frete_gratis">🚚 Frete Grátis</option>
                                <option value="brinde">🎁 Brinde Especial (ex: Batom/Mimo)</option>
                                <option value="desconto">🏷️ Desconto Especial</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelCls}>Tipo de Meta</label>
                            <select
                                value={rewardBar.target_type}
                                onChange={(e) => setRewardBar(prev => ({ ...prev, target_type: e.target.value }))}
                                className={inputCls}
                            >
                                <option value="value">Valor Mínimo da Compra (R$)</option>
                                <option value="quantity">Quantidade Mínima de Produtos (Qtd)</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelCls}>
                                {rewardBar.target_type === 'quantity' ? 'Quantidade Meta (ex: 3)' : 'Valor Meta R$ (ex: 299.99)'}
                            </label>
                            <input
                                type="number"
                                step="any"
                                value={rewardBar.target_value}
                                onChange={(e) => setRewardBar(prev => ({ ...prev, target_value: parseFloat(e.target.value) || 0 }))}
                                className={inputCls}
                                required
                            />
                        </div>

                        <div>
                            <label className={labelCls}>Título da Recompensa</label>
                            <input
                                type="text"
                                value={rewardBar.reward_title}
                                onChange={(e) => setRewardBar(prev => ({ ...prev, reward_title: e.target.value }))}
                                className={inputCls}
                                placeholder="Ex: Frete Grátis ou Batom de Brinde"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className={labelCls}>Mensagem de Comemoração (Ao atingir a meta)</label>
                        <input
                            type="text"
                            value={rewardBar.success_message}
                            onChange={(e) => setRewardBar(prev => ({ ...prev, success_message: e.target.value }))}
                            className={inputCls}
                            placeholder="Ex: Parabéns! Você ganhou Frete Grátis!"
                            required
                        />
                    </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-8 py-3.5 bg-gradient-to-r from-[#7A3E4A] to-[#9A5060] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:shadow-lg hover:shadow-[#7A3E4A]/30 transition-all cursor-pointer disabled:opacity-50"
                    >
                        {saving ? 'Salvando...' : 'Salvar Configurações da Loja'}
                    </button>
                </div>
            </form>

            {/* Alteração de Senha */}
            <form onSubmit={handlePasswordChange} className="bg-white p-6 rounded-2xl border border-[#EEEEEE] space-y-4">
                <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-1">Alterar Minha Senha de Administrador</h3>
                    <p className="text-xs text-gray-400">Insira a nova senha para atualizar seu login administrativo do site.</p>
                </div>

                {pwdMessage && (
                    <div className={`p-4 text-xs font-bold rounded-xl border ${pwdError ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                        {pwdMessage}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelCls}>Nova Senha (Mínimo 6 caracteres)</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className={inputCls}
                            required
                        />
                    </div>
                    <div>
                        <label className={labelCls}>Confirmar Nova Senha</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={inputCls}
                            required
                        />
                    </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-3 bg-gradient-to-r from-[#7A3E4A] to-[#9A5060] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:shadow-lg hover:shadow-[#7A3E4A]/30 transition-all cursor-pointer disabled:opacity-50"
                    >
                        {saving ? 'Alterando...' : 'Alterar Senha'}
                    </button>
                </div>
            </form>
        </div>
    )
}

export function InstitutionalSection({ saving, setSaving, updateStoreConfig }) {
    const masterPagesList = [
        { id: 'story', label: 'Nossa História', category: 'Sobre' },
        { id: 'revenda', label: 'Seja um Revendedor', category: 'Sobre' },
        { id: 'connect', label: 'Conecte-se (Contatos & Redes)', category: 'Sobre' },
        { id: 'security', label: 'Compra Segura', category: 'Atendimento' },
        { id: 'payment', label: 'Formas de Pagamento', category: 'Atendimento' },
        { id: 'delivery', label: 'Entrega e Frete', category: 'Atendimento' },
        { id: 'returns', label: 'Política de Troca', category: 'Atendimento' },
        { id: 'withdrawal', label: 'Direito de Arrependimento', category: 'Atendimento' },
        { id: 'privacy', label: 'Política de Privacidade', category: 'Atendimento' },
        { id: 'promotional-rules', label: 'Regras Promocionais', category: 'Atendimento' },
        { id: 'stores', label: 'Nossas Lojas', category: 'Lojas' }
    ]

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

    // New Page Modal States
    const [createModalOpen, setCreateModalOpen] = useState(false)
    const [newPageTitle, setNewPageTitle] = useState('')
    const [newPageCategory, setNewPageCategory] = useState('Atendimento')
    const [newPageContent, setNewPageContent] = useState('')

    const allMasterPagesList = useMemo(() => {
        return [...masterPagesList, ...customPagesList]
    }, [customPagesList])

    const pagesList = useMemo(() => {
        return allMasterPagesList.filter(p => !deletedPages.includes(p.id))
    }, [allMasterPagesList, deletedPages])

    const handleCreatePage = async (e) => {
        e.preventDefault()
        const title = newPageTitle.trim()
        if (!title) return

        const slug = title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '') || `pagina-${Date.now()}`

        const newPageObj = {
            id: slug,
            label: title,
            category: newPageCategory.trim() || 'Atendimento',
            isCustom: true
        }

        const updatedCustom = [...customPagesList.filter(p => p.id !== slug), newPageObj]
        setCustomPagesList(updatedCustom)
        localStorage.setItem('meraki_custom_pages_list', JSON.stringify(updatedCustom))

        const initialContent = newPageContent.trim() || `Bem-vindo à página ${title}. Escreva aqui o seu texto.`
        const updatedPagesData = {
            ...pagesData,
            [slug]: {
                title: title,
                content: initialContent,
                category: newPageCategory.trim() || 'Atendimento',
                updated_at: new Date().toISOString()
            }
        }
        setPagesData(updatedPagesData)
        localStorage.setItem('meraki_pages_content', JSON.stringify(updatedPagesData))
        window.dispatchEvent(new Event('pagesContentUpdated'))

        if (updateStoreConfig) {
            const config = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
            await updateStoreConfig({
                ...config,
                custom_pages_list: updatedCustom,
                pages_content: updatedPagesData
            })
        }

        setSelectedPageId(slug)
        setCreateModalOpen(false)
        setNewPageTitle('')
        setNewPageContent('')
        setMessage(`Nova página "${title}" criada com sucesso!`)
        setTimeout(() => setMessage(''), 4000)
    }

    const handleDeletePage = async (pageId) => {
        const pageObj = allMasterPagesList.find(p => p.id === pageId)
        const pageName = pageObj?.label || pageId
        if (!window.confirm(`Tem certeza que deseja excluir a página "${pageName}"?\nEla deixará de aparecer no site e no painel de administração.`)) {
            return
        }

        if (pageObj?.isCustom) {
            const updatedCustom = customPagesList.filter(p => p.id !== pageId)
            setCustomPagesList(updatedCustom)
            localStorage.setItem('meraki_custom_pages_list', JSON.stringify(updatedCustom))

            const updatedPagesData = { ...pagesData }
            delete updatedPagesData[pageId]
            setPagesData(updatedPagesData)
            localStorage.setItem('meraki_pages_content', JSON.stringify(updatedPagesData))
            window.dispatchEvent(new Event('pagesContentUpdated'))

            if (updateStoreConfig) {
                const config = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
                await updateStoreConfig({
                    ...config,
                    custom_pages_list: updatedCustom,
                    pages_content: updatedPagesData
                })
            }
        } else {
            const newDeleted = [...deletedPages, pageId]
            setDeletedPages(newDeleted)
            localStorage.setItem('meraki_deleted_pages', JSON.stringify(newDeleted))
            window.dispatchEvent(new Event('pagesContentUpdated'))

            if (updateStoreConfig) {
                const config = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
                await updateStoreConfig({ ...config, deleted_pages: newDeleted })
            }
        }

        const remaining = allMasterPagesList.filter(p => p.id !== pageId && !deletedPages.includes(p.id))
        if (remaining.length > 0) {
            setSelectedPageId(remaining[0].id)
        }
        setMessage(`Página "${pageName}" excluída com sucesso!`)
        setTimeout(() => setMessage(''), 4000)
    }

    const handleRestorePage = async (pageId) => {
        const pageObj = allMasterPagesList.find(p => p.id === pageId)
        const newDeleted = deletedPages.filter(id => id !== pageId)
        setDeletedPages(newDeleted)
        localStorage.setItem('meraki_deleted_pages', JSON.stringify(newDeleted))
        window.dispatchEvent(new Event('pagesContentUpdated'))

        if (updateStoreConfig) {
            const config = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
            await updateStoreConfig({ ...config, deleted_pages: newDeleted })
        }

        setSelectedPageId(pageId)
        setMessage(`Página "${pageObj?.label || pageId}" restaurada com sucesso!`)
        setTimeout(() => setMessage(''), 4000)
    }

    const defaultPagesData = {
        story: {
            title: 'Nossa História',
            content: `A Meraki nasceu do desejo de celebrar a beleza autêntica e a sofisticação da mulher moderna. Fundada em 2023, nossa marca tem como propósito criar lingeries que oferecem o equilíbrio perfeito entre sensualidade, conforto e qualidade excepcional.\n\nO termo grego "Meraki" significa fazer algo com alma, criatividade ou amor; colocar uma parte de si em tudo o que faz. Essa filosofia está presente em cada detalhe de nosso processo: desde a escolha cuidadosa das rendas francesas de toque macio até o design das costuras e acabamentos manuais de luxo.\n\n"Acreditamos que a primeira camada de roupa que uma mulher veste tem o poder de transformar como ela se sente por fora e por dentro."\n\nHoje, contamos com ateliê próprio e coleções exclusivas criadas para abraçar a diversidade dos corpos femininos com caimento impecável e modelagem inteligente.`
        },
        revenda: {
            title: 'Seja um Revendedor',
            content: `Aumente sua renda revendendo lingeries premium de altíssima aceitação. O programa de revendedoras da Meraki foi desenvolvido para quem busca flexibilidade de horários, independência financeira e um produto com design autoral diferenciado.\n\nMargens de Lucro:\nCondições comerciais e descontos progressivos atrativos para compras no atacado.\n\nFotos & Catálogos:\nAcesso completo a materiais fotográficos de alta qualidade para divulgação nas suas redes sociais.\n\nSem Burocracia:\nPedido mínimo inicial reduzido e reposição rápida de peças conforme a sua demanda.\n\nPara receber nosso catálogo de atacado e a tabela de valores de revenda, envie um e-mail para revenda@merakistore.com.br ou entre em contato pelo nosso WhatsApp de atendimento comercial.`
        },
        connect: {
            title: 'Conecte-se',
            content: `Acompanhe de perto as nossas novidades, coleções exclusivas e bastidores da marca em nossos canais oficiais de comunicação.\n\nInstagram:\n@merakistore.oficial\n\nWhatsApp VIP:\n(11) 2388-0403\n\nAtendimento Geral:\ncontato@merakistore.com.br`
        },
        security: {
            title: 'Compra Segura',
            content: `Para nós da Meraki, a segurança dos seus dados pessoais e de pagamento é prioridade absoluta. Investimos nas melhores tecnologias de criptografia do mercado para proporcionar a você uma experiência de compra tranquila e protegida.\n\nNossas Certificações & Garantias:\n- Criptografia SSL (Secure Sockets Layer): Protege e codifica toda a comunicação de dados durante as transações financeiras e preenchimento de senhas.\n- Certificado Let's Encrypt: Garante a autenticidade e a criptografia ponto a ponto de ponta em todas as conexões da plataforma.\n- Proteção Antifraude Integrada: Análise de segurança automática com validação instantânea dos meios de pagamento.`
        },
        payment: {
            title: 'Formas de Pagamento',
            content: `Disponibilizamos formas de pagamento flexíveis e seguras para facilitar o processo de compra das suas lingeries prediletas.\n\nFormas Aceitas:\n- Cartão de Crédito: Aceitamos as bandeiras Visa, Mastercard, Elo, American Express e Diners Club. Você pode parcelar suas compras em até 12x sem juros (ou conforme promoção vigente).\n- Pix (Pagamento Instantâneo): Pagamentos via Pix são processados em tempo real, agilizando a expedição e o envio imediato da sua compra.`
        },
        delivery: {
            title: 'Entrega e Frete',
            content: `Entregamos em todo o Brasil por meio de transportadoras homologadas e dos Correios, com códigos de rastreamento enviados diretamente ao seu e-mail após a postagem.\n\nCondições Especiais:\n- Frete Grátis Bonfinópolis-GO: Entrega especial em Bonfinópolis-GO nas compras acima de R$ 29,99.\n- Frete Grátis Centro-Oeste: Disponível nas compras acima de R$ 299,90 para a região.\n- Prazo de Expedição: Pedidos aprovados são separados, revisados e postados em até 24 horas úteis.\n- Opções de Envio: Modalidades Sedex (Expressa) e PAC (Normal), cotadas no fechamento do carrinho.`
        },
        returns: {
            title: 'Política de Troca',
            content: `Queremos que você se sinta plenamente satisfeita com a sua lingerie Meraki. Por se tratar de peças íntimas e por questões de higiene e saúde, oferecemos um processo de troca seguro e descomplicado.\n\nRegras de Troca:\n- Prazo de Solicitação: Até 7 dias corridos após a entrega do produto, contados conforme o rastreamento da transportadora.\n- Condições da Peça: Os produtos não podem apresentar qualquer sinal de uso, prova inadequada, lavagem, manchas, odores ou alterações e devem conter a etiqueta original fixada.\n- Primeira Troca: O frete de retorno do produto para troca é custeado pela Meraki por meio de código de autorização de postagem reversa na primeira troca.`
        },
        withdrawal: {
            title: 'Direito de Arrependimento',
            content: `De acordo com o artigo 49 do Código de Defesa do Consumidor brasileiro, nas compras realizadas fora do estabelecimento físico (via internet), o cliente possui o direito de arrependimento e cancelamento da compra.\n\nProcedimento:\n- O arrependimento deve ser formalizado em até 7 dias corridos a partir do recebimento da encomenda.\n- Após o recebimento e análise de controle de qualidade das lingeries em nosso ateliê, o reembolso do valor total pago é realizado em até 5 dias úteis no caso de Pix, ou estornado em até duas faturas no caso de cartão de crédito.`
        },
        privacy: {
            title: 'Política de Privacidade',
            content: `Esta Política de Privacidade descreve como tratamos e protegemos as suas informações cadastrais e dados de navegação ao interagir em nossa plataforma digital, seguindo rigorosamente a Lei Geral de Proteção de Dados (LGPD).\n\nSegurança e Compartilhamento:\n- Utilizamos seus dados cadastrais (Nome, CPF, Endereço) unicamente para processamento e emissão de notas fiscais dos seus pedidos.\n- Nunca comercializamos ou expomos dados pessoais a terceiros estranhos ao processo de entrega ou processamento bancário.\n- Você pode solicitar a alteração ou exclusão definitiva do seu cadastro da base de dados enviando solicitação formal aos nossos canais de suporte.`
        },
        'promotional-rules': {
            title: 'Regras Promocionais',
            content: `Para garantir a transparência de nossas ofertas e campanhas, listamos abaixo as diretrizes gerais de aplicação de cupons, descontos e combos.\n\nRegras Gerais:\n- Cupons de Desconto: Não são cumulativos. Apenas um cupom pode ser inserido por pedido no fechamento da compra.\n- Preços Promocionais: Preços destacados ou riscados em promoção são válidos por tempo limitado ou enquanto durarem os estoques do lote.\n- Frete Grátis: Atingindo o valor mínimo estipulado após a dedução de todos os descontos promocionais.`
        },
        stores: {
            title: 'Nossas Lojas',
            content: `Venha viver a experiência Meraki presencialmente e desfrutar de um atendimento personalizado em nosso showroom exclusivo em Bonfinópolis-GO.\n\nShowroom Meraki Bonfinópolis:\nAvenida Alfredo Nasser, Qd. 14, Lt. 05 - Centro, Bonfinópolis - GO, CEP: 75195-000\nTelefone/WhatsApp de Atendimento: (11) 2388-0403`
        }
    }

    const [selectedPageId, setSelectedPageId] = useState('story')
    const [editorMode, setEditorMode] = useState('editor') // 'editor' | 'preview'
    const textareaRef = useRef(null)

    const [pagesData, setPagesData] = useState(() => {
        try {
            const stored = localStorage.getItem('meraki_pages_content')
            if (stored) {
                const parsed = JSON.parse(stored)
                return { ...defaultPagesData, ...parsed }
            }
        } catch (e) { console.error(e) }
        return defaultPagesData
    })

    const [pageTitle, setPageTitle] = useState('')
    const [pageContent, setPageContent] = useState('')
    const [message, setMessage] = useState('')

    useEffect(() => {
        const current = pagesData[selectedPageId] || {}
        const defaultPage = pagesList.find(p => p.id === selectedPageId)
        setPageTitle(current.title || defaultPage?.label || '')
        setPageContent(current.content || '')
    }, [selectedPageId, pagesData])

    const insertTag = (openTag, closeTag = '') => {
        const textarea = textareaRef.current
        if (!textarea) return
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const selectedText = pageContent.substring(start, end)
        const replacement = `${openTag}${selectedText || 'Seu texto aqui'}${closeTag}`
        const newContent = pageContent.substring(0, start) + replacement + pageContent.substring(end)
        setPageContent(newContent)
        setTimeout(() => {
            textarea.focus()
            textarea.setSelectionRange(start + openTag.length, start + openTag.length + (selectedText ? selectedText.length : 14))
        }, 50)
    }

    const handleSavePage = async (e) => {
        e.preventDefault()
        setSaving?.(true)
        setMessage('')
        try {
            const currentObj = pagesList.find(p => p.id === selectedPageId)
            const newTitle = pageTitle.trim() || currentObj?.label || selectedPageId

            let updatedCustom = [...customPagesList]
            if (currentObj?.isCustom) {
                updatedCustom = updatedCustom.map(p => p.id === selectedPageId ? { ...p, label: newTitle } : p)
                setCustomPagesList(updatedCustom)
                localStorage.setItem('meraki_custom_pages_list', JSON.stringify(updatedCustom))
            }

            const updated = {
                ...pagesData,
                [selectedPageId]: {
                    ...pagesData[selectedPageId],
                    title: newTitle,
                    content: pageContent,
                    category: currentObj?.category || 'Atendimento',
                    updated_at: new Date().toISOString()
                }
            }
            setPagesData(updated)
            localStorage.setItem('meraki_pages_content', JSON.stringify(updated))
            window.dispatchEvent(new Event('pagesContentUpdated'))

            if (updateStoreConfig) {
                const config = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
                await updateStoreConfig({
                    ...config,
                    pages_content: updated,
                    custom_pages_list: updatedCustom
                })
            }

            setMessage(`Página "${newTitle}" atualizada com sucesso no site!`)
            setTimeout(() => setMessage(''), 3000)
        } catch (err) {
            setMessage('Erro ao salvar página: ' + err.message)
        } finally {
            setSaving?.(false)
        }
    }

    const inputCls = "w-full px-4 py-3 bg-[#FAF9F5] border border-[#EEEEEE] rounded-xl text-sm text-gray-800 outline-none focus:border-[#7A3E4A] focus:ring-2 focus:ring-[#7A3E4A]/10 transition-all font-medium placeholder-gray-400"
    const labelCls = "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5"

    const isHtmlContent = /<[a-z][\s\S]*>/i.test(pageContent)
    const renderPreviewContent = () => {
        if (!pageContent) return <p className="text-gray-400 text-xs italic">Sem conteúdo digitado.</p>
        if (isHtmlContent) {
            return (
                <div 
                    className="prose prose-stone max-w-none text-sm leading-relaxed text-gray-600 space-y-4"
                    dangerouslySetInnerHTML={{ __html: pageContent }}
                />
            )
        }
        return pageContent.split('\n\n').filter(Boolean).map((p, i) => (
            <p key={i} className="text-sm leading-relaxed text-gray-600 whitespace-pre-line mb-4">
                {p}
            </p>
        ))
    }

    return (
        <div className="space-y-6 font-sans">
            <div className="bg-white p-6 rounded-2xl border border-[#EEEEEE] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <span className="text-[10px] font-bold text-[#C6A76A] uppercase tracking-widest">Editor Visual de Conteúdo</span>
                    <h2 className="text-xl font-bold text-gray-900">Páginas Institucionais & Atendimento</h2>
                    <p className="text-xs text-gray-500 mt-1">Edite textos com cartões, negrito, destaques e pré-visualização ao vivo igual ao site.</p>
                </div>
                <button
                    type="button"
                    onClick={() => setCreateModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#7A3E4A] to-[#9A5060] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:shadow-lg hover:shadow-[#7A3E4A]/30 transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                    <Icon path="M12 4v16m8-8H4" className="w-4 h-4" />
                    Nova Página
                </button>
            </div>

            {message && (
                <div className="p-4 text-xs font-bold rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-sm animate-[fadeIn_200ms_ease-out]">
                    {message}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Page Selector List */}
                <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-[#EEEEEE] space-y-4">
                    <div>
                        <div className="flex items-center justify-between px-2 mb-3">
                            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">Selecione a Página para Editar</h3>
                            <span className="text-[10px] font-bold text-gray-400">({pagesList.length})</span>
                        </div>
                        <div className="space-y-1.5 max-h-[480px] overflow-y-auto overflow-x-hidden pr-1">
                            {pagesList.map(p => {
                                const isSelected = selectedPageId === p.id
                                const displayTitle = pagesData[p.id]?.title || p.label
                                return (
                                    <div key={p.id} className={`w-full flex items-center justify-between gap-1 p-1 rounded-xl transition-all ${
                                        isSelected
                                            ? 'bg-gradient-to-r from-[#7A3E4A] to-[#9A5060] text-white shadow-md shadow-[#7A3E4A]/20'
                                            : 'bg-[#FAF9F5] hover:bg-[#7A3E4A]/10 text-gray-700'
                                    }`}>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedPageId(p.id)}
                                            className="flex-1 flex items-center justify-between min-w-0 py-1.5 px-2.5 text-left font-bold cursor-pointer"
                                        >
                                            <span className="truncate text-xs">{displayTitle}</span>
                                            <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md shrink-0 ml-1 ${
                                                isSelected ? 'bg-white/20 text-white' : 'bg-gray-200/60 text-gray-500'
                                            }`}>
                                                {p.category}
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeletePage(p.id)}
                                            title="Excluir esta página do site"
                                            className={`p-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
                                                isSelected ? 'text-white/70 hover:text-white hover:bg-white/20' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                            }`}
                                        >
                                            <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Deleted Pages Restore Section */}
                    {deletedPages.length > 0 && (
                        <div className="pt-3 border-t border-gray-100">
                            <h4 className="text-[10px] font-black text-red-500 uppercase tracking-wider px-2 mb-2">Páginas Excluídas ({deletedPages.length})</h4>
                            <div className="space-y-1">
                                {deletedPages.map(pageId => {
                                    const pageObj = allMasterPagesList.find(p => p.id === pageId)
                                    const displayDeletedTitle = pagesData[pageId]?.title || pageObj?.label || pageId
                                    return (
                                        <div key={pageId} className="flex items-center justify-between px-3 py-2 bg-red-50/50 rounded-xl border border-red-100 text-xs">
                                            <span className="font-semibold text-gray-600 line-through truncate max-w-[140px]">{displayDeletedTitle}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRestorePage(pageId)}
                                                className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-all cursor-pointer flex items-center gap-1"
                                            >
                                                <Icon path="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" className="w-3 h-3" />
                                                Restaurar
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Page Content Form & Live Preview */}
                <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-[#EEEEEE] space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-3">
                        <div>
                            <span className="text-[9px] font-bold text-[#7A3E4A] uppercase tracking-widest">Editando Página</span>
                            <h3 className="text-lg font-black text-gray-900">
                                {pageTitle || pagesData[selectedPageId]?.title || allMasterPagesList.find(p => p.id === selectedPageId)?.label || selectedPageId}
                            </h3>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Editor / Preview Toggle */}
                            <div className="flex items-center bg-[#FAF9F5] p-1 rounded-xl border border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setEditorMode('editor')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        editorMode === 'editor'
                                            ? 'bg-[#7A3E4A] text-white shadow-sm'
                                            : 'text-gray-500 hover:text-gray-800'
                                    }`}
                                >
                                    ✏️ Editar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditorMode('preview')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        editorMode === 'preview'
                                            ? 'bg-[#7A3E4A] text-white shadow-sm'
                                            : 'text-gray-500 hover:text-gray-800'
                                    }`}
                                >
                                    👁️ Pré-visualizar
                                </button>
                            </div>

                            {/* Delete Page Button Header */}
                            <button
                                type="button"
                                onClick={() => handleDeletePage(selectedPageId)}
                                className="px-3.5 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                                title="Excluir esta página"
                            >
                                <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="w-4 h-4" />
                                Excluir Página
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSavePage} className="space-y-4">
                        <div>
                            <label className={labelCls}>Título da Página</label>
                            <input
                                type="text"
                                value={pageTitle}
                                onChange={(e) => setPageTitle(e.target.value)}
                                className={inputCls}
                                placeholder="Ex: Nossa História"
                                required
                            />
                        </div>

                        {editorMode === 'editor' ? (
                            <div className="space-y-2">
                                <label className={labelCls}>Barra de Ferramentas de Formatação (Clique para inserir)</label>
                                
                                {/* Complete Rich Text Formatting Toolbar */}
                                <div className="p-3 bg-[#FAF9F5] border border-[#EEEEEE] rounded-2xl space-y-2 font-sans">
                                    {/* Row 1: Basic Formatting, Colors, Highlights */}
                                    <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-gray-200/60">
                                        {/* Text styles */}
                                        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-2xs">
                                            <button
                                                type="button"
                                                onClick={() => insertTag('<strong>', '</strong>')}
                                                className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-lg text-xs font-black text-gray-900 cursor-pointer"
                                                title="Negrito (Strong)"
                                            >
                                                B
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertTag('<em>', '</em>')}
                                                className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-lg text-xs font-serif italic text-gray-900 cursor-pointer"
                                                title="Itálico (Emphasize)"
                                            >
                                                I
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertTag('<u>', '</u>')}
                                                className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-lg text-xs underline font-bold text-gray-900 cursor-pointer"
                                                title="Sublinhado"
                                            >
                                                U
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertTag('<s>', '</s>')}
                                                className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-lg text-xs line-through font-bold text-gray-900 cursor-pointer"
                                                title="Tachado / Riscado"
                                            >
                                                S
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertTag('<sup>', '</sup>')}
                                                className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-lg text-[10px] font-bold text-gray-900 cursor-pointer"
                                                title="Sobrescrito (x²)"
                                            >
                                                x²
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertTag('<sub>', '</sub>')}
                                                className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-lg text-[10px] font-bold text-gray-900 cursor-pointer"
                                                title="Subscrito (x₂)"
                                            >
                                                x₂
                                            </button>
                                        </div>

                                        <div className="w-px h-6 bg-gray-200" />

                                        {/* Custom Text Color Picker */}
                                        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-gray-200 shadow-2xs">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Cor Texto:</span>
                                            <input
                                                type="color"
                                                defaultValue="#7A3E4A"
                                                onChange={(e) => insertTag(`<span style="color: ${e.target.value}; font-weight: bold;">`, '</span>')}
                                                className="w-6 h-6 rounded-md cursor-pointer border-none bg-transparent"
                                                title="Escolher Cor do Texto Personalizada"
                                            />
                                            {/* Preset Colors */}
                                            <button type="button" onClick={() => insertTag('<span style="color: #7A3E4A; font-weight: bold;">', '</span>')} className="w-4 h-4 rounded-full bg-[#7A3E4A] hover:scale-110 transition-all cursor-pointer" title="Vinho Meraki" />
                                            <button type="button" onClick={() => insertTag('<span style="color: #C6A76A; font-weight: bold;">', '</span>')} className="w-4 h-4 rounded-full bg-[#C6A76A] hover:scale-110 transition-all cursor-pointer" title="Dourado Luxo" />
                                            <button type="button" onClick={() => insertTag('<span style="color: #D4A373; font-weight: bold;">', '</span>')} className="w-4 h-4 rounded-full bg-[#D4A373] hover:scale-110 transition-all cursor-pointer" title="Rosa Nude" />
                                            <button type="button" onClick={() => insertTag('<span style="color: #111827; font-weight: bold;">', '</span>')} className="w-4 h-4 rounded-full bg-[#111827] hover:scale-110 transition-all cursor-pointer" title="Preto Puro" />
                                            <button type="button" onClick={() => insertTag('<span style="color: #059669; font-weight: bold;">', '</span>')} className="w-4 h-4 rounded-full bg-[#059669] hover:scale-110 transition-all cursor-pointer" title="Verde Esmeralda" />
                                            <button type="button" onClick={() => insertTag('<span style="color: #2563EB; font-weight: bold;">', '</span>')} className="w-4 h-4 rounded-full bg-[#2563EB] hover:scale-110 transition-all cursor-pointer" title="Azul Real" />
                                            <button type="button" onClick={() => insertTag('<span style="color: #DC2626; font-weight: bold;">', '</span>')} className="w-4 h-4 rounded-full bg-[#DC2626] hover:scale-110 transition-all cursor-pointer" title="Vermelho Destaque" />
                                        </div>

                                        {/* Highlight Background Color Picker */}
                                        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-gray-200 shadow-2xs">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Marca-Texto:</span>
                                            <input
                                                type="color"
                                                defaultValue="#FEF08A"
                                                onChange={(e) => insertTag(`<span style="background-color: ${e.target.value}; padding: 2px 6px; border-radius: 4px; font-weight: 500;">`, '</span>')}
                                                className="w-6 h-6 rounded-md cursor-pointer border-none bg-transparent"
                                                title="Escolher Cor de Marca-Texto"
                                            />
                                            <button type="button" onClick={() => insertTag('<span style="background-color: #FEF08A; padding: 2px 6px; border-radius: 4px; color: #854D0E;">', '</span>')} className="w-4 h-4 rounded-full bg-[#FEF08A] hover:scale-110 transition-all cursor-pointer" title="Amarelo Marca-Texto" />
                                            <button type="button" onClick={() => insertTag('<span style="background-color: #FCE7F3; padding: 2px 6px; border-radius: 4px; color: #831843;">', '</span>')} className="w-4 h-4 rounded-full bg-[#FCE7F3] hover:scale-110 transition-all cursor-pointer" title="Rosa Marca-Texto" />
                                            <button type="button" onClick={() => insertTag('<span style="background-color: #FEF3C7; padding: 2px 6px; border-radius: 4px; color: #92400E;">', '</span>')} className="w-4 h-4 rounded-full bg-[#FEF3C7] hover:scale-110 transition-all cursor-pointer" title="Dourado Marca-Texto" />
                                            <button type="button" onClick={() => insertTag('<span style="background-color: #D1FAE5; padding: 2px 6px; border-radius: 4px; color: #065F46;">', '</span>')} className="w-4 h-4 rounded-full bg-[#D1FAE5] hover:scale-110 transition-all cursor-pointer" title="Verde Marca-Texto" />
                                        </div>
                                    </div>

                                    {/* Row 2: Typography, Size, Alignments */}
                                    <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-gray-200/60">
                                        {/* Font Size Select */}
                                        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-gray-200 shadow-2xs">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">Tamanho:</span>
                                            <select
                                                onChange={(e) => {
                                                    if (e.target.value) insertTag(`<span style="font-size: ${e.target.value}; font-weight: 500;">`, '</span>')
                                                }}
                                                className="text-xs font-bold text-gray-800 bg-transparent outline-none cursor-pointer"
                                            >
                                                <option value="">Selecione...</option>
                                                <option value="12px">Pequeno (12px)</option>
                                                <option value="14px">Normal (14px)</option>
                                                <option value="16px">Médio (16px)</option>
                                                <option value="18px">Grande (18px)</option>
                                                <option value="22px">Subtítulo (22px)</option>
                                                <option value="28px">Título (28px)</option>
                                                <option value="36px">Mega Título (36px)</option>
                                            </select>
                                        </div>

                                        {/* Font Family Select */}
                                        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-gray-200 shadow-2xs">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">Fonte:</span>
                                            <select
                                                onChange={(e) => {
                                                    if (e.target.value) insertTag(`<span style="font-family: ${e.target.value};">`, '</span>')
                                                }}
                                                className="text-xs font-bold text-gray-800 bg-transparent outline-none cursor-pointer"
                                            >
                                                <option value="">Selecione...</option>
                                                <option value="sans-serif">Sans-Serif Moderno</option>
                                                <option value="serif">Serif Elegante</option>
                                                <option value="monospace">Código / Monospace</option>
                                                <option value="cursive">Manuscrita / Script</option>
                                            </select>
                                        </div>

                                        <div className="w-px h-6 bg-gray-200" />

                                        {/* Text Alignment */}
                                        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-2xs">
                                            <button type="button" onClick={() => insertTag('<div style="text-align: left; margin-bottom: 8px;">', '</div>')} className="px-2 py-1 hover:bg-gray-100 rounded text-xs font-bold text-gray-700" title="Alinhar à Esquerda">⬅️ Esquerda</button>
                                            <button type="button" onClick={() => insertTag('<div style="text-align: center; margin-bottom: 8px;">', '</div>')} className="px-2 py-1 hover:bg-gray-100 rounded text-xs font-bold text-gray-700" title="Centralizar">↔️ Centro</button>
                                            <button type="button" onClick={() => insertTag('<div style="text-align: right; margin-bottom: 8px;">', '</div>')} className="px-2 py-1 hover:bg-gray-100 rounded text-xs font-bold text-gray-700" title="Alinhar à Direita">➡️ Direita</button>
                                            <button type="button" onClick={() => insertTag('<div style="text-align: justify; margin-bottom: 8px;">', '</div>')} className="px-2 py-1 hover:bg-gray-100 rounded text-xs font-bold text-gray-700" title="Justificado">↕️ Justificado</button>
                                        </div>
                                    </div>

                                    {/* Row 3: Cards, Alerts, Media & Components */}
                                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => insertTag('<div className="bg-[#FAF9F5] p-5 rounded-2xl border border-[#EEEEEE] my-4 shadow-2xs">\n  <h4 className="font-bold text-[#7A3E4A] text-xs uppercase tracking-wider mb-2">Título do Cartão</h4>\n  <p className="text-xs text-gray-600 leading-relaxed">', '</p>\n</div>')}
                                            className="px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 cursor-pointer shadow-2xs flex items-center gap-1"
                                        >
                                            📦 Cartão Luxo
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => insertTag('<div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-xl my-4 text-xs font-medium text-emerald-900">\n  <strong>Destaque de Sucesso:</strong> ', '\n</div>')}
                                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 cursor-pointer shadow-2xs flex items-center gap-1"
                                        >
                                            ✅ Alerta Verde
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => insertTag('<div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl my-4 text-xs font-medium text-amber-900">\n  <strong>Aviso Importante:</strong> ', '\n</div>')}
                                            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-xs font-bold text-amber-800 cursor-pointer shadow-2xs flex items-center gap-1"
                                        >
                                            💡 Alerta Amarelo
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => insertTag('<blockquote className="border-l-4 border-[#7A3E4A] pl-4 italic text-sm text-gray-500 my-4 bg-gray-50 py-3 rounded-r-md">', '</blockquote>')}
                                            className="px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 cursor-pointer shadow-2xs flex items-center gap-1"
                                        >
                                            💬 Citação
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => insertTag('<a href="https://exemplo.com.br" target="_blank" rel="noreferrer" className="text-[#7A3E4A] font-bold underline hover:opacity-80">', '</a>')}
                                            className="px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-[#7A3E4A] cursor-pointer shadow-2xs flex items-center gap-1"
                                        >
                                            🔗 Link
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => insertTag('<img src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800" alt="Imagem Meraki" className="w-full max-w-md rounded-2xl border border-gray-200 my-4 shadow-sm" />')}
                                            className="px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 cursor-pointer shadow-2xs flex items-center gap-1"
                                        >
                                            🖼️ Imagem
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => insertTag('<table className="w-full border-collapse border border-gray-200 text-xs my-4 font-sans">\n  <thead>\n    <tr className="bg-gray-100 text-gray-800 font-bold">\n      <th className="border border-gray-200 p-2">Item</th>\n      <th className="border border-gray-200 p-2">Detalhe</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td className="border border-gray-200 p-2">Exemplo 1</td>\n      <td className="border border-gray-200 p-2">Informação 1</td>\n    </tr>\n  </tbody>\n</table>')}
                                            className="px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 cursor-pointer shadow-2xs flex items-center gap-1"
                                        >
                                            📊 Tabela
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => insertTag('<hr className="my-6 border-t border-gray-200" />')}
                                            className="px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 cursor-pointer shadow-2xs"
                                        >
                                            ➖ Linha (HR)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => insertTag('<ul className="list-disc pl-5 text-xs text-gray-600 space-y-1.5 my-3">\n  <li>', '</li>\n</ul>')}
                                            className="px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 cursor-pointer shadow-2xs"
                                        >
                                            • Bullets
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => insertTag('<ol className="list-decimal pl-5 text-xs text-gray-600 space-y-1.5 my-3">\n  <li>', '</li>\n</ol>')}
                                            className="px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 cursor-pointer shadow-2xs"
                                        >
                                            1. Números
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => insertTag('<span className="bg-[#7A3E4A] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block">', '</span>')}
                                            className="px-3 py-1.5 bg-[#7A3E4A] text-white rounded-xl text-xs font-bold cursor-pointer shadow-2xs"
                                        >
                                            🏷️ Badge
                                        </button>
                                    </div>
                                </div>

                                <textarea
                                    ref={textareaRef}
                                    rows="16"
                                    value={pageContent}
                                    onChange={(e) => setPageContent(e.target.value)}
                                    className={`${inputCls} resize-y leading-relaxed font-mono text-xs`}
                                    placeholder="Escreva aqui o texto completo da página..."
                                    required
                                />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <label className={labelCls}>Pré-visualização do Resultado no Site</label>
                                <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm min-h-[350px]">
                                    <h2 className="text-2xl font-bold text-gray-900 border-b pb-4 mb-6">{pageTitle}</h2>
                                    {renderPreviewContent()}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-2">
                            <button
                                type="button"
                                onClick={() => handleDeletePage(selectedPageId)}
                                className="px-5 py-3.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                            >
                                <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="w-4 h-4" />
                                Excluir Página
                            </button>

                            <button
                                type="submit"
                                disabled={saving}
                                className="px-8 py-3.5 bg-gradient-to-r from-[#7A3E4A] to-[#9A5060] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:shadow-lg hover:shadow-[#7A3E4A]/30 transition-all cursor-pointer disabled:opacity-50"
                            >
                                {saving ? 'Salvando Página...' : 'Salvar Alterações na Página'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Modal: Criar Nova Página */}
            {createModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-[fadeIn_150ms_ease-out]">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-gray-100 shadow-2xl space-y-6 animate-[scaleUp_200ms_ease-out]">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div>
                                <span className="text-[9px] font-bold text-[#C6A76A] uppercase tracking-widest">Nova Página Institucional</span>
                                <h3 className="text-lg font-black text-gray-900">Criar Nova Página</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCreateModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold flex items-center justify-center transition-all cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreatePage} className="space-y-4">
                            <div>
                                <label className={labelCls}>Título da Página</label>
                                <input
                                    type="text"
                                    value={newPageTitle}
                                    onChange={(e) => setNewPageTitle(e.target.value)}
                                    className={inputCls}
                                    placeholder="Ex: Política de Cookies, Guia de Medidas..."
                                    required
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className={labelCls}>Categoria de Exibição no Site</label>
                                <select
                                    value={newPageCategory}
                                    onChange={(e) => setNewPageCategory(e.target.value)}
                                    className={inputCls}
                                >
                                    <option value="Atendimento">Atendimento</option>
                                    <option value="Sobre">Sobre</option>
                                    <option value="Conta">Conta</option>
                                    <option value="Lojas">Lojas</option>
                                </select>
                            </div>

                            <div>
                                <label className={labelCls}>Texto / Conteúdo Inicial (Opcional)</label>
                                <textarea
                                    rows="5"
                                    value={newPageContent}
                                    onChange={(e) => setNewPageContent(e.target.value)}
                                    className={inputCls}
                                    placeholder="Escreva aqui o texto inicial da nova página..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setCreateModalOpen(false)}
                                    className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-gradient-to-r from-[#7A3E4A] to-[#9A5060] text-white text-xs font-black uppercase tracking-wider rounded-xl hover:shadow-lg hover:shadow-[#7A3E4A]/30 transition-all cursor-pointer"
                                >
                                    Criar Página
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── SECTION: FINANCIAL MANAGEMENT / GESTÃO FINANCEIRA ───────────────────────
export function FinancialSection({
    orders = [],
    products = [],
    transactions = [],
    onCreateTransaction,
    onUpdateTransactionStatus,
    onDeleteTransaction,
    updateStoreConfig
}) {
    const [activeTab, setActiveTab] = useState('custo_real') // 'custo_real' | 'overview'
    const [filter, setFilter] = useState('todos') // 'todos' | 'receita' | 'despesa' | 'pendente'
    const [period, setPeriod] = useState('todos') // 'todos' | 'mes' | '30dias' | 'personalizado'
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [itemsPerPage, setItemsPerPage] = useState(15)
    const [currentPage, setCurrentPage] = useState(1)
    
    // Custom popover dropdown states (Zero OS popups)
    const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false)
    const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
    const [limiterDropdownOpen, setLimiterDropdownOpen] = useState(false)

    // Custom React Calendar states (Zero OS popups)
    const [customCalendarOpen, setCustomCalendarOpen] = useState(false)
    const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear())
    const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth())

    const dropdownRef = useRef(null)
    const calendarRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (event) => {
            const isDropdown = dropdownRef.current && dropdownRef.current.contains(event.target)
            const isCalendar = calendarRef.current && calendarRef.current.contains(event.target)

            if (!isDropdown && !isCalendar) {
                setPeriodDropdownOpen(false)
                setFilterDropdownOpen(false)
                setLimiterDropdownOpen(false)
                setCustomCalendarOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])
    
    const [modalOpen, setModalOpen] = useState(false)
    const [showCostConfig, setShowCostConfig] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Cost configuration states
    const [cardFeePercent, setCardFeePercent] = useState(() => {
        try {
            const config = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
            return config.card_fee_percent !== undefined ? config.card_fee_percent : 3.5
        } catch { return 3.5 }
    })
    const [pixFeePercent, setPixFeePercent] = useState(() => {
        try {
            const config = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
            return config.pix_fee_percent !== undefined ? config.pix_fee_percent : 0.99
        } catch { return 0.99 }
    })
    const [packagingCost, setPackagingCost] = useState(() => {
        try {
            const config = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
            return config.default_packaging_cost !== undefined ? config.default_packaging_cost : 5.0
        } catch { return 5.0 }
    })
    const [subsidyCost, setSubsidyCost] = useState(() => {
        try {
            const config = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
            return config.default_subsidy_cost !== undefined ? config.default_subsidy_cost : 0.0
        } catch { return 0.0 }
    })

    const handleSaveCostConfig = async () => {
        const config = JSON.parse(localStorage.getItem('meraki_store_config') || '{}')
        const updated = {
            ...config,
            card_fee_percent: parseFloat(cardFeePercent) || 0,
            pix_fee_percent: parseFloat(pixFeePercent) || 0,
            default_packaging_cost: parseFloat(packagingCost) || 0,
            default_subsidy_cost: parseFloat(subsidyCost) || 0
        }
        localStorage.setItem('meraki_store_config', JSON.stringify(updated))
        if (updateStoreConfig) await updateStoreConfig(updated)
        setShowCostConfig(false)
        alert('Taxas operacionais salvas com sucesso!')
    }

    const [txType, setTxType] = useState('despesa')
    const [txTitle, setTxTitle] = useState('')
    const [txCategory, setTxCategory] = useState('Outros')
    const [txAmount, setTxAmount] = useState('')
    const [txDueDate, setTxDueDate] = useState(() => new Date().toISOString().split('T')[0])
    const [txStatus, setTxStatus] = useState('pago')
    const [txMethod, setTxMethod] = useState('PIX')
    const [txNotes, setTxNotes] = useState('')

    // Reset pagination on filter change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery, filter, period, startDate, endDate, itemsPerPage, activeTab])

    // Order DRE Calculation
    const orderCostAnalysis = orders.map(order => {
        const salePrice = Number(order.total) || 0
        const discountAmount = Number(order.discount) || 0
        
        let productCost = 0
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
                const foundProd = products.find(p => p.id === item.id || p.name === item.name)
                const itemCost = foundProd?.cost_price || foundProd?.costPrice || (Number(item.price) * 0.35) || 0
                productCost += itemCost * (Number(item.quantity) || 1)
            })
        } else {
            productCost = salePrice * 0.35
        }

        const isPix = (order.paymentMethod || '').toLowerCase().includes('pix')
        const feeRate = isPix ? (parseFloat(pixFeePercent) / 100) : (parseFloat(cardFeePercent) / 100)
        const paymentFee = salePrice * feeRate

        const orderPackaging = parseFloat(packagingCost) || 0
        const orderSubsidy = parseFloat(subsidyCost) || 0

        const netProfit = salePrice - productCost - paymentFee - orderPackaging - orderSubsidy
        const profitMarginPercent = salePrice > 0 ? ((netProfit / salePrice) * 100).toFixed(1) : 0

        return {
            ...order,
            salePrice,
            productCost,
            paymentFee,
            packagingCost: orderPackaging,
            subsidyCost: orderSubsidy,
            discountAmount,
            netProfit,
            profitMarginPercent
        }
    })

    const now = new Date()
    const filteredOrdersDRE = orderCostAnalysis.filter(order => {
        const orderDate = new Date(order.created_at || order.date)
        if (period === 'mes') {
            if (orderDate.getMonth() !== now.getMonth() || orderDate.getFullYear() !== now.getFullYear()) return false
        } else if (period === '30dias') {
            const diffTime = Math.abs(now - orderDate)
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            if (diffDays > 30) return false
        } else if (period === 'personalizado') {
            if (startDate) {
                const start = new Date(startDate)
                start.setHours(0, 0, 0, 0)
                if (orderDate < start) return false
            }
            if (endDate) {
                const end = new Date(endDate)
                end.setHours(23, 59, 59, 999)
                if (orderDate > end) return false
            }
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            const matchesId = String(order.id).toLowerCase().includes(q)
            const matchesName = (order.customerName || '').toLowerCase().includes(q)
            const matchesMethod = (order.paymentMethod || '').toLowerCase().includes(q)
            if (!matchesId && !matchesName && !matchesMethod) return false
        }

        return true
    })

    const totalRealRevenue = filteredOrdersDRE.reduce((sum, o) => sum + o.salePrice, 0)
    const totalProductCost = filteredOrdersDRE.reduce((sum, o) => sum + o.productCost, 0)
    const totalPaymentFees = filteredOrdersDRE.reduce((sum, o) => sum + o.paymentFee, 0)
    const totalPackagingCosts = filteredOrdersDRE.reduce((sum, o) => sum + o.packagingCost, 0)
    const totalSubsidyCosts = filteredOrdersDRE.reduce((sum, o) => sum + o.subsidyCost, 0)
    const totalNetProfitReal = filteredOrdersDRE.reduce((sum, o) => sum + o.netProfit, 0)
    const averageMarginReal = totalRealRevenue > 0 ? ((totalNetProfitReal / totalRealRevenue) * 100).toFixed(1) : 0

    const paidOrders = orders.filter(o => ['Pago', 'Enviado', 'Entregue'].includes(o.status))
    const orderRevenues = paidOrders.map(o => ({
        id: `ord-${o.id}`,
        isOrder: true,
        type: 'receita',
        title: `Venda Online - Pedido #${o.id.toString().slice(-6)} (${o.customerName || 'Cliente'})`,
        category: 'Vendas Loja',
        amount: Number(o.total) || 0,
        due_date: o.created_at ? o.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
        payment_date: o.created_at ? o.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
        status: 'pago',
        payment_method: o.paymentMethod || 'PIX',
        created_at: o.created_at || new Date().toISOString()
    }))

    const allTransactionsList = [...transactions, ...orderRevenues]

    const filteredTransactionsList = allTransactionsList.filter(item => {
        const itemDate = new Date(item.due_date || item.created_at)
        if (period === 'mes') {
            if (itemDate.getMonth() !== now.getMonth() || itemDate.getFullYear() !== now.getFullYear()) return false
        } else if (period === '30dias') {
            const diffTime = Math.abs(now - itemDate)
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            if (diffDays > 30) return false
        } else if (period === 'personalizado') {
            if (startDate) {
                const start = new Date(startDate)
                start.setHours(0, 0, 0, 0)
                if (itemDate < start) return false
            }
            if (endDate) {
                const end = new Date(endDate)
                end.setHours(23, 59, 59, 999)
                if (itemDate > end) return false
            }
        }

        if (filter === 'receita' && item.type !== 'receita') return false
        if (filter === 'despesa' && item.type !== 'despesa') return false
        if (filter === 'pendente' && item.status !== 'pendente') return false

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            const matchesTitle = (item.title || '').toLowerCase().includes(q)
            const matchesCategory = (item.category || '').toLowerCase().includes(q)
            const matchesMethod = (item.payment_method || '').toLowerCase().includes(q)
            const matchesNotes = (item.notes || '').toLowerCase().includes(q)
            if (!matchesTitle && !matchesCategory && !matchesMethod && !matchesNotes) return false
        }

        return true
    })

    const totalReceitas = filteredTransactionsList
        .filter(i => i.type === 'receita' && i.status === 'pago')
        .reduce((sum, i) => sum + Number(i.amount), 0)

    const totalDespesas = filteredTransactionsList
        .filter(i => i.type === 'despesa' && i.status === 'pago')
        .reduce((sum, i) => sum + Number(i.amount), 0)

    const totalPendentes = filteredTransactionsList
        .filter(i => i.status === 'pendente')
        .reduce((sum, i) => sum + (i.type === 'receita' ? Number(i.amount) : -Number(i.amount)), 0)

    const lucroLiquido = totalReceitas - totalDespesas
    const margemLucro = totalReceitas > 0 ? ((lucroLiquido / totalReceitas) * 100).toFixed(1) : 0

    // Pagination
    const targetList = activeTab === 'custo_real' ? filteredOrdersDRE : filteredTransactionsList
    const limit = itemsPerPage === 'all' ? targetList.length : Number(itemsPerPage)
    const totalPages = Math.ceil(targetList.length / limit) || 1
    const paginatedItems = itemsPerPage === 'all' 
        ? targetList 
        : targetList.slice((currentPage - 1) * limit, currentPage * limit)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!txTitle || !txAmount) {
            alert('Preencha a descrição e o valor do lançamento.')
            return
        }
        setSubmitting(true)
        await onCreateTransaction({
            type: txType,
            title: txTitle,
            category: txCategory,
            amount: parseFloat(txAmount),
            due_date: txDueDate,
            status: txStatus,
            payment_method: txMethod,
            notes: txNotes
        })
        setSubmitting(false)
        setModalOpen(false)
        setTxTitle('')
        setTxAmount('')
        setTxNotes('')
    }

    return (
        <div className="space-y-6 font-sans text-gray-900">
            {/* CLEAN EXECUTIVE HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">Gestão Financeira & DRE</h2>
                    <p className="text-xs text-gray-500 mt-1 font-normal">
                        Demonstrativo de resultado do exercício, lucro líquido por pedido e controle de lançamentos.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => setShowCostConfig(!showCostConfig)}
                        className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                        <Icon path="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" className="w-3.5 h-3.5 text-gray-500" />
                        {showCostConfig ? 'Ocultar Taxas' : 'Taxas da Loja'}
                    </button>
                    <button
                        onClick={() => setModalOpen(true)}
                        className="px-4 py-2 bg-[#7A3E4A] hover:bg-[#603039] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                        <Icon path="M12 4v16m8-8H4" className="w-3.5 h-3.5" />
                        Novo Lançamento
                    </button>
                </div>
            </div>

            {/* COLLAPSIBLE STORE COSTS PANEL */}
            {showCostConfig && (
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Icon path="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" className="w-4 h-4 text-gray-500" />
                            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Parâmetros de Custos Fixos & Taxas</h3>
                        </div>
                        <span className="text-[11px] text-gray-500">Usado para calcular a margem líquida por pedido</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-[11px] font-medium text-gray-600 mb-1">Taxa Cartão Crédito (%)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={cardFeePercent}
                                onChange={(e) => setCardFeePercent(e.target.value)}
                                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-[#7A3E4A] outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-medium text-gray-600 mb-1">Taxa PIX (%)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={pixFeePercent}
                                onChange={(e) => setPixFeePercent(e.target.value)}
                                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-[#7A3E4A] outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-medium text-gray-600 mb-1">Custo Embalagem (R$/ped)</label>
                            <input
                                type="number"
                                step="0.50"
                                value={packagingCost}
                                onChange={(e) => setPackagingCost(e.target.value)}
                                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-[#7A3E4A] outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-medium text-gray-600 mb-1">Frete Subsidiado (R$/ped)</label>
                            <input
                                type="number"
                                step="1.00"
                                value={subsidyCost}
                                onChange={(e) => setSubsidyCost(e.target.value)}
                                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-[#7A3E4A] outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={handleSaveCostConfig}
                            className="px-4 py-2 bg-[#7A3E4A] text-white text-xs font-medium rounded-lg hover:bg-[#603039] transition-colors cursor-pointer"
                        >
                            Salvar Configurações
                        </button>
                    </div>
                </div>
            )}

            {/* STRIPE-STYLE EXECUTIVE METRICS STRIP WITH MONOCHROME ICONS */}
            <div className="bg-white rounded-xl border border-gray-200 divide-y md:divide-y-0 md:divide-x divide-gray-200 grid grid-cols-1 md:grid-cols-4 shadow-2xs">
                <div className="p-5">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-gray-500">Receita Bruta Total</p>
                        <Icon path="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                        R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">Acumulado vendas + entradas</p>
                </div>

                <div className="p-5">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-gray-500">Custos Operacionais & CMV</p>
                        <Icon path="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                        R$ {(totalProductCost + totalPaymentFees + totalPackagingCosts + totalSubsidyCosts + totalDespesas).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">Produtos, taxas e saídas</p>
                </div>

                <div className="p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <p className="text-xs font-medium text-gray-500">Lucro Líquido Real</p>
                            <Icon path="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4 text-gray-400" />
                        </div>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${lucroLiquido >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                            {margemLucro}% margem
                        </span>
                    </div>
                    <p className={`text-2xl font-bold mt-1 ${lucroLiquido >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                        R$ {lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">Lucro líquido acumulado</p>
                </div>

                <div className="p-5">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-gray-500">Contas Pendentes</p>
                        <Icon path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-2xl font-bold text-amber-600 mt-1">
                        R$ {Math.abs(totalPendentes).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">Pendências em aberto</p>
                </div>
            </div>

            {/* TAB SUB-NAVIGATION (SHOPIFY/STRIPE UNDERLINE STYLE WITH ICONS) */}
            <div className="border-b border-gray-200">
                <nav className="flex space-x-6">
                    <button
                        onClick={() => setActiveTab('custo_real')}
                        className={`pb-3 text-xs font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                            activeTab === 'custo_real'
                                ? 'border-[#7A3E4A] text-[#7A3E4A]'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Icon path="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" className="w-4 h-4 text-current" />
                        Margem por Pedido (Unit Economics)
                    </button>
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`pb-3 text-xs font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                            activeTab === 'overview'
                                ? 'border-[#7A3E4A] text-[#7A3E4A]'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Icon path="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" className="w-4 h-4 text-current" />
                        Fluxo de Caixa & Lançamentos
                    </button>
                </nav>
            </div>

            {/* TOOLBAR & FILTERS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 border border-gray-200 rounded-xl shadow-2xs" ref={dropdownRef}>
                {/* Search Bar */}
                <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" className="w-4 h-4" />
                    </span>
                    <input
                        type="text"
                        placeholder="Pesquisar por ID, cliente, descrição ou categoria..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:bg-white focus:border-gray-400 transition-colors"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-gray-400 hover:text-gray-600">✕</button>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* CUSTOM REACT PERIOD POPOVER DROPDOWN */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => {
                                setPeriodDropdownOpen(!periodDropdownOpen)
                                setFilterDropdownOpen(false)
                                setLimiterDropdownOpen(false)
                            }}
                            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-300 hover:border-gray-400 rounded-lg text-xs font-semibold text-gray-800 shadow-2xs transition-all cursor-pointer"
                        >
                            <Icon path="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-3.5 h-3.5 text-[#7A3E4A]" />
                            <span>
                                {period === 'todos' && 'Todo o Período'}
                                {period === 'mes' && 'Este Mês'}
                                {period === '30dias' && 'Últimos 30 dias'}
                                {period === 'personalizado' && 'Período Personalizado'}
                            </span>
                            <Icon path="M19 9l-7 7-7-7" className={`w-3.5 h-3.5 text-gray-400 transition-transform ${periodDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {periodDropdownOpen && (
                            <div className="absolute left-0 sm:right-0 sm:left-auto mt-1.5 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1 font-sans animate-fadeIn">
                                <button
                                    onClick={() => { setPeriod('todos'); setPeriodDropdownOpen(false); }}
                                    className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-gray-50 flex items-center justify-between cursor-pointer ${period === 'todos' ? 'text-[#7A3E4A] bg-rose-50/60 font-bold' : 'text-gray-700'}`}
                                >
                                    <span>Todo o Período</span>
                                    {period === 'todos' && <span className="text-[#7A3E4A] font-bold">✓</span>}
                                </button>
                                <button
                                    onClick={() => { setPeriod('mes'); setPeriodDropdownOpen(false); }}
                                    className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-gray-50 flex items-center justify-between cursor-pointer ${period === 'mes' ? 'text-[#7A3E4A] bg-rose-50/60 font-bold' : 'text-gray-700'}`}
                                >
                                    <span>Este Mês</span>
                                    {period === 'mes' && <span className="text-[#7A3E4A] font-bold">✓</span>}
                                </button>
                                <button
                                    onClick={() => { setPeriod('30dias'); setPeriodDropdownOpen(false); }}
                                    className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-gray-50 flex items-center justify-between cursor-pointer ${period === '30dias' ? 'text-[#7A3E4A] bg-rose-50/60 font-bold' : 'text-gray-700'}`}
                                >
                                    <span>Últimos 30 dias</span>
                                    {period === '30dias' && <span className="text-[#7A3E4A] font-bold">✓</span>}
                                </button>
                                <div className="my-1 border-t border-gray-100" />
                                <button
                                    onClick={() => { setPeriod('personalizado'); setPeriodDropdownOpen(false); }}
                                    className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-gray-50 flex items-center justify-between cursor-pointer ${period === 'personalizado' ? 'text-[#7A3E4A] bg-rose-50/60 font-bold' : 'text-gray-700'}`}
                                >
                                    <span>Período Personalizado...</span>
                                    {period === 'personalizado' && <span className="text-[#7A3E4A] font-bold">✓</span>}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* CUSTOM REACT FILTER POPOVER DROPDOWN (Overview Tab) */}
                    {activeTab === 'overview' && (
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => {
                                    setFilterDropdownOpen(!filterDropdownOpen)
                                    setPeriodDropdownOpen(false)
                                    setLimiterDropdownOpen(false)
                                }}
                                className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-300 hover:border-gray-400 rounded-lg text-xs font-semibold text-gray-800 shadow-2xs transition-all cursor-pointer"
                            >
                                <span>
                                    {filter === 'todos' && 'Todos os tipos'}
                                    {filter === 'receita' && 'Apenas Receitas'}
                                    {filter === 'despesa' && 'Apenas Despesas'}
                                    {filter === 'pendente' && 'Apenas Pendentes'}
                                </span>
                                <Icon path="M19 9l-7 7-7-7" className={`w-3.5 h-3.5 text-gray-400 transition-transform ${filterDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {filterDropdownOpen && (
                                <div className="absolute right-0 mt-1.5 w-44 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1 font-sans animate-fadeIn">
                                    <button
                                        onClick={() => { setFilter('todos'); setFilterDropdownOpen(false); }}
                                        className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-gray-50 flex items-center justify-between cursor-pointer ${filter === 'todos' ? 'text-[#7A3E4A] bg-rose-50/60 font-bold' : 'text-gray-700'}`}
                                    >
                                        <span>Todos os tipos</span>
                                        {filter === 'todos' && <span className="text-[#7A3E4A]">✓</span>}
                                    </button>
                                    <button
                                        onClick={() => { setFilter('receita'); setFilterDropdownOpen(false); }}
                                        className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-emerald-50 flex items-center justify-between cursor-pointer ${filter === 'receita' ? 'text-emerald-700 bg-emerald-50/60 font-bold' : 'text-gray-700'}`}
                                    >
                                        <span>Apenas Receitas</span>
                                        {filter === 'receita' && <span className="text-emerald-700">✓</span>}
                                    </button>
                                    <button
                                        onClick={() => { setFilter('despesa'); setFilterDropdownOpen(false); }}
                                        className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-red-50 flex items-center justify-between cursor-pointer ${filter === 'despesa' ? 'text-red-700 bg-red-50/60 font-bold' : 'text-gray-700'}`}
                                    >
                                        <span>Apenas Despesas</span>
                                        {filter === 'despesa' && <span className="text-red-700">✓</span>}
                                    </button>
                                    <button
                                        onClick={() => { setFilter('pendente'); setFilterDropdownOpen(false); }}
                                        className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-amber-50 flex items-center justify-between cursor-pointer ${filter === 'pendente' ? 'text-amber-700 bg-amber-50/60 font-bold' : 'text-gray-700'}`}
                                    >
                                        <span>Apenas Pendentes</span>
                                        {filter === 'pendente' && <span className="text-amber-700">✓</span>}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* CUSTOM REACT LIMITER POPOVER DROPDOWN */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => {
                                setLimiterDropdownOpen(!limiterDropdownOpen)
                                setPeriodDropdownOpen(false)
                                setFilterDropdownOpen(false)
                            }}
                            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-300 hover:border-gray-400 rounded-lg text-xs font-semibold text-gray-800 shadow-2xs transition-all cursor-pointer"
                        >
                            <span>{itemsPerPage === 'all' ? 'Exibir Todos' : `${itemsPerPage} por pág`}</span>
                            <Icon path="M19 9l-7 7-7-7" className={`w-3.5 h-3.5 text-gray-400 transition-transform ${limiterDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {limiterDropdownOpen && (
                            <div className="absolute right-0 mt-1.5 w-36 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1 font-sans animate-fadeIn">
                                {[10, 15, 30, 50, 'all'].map((val) => (
                                    <button
                                        key={val}
                                        onClick={() => { setItemsPerPage(val); setLimiterDropdownOpen(false); }}
                                        className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-gray-50 flex items-center justify-between cursor-pointer ${itemsPerPage === val ? 'text-[#7A3E4A] bg-rose-50/60 font-bold' : 'text-gray-700'}`}
                                    >
                                        <span>{val === 'all' ? 'Exibir Todos' : `${val} por pág`}</span>
                                        {itemsPerPage === val && <span className="text-[#7A3E4A]">✓</span>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* CUSTOM REACT LUXURY DATE RANGE PICKER (ZERO OS NATIVE POPUPS) */}
            {period === 'personalizado' && (
                <div className="relative bg-white p-3.5 border border-gray-200 rounded-xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn" ref={calendarRef}>
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                        <Icon path="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-4 h-4 text-[#7A3E4A]" />
                        <span>Intervalo Personalizado de Datas:</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 relative">
                        {/* TRIGGER BUTTON THAT OPENS CUSTOM REACT CALENDAR */}
                        <button
                            type="button"
                            onClick={() => setCustomCalendarOpen(!customCalendarOpen)}
                            className="flex items-center gap-2.5 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-xl text-xs font-bold text-gray-800 transition-all cursor-pointer shadow-2xs"
                        >
                            <Icon path="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-4 h-4 text-[#7A3E4A]" />
                            <span>
                                {startDate ? (
                                    <>
                                        <span className="text-gray-500 font-normal">De: </span>
                                        <strong className="text-gray-900">{startDate.split('-').reverse().join('/')}</strong>
                                    </>
                                ) : (
                                    <span className="text-gray-400">Data Inicial</span>
                                )}
                                {'  •  '}
                                {endDate ? (
                                    <>
                                        <span className="text-gray-500 font-normal">Até: </span>
                                        <strong className="text-gray-900">{endDate.split('-').reverse().join('/')}</strong>
                                    </>
                                ) : (
                                    <span className="text-gray-400">Data Final</span>
                                )}
                            </span>
                            <Icon path="M19 9l-7 7-7-7" className={`w-3.5 h-3.5 text-gray-400 transition-transform ${customCalendarOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {(startDate || endDate) && (
                            <button
                                onClick={() => { setStartDate(''); setEndDate(''); }}
                                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                            >
                                Limpar Datas
                            </button>
                        )}

                        {/* FLOATING CUSTOM REACT CALENDAR POPOVER */}
                        {customCalendarOpen && (
                            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 p-4 font-sans animate-fadeIn">
                                {/* Calendar Header & Navigation */}
                                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (calendarMonth === 0) {
                                                setCalendarMonth(11)
                                                setCalendarYear(y => y - 1)
                                            } else {
                                                setCalendarMonth(m => m - 1)
                                            }
                                        }}
                                        className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-lg text-gray-700 font-bold transition-colors cursor-pointer"
                                    >
                                        ‹
                                    </button>
                                    <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                                        {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][calendarMonth]} {calendarYear}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (calendarMonth === 11) {
                                                setCalendarMonth(0)
                                                setCalendarYear(y => y + 1)
                                            } else {
                                                setCalendarMonth(m => m + 1)
                                            }
                                        }}
                                        className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-lg text-gray-700 font-bold transition-colors cursor-pointer"
                                    >
                                        ›
                                    </button>
                                </div>

                                {/* Week Day Headers */}
                                <div className="grid grid-cols-7 text-center mb-1">
                                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                                        <span key={day} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider py-1">
                                            {day}
                                        </span>
                                    ))}
                                </div>

                                {/* Days Grid */}
                                <div className="grid grid-cols-7 gap-1 text-center">
                                    {(() => {
                                        const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay()
                                        const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate()
                                        const todayStr = new Date().toISOString().split('T')[0]
                                        
                                        const cells = []
                                        for (let i = 0; i < firstDayIndex; i++) {
                                            cells.push(<div key={`empty-${i}`} className="h-8" />)
                                        }

                                        for (let d = 1; d <= daysInMonth; d++) {
                                            const monthStr = String(calendarMonth + 1).padStart(2, '0')
                                            const dayStr = String(d).padStart(2, '0')
                                            const isoDate = `${calendarYear}-${monthStr}-${dayStr}`
                                            
                                            const isStart = startDate === isoDate
                                            const isEnd = endDate === isoDate
                                            const isInRange = startDate && endDate && isoDate >= startDate && isoDate <= endDate
                                            const isToday = isoDate === todayStr

                                            let cellStyle = "hover:bg-rose-50 text-gray-800"
                                            if (isStart || isEnd) {
                                                cellStyle = "bg-[#7A3E4A] text-white font-extrabold shadow-sm"
                                            } else if (isInRange) {
                                                cellStyle = "bg-[#7A3E4A]/15 text-[#7A3E4A] font-bold"
                                            } else if (isToday) {
                                                cellStyle = "border border-[#7A3E4A] text-[#7A3E4A] font-bold"
                                            }

                                            cells.push(
                                                <button
                                                    key={d}
                                                    type="button"
                                                    onClick={() => {
                                                        if (!startDate || (startDate && endDate && startDate !== endDate)) {
                                                            setStartDate(isoDate)
                                                            setEndDate(isoDate)
                                                        } else if (startDate && (endDate === startDate || !endDate)) {
                                                            if (isoDate < startDate) {
                                                                setEndDate(startDate)
                                                                setStartDate(isoDate)
                                                            } else {
                                                                setEndDate(isoDate)
                                                            }
                                                        }
                                                    }}
                                                    className={`h-8 w-full rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${cellStyle}`}
                                                >
                                                    {d}
                                                </button>
                                            )
                                        }
                                        return cells
                                    })()}
                                </div>

                                {/* Preset Actions & Close */}
                                <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100 text-[11px]">
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const today = new Date().toISOString().split('T')[0]
                                                setStartDate(today)
                                                setEndDate(today)
                                                setCustomCalendarOpen(false)
                                            }}
                                            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-semibold transition-colors cursor-pointer"
                                        >
                                            Hoje
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const now = new Date()
                                                const first = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
                                                const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
                                                setStartDate(first)
                                                setEndDate(last)
                                                setCustomCalendarOpen(false)
                                            }}
                                            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-semibold transition-colors cursor-pointer"
                                        >
                                            Este Mês
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setCustomCalendarOpen(false)}
                                        className="px-3 py-1 bg-[#7A3E4A] text-white rounded-md font-bold hover:bg-[#603039] transition-colors cursor-pointer"
                                    >
                                        Aplicar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 1: UNIT ECONOMICS DATA TABLE (PRO HUMAN LAYOUT) */}
            {activeTab === 'custo_real' && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
                    {paginatedItems.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 text-xs">
                            Nenhum pedido localizado no período ou busca informada.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-gray-700">
                                <thead className="bg-gray-50 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3">Pedido / Cliente</th>
                                        <th className="px-4 py-3">Pagamento</th>
                                        <th className="px-4 py-3 text-right">Valor Venda</th>
                                        <th className="px-4 py-3 text-right">Custo Prod. (CMV)</th>
                                        <th className="px-4 py-3 text-right">Taxa Pagto</th>
                                        <th className="px-4 py-3 text-right">Embalagem/Frete</th>
                                        <th className="px-4 py-3 text-right">Lucro Líquido</th>
                                        <th className="px-4 py-3 text-right">Margem %</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {paginatedItems.map((order, idx) => (
                                        <tr key={order.id || idx} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-gray-900">#{order.id.toString().slice(-6)}</div>
                                                <div className="text-[11px] text-gray-500">{order.customerName || 'Cliente'}</div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {order.paymentMethod || 'PIX'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-gray-900">
                                                R$ {order.salePrice.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-red-600">
                                                - R$ {order.productCost.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-red-600">
                                                - R$ {order.paymentFee.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-red-600">
                                                - R$ {(order.packagingCost + order.subsidyCost).toFixed(2)}
                                            </td>
                                            <td className={`px-4 py-3 text-right font-bold ${order.netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                                R$ {order.netProfit.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                                                    order.netProfit >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                                }`}>
                                                    {order.profitMarginPercent}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* PAGINATION FOOTER */}
                    {totalPages > 1 && (
                        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-600">
                            <span>Exibindo {paginatedItems.length} de {targetList.length} pedidos</span>
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                    className="px-3 py-1 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    Anterior
                                </button>
                                <span className="font-semibold text-gray-800">Página {currentPage} de {totalPages}</span>
                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                    className="px-3 py-1 bg-[#7A3E4A] text-white rounded text-xs font-medium hover:bg-[#603039] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    Próxima
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: GENERAL TRANSACTIONS DATA TABLE (PRO HUMAN LAYOUT) */}
            {activeTab === 'overview' && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
                    {paginatedItems.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 text-xs">
                            Nenhum lançamento localizado no filtro selecionado.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-gray-700">
                                <thead className="bg-gray-50 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3">Data / Vencimento</th>
                                        <th className="px-4 py-3">Descrição</th>
                                        <th className="px-4 py-3">Categoria</th>
                                        <th className="px-4 py-3">Forma Pagto</th>
                                        <th className="px-4 py-3">Tipo</th>
                                        <th className="px-4 py-3 text-right">Valor (R$)</th>
                                        <th className="px-4 py-3 text-center">Status</th>
                                        <th className="px-4 py-3 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {paginatedItems.map((item, idx) => (
                                        <tr key={item.id || idx} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="px-4 py-3 text-gray-500">
                                                {item.due_date || item.created_at?.split('T')[0] || 'N/A'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-gray-900">{item.title}</div>
                                                {item.notes && <div className="text-[11px] text-gray-400">{item.notes}</div>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[11px] font-medium">
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {item.payment_method || 'PIX'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                                                    item.type === 'receita' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                                }`}>
                                                    {item.type === 'receita' ? 'Receita' : 'Despesa'}
                                                </span>
                                            </td>
                                            <td className={`px-4 py-3 text-right font-bold ${
                                                item.type === 'receita' ? 'text-emerald-700' : 'text-red-600'
                                            }`}>
                                                {item.type === 'receita' ? '+' : '-'} R$ {Number(item.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                                                    item.status === 'pago' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                                }`}>
                                                    {item.status === 'pago' ? 'Pago' : 'Pendente'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {!item.isOrder ? (
                                                    <div className="inline-flex items-center gap-1">
                                                        <button
                                                            onClick={() => onUpdateTransactionStatus(item.id, item.status === 'pago' ? 'pendente' : 'pago')}
                                                            className="p-1 hover:bg-gray-100 text-gray-500 rounded transition-colors cursor-pointer"
                                                            title="Alternar Status"
                                                        >
                                                            <Icon path="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => onDeleteTransaction(item.id)}
                                                            className="p-1 hover:bg-red-50 text-red-500 rounded transition-colors cursor-pointer"
                                                            title="Excluir Lançamento"
                                                        >
                                                            <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] text-gray-400 font-medium">Automático</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* PAGINATION FOOTER */}
                    {totalPages > 1 && (
                        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-600">
                            <span>Exibindo {paginatedItems.length} de {targetList.length} lançamentos</span>
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                    className="px-3 py-1 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    Anterior
                                </button>
                                <span className="font-semibold text-gray-800">Página {currentPage} de {totalPages}</span>
                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                    className="px-3 py-1 bg-[#7A3E4A] text-white rounded text-xs font-medium hover:bg-[#603039] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    Próxima
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* MODAL: NOVO LANÇAMENTO FINANCEIRO (CLEAN STRIPE STYLE DIALOG) */}
            {modalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-fadeIn">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md border border-gray-200 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="text-sm font-bold text-gray-900">Novo Lançamento Financeiro</h3>
                            <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-sm font-bold p-1 cursor-pointer">✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Type Toggle */}
                            <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setTxType('receita')}
                                    className={`py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                                        txType === 'receita' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-gray-600'
                                    }`}
                                >
                                    Receita (Entrada)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTxType('despesa')}
                                    className={`py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                                        txType === 'despesa' ? 'bg-white text-red-700 shadow-2xs' : 'text-gray-600'
                                    }`}
                                >
                                    Despesa (Saída)
                                </button>
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Descrição / Nome do Gasto</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Compra de Tecidos, Anúncios Meta, Luz..."
                                    value={txTitle}
                                    onChange={(e) => setTxTitle(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium focus:bg-white focus:border-[#7A3E4A] outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Valor (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        placeholder="0.00"
                                        value={txAmount}
                                        onChange={(e) => setTxAmount(e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-bold focus:bg-white focus:border-[#7A3E4A] outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Categoria</label>
                                    <select
                                        value={txCategory}
                                        onChange={(e) => setTxCategory(e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium focus:bg-white focus:border-[#7A3E4A] outline-none cursor-pointer"
                                    >
                                        <option value="Fornecedores">Fornecedores / Matéria Prima</option>
                                        <option value="Marketing">Marketing & Anúncios</option>
                                        <option value="Vendas">Vendas / Entradas</option>
                                        <option value="Impostos">Impostos & Taxas</option>
                                        <option value="Fretes">Logística & Fretes</option>
                                        <option value="Salarios">Salários / Pró-labore</option>
                                        <option value="Outros">Outros</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Data / Vencimento</label>
                                    <input
                                        type="date"
                                        value={txDueDate}
                                        onChange={(e) => setTxDueDate(e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium focus:bg-white focus:border-[#7A3E4A] outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Status</label>
                                    <select
                                        value={txStatus}
                                        onChange={(e) => setTxStatus(e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium focus:bg-white focus:border-[#7A3E4A] outline-none cursor-pointer"
                                    >
                                        <option value="pago">Pago / Confirmado</option>
                                        <option value="pendente">Pendente</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Forma de Pagamento</label>
                                <select
                                    value={txMethod}
                                    onChange={(e) => setTxMethod(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium focus:bg-white focus:border-[#7A3E4A] outline-none cursor-pointer"
                                >
                                    <option value="PIX">PIX</option>
                                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                                    <option value="Cartão de Débito">Cartão de Débito</option>
                                    <option value="Boleto">Boleto Bancário</option>
                                    <option value="Transferência">Transferência</option>
                                    <option value="Dinheiro">Dinheiro</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Observações (Opcional)</label>
                                <textarea
                                    rows="2"
                                    placeholder="Notas adicionais..."
                                    value={txNotes}
                                    onChange={(e) => setTxNotes(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium focus:bg-white focus:border-[#7A3E4A] outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium cursor-pointer hover:bg-gray-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2 bg-[#7A3E4A] hover:bg-[#603039] text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                                >
                                    {submitting ? 'Salvando...' : 'Salvar Lançamento'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── SECTION: MARKETING AUTOMATIONS ───────────────────────────────────────────
export function AutomationsSection() {
    const [subTab, setSubTab] = useState('carrinho')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [running, setRunning] = useState(false)
    const [config, setConfig] = useState(null)
    const [logs, setLogs] = useState([])
    const [carts, setCarts] = useState([])
    const [feedback, setFeedback] = useState(null)
    const [collectionInput, setCollectionInput] = useState('')

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        const cfg = await getMarketingConfig()
        setConfig(cfg)
        const lgs = await getMarketingLogs()
        setLogs(lgs)
        const cts = await getAbandonedCarts()
        setCarts(cts)
        setLoading(false)
    }

    async function handleSaveConfig() {
        setSaving(true)
        const res = await updateMarketingConfig(config)
        setSaving(false)
        if (res.success) {
            setFeedback({ type: 'success', message: 'Configurações de automação salvas com sucesso!' })
        } else {
            setFeedback({ type: 'error', message: 'Erro ao salvar: ' + res.error })
        }
        setTimeout(() => setFeedback(null), 4000)
    }

    async function handleRunEngineNow() {
        setRunning(true)
        const res = await processMarketingAutomations()
        setRunning(false)
        if (res.success) {
            setFeedback({ type: 'success', message: `Motor de automações executado! ${res.executedCount || 0} ações disparadas.` })
            await loadData()
        } else {
            setFeedback({ type: 'error', message: 'Erro ao executar automações: ' + res.error })
        }
        setTimeout(() => setFeedback(null), 5000)
    }

    async function handleBroadcastNewCollection(e) {
        e.preventDefault()
        if (!collectionInput.trim()) return
        setRunning(true)
        const res = await broadcastNewCollection(collectionInput.trim())
        setRunning(false)
        if (res.success) {
            setFeedback({ type: 'success', message: res.message || `Transmissão disparada para ${res.count} destinatários!` })
            setCollectionInput('')
            await loadData()
        } else {
            setFeedback({ type: 'error', message: 'Erro ao transmitir lançamento: ' + res.error })
        }
        setTimeout(() => setFeedback(null), 5000)
    }

    const inputCls = "w-full px-3 py-2.5 bg-[#FAF9F5] border border-[#EEEEEE] rounded-xl text-xs text-gray-800 outline-none focus:border-[#7A3E4A] focus:ring-2 focus:ring-[#7A3E4A]/10 transition-all font-medium"
    const labelCls = "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1"

    const iconPaths = {
        zap: "M13 10V3L4 14h7v7l9-11h-7z",
        cart: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z",
        phone: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z",
        mail: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
        heart: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
        megaphone: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z",
        history: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2",
        clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
        gift: "M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V6a2 2 0 10-2 2h2zm0 13-4-4m4 4 4-4",
        box: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
        sparkles: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
    }

    if (loading || !config) {
        return (
            <div className="p-8 text-center bg-white rounded-2xl border border-[#EEEEEE]">
                <p className="text-xs font-bold text-gray-400 animate-pulse">Carregando automações de marketing...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header com Ação Principal */}
            <div className="bg-white p-6 rounded-2xl border border-[#EEEEEE] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-[#7A3E4A]/10 flex items-center justify-center text-[#7A3E4A]">
                            <Icon path={iconPaths.zap} className="w-4 h-4" />
                        </span>
                        Automação de Marketing & Relacionamento
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                        Gerencie disparos automáticos para WhatsApp, E-mail, Carrinho Abandonado, Inativos e Aniversários.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={handleRunEngineNow}
                        disabled={running}
                        className="px-4 py-2.5 bg-[#7A3E4A] hover:bg-[#603039] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                    >
                        <Icon path="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4" />
                        {running ? 'Executando...' : 'Executar Verificação Agora'}
                    </button>
                    <button
                        onClick={handleSaveConfig}
                        disabled={saving}
                        className="px-5 py-2.5 bg-gradient-to-r from-[#C6A76A] to-[#D4B87C] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </div>

            {/* Mensagem de Feedback */}
            {feedback && (
                <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between border ${
                    feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
                }`}>
                    <span>{feedback.message}</span>
                    <button onClick={() => setFeedback(null)} className="text-xs opacity-60 hover:opacity-100 cursor-pointer">✕</button>
                </div>
            )}

            {/* Sub Navegação por Abas Limpas */}
            <div className="flex items-center gap-2 border-b border-[#EEEEEE] overflow-x-auto pb-1">
                {[
                    { id: 'carrinho', label: 'Carrinho Abandonado', iconPath: iconPaths.cart, count: carts.length },
                    { id: 'pedidos', label: 'WhatsApp & Pedidos', iconPath: iconPaths.phone },
                    { id: 'relacionamento', label: 'Inativos & Aniversário', iconPath: iconPaths.heart },
                    { id: 'posvenda', label: 'Lançamentos & Pós-Venda', iconPath: iconPaths.megaphone },
                    { id: 'logs', label: 'Histórico de Disparos', iconPath: iconPaths.history, count: logs.length }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setSubTab(tab.id)}
                        className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                            subTab === tab.id
                                ? 'border-[#7A3E4A] text-[#7A3E4A] bg-[#7A3E4A]/5 rounded-t-xl'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        <Icon path={tab.iconPath} className="w-4 h-4 opacity-75" />
                        {tab.label}
                        {tab.count !== undefined && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 font-extrabold text-gray-600">
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* CONTEÚDO DAS ABAS */}

            {/* ABA 1: CARRINHO ABANDONADO */}
            {subTab === 'carrinho' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-[#EEEEEE] space-y-6">
                        <div className="flex items-center justify-between border-b border-[#EEEEEE] pb-4">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <Icon path={iconPaths.cart} className="w-4 h-4 text-[#7A3E4A]" />
                                    Automação de Recuperação de Carrinho
                                </h3>
                                <p className="text-xs text-gray-400">Notifique clientes automaticamente em 30 min, 24 horas e 48 horas com cupons.</p>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={config.cart_abandoned_active}
                                    onChange={e => setConfig({ ...config, cart_abandoned_active: e.target.checked })}
                                    className="w-4 h-4 accent-[#7A3E4A] cursor-pointer"
                                />
                                <span className="text-xs font-bold text-gray-700">Ativar Carrinho Abandonado</span>
                            </label>
                        </div>

                        {/* Etapa 1: 30 minutos */}
                        <div className="p-4 bg-[#FAF9F5] rounded-xl border border-[#EEEEEE] space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-[#7A3E4A] uppercase tracking-wider flex items-center gap-1.5">
                                    <Icon path={iconPaths.clock} className="w-3.5 h-3.5" />
                                    1ª Etapa: Após 30 minutos
                                </span>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.cart_30m_active}
                                        onChange={e => setConfig({ ...config, cart_30m_active: e.target.checked })}
                                        className="w-3.5 h-3.5 accent-[#7A3E4A] cursor-pointer"
                                    />
                                    <span className="text-[11px] font-bold text-gray-600">Ativo</span>
                                </label>
                            </div>
                            <div>
                                <label className={labelCls}>Mensagem (Use &#123;nome&#125; e &#123;link_carrinho&#125;)</label>
                                <textarea
                                    rows="2"
                                    value={config.cart_30m_message}
                                    onChange={e => setConfig({ ...config, cart_30m_message: e.target.value })}
                                    className={inputCls}
                                />
                            </div>
                        </div>

                        {/* Etapa 2: 24 horas */}
                        <div className="p-4 bg-[#FAF9F5] rounded-xl border border-[#EEEEEE] space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-[#7A3E4A] uppercase tracking-wider flex items-center gap-1.5">
                                    <Icon path={iconPaths.clock} className="w-3.5 h-3.5" />
                                    2ª Etapa: Após 24 horas
                                </span>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.cart_24h_active}
                                        onChange={e => setConfig({ ...config, cart_24h_active: e.target.checked })}
                                        className="w-3.5 h-3.5 accent-[#7A3E4A] cursor-pointer"
                                    />
                                    <span className="text-[11px] font-bold text-gray-600">Ativo</span>
                                </label>
                            </div>
                            <div>
                                <label className={labelCls}>Mensagem (Use &#123;nome&#125; e &#123;link_carrinho&#125;)</label>
                                <textarea
                                    rows="2"
                                    value={config.cart_24h_message}
                                    onChange={e => setConfig({ ...config, cart_24h_message: e.target.value })}
                                    className={inputCls}
                                />
                            </div>
                        </div>

                        {/* Etapa 3: 48 horas (Com Cupom) */}
                        <div className="p-4 bg-[#FAF9F5] rounded-xl border border-[#EEEEEE] space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-[#7A3E4A] uppercase tracking-wider flex items-center gap-1.5">
                                    <Icon path={iconPaths.gift} className="w-3.5 h-3.5" />
                                    3ª Etapa: Após 48 horas (Com Cupom 5% OFF)
                                </span>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.cart_48h_active}
                                        onChange={e => setConfig({ ...config, cart_48h_active: e.target.checked })}
                                        className="w-3.5 h-3.5 accent-[#7A3E4A] cursor-pointer"
                                    />
                                    <span className="text-[11px] font-bold text-gray-600">Ativo</span>
                                </label>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelCls}>Código do Cupom</label>
                                    <input
                                        type="text"
                                        value={config.cart_48h_coupon}
                                        onChange={e => setConfig({ ...config, cart_48h_coupon: e.target.value.toUpperCase() })}
                                        className={`${inputCls} uppercase font-bold`}
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Desconto (%)</label>
                                    <input
                                        type="number"
                                        value={config.cart_48h_discount_percent}
                                        onChange={e => setConfig({ ...config, cart_48h_discount_percent: parseFloat(e.target.value) || 0 })}
                                        className={inputCls}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Mensagem (Use &#123;nome&#125;, &#123;cupom&#125; e &#123;link_carrinho&#125;)</label>
                                <textarea
                                    rows="2"
                                    value={config.cart_48h_message}
                                    onChange={e => setConfig({ ...config, cart_48h_message: e.target.value })}
                                    className={inputCls}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Lista de Carrinhos Monitorados */}
                    <div className="bg-white p-6 rounded-2xl border border-[#EEEEEE] space-y-4">
                        <h3 className="text-sm font-bold text-gray-900">Carrinhos Monitorados Recentemente</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-[#EEEEEE] text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                                        <th className="pb-3">Sessão / Cliente</th>
                                        <th className="pb-3">Itens</th>
                                        <th className="pb-3">Subtotal</th>
                                        <th className="pb-3">Estágio Notificado</th>
                                        <th className="pb-3">Status</th>
                                        <th className="pb-3">Última Atividade</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#EEEEEE] text-xs">
                                    {carts.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="py-6 text-center text-gray-400 italic">Nenhum carrinho registrado ainda.</td>
                                        </tr>
                                    ) : (
                                        carts.map(c => (
                                            <tr key={c.id} className="hover:bg-[#FAF9F5] transition-colors">
                                                <td className="py-3 font-semibold text-gray-800">
                                                    <div>{c.customer_name || c.customer_email || c.customer_phone || c.session_id}</div>
                                                    {c.customer_phone && <div className="text-[10px] text-gray-400 font-normal">{c.customer_phone}</div>}
                                                </td>
                                                <td className="py-3 text-gray-600">{Array.isArray(c.items) ? c.items.length : 0} produto(s)</td>
                                                <td className="py-3 font-bold text-[#7A3E4A]">R$ {(Number(c.subtotal) || 0).toFixed(2)}</td>
                                                <td className="py-3">
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
                                                        Estágio {c.stage || 0}/3
                                                    </span>
                                                </td>
                                                <td className="py-3">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                                        c.status === 'recovered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                        c.status === 'abandoned' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-50 text-gray-600 border-gray-200'
                                                    }`}>
                                                        {c.status === 'recovered' ? 'Recuperado' : c.status === 'abandoned' ? 'Abandonado' : 'Ativo'}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-gray-400 text-[10px]">
                                                    {new Date(c.last_activity || c.created_at).toLocaleString('pt-BR')}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ABA 2: WHATSAPP & PEDIDOS */}
            {subTab === 'pedidos' && (
                <div className="bg-white p-6 rounded-2xl border border-[#EEEEEE] space-y-6">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <Icon path={iconPaths.phone} className="w-4 h-4 text-[#7A3E4A]" />
                            Integração WhatsApp & E-mail de Status de Pedido
                        </h3>
                        <p className="text-xs text-gray-400">Configure suas APIs de envio e ative notificações instantâneas a cada alteração de pedido.</p>
                    </div>

                    {/* Provedores de API */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-[#EEEEEE] pb-6">
                        <div className="p-4 bg-[#FAF9F5] rounded-xl border border-[#EEEEEE] space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                                    <Icon path={iconPaths.phone} className="w-3.5 h-3.5 text-gray-500" />
                                    WhatsApp Provider (Z-API / Evolution / Webhook)
                                </span>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.whatsapp_enabled}
                                        onChange={e => setConfig({ ...config, whatsapp_enabled: e.target.checked })}
                                        className="w-3.5 h-3.5 accent-[#7A3E4A] cursor-pointer"
                                    />
                                    <span className="text-[11px] font-bold text-gray-600">Ativo</span>
                                </label>
                            </div>
                            <div>
                                <label className={labelCls}>API Webhook URL</label>
                                <input
                                    type="text"
                                    placeholder="https://api.z-api.io/instances/..."
                                    value={config.whatsapp_api_url}
                                    onChange={e => setConfig({ ...config, whatsapp_api_url: e.target.value })}
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>API Token / Key</label>
                                <input
                                    type="password"
                                    placeholder="••••••••••••••••"
                                    value={config.whatsapp_api_token}
                                    onChange={e => setConfig({ ...config, whatsapp_api_token: e.target.value })}
                                    className={inputCls}
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-[#FAF9F5] rounded-xl border border-[#EEEEEE] space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                                    <Icon path={iconPaths.mail} className="w-3.5 h-3.5 text-gray-500" />
                                    E-mail Provider (Resend / SendGrid / Webhook)
                                </span>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.email_enabled}
                                        onChange={e => setConfig({ ...config, email_enabled: e.target.checked })}
                                        className="w-3.5 h-3.5 accent-[#7A3E4A] cursor-pointer"
                                    />
                                    <span className="text-[11px] font-bold text-gray-600">Ativo</span>
                                </label>
                            </div>
                            <div>
                                <label className={labelCls}>API Webhook URL</label>
                                <input
                                    type="text"
                                    placeholder="https://api.resend.com/emails"
                                    value={config.email_api_url}
                                    onChange={e => setConfig({ ...config, email_api_url: e.target.value })}
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>API Token / Key</label>
                                <input
                                    type="password"
                                    placeholder="re_••••••••••••••••"
                                    value={config.email_api_token}
                                    onChange={e => setConfig({ ...config, email_api_token: e.target.value })}
                                    className={inputCls}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Modelos de Mensagens por Status */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Modelos de Notificação de Pedido</h4>

                        <div className="p-4 bg-[#FAF9F5] rounded-xl border border-[#EEEEEE] space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-800">Pedido Confirmado</span>
                                <label className="flex items-center gap-1 cursor-pointer">
                                    <input type="checkbox" checked={config.order_confirmed_active} onChange={e => setConfig({ ...config, order_confirmed_active: e.target.checked })} className="w-3.5 h-3.5 accent-[#7A3E4A]" />
                                    <span className="text-[11px] font-bold">Ativo</span>
                                </label>
                            </div>
                            <textarea rows="2" value={config.order_confirmed_message} onChange={e => setConfig({ ...config, order_confirmed_message: e.target.value })} className={inputCls} />
                        </div>

                        <div className="p-4 bg-[#FAF9F5] rounded-xl border border-[#EEEEEE] space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-800">Pagamento Aprovado</span>
                                <label className="flex items-center gap-1 cursor-pointer">
                                    <input type="checkbox" checked={config.payment_approved_active} onChange={e => setConfig({ ...config, payment_approved_active: e.target.checked })} className="w-3.5 h-3.5 accent-[#7A3E4A]" />
                                    <span className="text-[11px] font-bold">Ativo</span>
                                </label>
                            </div>
                            <textarea rows="2" value={config.payment_approved_message} onChange={e => setConfig({ ...config, payment_approved_message: e.target.value })} className={inputCls} />
                        </div>

                        <div className="p-4 bg-[#FAF9F5] rounded-xl border border-[#EEEEEE] space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-800">Pagamento Pendente (Lembrete)</span>
                                <label className="flex items-center gap-1 cursor-pointer">
                                    <input type="checkbox" checked={config.payment_pending_active} onChange={e => setConfig({ ...config, payment_pending_active: e.target.checked })} className="w-3.5 h-3.5 accent-[#7A3E4A]" />
                                    <span className="text-[11px] font-bold">Ativo</span>
                                </label>
                            </div>
                            <textarea rows="2" value={config.payment_pending_message} onChange={e => setConfig({ ...config, payment_pending_message: e.target.value })} className={inputCls} />
                        </div>

                        <div className="p-4 bg-[#FAF9F5] rounded-xl border border-[#EEEEEE] space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-800">Pedido Enviado (Com Rastreio)</span>
                                <label className="flex items-center gap-1 cursor-pointer">
                                    <input type="checkbox" checked={config.order_shipped_active} onChange={e => setConfig({ ...config, order_shipped_active: e.target.checked })} className="w-3.5 h-3.5 accent-[#7A3E4A]" />
                                    <span className="text-[11px] font-bold">Ativo</span>
                                </label>
                            </div>
                            <textarea rows="2" value={config.order_shipped_message} onChange={e => setConfig({ ...config, order_shipped_message: e.target.value })} className={inputCls} />
                        </div>

                        <div className="p-4 bg-[#FAF9F5] rounded-xl border border-[#EEEEEE] space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-800">Pedido Entregue</span>
                                <label className="flex items-center gap-1 cursor-pointer">
                                    <input type="checkbox" checked={config.order_delivered_active} onChange={e => setConfig({ ...config, order_delivered_active: e.target.checked })} className="w-3.5 h-3.5 accent-[#7A3E4A]" />
                                    <span className="text-[11px] font-bold">Ativo</span>
                                </label>
                            </div>
                            <textarea rows="2" value={config.order_delivered_message} onChange={e => setConfig({ ...config, order_delivered_message: e.target.value })} className={inputCls} />
                        </div>
                    </div>
                </div>
            )}

            {/* ABA 3: INATIVOS & ANIVERSÁRIO */}
            {subTab === 'relacionamento' && (
                <div className="bg-white p-6 rounded-2xl border border-[#EEEEEE] space-y-6">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <Icon path={iconPaths.heart} className="w-4 h-4 text-[#7A3E4A]" />
                            Relacionamento com Clientes
                        </h3>
                        <p className="text-xs text-gray-400">Reengaje clientes sem compras há 90 dias e envie mimos no dia do aniversário.</p>
                    </div>

                    {/* 90 Dias Inativos */}
                    <div className="p-4 bg-[#FAF9F5] rounded-xl border border-[#EEEEEE] space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-[#7A3E4A] uppercase tracking-wider">Clientes Inativos (90 Dias Sem Comprar)</span>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={config.inactive_90d_active}
                                    onChange={e => setConfig({ ...config, inactive_90d_active: e.target.checked })}
                                    className="w-3.5 h-3.5 accent-[#7A3E4A] cursor-pointer"
                                />
                                <span className="text-[11px] font-bold text-gray-600">Ativo</span>
                            </label>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelCls}>Cupom de Retorno</label>
                                <input
                                    type="text"
                                    value={config.inactive_90d_coupon}
                                    onChange={e => setConfig({ ...config, inactive_90d_coupon: e.target.value.toUpperCase() })}
                                    className={`${inputCls} uppercase font-bold`}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Desconto (%)</label>
                                <input
                                    type="number"
                                    value={config.inactive_90d_discount_percent}
                                    onChange={e => setConfig({ ...config, inactive_90d_discount_percent: parseFloat(e.target.value) || 0 })}
                                    className={inputCls}
                                />
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>Mensagem (Use &#123;nome&#125;, &#123;cupom&#125; e &#123;link_loja&#125;)</label>
                            <textarea
                                rows="2"
                                value={config.inactive_90d_message}
                                onChange={e => setConfig({ ...config, inactive_90d_message: e.target.value })}
                                className={inputCls}
                            />
                        </div>
                    </div>

                    {/* Aniversariantes */}
                    <div className="p-4 bg-[#FAF9F5] rounded-xl border border-[#EEEEEE] space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-[#7A3E4A] uppercase tracking-wider flex items-center gap-1.5">
                                <Icon path={iconPaths.sparkles} className="w-3.5 h-3.5" />
                                Mensagem de Aniversário
                            </span>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={config.birthday_active}
                                    onChange={e => setConfig({ ...config, birthday_active: e.target.checked })}
                                    className="w-3.5 h-3.5 accent-[#7A3E4A] cursor-pointer"
                                />
                                <span className="text-[11px] font-bold text-gray-600">Ativo</span>
                            </label>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelCls}>Cupom de Aniversário</label>
                                <input
                                    type="text"
                                    value={config.birthday_coupon}
                                    onChange={e => setConfig({ ...config, birthday_coupon: e.target.value.toUpperCase() })}
                                    className={`${inputCls} uppercase font-bold`}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Desconto (%)</label>
                                <input
                                    type="number"
                                    value={config.birthday_discount_percent}
                                    onChange={e => setConfig({ ...config, birthday_discount_percent: parseFloat(e.target.value) || 0 })}
                                    className={inputCls}
                                />
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>Mensagem (Use &#123;nome&#125;, &#123;cupom&#125; e &#123;link_loja&#125;)</label>
                            <textarea
                                rows="2"
                                value={config.birthday_message}
                                onChange={e => setConfig({ ...config, birthday_message: e.target.value })}
                                className={inputCls}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* ABA 4: LANÇAMENTOS & PÓS-VENDA */}
            {subTab === 'posvenda' && (
                <div className="bg-white p-6 rounded-2xl border border-[#EEEEEE] space-y-6">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <Icon path={iconPaths.megaphone} className="w-4 h-4 text-[#7A3E4A]" />
                            Pós-Venda & Lançamento de Coleção
                        </h3>
                        <p className="text-xs text-gray-400">Envie pesquisas de satisfação e lance transmissões de novas coleções.</p>
                    </div>

                    {/* Transmissão de Lançamento */}
                    <div className="p-4 bg-[#FAF9F5] rounded-xl border border-[#EEEEEE] space-y-4">
                        <span className="text-xs font-black text-[#7A3E4A] uppercase tracking-wider">Transmissão de Nova Coleção</span>
                        <div>
                            <label className={labelCls}>Modelo de Mensagem de Lançamento</label>
                            <textarea
                                rows="2"
                                value={config.new_collection_message}
                                onChange={e => setConfig({ ...config, new_collection_message: e.target.value })}
                                className={inputCls}
                            />
                        </div>
                        <form onSubmit={handleBroadcastNewCollection} className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Nome da Coleção (Ex: Primavera/Verão)"
                                value={collectionInput}
                                onChange={e => setCollectionInput(e.target.value)}
                                className={inputCls}
                            />
                            <button
                                type="submit"
                                disabled={running}
                                className="px-5 py-2.5 bg-[#7A3E4A] hover:bg-[#603039] text-white text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
                            >
                                Disparar para Opt-in
                            </button>
                        </form>
                    </div>

                    {/* Pós-Venda */}
                    <div className="p-4 bg-[#FAF9F5] rounded-xl border border-[#EEEEEE] space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-[#7A3E4A] uppercase tracking-wider">Mensagem de Pós-Venda (Avaliação & Foto)</span>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={config.post_sale_active}
                                    onChange={e => setConfig({ ...config, post_sale_active: e.target.checked })}
                                    className="w-3.5 h-3.5 accent-[#7A3E4A] cursor-pointer"
                                />
                                <span className="text-[11px] font-bold text-gray-600">Ativo</span>
                            </label>
                        </div>
                        <div>
                            <label className={labelCls}>Dias Após Entrega</label>
                            <input
                                type="number"
                                value={config.post_sale_days}
                                onChange={e => setConfig({ ...config, post_sale_days: parseInt(e.target.value) || 1 })}
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Mensagem (Use &#123;nome&#125;)</label>
                            <textarea
                                rows="2"
                                value={config.post_sale_message}
                                onChange={e => setConfig({ ...config, post_sale_message: e.target.value })}
                                className={inputCls}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* ABA 5: HISTÓRICO DE LOGS */}
            {subTab === 'logs' && (
                <div className="bg-white p-6 rounded-2xl border border-[#EEEEEE] space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Icon path={iconPaths.history} className="w-4 h-4 text-[#7A3E4A]" />
                        Histórico de Disparos de Automação
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#EEEEEE] text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                                    <th className="pb-3">Canal / Evento</th>
                                    <th className="pb-3">Destinatário</th>
                                    <th className="pb-3">Conteúdo da Mensagem</th>
                                    <th className="pb-3">Status</th>
                                    <th className="pb-3">Data</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#EEEEEE] text-xs">
                                {logs.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-6 text-center text-gray-400 italic">Nenhum disparo registrado ainda.</td>
                                    </tr>
                                ) : (
                                    logs.map(log => (
                                        <tr key={log.id} className="hover:bg-[#FAF9F5] transition-colors">
                                            <td className="py-3">
                                                <span className="font-bold text-gray-800 uppercase text-[10px] tracking-wider block flex items-center gap-1">
                                                    <Icon path={log.channel === 'whatsapp' ? iconPaths.phone : iconPaths.mail} className="w-3 h-3 text-gray-500" />
                                                    {log.channel === 'whatsapp' ? 'WhatsApp' : 'E-mail'}
                                                </span>
                                                <span className="text-[10px] text-[#7A3E4A] font-semibold">{log.event_type}</span>
                                            </td>
                                            <td className="py-3 font-medium text-gray-700">
                                                <div>{log.recipient_name || log.recipient_email || log.recipient_phone}</div>
                                                {log.recipient_phone && <div className="text-[10px] text-gray-400">{log.recipient_phone}</div>}
                                            </td>
                                            <td className="py-3 text-gray-600 max-w-xs truncate" title={log.message_content}>
                                                {log.message_content}
                                            </td>
                                            <td className="py-3">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                                    log.status === 'sent' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-700 border-gray-200'
                                                }`}>
                                                    {log.status === 'sent' ? 'Enviado' : 'Simulado / Log'}
                                                </span>
                                            </td>
                                            <td className="py-3 text-gray-400 text-[10px]">
                                                {new Date(log.created_at).toLocaleString('pt-BR')}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}

