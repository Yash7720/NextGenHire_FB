// import { useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import Stars from '../components/ui/Stars'

// export default function Auth({ mode }) {
//   const nav = useNavigate()
//   const isSignIn = mode === 'signin'
//   const [form, setForm] = useState({ name: '', email: '', password: '', age: '', degree: '' })

//   const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

//   return (
//     <div className="min-h-screen grid-bg bg-bg flex items-center justify-center px-4 relative">
//       <Stars count={50} />

//       {/* Back */}
//       <button
//         onClick={() => nav('/')}
//         className="absolute top-5 left-5 z-10 btn btn-sm btn-outline"
//       >← BACK</button>

//       <div className="glass w-full max-w-[440px] p-10 rounded-2xl relative z-10 animate-fade-up">
//         {/* Logo */}
//         <div className="text-center mb-8">
//           <div className="text-5xl mb-3">⚡</div>
//           <div className="font-orbitron text-xl text-cyan tracking-widest">
//             NEXTGEN<span className="text-gold">HIRE</span>
//           </div>
//           <p className="text-slate-500 text-sm mt-1">
//             {isSignIn ? 'Welcome back, Warrior!' : 'Begin Your Journey'}
//           </p>
//         </div>

//         {/* Social */}
//         <div className="flex gap-3 mb-5">
//           {[['🔵 Google','#4285f4'],['⚫ GitHub','#24292e']].map(([label, bg]) => (
//             <button
//               key={label}
//               onClick={() => nav('/app/dashboard')}
//               className="flex-1 py-2.5 rounded font-rajdhani text-sm font-semibold text-white transition-opacity hover:opacity-85"
//               style={{ background: bg }}
//             >{label}</button>
//           ))}
//         </div>

//         <div className="flex items-center gap-3 mb-5">
//           <div className="flex-1 h-px bg-border" />
//           <span className="text-slate-600 text-xs">or continue with email</span>
//           <div className="flex-1 h-px bg-border" />
//         </div>

//         {/* Form fields */}
//         <div className="flex flex-col gap-3">
//           {!isSignIn && (
//             <div className="grid grid-cols-2 gap-3">
//               <div>
//                 <label className="section-label mb-1">Name</label>
//                 <input className="input" placeholder="Your name" value={form.name} onChange={set('name')} />
//               </div>
//               <div>
//                 <label className="section-label mb-1">Age</label>
//                 <input className="input" placeholder="22" value={form.age} onChange={set('age')} />
//               </div>
//             </div>
//           )}
//           {!isSignIn && (
//             <div>
//               <label className="section-label mb-1">Degree</label>
//               <input className="input" placeholder="e.g. B.Tech CS" value={form.degree} onChange={set('degree')} />
//             </div>
//           )}
//           <div>
//             <label className="section-label mb-1">Email</label>
//             <input className="input" type="email" placeholder="your@email.com" value={form.email} onChange={set('email')} />
//           </div>
//           <div>
//             <label className="section-label mb-1">Password</label>
//             <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} />
//           </div>

//           <button
//             className="btn btn-lg btn-cyan w-full mt-1"
//             onClick={() => nav('/app/dashboard')}
//           >
//             {isSignIn ? '⚡ LAUNCH QUEST' : '🚀 CREATE ACCOUNT'}
//           </button>
//         </div>

//         <p className="text-center mt-5 text-sm text-slate-500">
//           {isSignIn ? 'New warrior? ' : 'Already playing? '}
//           <button
//             className="text-cyan hover:underline"
//             onClick={() => nav(isSignIn ? '/signup' : '/signin')}
//           >
//             {isSignIn ? 'Create Account' : 'Sign In'}
//           </button>
//         </p>

//         <div className="text-center mt-3">
//           <button
//             className="text-[11px] text-slate-600 hover:text-neon-pink transition-colors"
//             onClick={() => nav('/admin')}
//           >🔐 Admin Portal →</button>
//         </div>
//       </div>
//     </div>
//   )
// }





import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Stars from '../components/ui/Stars'
import { useAuth } from '../hooks/useAuth'
import { dailyLogin, getCurrentUser, firebaseLogin as syncSocialUser } from '../services/userApi'
import { auth, googleProvider, githubProvider } from '../firebase'
import { signInWithPopup } from 'firebase/auth'

