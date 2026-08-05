import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase.js'

const BUTTERFLIES = [
    { id: 1, size: 72, drift: 'drift-1', dur: 28, delay: 0,   left: '3%',  bottom: '0%',  op: 0.12 },
    { id: 2, size: 52, drift: 'drift-2', dur: 33, delay: -8,  right: '4%', bottom: '0%',  op: 0.09 },
    { id: 3, size: 88, drift: 'drift-3', dur: 26, delay: -15, left: '1%',  top: '15%',    op: 0.14 },
    { id: 4, size: 60, drift: 'drift-1', dur: 36, delay: -5,  left: '22%', bottom: '0%',  op: 0.10 },
    { id: 5, size: 76, drift: 'drift-2', dur: 24, delay: -20, right: '20%',bottom: '0%',  op: 0.08 },
    { id: 6, size: 64, drift: 'drift-4', dur: 30, delay: -3,  left: '12%', top: '5%',     op: 0.12 },
    { id: 7, size: 48, drift: 'drift-3', dur: 38, delay: -11, right: '10%',top: '25%',    op: 0.09 },
    { id: 8, size: 84, drift: 'drift-4', dur: 31, delay: -23, left: '42%', top: '0%',     op: 0.13 },
    { id: 9, size: 56, drift: 'drift-1', dur: 25, delay: -13, left: '8%',  bottom: '0%',  op: 0.10 },
    { id: 10,size: 68, drift: 'drift-2', dur: 29, delay: -6,  right: '13%',bottom: '0%',  op: 0.11 },
]

