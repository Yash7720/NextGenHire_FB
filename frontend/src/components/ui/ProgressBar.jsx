import clsx from 'clsx'

export default function ProgressBar({ value, max, color, height = 'h-1.5', className }) {
  const pct = Math.min(100, Math.round((value / max) * 100))

  return (
    <div className={clsx('progress-track w-full', height, className)}>
      <div
        className="progress-fill"
        style={{ width: `${pct}%`, background: color ?? 'linear-gradient(90deg,#00f5ff,#00c8d4)' }}
      />
    </div>
  )
}
