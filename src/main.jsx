import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.jsx'
import { applyTransparentButterflyFavicon } from './utils/favicon.js'

// Automatically apply transparent Meraki butterfly favicon in browser tab
applyTransparentButterflyFavicon()

// Security Purge: Ensure sensitive user data is never stored in persistent localStorage
const cleanSessionData = () => {
    try {
        localStorage.removeItem('meraki_users')
        localStorage.removeItem('meraki_session')
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('meraki_user_addresses_') || key.startsWith('meraki_returns_')) {
                localStorage.removeItem(key)
            }
        })
    } catch (e) {}
}
cleanSessionData()

window.addEventListener('pagehide', cleanSessionData)
window.addEventListener('beforeunload', cleanSessionData)

// Auto-recover strictly from real stale asset 404s after new deployments (e.g. SCRIPT/LINK network errors or dynamic import failures)
window.addEventListener('error', (event) => {
    const isScriptOrLinkTag = event?.target && (event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK')
    const isChunkImportError = event?.message?.includes('dynamically imported module') || event?.message?.includes('Loading chunk')
    
    if (isScriptOrLinkTag || isChunkImportError) {
        const reloaded = sessionStorage.getItem('meraki_asset_reload')
        if (!reloaded) {
            sessionStorage.setItem('meraki_asset_reload', 'true')
            window.location.reload()
        }
    }
}, true)

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>,
)