export default function MaintenanceScreen({ config }) {
    const [phone, setPhone] = useState('')
    const [submitted, setSubmitted] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [butterflySrc, setButterflySrc] = useState('/assets/borboleta-v2.png')
    const [dots, setDots] = useState(0)

    const title = config?.maintenance_title || config?.maintenanceTitle || 'Nova Coleção a Caminho'
    const message = config?.maintenance_message || config?.maintenanceMessage || 'Estamos preparando peças especialmente selecionadas para você. Um momento de transformação está chegando.'
    const eta = config?.maintenance_eta || config?.maintenanceEta || ''

    // Remove background from butterfly image (same technique as AuthPage/SplashLoader)
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
                        const r = data[i], g = data[i+1], b = data[i+2]
                        if (r > 185 && g > 185 && b > 185) data[i+3] = 0
                    }
                    ctx.putImageData(imgData, 0, 0)
                    setButterflySrc(canvas.toDataURL())
                } catch {}
            }
        }
    }, [])

    // Animated loading dots
    useEffect(() => {
        const t = setInterval(() => setDots(d => (d + 1) % 4), 500)
        return () => clearInterval(t)
    }, [])

    const handleSubscribe = async (e) => {
        e.preventDefault()
        if (!phone.trim()) return
        setSubmitting(true)
        try {
            await supabase.from('marketing_leads').insert([
                { phone, source: 'maintenance_page', created_at: new Date().toISOString() }
            ]).catch(() => {})
            const saved = JSON.parse(localStorage.getItem('meraki_maintenance_leads') || '[]')
            saved.push({ phone, date: new Date().toISOString() })
            localStorage.setItem('meraki_maintenance_leads', JSON.stringify(saved))
            setSubmitted(true)
        } catch { setSubmitted(true) }
        finally { setSubmitting(false) }
    }

    const loadingStr = '.'.repeat(dots)

    return (
        <>
            <style>{`
                @keyframes drift-1 {
                    0%   { transform: translateY(0)  translateX(0)   rotate(0deg)   scaleX(1); }
                    25%  { transform: translateY(-30vh) translateX(12vw) rotate(12deg)  scaleX(-1); }
                    50%  { transform: translateY(-60vh) translateX(0)   rotate(-8deg)  scaleX(1); }
                    75%  { transform: translateY(-85vh) translateX(-8vw) rotate(15deg)  scaleX(-1); }
                    100% { transform: translateY(-110vh) translateX(4vw) rotate(5deg) scaleX(1); }
                }
                @keyframes drift-2 {
                    0%   { transform: translateY(0) translateX(0) rotate(0deg) scaleX(1); }
                    30%  { transform: translateY(-40vh) translateX(-15vw) rotate(-15deg) scaleX(-1); }
                    60%  { transform: translateY(-70vh) translateX(8vw) rotate(10deg) scaleX(1); }
                    100% { transform: translateY(-115vh) translateX(-5vw) rotate(-8deg) scaleX(-1); }
                }
                @keyframes drift-3 {
                    0%   { transform: translateY(0) translateX(0) rotate(0deg) scaleX(-1); }
                    20%  { transform: translateY(-25vh) translateX(18vw) rotate(20deg) scaleX(1); }
                    50%  { transform: translateY(-55vh) translateX(5vw) rotate(-12deg) scaleX(-1); }
                    80%  { transform: translateY(-90vh) translateX(20vw) rotate(18deg) scaleX(1); }
                    100% { transform: translateY(-120vh) translateX(10vw) rotate(-5deg) scaleX(-1); }
                }
                @keyframes drift-4 {
                    0%   { transform: translateY(0) translateX(0) rotate(0deg) scaleX(1); }
                    35%  { transform: translateY(-45vh) translateX(-10vw) rotate(-18deg) scaleX(-1); }
                    65%  { transform: translateY(-75vh) translateX(15vw) rotate(12deg) scaleX(1); }
                    100% { transform: translateY(-110vh) translateX(-8vw) rotate(-10deg) scaleX(-1); }
                }
                @keyframes flutter {
                    0%, 100% { scaleY(1); }
                    50% { scaleY(0.7); }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(28px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes shimmer {
                    0%   { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                @keyframes pulse-ring {
                    0%   { transform: scale(0.9); opacity: 0.6; }
                    50%  { transform: scale(1.05); opacity: 0.3; }
                    100% { transform: scale(0.9); opacity: 0.6; }
                }
                .anim-slideup { animation: slideUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) both; }
                .anim-slideup-1 { animation: slideUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both; }
                .anim-slideup-2 { animation: slideUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.30s both; }
                .anim-slideup-3 { animation: slideUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.45s both; }
                .anim-fadein { animation: fadeIn 1.2s ease 0.6s both; }
                .shimmer-text {
                    background: linear-gradient(90deg, #C6A76A 0%, #E8C98A 40%, #C6A76A 55%, #9A7A45 70%, #C6A76A 100%);
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    animation: shimmer 4s linear infinite;
                }
                .glass-card {
                    background: rgba(255,255,255,0.04);
                    backdrop-filter: blur(18px);
                    -webkit-backdrop-filter: blur(18px);
                    border: 1px solid rgba(255,255,255,0.09);
                }
                .mnt-input {
                    background: rgba(0,0,0,0.25);
                    border: 1px solid rgba(255,255,255,0.10);
                    color: white;
                    width: 100%;
                    padding: 14px 18px;
                    border-radius: 14px;
                    font-size: 13px;
                    outline: none;
                    transition: border-color 0.2s;
                    font-family: inherit;
                }
                .mnt-input::placeholder { color: rgba(255,255,255,0.3); }
                .mnt-input:focus { border-color: rgba(198,167,106,0.6); }
                .divider-line {
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(198,167,106,0.3), transparent);
                }
            `}</style>

            <div className="relative min-h-screen overflow-hidden flex flex-col" style={{
                background: 'linear-gradient(160deg, #100508 0%, #1E0C12 40%, #160A10 70%, #0E0407 100%)',
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif"
            }}>

                {/* ── Atmospheric glow blobs ─────────────────────────────── */}
                <div style={{
                    position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
                    width: '70vw', height: '50vh', borderRadius: '50%',
                    background: 'radial-gradient(ellipse, rgba(122,62,74,0.25) 0%, transparent 70%)',
                    filter: 'blur(60px)', pointerEvents: 'none'
                }} />
                <div style={{
                    position: 'absolute', bottom: '0', right: '-10%',
                    width: '45vw', height: '40vh', borderRadius: '50%',
                    background: 'radial-gradient(ellipse, rgba(198,167,106,0.08) 0%, transparent 70%)',
                    filter: 'blur(80px)', pointerEvents: 'none'
                }} />
                <div style={{
                    position: 'absolute', top: '40%', left: '-5%',
                    width: '30vw', height: '30vh', borderRadius: '50%',
                    background: 'radial-gradient(ellipse, rgba(122,62,74,0.12) 0%, transparent 70%)',
                    filter: 'blur(60px)', pointerEvents: 'none'
                }} />

                {/* ── Butterflies ────────────────────────────────────────── */}
                {butterflySrc.startsWith('data:') && BUTTERFLIES.map(b => (
                    <img
                        key={b.id}
                        src={butterflySrc}
                        alt=""
                        aria-hidden="true"
                        style={{
                            position: 'absolute',
                            width: b.size,
                            height: b.size,
                            objectFit: 'contain',
                            opacity: b.op,
                            ...(b.left ? { left: b.left } : { right: b.right }),
                            ...(b.bottom ? { bottom: b.bottom } : { top: b.top }),
                            animation: `${b.drift} ${b.dur}s ${b.delay}s linear infinite`,
                            pointerEvents: 'none',
                            userSelect: 'none',
                            filter: 'brightness(0.9) sepia(0.2)'
                        }}
                    />
                ))}

                {/* ── HEADER ────────────────────────────────────────────── */}
                <header style={{ padding: '32px 24px 0', textAlign: 'center', position: 'relative', zIndex: 10 }}>
                    <div className="anim-slideup" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <img
                            src="/assets/logo-meraki.png"
                            alt="Meraki Femme"
                            style={{
                                height: 52, width: 'auto', objectFit: 'contain',
                                filter: 'brightness(1.1) drop-shadow(0 8px 24px rgba(198,167,106,0.25))',
                            }}
                            onError={e => {
                                e.target.style.display = 'none'
                                document.getElementById('mnt-logo-fallback').style.display = 'block'
                            }}
                        />
                        <span id="mnt-logo-fallback" style={{
                            display: 'none',
                            letterSpacing: '0.35em', textTransform: 'uppercase',
                            fontSize: 22, fontWeight: 900, color: '#C6A76A'
                        }}>MERAKI FEMME</span>
                        <span style={{
                            letterSpacing: '0.28em', textTransform: 'uppercase',
                            fontSize: 9, color: 'rgba(198,167,106,0.55)', fontWeight: 600
                        }}>Lingerie — Alta Autoestima</span>
                    </div>
                </header>

                {/* ── MAIN ──────────────────────────────────────────────── */}
                <main style={{
                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', padding: '48px 24px', position: 'relative', zIndex: 10
                }}>
                    <div style={{ maxWidth: 540, width: '100%', margin: '0 auto', textAlign: 'center' }}>

                        {/* Status chip */}
                        <div className="anim-slideup" style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            padding: '7px 18px', borderRadius: 999, marginBottom: 32,
                            border: '1px solid rgba(198,167,106,0.25)',
                            background: 'rgba(198,167,106,0.05)'
                        }}>
                            <span style={{
                                width: 7, height: 7, borderRadius: '50%',
                                background: '#C6A76A', flexShrink: 0,
                                boxShadow: '0 0 8px rgba(198,167,106,0.8)',
                                animation: 'pulse-ring 2s ease-in-out infinite'
                            }} />
                            <span style={{
                                fontSize: 10, fontWeight: 700, letterSpacing: '0.2em',
                                textTransform: 'uppercase', color: 'rgba(198,167,106,0.8)'
                            }}>
                                {eta ? `Voltamos ${eta}` : 'Em breve'}
                            </span>
                        </div>

                        {/* Main heading */}
                        <h1 className="anim-slideup-1" style={{
                            fontSize: 'clamp(32px, 7vw, 56px)', fontWeight: 900, lineHeight: 1.1,
                            letterSpacing: '-0.02em', color: '#fff', marginBottom: 6,
                            fontFamily: "'Georgia', 'Times New Roman', serif"
                        }}>
                            {title}
                        </h1>

                        {/* Gold accent rule */}
                        <div className="anim-slideup-1" style={{ margin: '18px auto 24px', width: 60 }}>
                            <div className="divider-line" />
                            <div style={{ margin: '8px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                <div style={{ height: 1, width: 24, background: 'rgba(198,167,106,0.3)' }} />
                                <img
                                    src={butterflySrc.startsWith('data:') ? butterflySrc : '/assets/borboleta-v2.png'}
                                    alt=""
                                    style={{ width: 18, height: 18, objectFit: 'contain', opacity: 0.6, filter: 'sepia(0.3)' }}
                                />
                                <div style={{ height: 1, width: 24, background: 'rgba(198,167,106,0.3)' }} />
                            </div>
                            <div className="divider-line" />
                        </div>

                        {/* Subtitle message */}
                        <p className="anim-slideup-2" style={{
                            fontSize: 15, color: 'rgba(255,255,255,0.45)', fontWeight: 400,
                            lineHeight: 1.75, marginBottom: 40, letterSpacing: '0.01em'
                        }}>
                            {message}
                        </p>

                        {/* Loading string */}
                        <p className="anim-slideup-2" style={{
                            fontSize: 11, color: 'rgba(198,167,106,0.4)',
                            letterSpacing: '0.3em', textTransform: 'uppercase',
                            marginBottom: 40, minHeight: 18, fontWeight: 600
                        }}>
                            Carregando novidades{loadingStr}
                        </p>

                        {/* Lead capture card */}
                        <div className="anim-slideup-3 glass-card" style={{ borderRadius: 24, padding: '28px 28px 24px' }}>
                            {!submitted ? (
                                <>
                                    <p style={{
                                        fontSize: 11, fontWeight: 700, letterSpacing: '0.18em',
                                        textTransform: 'uppercase', color: 'rgba(198,167,106,0.7)',
                                        marginBottom: 6
                                    }}>
                                        Acesso Antecipado & Cupom Exclusivo
                                    </p>
                                    <p style={{
                                        fontSize: 13, color: 'rgba(255,255,255,0.35)',
                                        marginBottom: 18, lineHeight: 1.6
                                    }}>
                                        Deixe seu WhatsApp e seja a primeira a entrar quando a nova coleção for ao ar.
                                    </p>

                                    <form onSubmit={handleSubscribe} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <input
                                            type="tel"
                                            required
                                            value={phone}
                                            onChange={e => setPhone(e.target.value)}
                                            placeholder="(11) 99999-8888"
                                            className="mnt-input"
                                        />
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            style={{
                                                padding: '14px 24px',
                                                borderRadius: 14,
                                                border: 'none',
                                                cursor: submitting ? 'wait' : 'pointer',
                                                fontSize: 12, fontWeight: 800,
                                                letterSpacing: '0.18em', textTransform: 'uppercase',
                                                color: '#fff', opacity: submitting ? 0.6 : 1,
                                                background: 'linear-gradient(135deg, #7A3E4A 0%, #9A5060 50%, #7A3E4A 100%)',
                                                backgroundSize: '200% auto',
                                                transition: 'background-position 0.4s, opacity 0.2s, transform 0.2s, box-shadow 0.2s',
                                                boxShadow: '0 4px 24px rgba(122,62,74,0.35)',
                                                fontFamily: 'inherit'
                                            }}
                                            onMouseEnter={e => {
                                                e.target.style.backgroundPosition = 'right center'
                                                e.target.style.transform = 'translateY(-1px)'
                                                e.target.style.boxShadow = '0 8px 32px rgba(122,62,74,0.5)'
                                            }}
                                            onMouseLeave={e => {
                                                e.target.style.backgroundPosition = 'left center'
                                                e.target.style.transform = 'translateY(0)'
                                                e.target.style.boxShadow = '0 4px 24px rgba(122,62,74,0.35)'
                                            }}
                                        >
                                            {submitting ? 'Enviando...' : 'Quero Acesso Antecipado'}
                                        </button>
                                    </form>
                                </>
                            ) : (
                                <div style={{ padding: '12px 0', textAlign: 'center' }} className="anim-fadein">
                                    <div style={{
                                        width: 48, height: 48, borderRadius: '50%', margin: '0 auto 14px',
                                        background: 'rgba(198,167,106,0.12)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: '1px solid rgba(198,167,106,0.25)',
                                        fontSize: 20
                                    }}>✓</div>
                                    <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
                                        Você está na lista!
                                    </p>
                                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
                                        Assim que o site voltar, você receberá seu convite exclusivo no WhatsApp.
                                    </p>
                                </div>
                            )}
                        </div>

                    </div>
                </main>

                {/* ── FOOTER ────────────────────────────────────────────── */}
                <footer className="anim-fadein" style={{
                    padding: '20px 24px 28px', textAlign: 'center',
                    position: 'relative', zIndex: 10
                }}>
                    <div className="divider-line" style={{ maxWidth: 200, margin: '0 auto 20px' }} />
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.08em', marginBottom: 8 }}>
                        © {new Date().getFullYear()} Meraki Femme Lingerie — Todos os direitos reservados
                    </p>
                    <a
                        href="#/admin"
                        style={{
                            fontSize: 10, color: 'rgba(255,255,255,0.15)',
                            textDecoration: 'none', letterSpacing: '0.15em',
                            textTransform: 'uppercase', transition: 'color 0.2s'
                        }}
                        onMouseEnter={e => e.target.style.color = 'rgba(198,167,106,0.5)'}
                        onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.15)'}
                    >
                        Acesso Restrito
                    </a>
                </footer>
            </div>
        </>
    )
}
