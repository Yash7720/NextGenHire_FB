export default function XPNotif({ show, amount }) {
  if (!show) return null
  return (
    <div
      className="xp-notif"
      style={{ top: '45%', left: '50%', transform: 'translateX(-50%)' }}
    >
      +{amount} XP ✨
    </div>
  )
}