// ── Error icon map ────────────────────────────────────────────────
const ERROR_ICONS = {
  'Invalid Email':      '📧',
  'Invalid Password':   '🔒',
  'User Already Exists':'⚠️',
  'User Not Found':     '👤',
  'Popup Blocked':      '🚫',
  'Account Conflict':   '🔀',
  'Config Missing':     '⚙️',
}

// ── Toast component ───────────────────────────────────────────────
function ErrorToast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [message, onClose])

  const icon = Object.entries(ERROR_ICONS).find(([key]) => message.startsWith(key))?.[1] ?? '❌'

  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 20px',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #1a0a0a 0%, #2d0f0f 100%)',
        border: '1px solid rgba(239,68,68,0.5)',
        boxShadow: '0 0 24px rgba(239,68,68,0.25), 0 4px 16px rgba(0,0,0,0.6)',
        color: '#fca5a5',
        fontFamily: 'inherit',
        fontSize: '14px',
        fontWeight: 600,
        minWidth: '260px',
        maxWidth: '360px',
        animation: 'toastSlideIn 0.3s ease',
      }}
    >
      <span style={{ fontSize: '20px' }}>{icon}</span>
      <span style={{ flex: 1, color: '#fca5a5' }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: '#f87171',
          cursor: 'pointer',
          fontSize: '16px',
          lineHeight: 1,
          padding: '2px 4px',
        }}
        aria-label="Close"
      >✕</button>

      {/* progress bar */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: '3px',
        borderRadius: '0 0 12px 12px',
        background: 'linear-gradient(90deg, #ef4444, #f97316)',
        animation: 'toastProgress 4s linear forwards',
        width: '100%',
      }} />

      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  )
}

