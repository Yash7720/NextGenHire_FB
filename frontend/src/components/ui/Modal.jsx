import { useEffect } from 'react'

export default function Modal({ open, onClose, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur z-[1000] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`glass-bright w-full ${maxWidth} animate-bounce-in relative`}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
