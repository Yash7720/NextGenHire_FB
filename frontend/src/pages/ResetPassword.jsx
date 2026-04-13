import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Stars from '../components/ui/Stars'
import { resetPassword } from '../services/userApi'

export default function ResetPassword() {
  const { token } = useParams()
  const nav = useNavigate()
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await resetPassword(token, password)
      if (res.success) {
        setMessage('Password reset successful!')
        setTimeout(() => nav('/signin'), 3000)
      } else {
        setError(res.message || 'Something went wrong. Token might be invalid.')
      }
    } catch (err) {
      setError(err?.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid-bg bg-bg flex items-center justify-center px-4 relative overflow-hidden">
      <Stars count={50} />
      
      {/* Background Orbs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-600/10 blur-[100px] rounded-full" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-cyan/10 blur-[100px] rounded-full" />

      <div className="glass w-full max-w-[440px] p-10 rounded-2xl relative z-10 animate-fade-up border border-white/5 shadow-2xl">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🛡️</div>
          <h2 className="font-orbitron text-2xl text-white tracking-widest mb-2">
            RESET <span className="text-cyan">PASSWORD</span>
          </h2>
          <p className="text-slate-400 text-sm font-rajdhani">
            Strengthen your security with a new password
          </p>
        </div>

        {message ? (
          <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-center animate-bounce-in">
            <p className="font-bold text-lg mb-2">✨ SUCCESS!</p>
            <p className="text-sm opacity-80 mb-4">{message}</p>
            <p className="text-xs text-slate-500">Redirecting to login portal...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="section-label mb-1.5 opacity-70">New Password</label>
              <input
                required
                type="password"
                className="input focus:ring-2 focus:ring-cyan/50"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="section-label mb-1.5 opacity-70">Confirm Password</label>
              <input
                required
                type="password"
                className="input focus:ring-2 focus:ring-cyan/50"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              className="btn btn-lg btn-cyan w-full mt-2 group relative overflow-hidden shadow-[0_0_20px_rgba(0,245,255,0.2)]"
            >
              <span className="relative z-10">
                {loading ? 'CALCULATING HASH...' : 'UPDATE PASSWORD'}
              </span>
              {loading && (
                <div className="absolute inset-0 bg-white/10 animate-pulse" />
              )}
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
            <button 
                onClick={() => nav('/signin')}
                className="text-xs text-slate-500 hover:text-cyan transition-colors"
            >
                Cancel and return to login
            </button>
        </div>
      </div>
    </div>
  )
}