// ── Main Auth page ────────────────────────────────────────────────
export default function Auth({ mode }) {

  const nav = useNavigate()
  const isSignIn = mode === 'signin'
  const { login, register } = useAuth()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
    degree: ''
  })

  const [errorMsg, setErrorMsg] = useState(null)
  const [loading, setLoading]   = useState(false)

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  // ── Client-side quick validation ──────────────────────────────
  const validateClient = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!form.email || !emailRegex.test(form.email)) {
      setErrorMsg('Invalid Email')
      return false
    }
    if (!form.password || form.password.length < 1) {
      setErrorMsg('Invalid Password')
      return false
    }
    return true
  }

  // ── Submit handler ─────────────────────────────────────────────
  const handleSubmit = async () => {
    setErrorMsg(null)
    if (!validateClient()) return

    setLoading(true)
    try {
      if (isSignIn) {
        const loggedInUser = await login({ email: form.email, password: form.password })

        // Daily login bonus is now handled automatically by useGameState 
        // upon reaching the dashboard. 
        // Redirect based on role
        if (loggedInUser.role === 'admin') {
          window.location.href = '/admin/dashboard'
        } else {
          window.location.href = '/app/dashboard'
        }
      } else {
        await register({
          name: form.name,
          email: form.email,
          password: form.password,
          age: form.age,
          degree: form.degree,
        })
        nav('/signin')
      }
    } catch (err) {
      // Pull the message the server sent back
      let msg = err?.message || 'Something went wrong'
      
      // Cleanup for technical SSL errors (e.g. Node/OpenSSL internal errors)
      if (msg.includes('error:0A000438') || msg.includes('alert internal error')) {
        msg = 'Database Connection Error (SSL Handshake Failed). Please check your internet or VPN settings.'
      } else if (msg.includes('EADDRINUSE')) {
        msg = 'Server Port Conflict. Please restart the backend.'
      }
      
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  // ── Social login handler ───────────────────────────────────────
  const handleSocialLogin = async (providerName) => {
    setErrorMsg(null)
    setLoading(true)
    try {
      const provider = providerName === 'google' ? googleProvider : githubProvider
      const result   = await signInWithPopup(auth, provider)
      const user     = result.user

      // Fallback for missing email (common with GitHub if user hasn't made it public)
      const userEmail = user.email || `${user.uid}@github.com`

      // Sync with our MongoDB backend
      const syncedUser = await syncSocialUser({
        name:        user.displayName || 'Warrior',
        email:       userEmail,
        firebaseUid: user.uid,
        profilePic:  user.photoURL,
      })

      if (syncedUser) {
        if (syncedUser.role === 'admin') {
          window.location.href = '/admin/dashboard'
        } else {
          window.location.href = '/app/dashboard'
        }
      }
    } catch (err) {
      console.error("[Auth] Social login error:", err)
      
      let msg = err?.message || 'Social login failed'
      
      // Better user-facing messages for Firebase codes
      if (err?.code === 'auth/popup-blocked') {
        msg = 'Popup blocked! Please allow popups.'
      } else if (err?.code === 'auth/account-exists-with-different-credential') {
        msg = 'Account Conflict: An account already exists with this email but a different provider. Please use your original login method.'
      } else if (err?.code === 'auth/operation-not-allowed' || err?.code === 'auth/configuration-not-found') {
        msg = 'Config Missing: This login method is not yet fully configured in the Firebase console.'
      } else if (msg.includes('auth/invalid-credential')) {
        msg = 'Invalid Credential: The social login session expired or is invalid.'
      }

      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  // ── Allow Enter key to submit ─────────────────────────────────
  const handleKey = (e) => { if (e.key === 'Enter') handleSubmit() }

  return (
    <div className="min-h-screen grid-bg bg-bg flex items-center justify-center px-4 relative">
      <Stars count={50} />

      {/* Error Toast */}
      {errorMsg && (
        <ErrorToast message={errorMsg} onClose={() => setErrorMsg(null)} />
      )}

      <button
        onClick={() => nav('/')}
        className="absolute top-5 left-5 z-10 btn btn-sm btn-outline"
      >← BACK</button>

      <div className="glass w-full max-w-[440px] p-10 rounded-2xl relative z-10 animate-fade-up">

        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⚡</div>
          <div className="font-orbitron text-xl text-cyan tracking-widest">
            NEXTGEN<span className="text-gold">HIRE</span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            {isSignIn ? 'Welcome back, Warrior!' : 'Begin Your Journey'}
          </p>
        </div>

        <div className="flex gap-3 mb-5">
          <button
            onClick={() => handleSocialLogin('google')}
            className="flex-1 py-2.5 rounded font-rajdhani text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ background: '#4285f4' }}
            disabled={loading}
          >🔵 Google</button>
          
          <button
            onClick={() => handleSocialLogin('github')}
            className="flex-1 py-2.5 rounded font-rajdhani text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ background: '#24292e' }}
            disabled={loading}
          >⚫ GitHub</button>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-slate-600 text-xs">or continue with email</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="flex flex-col gap-3">

          {!isSignIn && (
            <div className="grid grid-cols-2 gap-3">
              <input id="auth-name"   className="input" placeholder="Name"   value={form.name}   onChange={set('name')}   onKeyDown={handleKey} />
              <input id="auth-age"    className="input" placeholder="Age"    value={form.age}    onChange={set('age')}    onKeyDown={handleKey} />
            </div>
          )}

          {!isSignIn && (
            <input id="auth-degree" className="input" placeholder="Degree (e.g. B.Tech CS)" value={form.degree} onChange={set('degree')} onKeyDown={handleKey} />
          )}

          <input
            id="auth-email"
            className={`input${errorMsg === 'Invalid Email' ? ' ring-2 ring-red-500' : ''}`}
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={set('email')}
            onKeyDown={handleKey}
          />
          <input
            id="auth-password"
            className={`input${errorMsg === 'Invalid Password' ? ' ring-2 ring-red-500' : ''}`}
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={set('password')}
            onKeyDown={handleKey}
          />

          {isSignIn && (
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => nav('/forgot-password')}
                className="text-[11px] text-cyan/70 hover:text-cyan transition-colors font-rajdhani uppercase tracking-tighter"
              >
                Forgot Password?
              </button>
            </div>
          )}

          <button
            id="auth-submit"
            className="btn btn-lg btn-cyan w-full mt-1"
            onClick={handleSubmit}
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? '⏳ Please wait…' : isSignIn ? '⚡ LAUNCH QUEST' : '🚀 CREATE ACCOUNT'}
          </button>

        </div>

        <p className="text-center mt-5 text-sm text-slate-500">
          {isSignIn ? 'New warrior? ' : 'Already playing? '}
          <button
            className="text-cyan hover:underline"
            onClick={() => nav(isSignIn ? '/signup' : '/signin')}
          >
            {isSignIn ? 'Create Account' : 'Sign In'}
          </button>
        </p>

      </div>
    </div>
  )
}