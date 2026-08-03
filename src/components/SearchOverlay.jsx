import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useProducts } from '../hooks/useProducts.js'
import { getAssetUrl } from '../utils/assets.js'

export default function SearchOverlay({ isOpen: externalIsOpen, onClose: externalOnClose }) {
    const [internalIsOpen, setInternalIsOpen] = useState(false)
    const [query, setQuery] = useState('')
    const { products } = useProducts()
    const inputRef = useRef(null)
    const navigate = useNavigate()

    const isVisible = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen

    const handleClose = () => {
        setInternalIsOpen(false)
        if (externalOnClose) externalOnClose()
    }

    useEffect(() => {
        const handleGlobalOpen = () => setInternalIsOpen(true)
        const handleGlobalClose = () => setInternalIsOpen(false)

        window.addEventListener('open-search', handleGlobalOpen)
        window.addEventListener('close-search', handleGlobalClose)
        return () => {
            window.removeEventListener('open-search', handleGlobalOpen)
            window.removeEventListener('close-search', handleGlobalClose)
        }
    }, [])

    useEffect(() => {
        if (isVisible) {
            setTimeout(() => inputRef.current?.focus(), 150)
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
            setQuery('')
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [isVisible])

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isVisible) {
                handleClose()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isVisible])

    const cleanQuery = query.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

    const matchingProducts = cleanQuery
        ? products.filter(p => {
            const name = (p.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            const cat = (p.category || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            const sub = (p.subcategory || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            const desc = (p.description || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            return name.includes(cleanQuery) || cat.includes(cleanQuery) || sub.includes(cleanQuery) || desc.includes(cleanQuery)
        }).slice(0, 8)
        : []

    const categories = (() => {
        try {
            const stored = localStorage.getItem('meraki_categories')
            if (stored) {
                const parsed = JSON.parse(stored)
                return parsed.map(c => typeof c === 'string' ? c : (c.name || '')).filter(Boolean)
            }
        } catch (e) { console.error(e) }
        return ['Linha Sexy', 'Conjuntos', 'Camisolas', 'Baby Doll', 'Body', 'Fantasias', 'Plus Size']
    })()

    const handleSearchSubmit = (e) => {
        e.preventDefault()
        if (!cleanQuery) return
        const slug = cleanQuery.replace(/\s+/g, '-')
        handleClose()
        navigate(`/category/${slug}`)
    }

    const getProductImage = (product) => {
        if (Array.isArray(product.image)) return getAssetUrl(product.image[0] || '/placeholder.jpg')
        return getAssetUrl(product.image || '/placeholder.jpg')
    }

    return (
        <div className={`fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 md:pt-24 px-4 transition-opacity duration-300 ${isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            <div 
                className="fixed inset-0"
                onClick={handleClose}
            />
            <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 relative z-10 overflow-hidden animate-[fadeInUp_300ms_ease-out]">
                {/* Search Bar Form */}
                <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 border-b border-gray-100 pb-4">
                    <svg className="w-5 h-5 text-[#7A3E4A] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="O que você procura? (ex: Corset, Body, Conjunto...)"
                        className="flex-1 text-base md:text-lg font-medium text-gray-900 outline-none placeholder:text-gray-400"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => setQuery('')}
                            className="px-2 py-1 text-gray-400 hover:text-gray-600 rounded-lg text-xs font-bold uppercase cursor-pointer"
                        >
                            Limpar
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer text-gray-400 hover:text-gray-700"
                        aria-label="Fechar busca"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </form>

                {/* Real-time Product Results */}
                {matchingProducts.length > 0 && (
                    <div className="mt-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-bold text-[#7A3E4A] uppercase tracking-[0.2em]">Produtos Encontrados ({matchingProducts.length})</h4>
                        </div>
                        <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto pr-1">
                            {matchingProducts.map(product => (
                                <Link
                                    key={product.id}
                                    to={`/product/${product.id}`}
                                    onClick={handleClose}
                                    className="flex items-center gap-4 py-3 hover:bg-[#FAF9F5] px-3 rounded-2xl transition-all group cursor-pointer"
                                >
                                    <div className="w-12 h-14 bg-gray-50 rounded-xl overflow-hidden border border-[#EEEEEE] shrink-0">
                                        <img src={getProductImage(product)} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-gray-900 truncate group-hover:text-[#7A3E4A] transition-colors">{product.name}</p>
                                        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{product.category}</span>
                                    </div>
                                    <span className="text-xs font-black text-[#7A3E4A]">R$ {product.price?.toFixed(2)}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* No results message */}
                {cleanQuery && matchingProducts.length === 0 && (
                    <div className="py-8 text-center space-y-2">
                        <p className="text-xs font-bold text-gray-600">Nenhum produto encontrado para "{query}"</p>
                        <p className="text-[10px] text-gray-400">Tente buscar por termos como "Lingerie", "Conjunto", "Corset" ou "Body".</p>
                    </div>
                )}

                {/* Categories & Search Suggestions */}
                {!cleanQuery && categories.length > 0 && (
                    <div className="mt-6">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">Sugestões de Busca</h4>
                        <div className="flex flex-wrap gap-2">
                            {categories.map(tag => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => setQuery(tag)}
                                    className="px-3.5 py-1.5 bg-[#FAF9F5] hover:bg-[#7A3E4A]/10 border border-[#EEEEEE] rounded-full text-xs font-semibold text-gray-700 hover:text-[#7A3E4A] hover:border-[#7A3E4A]/30 transition-all cursor-pointer"
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
