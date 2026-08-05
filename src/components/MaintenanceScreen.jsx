import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase.js'

/* ─── Butterfly positions (same pattern as Footer & Header) ──────────────── */
const BG_BUTTERFLIES = [
    { id: 1,  size: 56,  left: '4%',   top: '12%',  op: 0.07, dur: 6.2, delay: 0 },
    { id: 2,  size: 44,  right: '6%',  top: '8%',   op: 0.05, dur: 7.1, delay: -2 },
    { id: 3,  size: 72,  left: '1%',   top: '50%',  op: 0.06, dur: 5.8, delay: -1 },
    { id: 4,  size: 40,  right: '3%',  top: '45%',  op: 0.05, dur: 8.0, delay: -3 },
    { id: 5,  size: 60,  left: '48%',  top: '5%',   op: 0.04, dur: 6.7, delay: -1.5 },
    { id: 6,  size: 36,  left: '20%',  top: '80%',  op: 0.06, dur: 7.5, delay: -0.5 },
    { id: 7,  size: 52,  right: '18%', top: '75%',  op: 0.05, dur: 6.0, delay: -2.5 },
    { id: 8,  size: 48,  left: '70%',  top: '30%',  op: 0.04, dur: 8.3, delay: -1.8 },
]

export default function MaintenanceScreen({ config }) {
    const [phone, setPhone]         = useState('')
    const [submitted, setSubmitted] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [butterflySrc, setButterflySrc] = useState('')
    const [visible, setVisible]     = useState(false)

    const title   = config?.maintenance_title   || config?.maintenanceTitle   || 'Nova Coleção a Caminho'
    const message = config?.maintenance_message || config?.maintenanceMessage || 'Estamos preparando peças especialmente selecionadas para você. Um momento especial está chegando.'
    const eta     = config?.maintenance_eta     || config?.maintenanceEta     || ''

    /* ── Remove white BG from butterfly (same technique as Header/Footer) ── */
    useEffect(() => {
        const img = new Image()
        img.src = '/assets/borboleta-v2.png'
        img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width  = img.width
            canvas.height = img.height
            const ctx = canvas.getContext('2d')
            if (!ctx) return
            ctx.drawImage(img, 0, 0)
            try {
                const d = ctx.getImageData(0, 0, canvas.width, canvas.height)
                for (let i = 0; i < d.data.length; i += 4) {
                    if (d.data[i] > 185 && d.data[i+1] > 185 && d.data[i+2] > 185)
                        d.data[i+3] = 0
                }
                ctx.putImageData(d, 0, 0)
                setButterflySrc(canvas.toDataURL())
            } catch { setButterflySrc('/assets/borboleta-v2.png') }
        }
        img.onerror = () => setButterflySrc('/assets/borboleta-v2.png')
        // Fade-in entrance after a brief delay
        const t = setTimeout(() => setVisible(true), 60)
        return () => clearTimeout(t)
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
        finally  { setSubmitting(false) }
    }

    const hasBfly = butterflySrc.length > 0

    return (
        <>
            <style>{`
                /* ── Entrance animations ── */
                @keyframes mnt-fade-up {
                    from { opacity: 0; transform: translateY(22px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes mnt-fade-in {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                /* ── Butterfly gentle float (same as animate-butterfly-flight in global) ── */
                @keyframes mnt-flutter {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    25%      { transform: translateY(-6px) rotate(2deg); }
                    75%      { transform: translateY(4px) rotate(-2deg); }
                }
                /* ── BG butterflies slow drift ── */
                @keyframes mnt-drift {
                    0%, 100% { transform: translate(0, 0) rotate(0deg); }
                    33%      { transform: translate(4px, -8px) rotate(3deg); }
                    66%      { transform: translate(-3px, 5px) rotate(-2deg); }
                }
                /* ── Divider ornament ── */
                @keyframes mnt-shimmer {
                    0%   { opacity: 0.3; }
                    50%  { opacity: 0.7; }
                    100% { opacity: 0.3; }
                }
                /* ── Pulsing dot ── */
                @keyframes mnt-pulse-dot {
                    0%, 100% { transform: scale(1);   opacity: 1; }
                    50%      { transform: scale(1.4); opacity: 0.5; }
                }

                .mnt-root {
                    opacity: 0;
                    transition: opacity 0.6s ease;
                }
                .mnt-root.mnt-visible {
                    opacity: 1;
                }

                .mnt-a1 { animation: mnt-fade-up 0.8s cubic-bezier(0.22,1,0.36,1) 0.1s both; }
                .mnt-a2 { animation: mnt-fade-up 0.8s cubic-bezier(0.22,1,0.36,1) 0.25s both; }
                .mnt-a3 { animation: mnt-fade-up 0.8s cubic-bezier(0.22,1,0.36,1) 0.40s both; }
                .mnt-a4 { animation: mnt-fade-up 0.8s cubic-bezier(0.22,1,0.36,1) 0.55s both; }
                .mnt-a5 { animation: mnt-fade-in 1.0s ease 0.8s both; }

                .mnt-butterfly-hero {
                    animation: mnt-flutter 5s ease-in-out infinite;
                }
                .mnt-butterfly-bg {
                    animation: mnt-drift var(--dur,7s) var(--delay,0s) ease-in-out infinite;
                    pointer-events: none;
                    user-select: none;
                    position: absolute;
                }

                .mnt-input {
                    width: 100%;
                    padding: 14px 16px;
                    border: 1.5px solid #E8DFD5;
                    border-radius: 12px;
                    font-size: 13px;
                    font-family: 'Manrope', sans-serif;
                    color: #1A1A1A;
                    background: #ffffff;
                    outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s;
                    box-sizing: border-box;
                }
                .mnt-input::placeholder { color: #B0A8A0; }
                .mnt-input:focus {
                    border-color: #7A3E4A;
                    box-shadow: 0 0 0 3px rgba(122,62,74,0.08);
                }

                .mnt-btn {
                    width: 100%;
                    padding: 15px 24px;
                    background: #7A3E4A;
                    color: #ffffff;
                    border: none;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 800;
                    font-family: 'Manrope', sans-serif;
                    letter-spacing: 0.18em;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: background 0.25s, transform 0.2s, box-shadow 0.2s;
                    box-shadow: 0 4px 20px rgba(122,62,74,0.22);
                }
                .mnt-btn:hover:not(:disabled) {
                    background: #5A2E34;
                    transform: translateY(-1px);
                    box-shadow: 0 8px 28px rgba(122,62,74,0.3);
                }
                .mnt-btn:active:not(:disabled) {
                    transform: translateY(0);
                }
                .mnt-btn:disabled { opacity: 0.6; cursor: wait; }

                .mnt-success-check {
                    width: 52px; height: 52px; border-radius: 50%;
                    background: rgba(122,62,74,0.08);
                    border: 1.5px solid rgba(122,62,74,0.2);
                    display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 14px;
                    color: #7A3E4A; font-size: 22px;
                    animation: mnt-fade-in 0.5s ease both;
                }

                .mnt-ornament {
                    animation: mnt-shimmer 3s ease-in-out infinite;
                }

                .mnt-dot {
                    width: 6px; height: 6px; border-radius: 50%;
                    background: #7A3E4A;
                    display: inline-block;
                    animation: mnt-pulse-dot 2s ease-in-out infinite;
                }

                /* Border top accent */
                .mnt-card {
                    background: #ffffff;
                    border: 1px solid #EDE5DD;
                    border-radius: 20px;
                    padding: 32px;
                    box-shadow: 0 4px 32px rgba(122,62,74,0.06), 0 1px 4px rgba(0,0,0,0.04);
                }

                /* Fine horizontal line */
                .mnt-hr {
                    height: 1px;
                    background: linear-gradient(90deg, transparent 0%, #C6A76A 50%, transparent 100%);
                    border: none;
                    margin: 0;
                    opacity: 0.35;
                }

                @media (max-width: 600px) {
                    .mnt-card { padding: 24px 20px; }
                }
            `}</style>

            <div
                className={`mnt-root${visible ? ' mnt-visible' : ''}`}
                style={{
                    minHeight: '100vh',
                    background: '#FCFAFA',
                    fontFamily: "'Manrope', sans-serif",
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* ── Very subtle background texture ─────────────────────── */}
                <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(198,167,106,0.06) 0%, transparent 70%)',
                }} />
                <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: 'radial-gradient(ellipse 50% 40% at 100% 100%, rgba(122,62,74,0.04) 0%, transparent 70%)',
                }} />

                {/* ── Background butterflies ─────────────────────────────── */}
                {hasBfly && BG_BUTTERFLIES.map(b => (
                    <img
                        key={b.id}
                        src={butterflySrc}
                        alt=""
                        aria-hidden="true"
                        className="mnt-butterfly-bg"
                        style={{
                            width: b.size, height: b.size,
                            objectFit: 'contain',
                            opacity: b.op,
                            '--dur': `${b.dur}s`,
                            '--delay': `${b.delay}s`,
                            ...(b.left  ? { left:  b.left  } : { right: b.right }),
                            ...(b.top   ? { top:   b.top   } : {}),
                        }}
                    />
                ))}

                {/* ── HEADER ─────────────────────────────────────────────── */}
                <header className="mnt-a1" style={{
                    padding: '36px 24px 0',
                    textAlign: 'center',
                    position: 'relative',
                    zIndex: 10,
                }}>
                    {/* Same logo as Header.jsx */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14 }}>
                        {hasBfly && (
                            <img
                                src={butterflySrc}
                                alt="Borboleta Meraki"
                                className="mnt-butterfly-hero"
                                style={{ width: 52, height: 52, objectFit: 'contain' }}
                            />
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
                            <span style={{
                                fontFamily: "'Cormorant Garamond', serif",
                                fontWeight: 900,
                                fontSize: 'clamp(22px, 5vw, 32px)',
                                letterSpacing: '0.25em',
                                textTransform: 'uppercase',
                                color: '#1A1A1A',
                                WebkitFontSmoothing: 'antialiased',
                            }}>
                                MERAKI
                            </span>
                            <span style={{
                                fontFamily: "'Manrope', sans-serif",
                                fontWeight: 800,
                                fontSize: 'clamp(8px, 1.5vw, 10px)',
                                letterSpacing: '0.48em',
                                textTransform: 'uppercase',
                                color: '#7A3E4A',
                                marginTop: 5,
                                marginLeft: '0.48em',
                            }}>
                                ---- FEMME ----
                            </span>
                        </div>
                    </div>

                    {/* Thin gold rule under logo */}
                    <div style={{ maxWidth: 80, margin: '24px auto 0' }}>
                        <div className="mnt-hr" />
                    </div>
                </header>

                {/* ── MAIN ───────────────────────────────────────────────── */}
                <main style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '48px 20px',
                    position: 'relative',
                    zIndex: 10,
                }}>
                    <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>

                        {/* Status chip */}
                        <div className="mnt-a2" style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            padding: '6px 16px',
                            borderRadius: 999,
                            border: '1px solid rgba(122,62,74,0.18)',
                            background: 'rgba(122,62,74,0.04)',
                            marginBottom: 28,
                        }}>
                            <span className="mnt-dot" />
                            <span style={{
                                fontFamily: "'Manrope', sans-serif",
                                fontWeight: 800,
                                fontSize: 9,
                                letterSpacing: '0.22em',
                                textTransform: 'uppercase',
                                color: '#7A3E4A',
                            }}>
                                {eta ? `Voltamos ${eta}` : 'Em breve'}
                            </span>
                        </div>

                        {/* Title */}
                        <h1 className="mnt-a2" style={{
                            fontFamily: "'Cormorant Garamond', serif",
                            fontWeight: 700,
                            fontSize: 'clamp(36px, 8vw, 60px)',
                            lineHeight: 1.08,
                            color: '#1A1A1A',
                            letterSpacing: '-0.01em',
                            marginBottom: 0,
                        }}>
                            {title}
                        </h1>

                        {/* Ornamental divider */}
                        <div className="mnt-a3" style={{
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'center', gap: 12,
                            margin: '22px auto 22px',
                        }}>
                            <div className="mnt-hr mnt-ornament" style={{ width: 48 }} />
                            {hasBfly && (
                                <img
                                    src={butterflySrc}
                                    alt=""
                                    aria-hidden="true"
                                    style={{ width: 20, height: 20, objectFit: 'contain', opacity: 0.4 }}
                                />
                            )}
                            <div className="mnt-hr mnt-ornament" style={{ width: 48, opacity: 0.35 }} />
                        </div>

                        {/* Message */}
                        <p className="mnt-a3" style={{
                            fontFamily: "'Manrope', sans-serif",
                            fontSize: 14,
                            fontWeight: 500,
                            lineHeight: 1.8,
                            color: '#888080',
                            marginBottom: 40,
                            maxWidth: 400,
                            marginLeft: 'auto',
                            marginRight: 'auto',
                        }}>
                            {message}
                        </p>

                        {/* Lead Capture Card */}
                        <div className="mnt-a4 mnt-card" style={{ textAlign: 'left' }}>
                            {/* Card top accent bar */}
                            <div style={{
                                height: 3,
                                background: 'linear-gradient(90deg, #7A3E4A, #C6A76A)',
                                borderRadius: '4px 4px 0 0',
                                margin: '-32px -32px 24px',
                                opacity: 0.85,
                            }} />

                            {!submitted ? (
                                <>
                                    <p style={{
                                        fontFamily: "'Manrope', sans-serif",
                                        fontWeight: 800,
                                        fontSize: 10,
                                        letterSpacing: '0.2em',
                                        textTransform: 'uppercase',
                                        color: '#7A3E4A',
                                        marginBottom: 6,
                                    }}>
                                        Acesso Antecipado
                                    </p>
                                    <p style={{
                                        fontFamily: "'Cormorant Garamond', serif",
                                        fontWeight: 500,
                                        fontStyle: 'italic',
                                        fontSize: 18,
                                        color: '#1A1A1A',
                                        marginBottom: 6,
                                        lineHeight: 1.4,
                                    }}>
                                        Seja a primeira a saber.
                                    </p>
                                    <p style={{
                                        fontFamily: "'Manrope', sans-serif",
                                        fontSize: 13,
                                        fontWeight: 500,
                                        color: '#9A9090',
                                        marginBottom: 20,
                                        lineHeight: 1.65,
                                    }}>
                                        Deixe seu WhatsApp e garanta acesso exclusivo assim que o site voltar, com um cupom especial para a nova coleção.
                                    </p>

                                    <form onSubmit={handleSubscribe} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <input
                                            type="tel"
                                            required
                                            value={phone}
                                            onChange={e => setPhone(e.target.value)}
                                            placeholder="(11) 99999-9999"
                                            className="mnt-input"
                                        />
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="mnt-btn"
                                        >
                                            {submitting ? 'Enviando...' : 'Quero Acesso Antecipado'}
                                        </button>
                                    </form>

                                    <p style={{
                                        fontFamily: "'Manrope', sans-serif",
                                        fontSize: 10,
                                        color: '#B0A8A0',
                                        textAlign: 'center',
                                        marginTop: 14,
                                        lineHeight: 1.5,
                                    }}>
                                        Seus dados são protegidos. Sem spam.
                                    </p>
                                </>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                                    <div className="mnt-success-check">✓</div>
                                    <p style={{
                                        fontFamily: "'Cormorant Garamond', serif",
                                        fontWeight: 600,
                                        fontSize: 22,
                                        color: '#1A1A1A',
                                        marginBottom: 8,
                                    }}>
                                        Você está na lista!
                                    </p>
                                    <p style={{
                                        fontFamily: "'Manrope', sans-serif",
                                        fontSize: 13,
                                        color: '#9A9090',
                                        lineHeight: 1.65,
                                    }}>
                                        Assim que a nova coleção for ao ar, você receberá seu convite exclusivo pelo WhatsApp.
                                    </p>
                                </div>
                            )}
                        </div>

                    </div>
                </main>

                {/* ── FOOTER ─────────────────────────────────────────────── */}
                <footer className="mnt-a5" style={{
                    padding: '0 24px 32px',
                    textAlign: 'center',
                    position: 'relative',
                    zIndex: 10,
                }}>
                    <div style={{ maxWidth: 120, margin: '0 auto 20px' }}>
                        <div className="mnt-hr" />
                    </div>
                    <p style={{
                        fontFamily: "'Manrope', sans-serif",
                        fontSize: 10,
                        color: '#C0B8B0',
                        letterSpacing: '0.05em',
                        marginBottom: 8,
                    }}>
                        © {new Date().getFullYear()} Meraki Femme Lingerie — Todos os direitos reservados
                    </p>
                    <a
                        href="#/admin"
                        style={{
                            fontFamily: "'Manrope', sans-serif",
                            fontSize: 9,
                            color: '#D8D0C8',
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            textDecoration: 'none',
                            transition: 'color 0.2s',
                        }}
                        onMouseEnter={e => e.target.style.color = '#7A3E4A'}
                        onMouseLeave={e => e.target.style.color = '#D8D0C8'}
                    >
                        Acesso Restrito
                    </a>
                </footer>
            </div>
        </>
    )
}
