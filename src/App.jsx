import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import HomePage from './pages/HomePage.jsx'
import AuthPage from './pages/AuthPage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import CategoryPage from './pages/CategoryPage.jsx'
import CheckoutPage from './pages/CheckoutPage.jsx'
import OrderSuccessPage from './pages/OrderSuccessPage.jsx'
import ProductPage from './pages/ProductPage.jsx'
import InfoPage from './pages/InfoPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import CartDrawer from './components/CartDrawer.jsx'
import SearchOverlay from './components/SearchOverlay.jsx'
import TrackingManager from './components/TrackingManager.jsx'
import { isInitialSyncComplete } from './services/database.js'

function ScrollToTopReset() {
    const { pathname } = useLocation()
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [pathname])
    return null
}

function SplashLoader() {
    const [butterflySrc, setButterflySrc] = useState('/assets/borboleta-v2.png')

    useEffect(() => {
        const img = new Image()
        img.src = '/assets/borboleta-v2.png'
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
                            data[i+3] = 0 // make light background transparent
                        }
                    }
                    ctx.putImageData(imgData, 0, 0)
                    setButterflySrc(canvas.toDataURL())
                } catch (e) {
                    console.error("Erro ao remover fundo da borboleta:", e)
                }
            }
        }
    }, [])

    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center z-[99999]" style={{ background: 'linear-gradient(135deg, #FAF9F5 0%, #F5EEE9 100%)' }}>
            <div className="flex flex-col items-center gap-6">
                <div className="relative flex flex-col items-center">
                    {/* Animated Butterfly */}
                    <img 
                        src={butterflySrc} 
                        alt="Borboleta Meraki" 
                        className={`w-16 h-16 md:w-20 md:h-20 object-contain animate-bounce mb-2 transition-opacity duration-200 ${
                            butterflySrc.startsWith('data:') ? 'opacity-100' : 'opacity-0'
                        }`}
                        style={{ animationDuration: '2s' }}
                    />
                    {/* Logo Text */}
                    <div className="flex flex-col items-center leading-none animate-pulse">
                        <h1 className="font-heading text-3xl md:text-4.5xl font-bold tracking-[0.3em] text-[#1A1A1A]">
                            MERAKI
                        </h1>
                        <span className="text-xs md:text-sm uppercase tracking-[0.55em] text-[#7A3E4A] font-bold mt-1.5 ml-1">
                            ---- FEMME ----
                        </span>
                    </div>
                    <p className="text-[9px] uppercase tracking-[0.4em] text-[#7A3E4A]/60 mt-4 font-medium text-center">
                        Carregando a melhor experiência...
                    </p>
                </div>
                {/* Custom Elegant Line Loader */}
                <div className="w-40 h-[2px] bg-[#7A3E4A]/10 rounded-full overflow-hidden relative mt-2">
                    <div className="absolute top-0 bottom-0 left-0 w-1/3 bg-[#7A3E4A] rounded-full animate-[loadingLine_1.5s_infinite_ease-in-out]" />
                </div>
            </div>
            
            {/* Inline keyframe styles for zero dependencies and design safety */}
            <style>{`
                @keyframes loadingLine {
                    0% { left: -30%; width: 30%; }
                    50% { width: 50%; }
                    100% { left: 110%; width: 30%; }
                }
            `}</style>
        </div>
    )
}

export default function App() {
    const [loading, setLoading] = useState(!isInitialSyncComplete)

    useEffect(() => {
        if (isInitialSyncComplete) {
            setLoading(false)
            return
        }
        
        const handleSync = () => {
            setLoading(false)
        }
        window.addEventListener('meraki_db_synced', handleSync)
        return () => window.removeEventListener('meraki_db_synced', handleSync)
    }, [])

    return (
        <HashRouter>
            {loading && <SplashLoader />}
            <ScrollToTopReset />
            <TrackingManager />
            <CartDrawer />
            <SearchOverlay />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/category/:slug" element={<CategoryPage />} />
                <Route path="/product/:id" element={<ProductPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
                
                {/* Institutional & Atendimento Routes */}
                <Route path="/story" element={<InfoPage tab="story" />} />
                <Route path="/revenda" element={<InfoPage tab="revenda" />} />
                <Route path="/connect" element={<InfoPage tab="connect" />} />
                <Route path="/security" element={<InfoPage tab="security" />} />
                <Route path="/payment" element={<InfoPage tab="payment" />} />
                <Route path="/delivery" element={<InfoPage tab="delivery" />} />
                <Route path="/returns" element={<InfoPage tab="returns" />} />
                <Route path="/withdrawal" element={<InfoPage tab="withdrawal" />} />
                <Route path="/privacy" element={<InfoPage tab="privacy" />} />
                <Route path="/promotional-rules" element={<InfoPage tab="promotional-rules" />} />
                <Route path="/stores" element={<InfoPage tab="stores" />} />
                <Route path="/wishlist" element={<InfoPage tab="wishlist" />} />
                <Route path="/info/:tab" element={<InfoPage />} />
            </Routes>
        </HashRouter>
    )
}
