import { useState, useEffect } from 'react'

/* ──────────────────────────────────────────────────────────────
   Exact same butterfly config as AuthPage.jsx backgroundButterflies
   Using butterfly-drift-1 … butterfly-drift-4 from global.css
────────────────────────────────────────────────────────────── */
const BUTTERFLIES = [
    { id: 1,  size: 64, drift: 'butterfly-drift-1', duration: 25, delay: 0,   left: '5%',  bottom: '0%', opacity: 0.14 },
    { id: 2,  size: 48, drift: 'butterfly-drift-2', duration: 30, delay: -7,  right: '5%', bottom: '0%', opacity: 0.11 },
    { id: 3,  size: 80, drift: 'butterfly-drift-3', duration: 28, delay: -14, left: '0%',  top: '20%',   opacity: 0.16 },
    { id: 4,  size: 56, drift: 'butterfly-drift-1', duration: 32, delay: -4,  left: '25%', bottom: '0%', opacity: 0.13 },
    { id: 5,  size: 72, drift: 'butterfly-drift-2', duration: 26, delay: -18, right: '25%',bottom: '0%', opacity: 0.10 },
    { id: 6,  size: 64, drift: 'butterfly-drift-4', duration: 24, delay: -3,  left: '15%', top: '0%',    opacity: 0.14 },
    { id: 7,  size: 48, drift: 'butterfly-drift-3', duration: 35, delay: -10, left: '0%',  top: '40%',   opacity: 0.11 },
    { id: 8,  size: 80, drift: 'butterfly-drift-4', duration: 29, delay: -22, left: '40%', top: '0%',    opacity: 0.16 },
    { id: 9,  size: 56, drift: 'butterfly-drift-1', duration: 22, delay: -12, left: '10%', bottom: '0%', opacity: 0.12 },
    { id: 10, size: 64, drift: 'butterfly-drift-2', duration: 28, delay: -5,  right: '15%',bottom: '0%', opacity: 0.13 },
    { id: 11, size: 48, drift: 'butterfly-drift-3', duration: 30, delay: -8,  left: '5%',  top: '30%',   opacity: 0.10 },
    { id: 12, size: 72, drift: 'butterfly-drift-4', duration: 26, delay: -15, left: '30%', top: '0%',    opacity: 0.14 },
    { id: 13, size: 64, drift: 'butterfly-drift-1', duration: 34, delay: -19, left: '20%', bottom: '0%', opacity: 0.12 },
    { id: 14, size: 56, drift: 'butterfly-drift-2', duration: 32, delay: -2,  right: '30%',bottom: '0%', opacity: 0.10 },
    { id: 15, size: 80, drift: 'butterfly-drift-3', duration: 25, delay: -11, left: '0%',  top: '50%',   opacity: 0.15 },
    { id: 16, size: 48, drift: 'butterfly-drift-4', duration: 27, delay: -17, left: '50%', top: '0%',    opacity: 0.11 },
]

/* ── Parse eta string into a target Date ────────────────────── */
function parseEta(eta) {
    if (!eta) return null
    // Try ISO date string first
    const d = new Date(eta)
    if (!isNaN(d.getTime())) return d
    // Try "DD/MM/YYYY HH:MM" format
    const match = eta.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/)
    if (match) {
        const [, dd, mm, yyyy, hh, min] = match
        return new Date(+yyyy, +mm - 1, +dd, +hh, +min)
    }
    // Try "HH:MM" as today's time
    const timeOnly = eta.match(/^(\d{1,2}):(\d{2})$/)
    if (timeOnly) {
        const now = new Date()
        const target = new Date(now)
        target.setHours(+timeOnly[1], +timeOnly[2], 0, 0)
        if (target <= now) target.setDate(target.getDate() + 1)
        return target
    }
    return null
}

function useCountdown(targetDate) {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0, expired: false })

    useEffect(() => {
        if (!targetDate) return
        const tick = () => {
            const diff = targetDate - Date.now()
            if (diff <= 0) {
                setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0, expired: true })
                return
            }
            const total = Math.floor(diff / 1000)
            setTimeLeft({
                days:    Math.floor(total / 86400),
                hours:   Math.floor((total % 86400) / 3600),
                mins:    Math.floor((total % 3600) / 60),
                secs:    total % 60,
                expired: false,
            })
        }
        tick()
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [targetDate])

    return timeLeft
}

