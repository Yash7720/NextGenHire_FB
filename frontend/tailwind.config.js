/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        rajdhani: ['Rajdhani', 'sans-serif'],
        mono: ['"Share Tech Mono"', 'monospace'],
      },
      colors: {
        bg: {
          DEFAULT: '#050810',
          2: '#0a0f1e',
          3: '#0f1628',
        },
        panel: {
          DEFAULT: '#111827',
          2: '#1a2235',
        },
        border: {
          DEFAULT: '#1e2d4a',
          2: '#2a3f6a',
        },
        cyan: {
          DEFAULT: '#00f5ff',
          2: '#00c8d4',
        },
        gold: {
          DEFAULT: '#ffd700',
          2: '#ffb300',
        },
        neon: {
          pink: '#ff2d78',
          green: '#00ff9d',
          orange: '#ff6b35',
          purple: '#8b5cf6',
        },
      },
      boxShadow: {
        cyan: '0 0 20px rgba(0,245,255,0.4)',
        'cyan-lg': '0 0 40px rgba(0,245,255,0.6)',
        gold: '0 0 20px rgba(255,215,0,0.4)',
        'gold-lg': '0 0 40px rgba(255,215,0,0.6)',
        pink: '0 0 20px rgba(255,45,120,0.4)',
        green: '0 0 20px rgba(0,255,157,0.4)',
        purple: '0 0 20px rgba(139,92,246,0.4)',
      },
      backgroundImage: {
        'grid-pattern':
          'linear-gradient(rgba(0,245,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.03) 1px, transparent 1px)',
        'gradient-cyan': 'linear-gradient(135deg, #00f5ff, #00c8d4)',
        'gradient-gold': 'linear-gradient(135deg, #ffd700, #ffb300)',
        'gradient-pink': 'linear-gradient(135deg, #ff2d78, #c71585)',
        'gradient-purple': 'linear-gradient(135deg, #8b5cf6, #ff2d78)',
      },
      backgroundSize: {
        grid: '50px 50px',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'scan': 'scan 4s linear infinite',
        'fade-up': 'fadeUp 0.5s ease forwards',
        'slide-in': 'slideIn 0.4s ease forwards',
        'bounce-in': 'bounceIn 0.6s cubic-bezier(0.36,0.07,0.19,0.97) forwards',
        'shimmer': 'shimmer 2s linear infinite',
        'xp-pop': 'xpPop 2s ease forwards',
        'twinkle': 'twinkle 3s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'border-trace': 'borderTrace 3s linear infinite',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        pulseGlow: {
          '0%,100%': { boxShadow: '0 0 10px rgba(0,245,255,0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(0,245,255,0.7)' },
        },
        fadeUp: {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        slideIn: {
          from: { transform: 'translateX(-30px)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.1)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        xpPop: {
          '0%': { transform: 'scale(0) translateY(0)', opacity: '1' },
          '80%': { transform: 'scale(1.2) translateY(-40px)', opacity: '1' },
          '100%': { transform: 'scale(1) translateY(-60px)', opacity: '0' },
        },
        twinkle: {
          '0%,100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.3)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        borderTrace: {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '200% 0%' },
        },
      },
      clipPath: {
        btn: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
        'btn-sm': 'polygon(5px 0, 100% 0, calc(100% - 5px) 100%, 0 100%)',
      },
    },
  },
  plugins: [],
}
