import { useMemo } from 'react'

export default function Stars({ count = 80 }) {
  const stars = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      top:      Math.random() * 100,
      left:     Math.random() * 100,
      duration: 2 + Math.random() * 4,
      delay:    Math.random() * 4,
      size:     Math.random() > 0.8 ? 3 : 2,
    })), [count])

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {stars.map(s => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white animate-twinkle"
          style={{
            top:               `${s.top}%`,
            left:              `${s.left}%`,
            width:             s.size,
            height:            s.size,
            animationDuration: `${s.duration}s`,
            animationDelay:    `${s.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
