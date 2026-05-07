import { useState, useEffect } from 'react'
import useBoardStore from '../store/boardStore'

export default function LicenseModal({ onClose }) {
  const { setLicensed } = useBoardStore()
  const [input, setInput] = useState('')
  const [status, setStatus] = useState(null) // null | 'loading' | 'success' | 'error'

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && status !== 'loading') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, status])

  const handleActivate = async () => {
    const key = input.trim()
    if (!key) return

    setStatus('loading')
    const result = await window.stickyAPI.validateLicense(key)

    if (result.valid) {
      setLicensed(key)
      setStatus('success')
      setTimeout(onClose, 2000)
    } else {
      setStatus('error')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleActivate()
  }

  const busy = status === 'loading' || status === 'success'

  return (
    <div className="modal-overlay" onClick={busy ? undefined : onClose}>
      <div className="license-modal" onClick={e => e.stopPropagation()}>
        <h3>Activate Stickieview+</h3>
        <p>Enter the license key from your LemonSqueezy purchase email.</p>

        <input
          className="license-input"
          value={input}
          onChange={e => { setStatus(null); setInput(e.target.value) }}
          onKeyDown={handleKeyDown}
          placeholder="Paste your license key"
          autoFocus
          spellCheck={false}
          disabled={busy}
        />

        {status === 'loading' && <p className="license-status loading">⏳ Validating…</p>}
        {status === 'success' && <p className="license-status success">✅ Activated! Unlimited boards unlocked.</p>}
        {status === 'error'   && <p className="license-status error">❌ Invalid key. Check your email from LemonSqueezy.</p>}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn-primary" onClick={handleActivate} disabled={busy}>
            {status === 'loading' ? 'Validating…' : 'Activate'}
          </button>
        </div>

        <button className="modal-close" onClick={onClose} disabled={busy}>×</button>
      </div>
    </div>
  )
}
