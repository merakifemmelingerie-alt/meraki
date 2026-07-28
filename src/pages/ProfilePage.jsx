import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { updateUserProfile } from '../services/auth.js'
import { mapDbToFrontend } from '../services/database.js'
import { supabase } from '../services/supabase.js'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import WhatsAppButton from '../components/WhatsAppButton.jsx'
import { getAssetUrl } from '../utils/assets.js'

export default function ProfilePage() {
    const { user, profile, signOut } = useAuth()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('orders') // orders, addresses, account
    const [orders, setOrders] = useState([])
    const [userProfile, setUserProfile] = useState(null)
    const [addresses, setAddresses] = useState([])
    
    // Edit Profile form state
    const [fullName, setFullName] = useState('')
    const [phone, setPhone] = useState('')
    const [cpf, setCpf] = useState('')
    
    // Add Address form state
    const [addressLabel, setAddressLabel] = useState('Casa')
    const [cep, setCep] = useState('')
    const [street, setStreet] = useState('')
    const [number, setNumber] = useState('')
    const [complement, setComplement] = useState('')
    const [neighborhood, setNeighborhood] = useState('')
    const [city, setCity] = useState('')
    const [uf, setUf] = useState('')
    const [showAddressForm, setShowAddressForm] = useState(false)

    useEffect(() => {
        if (!user) {
            navigate('/auth')
            return
        }

        const cleanEmail = user.email?.trim().toLowerCase()

        // Fetch fresh profile and addresses directly from Supabase Database
        getUserProfile(user.id).then(({ profile: freshProfile }) => {
            const activeProfile = freshProfile || profile
            if (activeProfile) {
                setUserProfile(activeProfile)
                setFullName(activeProfile.full_name || '')
                setPhone(activeProfile.phone || '')
                setCpf(activeProfile.cpf || '')
            }

            let loadedAddrs = []
            
            // 1. Check profile.addresses array from Supabase Database
            if (activeProfile && Array.isArray(activeProfile.addresses) && activeProfile.addresses.length > 0) {
                loadedAddrs = activeProfile.addresses
            }

            // 2. Check local storage if empty from database
            if (loadedAddrs.length === 0) {
                try {
                    const storedLocal = localStorage.getItem(`meraki_user_addresses_${cleanEmail}`)
                    const storedSession = sessionStorage.getItem(`meraki_user_addresses_${cleanEmail}`)
                    if (storedLocal) {
                        loadedAddrs = JSON.parse(storedLocal)
                    } else if (storedSession) {
                        loadedAddrs = JSON.parse(storedSession)
                    }
                } catch (e) {
                    console.error(e)
                }
            }

            // 3. Fallback: Check profile address fields if still empty
            if (loadedAddrs.length === 0 && (activeProfile?.street || activeProfile?.address || activeProfile?.cep)) {
                loadedAddrs.push({
                    id: 'addr-default',
                    label: 'Principal',
                    cep: activeProfile.cep || '',
                    street: activeProfile.street || activeProfile.address || '',
                    number: activeProfile.number || '',
                    complement: activeProfile.complement || '',
                    neighborhood: activeProfile.neighborhood || '',
                    city: activeProfile.city || '',
                    state: activeProfile.state || activeProfile.uf || ''
                })
            }

            // 4. Fallback: Check user's last order shipping address if still empty
            if (loadedAddrs.length === 0) {
                const allOrders = JSON.parse(localStorage.getItem('meraki_orders') || '[]')
                const userOrder = allOrders.find(o => o.customerEmail?.trim().toLowerCase() === cleanEmail && o.shippingAddress)
                if (userOrder && userOrder.shippingAddress) {
                    const sa = userOrder.shippingAddress
                    loadedAddrs.push({
                        id: 'addr-order-1',
                        label: 'Entrega Recente',
                        cep: sa.cep || '',
                        street: sa.street || '',
                        number: sa.number || '',
                        complement: sa.complement || '',
                        neighborhood: sa.neighborhood || '',
                        city: sa.city || '',
                        state: sa.state || ''
                    })
                }
            }

            // Keep local storage in sync
            if (loadedAddrs.length > 0) {
                localStorage.setItem(`meraki_user_addresses_${cleanEmail}`, JSON.stringify(loadedAddrs))
            }
            setAddresses(loadedAddrs)
        })

        // Load initial cached orders from local storage
        const allOrders = JSON.parse(localStorage.getItem('meraki_orders') || '[]')
        const userOrders = allOrders.filter(o => o.customerEmail?.trim().toLowerCase() === cleanEmail)
        setOrders(userOrders)

        // Fetch live orders directly from Supabase Database
        supabase
            .from('orders')
            .select('*')
            .ilike('customeremail', cleanEmail)
            .order('created_at', { ascending: false })
            .then(({ data, error }) => {
                if (!error && data && data.length > 0) {
                    const mapped = data.map(o => mapDbToFrontend('orders', o))
                    setOrders(mapped)

                    const currentLocal = JSON.parse(localStorage.getItem('meraki_orders') || '[]')
                    const otherOrders = currentLocal.filter(o => o.customerEmail?.trim().toLowerCase() !== cleanEmail)
                    const mergedAll = [...mapped, ...otherOrders]
                    localStorage.setItem('meraki_orders', JSON.stringify(mergedAll))
                }
            })
            .catch(console.error)
    }, [user, profile, navigate])

    const handleSignOutClick = async () => {
        await signOut()
        navigate('/')
    }

    const handleUpdateProfile = async (e) => {
        e.preventDefault()
        if (!user) return
        try {
            const { profile: updated } = await updateUserProfile(user.id, {
                full_name: fullName,
                phone: phone,
                cpf: cpf
            })
            if (updated) {
                setUserProfile(updated)
                alert('Cadastro atualizado com sucesso!')
            }
        } catch (err) {
            console.error(err)
            alert('Erro ao atualizar cadastro: ' + err.message)
        }
    }

    const handleCepChange = async (e) => {
        const val = e.target.value.replace(/\D/g, '')
        setCep(val.slice(0, 8))
        if (val.length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${val}/json/`)
                const data = await response.json()
                if (!data.erro) {
                    setStreet(data.logradouro || '')
                    setNeighborhood(data.bairro || '')
                    setCity(data.localidade || '')
                    setUf(data.uf || '')
                }
            } catch (err) {
                console.error(err)
            }
        }
    }

    const handleAddAddress = async (e) => {
        e.preventDefault()
        if (!cep || !street || !number || !user?.email) return

        const cleanEmail = user.email.trim().toLowerCase()
        const newAddr = {
            id: 'addr-' + Date.now(),
            label: addressLabel || 'Casa',
            cep,
            street,
            number,
            complement,
            neighborhood,
            city,
            state: uf
        }
        const updatedAddresses = [...addresses, newAddr]
        
        // 1. Update UI component state immediately
        setAddresses(updatedAddresses)
        setShowAddressForm(false)

        // 2. Save PERMANENTLY in localStorage and sessionStorage
        localStorage.setItem(`meraki_user_addresses_${cleanEmail}`, JSON.stringify(updatedAddresses))
        sessionStorage.setItem(`meraki_user_addresses_${cleanEmail}`, JSON.stringify(updatedAddresses))

        // 3. Save directly to Supabase Database profile linked to User ID via UPSERT!
        try {
            const { profile: updated } = await updateUserProfile(user.id, {
                email: cleanEmail,
                addresses: updatedAddresses,
                address: street,
                cep,
                number,
                complement,
                neighborhood,
                city,
                state: uf
            })
            if (updated) setUserProfile(updated)
        } catch (err) {
            console.error('Erro ao sincronizar endereço no banco de dados:', err)
        }

        // Reset form
        setCep('')
        setStreet('')
        setNumber('')
        setComplement('')
        setNeighborhood('')
        setCity('')
        setUf('')
        setAddressLabel('Casa')
    }

    const handleDeleteAddress = async (id) => {
        if (!user?.email) return
        const cleanEmail = user.email.trim().toLowerCase()
        const updatedAddresses = addresses.filter(a => a.id !== id)
        localStorage.setItem(`meraki_user_addresses_${cleanEmail}`, JSON.stringify(updatedAddresses))
        sessionStorage.setItem(`meraki_user_addresses_${cleanEmail}`, JSON.stringify(updatedAddresses))
        setAddresses(updatedAddresses)

        if (user?.id) {
            try {
                const { profile: updated } = await updateUserProfile(user.id, {
                    addresses: updatedAddresses
                })
                if (updated) setUserProfile(updated)
            } catch (err) {
                console.error(err)
            }
        }
    }

    if (!user) return null

    return (
        <div className="bg-[#FCFAFA] min-h-screen flex flex-col font-sans">
            <Header />
            
            <main className="max-w-7xl mx-auto px-4 py-10 w-full flex-grow">
                {/* Header Profile Info */}
                <div className="bg-white rounded-2xl border border-[#EEEEEE] p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7A3E4A]/10 to-[#C6A76A]/10 flex items-center justify-center text-xl font-black text-[#7A3E4A]">
                            {fullName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{fullName || 'Cliente Meraki'}</h1>
                            <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleSignOutClick}
                        className="px-4 py-2 border border-red-200 hover:bg-red-50 text-red-500 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                        Sair da Conta
                    </button>
                </div>

                {/* Tabs */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Menu Sidebar */}
                    <div className="bg-white rounded-2xl border border-[#EEEEEE] p-4 h-fit space-y-1">
                        {[
                            { id: 'orders', label: 'Meus Pedidos', desc: 'Histórico e rastreamento' },
                            { id: 'addresses', label: 'Endereços de Entrega', desc: 'Endereços salvos' },
                            { id: 'account', label: 'Dados da Conta', desc: 'Editar informações básicas' }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className={`w-full text-left p-3.5 rounded-xl transition-all cursor-pointer flex flex-col ${
                                    activeTab === t.id
                                        ? 'bg-[#7A3E4A] text-white shadow-md shadow-[#7A3E4A]/10'
                                        : 'hover:bg-gray-50 text-gray-700'
                                }`}
                            >
                                <span className="text-xs font-bold uppercase tracking-wider">{t.label}</span>
                                <span className={`text-[10px] ${activeTab === t.id ? 'text-white/70' : 'text-gray-400'} font-medium`}>{t.desc}</span>
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-3">
                        {/* Tab 1: Orders */}
                        {activeTab === 'orders' && (
                            <div className="space-y-4">
                                <h2 className="text-base font-bold text-gray-900 mb-2">Meus Pedidos</h2>
                                {orders.length === 0 ? (
                                    <div className="bg-white rounded-2xl border border-[#EEEEEE] py-16 text-center">
                                        <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                        </svg>
                                        <p className="text-sm font-bold text-gray-600 mb-1">Nenhum pedido feito ainda</p>
                                        <p className="text-xs text-gray-400 mb-4">Suas compras aparecerão aqui assim que finalizar seu primeiro checkout.</p>
                                        <Link to="/" className="inline-block px-5 py-2.5 bg-[#7A3E4A] text-white text-xs font-bold rounded-xl hover:bg-[#63303a]">
                                            Ver Produtos
                                        </Link>
                                    </div>
                                ) : (
                                    orders.map(order => (
                                        <div key={order.id} className="bg-white rounded-2xl border border-[#EEEEEE] overflow-hidden">
                                            {/* Order Header */}
                                            <div className="px-5 py-4 bg-[#FAF9F5] border-b border-[#EEEEEE] flex flex-wrap justify-between items-center gap-3">
                                                <div className="flex items-center gap-3.5">
                                                    <span className="font-mono text-xs font-black text-[#7A3E4A]">#{order.id}</span>
                                                    <span className="text-[10px] text-gray-400 font-semibold">{new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-bold text-gray-800">
                                                        Total: {order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </span>
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                                        order.status === 'Pago' || order.status === 'Enviado' || order.status === 'Entregue'
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : 'bg-amber-50 text-amber-700'
                                                    }`}>
                                                        {order.status}
                                                    </span>
                                                    <Link
                                                        to={`/order-success/${order.id}`}
                                                        className="px-3 py-1.5 bg-[#7A3E4A] hover:bg-[#63303a] text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        Acompanhar
                                                    </Link>
                                                </div>
                                            </div>

                                            {/* Order Items */}
                                            <div className="p-5 divide-y divide-[#F8F8F8]">
                                                {order.items?.map((item, idx) => (
                                                    <div key={idx} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                                                        <div className="w-12 h-16 bg-gray-50 border border-[#EEEEEE] rounded-xl overflow-hidden shrink-0">
                                                            <img src={getAssetUrl(Array.isArray(item.image) ? item.image[0] : item.image || '/placeholder.jpg')} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-xs font-bold text-gray-900 truncate">{item.name}</h4>
                                                            <p className="text-[10px] text-gray-400 font-semibold">Tamanho: {item.size} • Qtd: {item.quantity}</p>
                                                            <p className="text-xs font-black text-[#7A3E4A] mt-0.5">{item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Shipping detail info */}
                                            {order.shippingAddress && (
                                                <div className="px-5 py-3 border-t border-[#F8F8F8] bg-[#FCFAFA] flex items-center justify-between text-[10px] text-gray-500 font-medium">
                                                    <span>
                                                        Envio: {order.shippingAddress.street}, {order.shippingAddress.number} - {order.shippingAddress.city}/{order.shippingAddress.state}
                                                    </span>
                                                    {order.postageCode && (
                                                        <span className="font-mono bg-white border border-[#EEEEEE] px-2 py-0.5 rounded text-gray-700">
                                                            Rastreamento: {order.postageCode}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Tab 2: Addresses */}
                        {activeTab === 'addresses' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-base font-bold text-gray-900">Endereços de Entrega</h2>
                                    <button 
                                        onClick={() => setShowAddressForm(!showAddressForm)}
                                        className="px-4 py-2 bg-[#7A3E4A] text-white text-xs font-bold rounded-xl cursor-pointer"
                                    >
                                        {showAddressForm ? 'Cancelar' : 'Novo Endereço'}
                                    </button>
                                </div>

                                {/* Add Address Form */}
                                {showAddressForm && (
                                    <div className="bg-white rounded-2xl border border-[#EEEEEE] p-5 mb-4">
                                        <form onSubmit={handleAddAddress} className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Identificador (Ex: Casa, Trabalho)</label>
                                                    <input type="text" value={addressLabel} onChange={e => setAddressLabel(e.target.value)} required className="w-full px-3 py-2.5 border border-[#EEEEEE] rounded-xl text-xs outline-none focus:border-[#7A3E4A]" />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">CEP</label>
                                                    <input type="text" value={cep} onChange={handleCepChange} placeholder="Digitar 8 números" required className="w-full px-3 py-2.5 border border-[#EEEEEE] rounded-xl text-xs outline-none focus:border-[#7A3E4A]" />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="col-span-2">
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Rua / Logradouro</label>
                                                    <input type="text" value={street} onChange={e => setStreet(e.target.value)} required className="w-full px-3 py-2.5 border border-[#EEEEEE] rounded-xl text-xs outline-none focus:border-[#7A3E4A]" />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Número</label>
                                                    <input type="text" value={number} onChange={e => setNumber(e.target.value)} required className="w-full px-3 py-2.5 border border-[#EEEEEE] rounded-xl text-xs outline-none focus:border-[#7A3E4A]" />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Complemento</label>
                                                    <input type="text" value={complement} onChange={e => setComplement(e.target.value)} className="w-full px-3 py-2.5 border border-[#EEEEEE] rounded-xl text-xs outline-none focus:border-[#7A3E4A]" />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Bairro</label>
                                                    <input type="text" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} required className="w-full px-3 py-2.5 border border-[#EEEEEE] rounded-xl text-xs outline-none focus:border-[#7A3E4A]" />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Cidade / UF</label>
                                                    <div className="flex gap-2">
                                                        <input type="text" value={city} onChange={e => setCity(e.target.value)} required className="w-full px-3 py-2.5 border border-[#EEEEEE] rounded-xl text-xs outline-none focus:border-[#7A3E4A]" />
                                                        <input type="text" value={uf} onChange={e => setUf(e.target.value)} placeholder="UF" maxLength="2" required className="w-14 text-center py-2.5 border border-[#EEEEEE] rounded-xl text-xs outline-none focus:border-[#7A3E4A]" />
                                                    </div>
                                                </div>
                                            </div>

                                            <button type="submit" className="px-5 py-3 bg-[#7A3E4A] hover:bg-[#603039] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer">
                                                Salvar Endereço
                                            </button>
                                        </form>
                                    </div>
                                )}

                                {/* Address Cards */}
                                {addresses.length === 0 ? (
                                    <div className="bg-white rounded-2xl border border-[#EEEEEE] py-12 text-center text-xs text-gray-400">
                                        Nenhum endereço cadastrado.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {addresses.map(a => (
                                            <div key={a.id} className="bg-white rounded-2xl border border-[#EEEEEE] p-5 flex flex-col justify-between hover:shadow-md transition-all">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="w-2 h-2 rounded-full bg-[#C6A76A]" />
                                                        <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">{a.label}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-600 font-medium">{a.street}, {a.number} {a.complement && `(${a.complement})`}</p>
                                                    <p className="text-xs text-gray-400">{a.neighborhood} • {a.city} - {a.state}</p>
                                                    <p className="text-[10px] text-gray-400 font-mono mt-1">CEP: {a.cep}</p>
                                                </div>
                                                <button 
                                                    onClick={() => handleDeleteAddress(a.id)}
                                                    className="mt-4 pt-3 border-t border-gray-50 text-[10px] font-bold text-red-500 uppercase tracking-wider cursor-pointer hover:text-red-700 transition-colors self-start"
                                                >
                                                    Remover
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tab 3: Account Info */}
                        {activeTab === 'account' && (
                            <div className="space-y-4">
                                <h2 className="text-base font-bold text-gray-900">Dados da Conta</h2>
                                <div className="bg-white rounded-2xl border border-[#EEEEEE] p-5">
                                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Nome Completo</label>
                                            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required className="w-full px-4 py-3 bg-[#FAF9F5] border border-[#EEEEEE] rounded-xl text-sm outline-none focus:border-[#7A3E4A]" />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Telefone</label>
                                                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(00) 00000-0000" className="w-full px-4 py-3 bg-[#FAF9F5] border border-[#EEEEEE] rounded-xl text-sm outline-none focus:border-[#7A3E4A]" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">CPF</label>
                                                <input type="text" value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" className="w-full px-4 py-3 bg-[#FAF9F5] border border-[#EEEEEE] rounded-xl text-sm outline-none focus:border-[#7A3E4A]" />
                                            </div>
                                        </div>

                                        <button type="submit" className="px-5 py-3 bg-[#7A3E4A] hover:bg-[#603039] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer">
                                            Salvar Dados
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
            <WhatsAppButton />
        </div>
    )
}
