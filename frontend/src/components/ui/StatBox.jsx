export default function StatBox({ label, value, icon, color = '#00f5ff' }) {
  return (
    <div
      className="stat-box"
      style={{ borderColor: `${color}33` }}
    >
      <span className="text-3xl">{icon}</span>
      <span className="font-orbitron text-xl font-bold" style={{ color }}>{value}</span>
      <span className="text-[11px] text-slate-500">{label}</span>
    </div>
  )
}
