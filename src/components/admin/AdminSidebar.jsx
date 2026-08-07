import { Link } from 'react-router-dom'
import { signOut } from '../../services/auth.js'
import { getAssetUrl } from '../../utils/assets.js'

function Icon({ path, className = 'w-5 h-5' }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d={path} />
        </svg>
    )
}

export default function AdminSidebar({
    activeSection,
    setActiveSection,
    adminName,
    adminInitials,
    menuItems,
    onNavClick
}) {
    const NavItem = ({ item, onClick }) => {
        const active = activeSection === item.id
        return (
            <button
                onClick={onClick || (() => setActiveSection(item.id))}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-semibold tracking-wide transition-all cursor-pointer group ${active
                    ? 'bg-gradient-to-r from-[#7A3E4A] to-[#9A5060] text-white shadow-md shadow-[#7A3E4A]/25'
                    : 'text-gray-500 hover:bg-[#7A3E4A]/5 hover:text-[#7A3E4A]'
                }`}
            >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${active ? 'bg-white/20' : 'bg-transparent group-hover:bg-[#7A3E4A]/10'}`}>
                    <Icon path={item.icon} className="w-4 h-4" />
                </span>
                {item.label}
                {active && <span className="ml-auto w-1.5 h-1.5 bg-white/70 rounded-full" />}
            </button>
        )
    }

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Logo */}
            <div className="p-5 border-b border-[#EEEEEE]">
                <Link to="/" className="flex items-center gap-2.5 group">
                    <img 
                        src={getAssetUrl('/assets/borboleta-v2.webp')} 
                        alt="Borboleta Meraki" 
                        className="w-10 h-10 object-contain animate-butterfly-flight shrink-0"
                    />
                    <div className="flex flex-col leading-none">
                        <span className="font-heading tracking-[0.22em] text-[18px] font-black uppercase text-[#1A1A1A] group-hover:text-[#7A3E4A] transition-colors antialiased">
                            MERAKI
                        </span>
                        <span className="text-[8px] uppercase tracking-[0.42em] text-[#7A3E4A] font-extrabold mt-1 ml-[0.42em] antialiased">
                            ---- FEMME ----
                        </span>
                        <span className="text-[7.5px] font-bold uppercase tracking-[0.2em] text-[#C6A76A] mt-1.5 antialiased">
                            Painel Administrativo
                        </span>
                    </div>
                </Link>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest px-4 mb-3 mt-1">Menu Principal</p>
                {menuItems.map(item => (
                    <NavItem 
                        key={item.id} 
                        item={item} 
                        onClick={onNavClick ? () => { setActiveSection(item.id); onNavClick() } : () => setActiveSection(item.id)} 
                    />
                ))}

                <div className="pt-4 mt-4 border-t border-[#EEEEEE] space-y-1">
                    <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest px-4 mb-3">Atalhos</p>
                    <Link
                        to="/"
                        onClick={onNavClick}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-gray-500 hover:bg-[#7A3E4A]/5 hover:text-[#7A3E4A] transition-all group"
                    >
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-transparent group-hover:bg-[#7A3E4A]/10 transition-all">
                            <Icon path="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" className="w-4 h-4" />
                        </span>
                        Ver Loja
                    </Link>
                </div>
            </nav>

            {/* User Card */}
            <div className="p-4 border-t border-[#EEEEEE]">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF9F5] mb-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7A3E4A] to-[#9A5060] flex items-center justify-center text-white text-xs font-black tracking-wider shrink-0">
                        {adminInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">{adminName}</p>
                        <p className="text-[10px] text-[#C6A76A] font-semibold">Administradora</p>
                    </div>
                </div>
                <button
                    onClick={() => signOut()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-all cursor-pointer border border-red-100"
                >
                    <Icon path="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" className="w-4 h-4" />
                    Sair do Painel
                </button>
            </div>
        </div>
    )
}
