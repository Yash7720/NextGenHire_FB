import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Stars from '../components/ui/Stars'
import { forgotPassword } from '../services/userApi'

export default function ForgotPassword() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const res = await forgotPassword(email)
      if (res.success && res.resetToken) {
        // Direct redirect as requested by user
        nav(`/reset-password/${res.resetToken}`)
      } else if (res.success) {
        setMessage('Reset link sent! Please check your email.')
      } else {
        setError(res.message || 'Something went wrong')
      }
    } catch (err) {
      setError(err?.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid-bg bg-bg flex items-center justify-center px-4 relative overflow-hidden">
      <Stars count={50} />
      
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      <button
        onClick={() => nav('/signin')}
        className="absolute top-5 left-5 z-20 btn btn-sm btn-outline border-slate-700 text-slate-400 hover:text-cyan hover:border-cyan"
      >
        ← BACK TO LOGIN
      </button>

      <div className="glass w-full max-w-[440px] p-10 rounded-2xl relative z-10 animate-fade-up border border-white/5 shadow-2xl">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4 animate-bounce-slow">🔑</div>
          <h2 className="font-orbitron text-2xl text-white tracking-widest mb-2">
            FORGOT <span className="text-cyan">PASSWORD?</span>
          </h2>
          <p className="text-slate-400 text-sm font-rajdhani">
            Enter your email to receive a recovery link
          </p>
        </div>

        {message ? (
          <div className="p-4 rounded-xl bg-cyan/10 border border-cyan/30 text-cyan text-center animate-fade-in">
            <p className="font-semibold mb-3">📬 {message}</p>
            <button 
              onClick={() => nav('/signin')}
              className="btn btn-sm btn-cyan w-full"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="section-label mb-1.5 opacity-70">Email Address</label>
              <input
                required
                type="email"
                className="input focus:ring-2 focus:ring-cyan/50"
                placeholder="warrior@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {error && (
              <div className="text-red-400 text-xs font-semibold px-1 py-1 animate-shake">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-lg btn-cyan w-full mt-2 group relative overflow-hidden"
            >
              <span className="relative z-10">
                {loading ? 'TRANSMITTING...' : 'SEND RESET LINK'}
              </span>
              {loading && (
                <div className="absolute inset-0 bg-white/10 animate-pulse" />
              )}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-xs text-slate-500 font-rajdhani tracking-wider">
            RECOVERY SYSTEM v2.0 // ENCRYPTED
          </p>
        </div>
      </div>
    </div>
  )
}
