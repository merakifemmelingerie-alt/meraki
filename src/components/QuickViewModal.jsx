import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAssetUrl } from '../utils/assets.js'
import { fetchProductReviews } from '../services/database.js'

export default function QuickViewModal({ product, isOpen, onClose, onAddToCart, isWishlisted, onToggleWishlist }) {
    const navigate = useNavigate()
    const [selectedSize, setSelectedSize] = useState(null)
    const [errorMsg, setErrorMsg] = useState('')
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [reviews, setReviews] = useState([])

    // Load reviews dynamically from Supabase / cache when the product changes
    useEffect(() => {
        if (!product) return
        let isMounted = true
        fetchProductReviews(product.id).then(({ data }) => {
            if (isMounted && data) {
                setReviews(data)
            }
        })
        return () => { isMounted = false }
    }, [product])

    if (!isOpen || !product || !product.name) return null

    const activeProduct = product || {}
    const formatPrice = (price) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price || 0)
    
    // Parse sizes safely
    const rawSizes = activeProduct.sizes ? (typeof activeProduct.sizes === 'string' ? activeProduct.sizes.split(',').map(s => s.trim()) : activeProduct.sizes) : []
    const sizes = (() => {
        const unique = []
        const seen = new Set()
        for (let s of rawSizes) {
            const key = s.trim().toUpperCase()
            if (key && !seen.has(key)) {
                seen.add(key)
                unique.push(s.trim())
            }
        }
        return unique
    })()
    
    // Gather all images safely
    const images = Array.isArray(activeProduct.image) ? activeProduct.image : [activeProduct.image].filter(Boolean)
    const activeImageSrc = getAssetUrl(images[currentImageIndex] || '/placeholder.jpg')

    // Compute average rating
    const averageRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) : 5

    const handleAdd = () => {
        if (sizes.length > 0 && !selectedSize) {
            setErrorMsg('Selecione um tamanho para continuar')
            return
        }
        setErrorMsg('')
        onAddToCart?.(activeProduct, selectedSize)
    }

    const showModal = isOpen && product

    return (
        <div className={`fixed inset-0 z-[95] transition-opacity duration-300 ${showModal ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            {/* Backdrop overlay */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300" onClick={onClose} />
            
            {/* Modal Container */}
            <div className="fixed inset-3 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 bg-white rounded-xl shadow-2xl md:max-w-3xl w-[calc(100%-1.5rem)] md:w-full max-h-[92vh] md:max-h-[85vh] overflow-y-auto flex flex-col md:flex-row font-sans">
                
                {/* Floating Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/90 text-gray-800 shadow-xs hover:bg-gray-150 hover:scale-105 active:scale-95 transition-all z-20 focus:outline-none"
                    aria-label="Fechar"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Left Side: Product Image Carousel Slider */}
                <div className="w-full md:w-1/2 h-72 sm:h-96 md:h-auto md:aspect-[3/4] relative overflow-hidden bg-gray-50 shrink-0 group">
                    <img 
                        src={activeImageSrc} 
                        alt={product.name} 
                        className="w-full h-full object-cover transition-all duration-300" 
                        onError={(e) => {
                            e.target.onError = null;
                            e.target.src = getAssetUrl('/placeholder.jpg');
                        }}
                    />
                    
                    {images.length > 1 && (
                        <>
                            {/* Navigation Arrows */}
                            <button 
                                onClick={() => setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length)}
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow-sm border border-gray-100 flex items-center justify-center text-gray-700 hover:bg-white hover:text-black focus:outline-none transition-all active:scale-95 z-10"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button 
                                onClick={() => setCurrentImageIndex(prev => (prev + 1) % images.length)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow-sm border border-gray-100 flex items-center justify-center text-gray-700 hover:bg-white hover:text-black focus:outline-none transition-all active:scale-95 z-10"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                            
                            {/* Dots indicators */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                                {images.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentImageIndex(idx)}
                                        className={`w-2 h-2 rounded-full transition-all ${currentImageIndex === idx ? 'bg-[#7A3E4A] w-3' : 'bg-gray-300'}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Right Side: Product Details */}
                <div className="w-full md:w-1/2 p-5 sm:p-7 md:p-8 flex flex-col justify-between">
                    <div>
                        {/* Header: COMPRA RÁPIDA */}
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                            <svg className="w-5 h-5 text-[#7A3E4A]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                <path d="M12 12v3M10.5 13.5h3" strokeWidth={1.8} strokeLinecap="round" />
                            </svg>
                            <span className="text-xs font-black text-[#7A3E4A] tracking-wider uppercase">Compra Rápida</span>
                        </div>

                        {/* Rating Header */}
                        <div className="flex items-center gap-1.5 text-xs text-gray-405 mb-3">
                            <div className="flex text-amber-400">
                                {Array.from({ length: 5 }).map((_, i) => {
                                    const active = i < Math.round(averageRating);
                                    return (
                                        <svg key={i} className={`w-3.5 h-3.5 fill-current ${active ? 'text-amber-400' : 'text-gray-200'}`} viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    );
                                })}
                            </div>
                            <span className="text-[10px] font-medium text-gray-400">({reviews.length})</span>
                        </div>

                        {/* Title */}
                        <h3 className="font-sans text-lg font-bold text-gray-900 leading-tight mb-1">{product.name}</h3>
                        
                        {/* Seller */}
                        <p className="text-[10px] text-gray-400 mb-4 font-sans">
                            Vendido e entregue por <span className="text-[#7A3E4A] font-bold">Meraki</span>
                        </p>

                        {/* Pricing */}
                        <div className="mb-6 flex items-baseline gap-2">
                            {product.original_price > 0 && product.original_price > product.price && (
                                <span className="text-sm text-gray-450 line-through font-light">{formatPrice(product.original_price)}</span>
                            )}
                            <span className="text-2xl font-black text-gray-950 tracking-tight">{formatPrice(product.price)}</span>
                        </div>

                        {/* Sizes selection */}
                        {sizes.length > 0 && (
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2.5">
                                    <span className="text-xs font-semibold text-gray-700">Selecione o tamanho</span>
                                    {errorMsg && <span className="text-red-500 text-[10px] font-bold animate-[pulse_1.5s_infinite]">{errorMsg}</span>}
                                </div>
                                <div className="flex flex-wrap gap-2.5">
                                    {sizes.map(size => (
                                        <button
                                            key={size}
                                            onClick={() => {
                                                setSelectedSize(size);
                                                setErrorMsg('');
                                            }}
                                            className={`w-10 h-10 rounded-full border text-xs uppercase font-extrabold flex items-center justify-center transition-all ${selectedSize === size ? 'border-[#7A3E4A] text-[#7A3E4A] border-2 bg-transparent scale-105 shadow-2xs' : 'border-gray-300 text-gray-650 hover:border-gray-450 bg-white'}`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-8 pt-4 border-t border-gray-100 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleAdd}
                                className="flex-grow bg-[#7A3E4A] hover:bg-[#63303a] active:scale-98 text-white py-3.5 rounded-xs text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 shadow-xs hover:shadow-sm flex items-center justify-center gap-2"
                            >
                                Adicionar à sacola
                            </button>
                            
                            <button
                                onClick={() => onToggleWishlist?.(product.id)}
                                className="p-3.5 rounded-xs border border-gray-200 hover:border-red-200 bg-white text-gray-400 hover:text-red-500 transition-all duration-300 shadow-2xs"
                                aria-label="Favoritar"
                            >
                                <svg
                                    className={`w-4 h-4 transition-all duration-300 ${isWishlisted ? 'text-[#7A3E4A] fill-[#7A3E4A]' : 'text-gray-500'}`}
                                    fill={isWishlisted ? 'currentColor' : 'none'}
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </button>
                        </div>
                        
                        <button
                            onClick={() => {
                                onClose();
                                navigate(`/product/${product.id}`);
                            }}
                            className="text-center text-[10px] font-bold uppercase tracking-wider text-[#7A3E4A] hover:text-[#5A2E34] transition-colors py-1.5 border-b border-[#7A3E4A]/30 hover:border-[#7A3E4A] self-center focus:outline-none"
                        >
                            Ver mais detalhes do produto
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
