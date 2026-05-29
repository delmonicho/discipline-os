import { useState } from 'react'
import { useAuth } from '../lib/useAuth'

export function SignIn() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const t = email.trim()
    if (!t || loading) return
    setLoading(true)
    await signIn(t)
    setSent(true)
    setLoading(false)
  }

  return (
    <div style={S.root}>
      <style>{CSS}</style>
      <div style={S.ambient}>
        <div className="blob b1" style={{ background: 'radial-gradient(circle, #3a2d72 0%, transparent 70%)' }} />
        <div className="blob b2" style={{ background: 'radial-gradient(circle, #19505e 0%, transparent 70%)' }} />
        <div className="blob b3" style={{ background: 'radial-gradient(circle, #2a2350 0%, transparent 70%)' }} />
        <div style={S.grain} />
      </div>

      <div style={S.card} className="rise">
        {sent ? (
          <>
            <div style={S.orb}>✦</div>
            <h1 style={S.heading}>Check your email</h1>
            <p style={S.body}>A magic link is on its way to <strong style={{ color: '#ece7f7' }}>{email}</strong>. Click it to sign in.</p>
            <button onClick={() => { setSent(false); setEmail('') }} style={S.back}>Use a different email</button>
          </>
        ) : (
          <>
            <div style={S.orb}>✦</div>
            <h1 style={S.heading}>Discipline OS</h1>
            <p style={S.body}>Your daily habit coach. Sign in with a magic link — no password needed.</p>
            <form onSubmit={handleSubmit} style={S.form}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoFocus
                style={S.input}
              />
              <button type="submit" style={S.btn(!!email.trim() && !loading)} disabled={!email.trim() || loading}>
                {loading ? 'Sending…' : 'Send link'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

const S = {
  root: {
    minHeight: '100vh', width: '100%', background: '#0d0a1c', position: 'relative' as const,
    overflow: 'hidden', fontFamily: "'Hanken Grotesk', sans-serif", display: 'flex',
    alignItems: 'center', justifyContent: 'center', color: '#ece7f7',
  },
  ambient: { position: 'fixed' as const, inset: 0, zIndex: 0 },
  grain: {
    position: 'absolute' as const, inset: 0, opacity: 0.05, mixBlendMode: 'overlay' as const,
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
  },
  card: {
    position: 'relative' as const, zIndex: 1, width: '100%', maxWidth: 380,
    padding: '48px 36px 44px', textAlign: 'center' as const,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 32, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
    boxShadow: '0 30px 80px -40px rgba(0,0,0,0.8)',
    margin: '0 16px',
  },
  orb: {
    fontSize: 28, color: '#5ad1c8', marginBottom: 20,
    filter: 'drop-shadow(0 0 12px #5ad1c8aa)',
  },
  heading: {
    fontFamily: "'Fraunces', serif", fontSize: 34, fontWeight: 500,
    letterSpacing: '-0.01em', lineHeight: 1.1, margin: '0 0 12px',
  },
  body: { fontSize: 14.5, color: '#a79fc4', lineHeight: 1.6, margin: '0 0 28px' },
  form: { display: 'flex', flexDirection: 'column' as const, gap: 12 },
  input: {
    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16, padding: '15px 18px', color: '#ece7f7', fontSize: 15,
    outline: 'none', fontFamily: 'inherit', textAlign: 'center' as const,
  },
  btn: (on: boolean) => ({
    background: on ? 'linear-gradient(135deg, #5ad1c8, #2b8aa6)' : 'rgba(255,255,255,0.07)',
    color: on ? '#06141a' : '#6c6489', border: 'none', borderRadius: 16,
    padding: '15px', fontSize: 15, fontWeight: 700, cursor: on ? 'pointer' : 'default',
    fontFamily: 'inherit', transition: 'all .25s',
  }),
  back: {
    background: 'none', border: 'none', color: '#7b7399', fontSize: 13,
    cursor: 'pointer', fontFamily: 'inherit', marginTop: 12,
  },
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Hanken+Grotesk:wght@400;500;600;700&display=swap');
* { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
body { margin: 0; }
.blob { position: absolute; width: 120vw; max-width: 760px; height: 760px; border-radius: 50%;
  filter: blur(60px); opacity: 0.55; will-change: transform; }
.b1 { top: -22%; left: -18%; animation: drift1 46s ease-in-out infinite; }
.b2 { bottom: -26%; right: -22%; animation: drift2 58s ease-in-out infinite; }
.b3 { top: 28%; right: -28%; animation: drift3 70s ease-in-out infinite; }
@keyframes drift1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(8%,12%) scale(1.12); } }
@keyframes drift2 { 0%,100% { transform: translate(0,0) scale(1.05); } 50% { transform: translate(-10%,-8%) scale(0.95); } }
@keyframes drift3 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-6%,10%) scale(1.1); } }
.rise { opacity: 0; transform: translateY(14px); animation: rise .7s cubic-bezier(.2,.8,.2,1) forwards; }
@keyframes rise { to { opacity: 1; transform: translateY(0); } }
`
