import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Stars from '../components/ui/Stars'
import { COURSES } from '../data'

export default function Landing() {
  const nav = useNavigate()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  const FEATURES = [
    { icon: '🎮', title: 'Gamified Learning',     desc: 'Earn XP, unlock achievements, maintain streaks, and level up your skills like a real RPG.',          color: '#00f5ff' },
    { icon: '🏆', title: 'Competitive Leaderboards', desc: 'Compete with peers globally. Climb ranks from Bronze to Diamond through skill mastery.',           color: '#ffd700' },
    { icon: '🎯', title: 'Skill-Based Hiring',    desc: 'Showcase real abilities to employers. Get matched with jobs based on verified skill scores.',          color: '#ff2d78' },
    { icon: '🤖', title: 'AI-Powered Paths',       desc: 'Personalized learning recommendations powered by AI to maximize your growth trajectory.',           color: '#8b5cf6' },
    { icon: '🔥', title: 'Daily Quests',           desc: 'Fresh challenges every day. Bonus XP for streaks, speedruns, and perfect scores.',                  color: '#ff6b35' },
    { icon: '💎', title: 'Badge System',            desc: 'Earn rare collectible badges for course completion, speed, and mastery achievements.',              color: '#00ff9d' },
  ]

  return (
    <div className="relative min-h-screen grid-bg bg-bg">
      <Stars />

      {/* ── Navbar ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-3 transition-all duration-300 ${scrolled ? 'bg-bg/95 backdrop-blur border-b border-border' : ''}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#00f5ff,#8b5cf6)', padding: '2px' }}>
            <img 
              src="/ngh.png"
              alt="NextGenHire Logo"
              className="w-9 h-9 object-contain"
            />
          </div>
          <span className="font-orbitron text-[18px] font-black tracking-widest text-cyan">
            NEXTGEN<span className="text-gold">HIRE</span>
          </span>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-md btn-outline"   onClick={() => nav('/signin')}>Sign In</button>
          <button className="btn btn-md btn-cyan"      onClick={() => nav('/signup')}>Get Started</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-5 pt-20">
        {/* Glow orbs */}
        <div className="absolute top-1/4 left-[8%] w-72 h-72 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle,rgba(0,245,255,0.07),transparent)' }} />
        <div className="absolute bottom-1/4 right-[8%] w-96 h-96 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle,rgba(139,92,246,0.07),transparent)' }} />

        <div className="animate-fade-up relative z-10">
          <div className="chip chip-cyan mb-6 text-[12px]">🚀 Next-Generation Hiring Platform</div>

          <h1 className="font-orbitron font-black leading-tight mb-5" style={{ fontSize: 'clamp(32px,7vw,78px)' }}>
            <span className="text-neon-c">LEVEL UP</span><br />
            <span className="text-slate-100">YOUR CAREER</span><br />
            <span className="text-neon-g">SKILLS</span>
          </h1>

          <p className="text-slate-400 text-lg max-w-xl mx-auto mb-8 leading-relaxed">
            Master programming with epic quests, earn XP & badges, conquer coding challenges — and land your dream job through skill-based hiring.
          </p>

          <div className="flex gap-3 justify-center flex-wrap">
            <button className="btn btn-lg btn-cyan"    onClick={() => nav('/signup')}>🚀 Start Your Journey</button>
            <button className="btn btn-lg btn-outline" onClick={() => nav('/signin')}>⚡ Continue Journey</button>
          </div>
        </div>

        {/* Stats */}
        <div className="animate-fade-up mt-16 flex gap-4 flex-wrap justify-center relative z-10" style={{ animationDelay: '0.4s', opacity: 0 }}>
          {[['12K+','Learners','#00f5ff'],['48','Courses','#ffd700'],['200+','Companies','#ff2d78'],['95%','Job Rate','#00ff9d']].map(([v,l,c]) => (
            <div key={l} className="glass px-6 py-4 text-center rounded-xl" style={{ borderColor: `${c}33` }}>
              <div className="font-orbitron text-2xl font-black" style={{ color: c }}>{v}</div>
              <div className="text-[12px] text-slate-500">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-10 max-w-6xl mx-auto">
        <h2 className="font-orbitron text-3xl text-center mb-3">
          WHY <span className="text-neon-c">NEXTGENHIRE</span>?
        </h2>
        <p className="text-center text-slate-500 mb-12">Not just learning — a full RPG experience for your career</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(f => (
            <div key={f.title} className="card p-6 rounded-xl" style={{ borderColor: `${f.color}22` }}>
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="font-orbitron text-[13px] tracking-widest mb-2" style={{ color: f.color }}>{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Courses preview ── */}
      <section className="py-20 px-10 bg-bg-2">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-orbitron text-3xl text-center mb-12">
            AVAILABLE <span className="text-neon-g">COURSES</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {COURSES.map(c => (
              <div key={c.id} className="card p-5 text-center cursor-pointer" onClick={() => nav('/signup')}>
                <div className="text-4xl mb-2">{c.icon}</div>
                <div className="font-orbitron text-[11px] mb-1" style={{ color: c.color }}>{c.title}</div>
                <span className="chip chip-slate text-[10px]">{c.level}</span>
                <div className="text-[11px] text-gold mt-2">+{c.xp} XP</div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <button className="btn btn-lg btn-gold" onClick={() => nav('/signup')}>🎮 Start Learning Now</button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-10 border-t border-border text-center">
        <div className="font-orbitron text-sm text-cyan mb-2">NEXTGEN<span className="text-gold">HIRE</span></div>
        <div className="text-[12px] text-slate-600">© 2025 NextGenHire Platform. Level Up Your Future.</div>
      </footer>
    </div>
  )
}
