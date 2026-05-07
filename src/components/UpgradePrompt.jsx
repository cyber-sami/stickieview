import { useEffect } from 'react'

export default function UpgradePrompt({ onClose, onEnterKey }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const openUpgrade = () => window.stickyAPI.openExternal('https://stickieview.app/upgrade')

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="upgrade-prompt" onClick={e => e.stopPropagation()}>
        <div className="upgrade-icon">📌</div>
        <h3>You've used all {3} free boards</h3>
        <p>Unlock unlimited boards for just <strong>$9.99</strong> — one time, forever.</p>
        <div className="upgrade-actions">
          <button className="btn-secondary" onClick={onEnterKey}>Enter license key</button>
          <button className="btn-primary" onClick={openUpgrade}>Get Stickieview+ ⭐</button>
        </div>
        <button className="modal-close" onClick={onClose}>×</button>
      </div>
    </div>
  )
}
