import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = 'http://localhost:5002/api/auth'

export default function AdminAuth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await axios.post(`${API_URL}/admin-login`, { email, password })
      if (res.data.success) {
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
        nav('/admin/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'System Authentication Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 font-orbitron overflow-hidden relative">
      {/* Animated Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
      
      {/* Glowing background elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gold/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative">
        {/* Border Glow Container */}
        <div className="relative glass border-2 border-cyan/20 rounded-2xl p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(0,245,255,0.1)]">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block px-3 py-1 border border-cyan/30 rounded text-[10px] text-cyan tracking-[0.3em] mb-4 bg-cyan/5">
              RESTRICTED ACCESS
            </div>
            <h1 className="text-2xl font-black text-white tracking-widest uppercase">
              Admin <span className="text-gold">Portal</span>
            </h1>

          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 tracking-widest ml-1">IDENTIFIER (EMAIL)</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-cyan focus:outline-none focus:border-cyan/50 focus:bg-black/60 transition-all font-share placeholder:text-slate-700"
                placeholder="root@nextgenhire.sys"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 tracking-widest ml-1">ACCESS CODE (PASSWORD)</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-cyan focus:outline-none focus:border-cyan/50 focus:bg-black/60 transition-all font-share placeholder:text-slate-700"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded p-3 text-[11px] text-red-400 text-center animate-pulse">
                ERR: {error.toUpperCase()}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-cyan text-black font-black tracking-[0.2em] rounded-lg hover:bg-white hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all disabled:opacity-50 relative group"
            >
              <span className={loading ? 'opacity-0' : 'opacity-100'}>
                {loading ? 'AUTHENTICATING...' : 'INITIATE ACCESS'}
              </span>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                </div>
              )}
            </button>
          </form>


        </div>

        {/* Decorative corner elements */}
        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-cyan/40 rounded-tl-xl pointer-events-none" />
        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-cyan/40 rounded-br-xl pointer-events-none" />
      </div>
    </div>
  )
}