function pad(n) { return String(n).padStart(2, '0') }

export default function MaintenanceScreen({ config }) {
    const [butterflySrc, setButterflySrc] = useState('')
    const [visible, setVisible]           = useState(false)

    const title   = config?.maintenance_title   || config?.maintenanceTitle   || 'Nova Coleção a Caminho'
    const message = config?.maintenance_message || config?.maintenanceMessage || 'Estamos preparando algo especial para você. O site voltará em breve com uma coleção incrível.'
    const eta     = config?.maintenance_eta     || config?.maintenanceEta     || ''

    const targetDate = parseEta(eta)
    const countdown  = useCountdown(targetDate)
    const hasBfly    = butterflySrc.startsWith('data:')

    /* ── Same canvas technique as AuthPage / Header / Footer ─── */
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
        const t = setTimeout(() => setVisible(true), 80)
        return () => clearTimeout(t)
    }, [])

    return (
        <>
            <style>{`
                /* ─ Entrance animations ─ */
                @keyframes mnt-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes mnt-in { from { opacity: 0; } to { opacity: 1; } }

                /* ─ Hero butterfly float ─ */
                @keyframes mnt-hero-flutter {
                    0%, 100% { transform: translateY(0px); }
                    40%      { transform: translateY(-7px); }
                    70%      { transform: translateY(4px); }
                }

                /* ─ Countdown pulse ─ */
                @keyframes mnt-cd-tick {
                    0%   { transform: scale(1); }
                    10%  { transform: scale(1.07); }
                    20%  { transform: scale(1); }
                }

                /* ─ Gold shimmer on the divider ─ */
                @keyframes mnt-gold-pulse {
                    0%, 100% { opacity: 0.25; }
                    50%      { opacity: 0.6; }
                }

                .mnt-root {
                    opacity: 0;
                    transition: opacity 0.7s ease;
                }
                .mnt-visible { opacity: 1; }

                .mnt-a1 { animation: mnt-up 0.85s cubic-bezier(0.22,1,0.36,1) 0.1s both; }
                .mnt-a2 { animation: mnt-up 0.85s cubic-bezier(0.22,1,0.36,1) 0.22s both; }
                .mnt-a3 { animation: mnt-up 0.85s cubic-bezier(0.22,1,0.36,1) 0.36s both; }
                .mnt-a4 { animation: mnt-up 0.85s cubic-bezier(0.22,1,0.36,1) 0.50s both; }
                .mnt-a5 { animation: mnt-in 1s ease 0.70s both; }

                .mnt-hero-bfly {
                    animation: mnt-hero-flutter 4.5s ease-in-out infinite;
                }

                .mnt-cd-digit {
                    animation: mnt-cd-tick 1s ease-in-out infinite;
                    display: inline-block;
                }

                .mnt-gold-line {
                    height: 1px;
                    background: linear-gradient(90deg, transparent 0%, #C6A76A 50%, transparent 100%);
                    animation: mnt-gold-pulse 3s ease-in-out infinite;
                }

                /* Countdown box */
                .mnt-cd-box {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    min-width: 64px;
                }
                .mnt-cd-number {
                    font-family: 'Cormorant Garamond', serif;
                    font-weight: 700;
                    font-size: clamp(42px, 8vw, 64px);
                    line-height: 1;
                    color: #1A1A1A;
                    letter-spacing: -0.02em;
                }
                .mnt-cd-label {
                    font-family: 'Manrope', sans-serif;
                    font-weight: 700;
                    font-size: 8px;
                    letter-spacing: 0.22em;
                    text-transform: uppercase;
                    color: #7A3E4A;
                    margin-top: 6px;
                }
                .mnt-cd-sep {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: clamp(32px, 6vw, 50px);
                    color: #C6A76A;
                    opacity: 0.4;
                    font-weight: 300;
                    align-self: flex-start;
                    padding-top: 8px;
                    line-height: 1;
                }

                @media (max-width: 480px) {
                    .mnt-cd-box { min-width: 48px; }
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
                {/* ── Subtle tinted bg gradients (same soft look as SplashLoader) ── */}
                <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: 'linear-gradient(135deg, #FAF9F5 0%, #F5EEE9 100%)',
                    zIndex: 0,
                }} />
                <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
                    background: 'radial-gradient(ellipse 80% 55% at 50% -5%, rgba(198,167,106,0.07) 0%, transparent 70%)',
                }} />

                {/* ── Flying butterflies — identical to AuthPage (drift + flutter) ── */}
                {hasBfly && BUTTERFLIES.map(b => (
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
                            opacity: b.opacity,
                            pointerEvents: 'none',
                            userSelect: 'none',
                            zIndex: 1,
                            animation: `${b.drift} ${b.duration}s ${b.delay}s linear infinite, butterfly-flutter ${0.3 + (b.id % 4) * 0.08}s ease-in-out infinite`,
                            ...(b.left   ? { left:   b.left   } : { right: b.right }),
                            ...(b.bottom ? { bottom: b.bottom } : { top:   b.top   }),
                        }}
                    />
                ))}

                {/* ── HEADER ── */}
                <header className="mnt-a1" style={{
                    padding: '36px 24px 0',
                    textAlign: 'center',
                    position: 'relative',
                    zIndex: 10,
                }}>
                    {/* Logo — borboleta centralizada acima do texto */}
                    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        {hasBfly && (
                            <img
                                src={butterflySrc}
                                alt="Borboleta Meraki"
                                className="animate-butterfly-flight"
                                style={{ width: 54, height: 54, objectFit: 'contain' }}
                            />
                        )}
                        <div style={{
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', lineHeight: 1,
                        }}>
                            <span style={{
                                fontFamily: "'Cormorant Garamond', serif",
                                fontWeight: 900,
                                fontSize: 'clamp(22px, 5vw, 30px)',
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
                                fontSize: 'clamp(7px, 1.4vw, 10px)',
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

                    {/* Gold rule */}
                    <div style={{ maxWidth: 80, margin: '24px auto 0' }}>
                        <div className="mnt-gold-line" />
                    </div>
                </header>

                {/* ── MAIN ── */}
                <main style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '48px 24px 40px',
                    position: 'relative',
                    zIndex: 10,
                }}>
                    <div style={{ maxWidth: 560, width: '100%', textAlign: 'center' }}>

                        {/* Status chip */}
                        <div className="mnt-a2" style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            padding: '7px 18px',
                            borderRadius: 999,
                            border: '1px solid rgba(198,167,106,0.3)',
                            background: 'rgba(198,167,106,0.07)',
                            marginBottom: 28,
                        }}>
                            <span style={{
                                width: 6, height: 6, borderRadius: '50%',
                                background: '#C6A76A', flexShrink: 0,
                                display: 'inline-block',
                            }} />
                            <span style={{
                                fontFamily: "'Manrope', sans-serif",
                                fontWeight: 700, fontSize: 9,
                                letterSpacing: '0.2em',
                                textTransform: 'uppercase',
                                color: '#9A7840',
                            }}>
                                Preparando algo especial
                            </span>
                        </div>

                        {/* Title */}
                        <h1 className="mnt-a2" style={{
                            fontFamily: "'Cormorant Garamond', serif",
                            fontWeight: 700,
                            fontSize: 'clamp(34px, 8vw, 62px)',
                            lineHeight: 1.07,
                            color: '#1A1A1A',
                            letterSpacing: '-0.01em',
                            marginBottom: 0,
                        }}>
                            {title}
                        </h1>

                        {/* Ornamental divider */}
                        <div className="mnt-a3" style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: 14, margin: '22px auto 22px',
                        }}>
                            <div className="mnt-gold-line" style={{ width: 52 }} />
                            {hasBfly && (
                                <img src={butterflySrc} alt="" aria-hidden="true"
                                    style={{ width: 18, height: 18, objectFit: 'contain', opacity: 0.35 }} />
                            )}
                            <div className="mnt-gold-line" style={{ width: 52 }} />
                        </div>

                        {/* Message */}
                        <p className="mnt-a3" style={{
                            fontFamily: "'Manrope', sans-serif",
                            fontSize: 14, fontWeight: 500,
                            lineHeight: 1.8, color: '#8A8280',
                            marginBottom: targetDate ? 44 : 0,
                            maxWidth: 420,
                            marginLeft: 'auto', marginRight: 'auto',
                        }}>
                            {message}
                        </p>

                        {/* ── Countdown ── */}
                        {targetDate && (
                            <div className="mnt-a4">
                                <p style={{
                                    fontFamily: "'Manrope', sans-serif",
                                    fontWeight: 800, fontSize: 9,
                                    letterSpacing: '0.25em',
                                    textTransform: 'uppercase',
                                    color: 'rgba(122,62,74,0.45)',
                                    marginBottom: 20,
                                }}>
                                    {countdown.expired ? 'Voltando agora...' : 'Voltamos em'}
                                </p>

                                {!countdown.expired ? (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        justifyContent: 'center',
                                        gap: 'clamp(8px, 3vw, 20px)',
                                    }}>
                                        {countdown.days > 0 && (
                                            <>
                                                <div className="mnt-cd-box">
                                                    <span className="mnt-cd-number mnt-cd-digit">{pad(countdown.days)}</span>
                                                    <span className="mnt-cd-label">Dias</span>
                                                </div>
                                                <span className="mnt-cd-sep">:</span>
                                            </>
                                        )}
                                        <div className="mnt-cd-box">
                                            <span className="mnt-cd-number mnt-cd-digit">{pad(countdown.hours)}</span>
                                            <span className="mnt-cd-label">Horas</span>
                                        </div>
                                        <span className="mnt-cd-sep">:</span>
                                        <div className="mnt-cd-box">
                                            <span className="mnt-cd-number mnt-cd-digit">{pad(countdown.mins)}</span>
                                            <span className="mnt-cd-label">Minutos</span>
                                        </div>
                                        <span className="mnt-cd-sep">:</span>
                                        <div className="mnt-cd-box">
                                            <span className="mnt-cd-number mnt-cd-digit">{pad(countdown.secs)}</span>
                                            <span className="mnt-cd-label">Segundos</span>
                                        </div>
                                    </div>
                                ) : (
                                    <p style={{
                                        fontFamily: "'Cormorant Garamond', serif",
                                        fontStyle: 'italic', fontWeight: 500,
                                        fontSize: 22, color: '#7A3E4A',
                                    }}>
                                        Recarregue a página para ver a nova coleção!
                                    </p>
                                )}

                                {/* Progress bar (cosmetic) */}
                                {!countdown.expired && (
                                    <div style={{
                                        maxWidth: 200, margin: '32px auto 0',
                                        height: 2, background: 'rgba(122,62,74,0.08)',
                                        borderRadius: 2, overflow: 'hidden',
                                    }}>
                                        <div style={{
                                            height: '100%',
                                            background: 'linear-gradient(90deg, #7A3E4A, #C6A76A)',
                                            borderRadius: 2,
                                            animation: 'mnt-progress 2s ease-in-out infinite alternate',
                                            width: '60%',
                                        }} />
                                        <style>{`
                                            @keyframes mnt-progress {
                                                from { width: 20%; opacity: 0.6; }
                                                to   { width: 80%; opacity: 1; }
                                            }
                                        `}</style>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </main>

                {/* ── FOOTER ── */}
                <footer className="mnt-a5" style={{
                    padding: '0 24px 32px',
                    textAlign: 'center',
                    position: 'relative',
                    zIndex: 10,
                }}>
                    <div style={{ maxWidth: 100, margin: '0 auto 20px' }}>
                        <div className="mnt-gold-line" />
                    </div>
                    <p style={{
                        fontFamily: "'Manrope', sans-serif",
                        fontSize: 10, color: '#C0B8B0',
                        letterSpacing: '0.05em',
                    }}>
                        © {new Date().getFullYear()} Meraki Femme Lingerie — Todos os direitos reservados
                    </p>
                </footer>
            </div>
        </>
    )
}
