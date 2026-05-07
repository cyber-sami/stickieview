import { useState, useEffect } from 'react'
import useBoardStore from '../store/boardStore'
import { validateLicenseKey, formatLicenseInput } from '../utils/licenseUtils'

export default function LicenseModal({ onClose }) {
  const { setLicensed } = useBoardStore()
  const [input, setInput] = useState('SV-')
  const [status, setStatus] = useState(null) // null | 'success' | 'error'

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleInput = (e) => {
    setStatus(null)
    setInput(formatLicenseInput(e.target.value))
  }

  const handleActivate = () => {
    const key = input.trim().toUpperCase()
    if (validateLicenseKey(key)) {
      setLicensed(key)
      setStatus('success')
      setTimeout(onClose, 1500)
    } else {
      setStatus('error')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleActivate()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="license-modal" onClick={e => e.stopPropagation()}>
        <h3>Activate Stickieview+</h3>
        <p>Enter the license key from your purchase email.</p>

        <input
          className="license-input"
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="SV-XXXX-XXXX-XXXX"
          autoFocus
          spellCheck={false}
        />

        {status === 'success' && (
          <p className="license-status success">✅ Activated! Unlimited boards unlocked.</p>
        )}
        {status === 'error' && (
          <p className="license-status error">❌ Invalid key. Check your email from the purchase.</p>
        )}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleActivate} disabled={status === 'success'}>
            Activate
          </button>
        </div>

        <button className="modal-close" onClick={onClose}>×</button>
      </div>
    </div>
  )
}
