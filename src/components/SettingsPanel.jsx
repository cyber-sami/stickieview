import { useState, useEffect } from 'react'
import useBoardStore from '../store/boardStore'
import { maskLicenseKey } from '../utils/licenseUtils'

export default function SettingsPanel({ onClose, onActivateLicense }) {
  const { isLicensed, config, updateConfig, removeLicense } = useBoardStore()
  const [storagePath, setStoragePath] = useState(config.storagePath || '')
  const [launchAtStartup, setLaunchAtStartup] = useState(config.launchAtStartup || false)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleStorageSave = () => {
    if (storagePath.trim()) {
      window.stickyAPI.setStoragePath(storagePath.trim())
      updateConfig('storagePath', storagePath.trim())
    }
  }

  const handleStartupToggle = (e) => {
    const enabled = e.target.checked
    setLaunchAtStartup(enabled)
    window.stickyAPI.setLaunchAtStartup(enabled)
    updateConfig('launchAtStartup', enabled)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={e => e.stopPropagation()}>
        <h3>Settings</h3>

        <section className="settings-section">
          <label>Storage folder</label>
          <div className="settings-row">
            <input
              className="settings-input"
              value={storagePath}
              onChange={e => setStoragePath(e.target.value)}
              spellCheck={false}
            />
            <button className="btn-secondary" onClick={handleStorageSave}>Save</button>
          </div>
          <p className="settings-hint">Boards are stored here as JSON files. Sync with Syncthing or Dropbox.</p>
        </section>

        <section className="settings-section">
          <label className="settings-checkbox-label">
            <input
              type="checkbox"
              checked={launchAtStartup}
              onChange={handleStartupToggle}
            />
            Launch at startup
          </label>
        </section>

        <section className="settings-section">
          <label>License</label>
          {isLicensed ? (
            <div>
              <p className="settings-hint">
                ⭐ Stickieview+ active — {maskLicenseKey(config.licenseKey)}
              </p>
              <button className="btn-danger" onClick={() => {
                if (window.confirm("Remove license? You'll revert to 3 boards.")) removeLicense()
              }}>
                Remove license
              </button>
            </div>
          ) : (
            <div>
              <p className="settings-hint">Free plan — up to 3 boards</p>
              <button className="btn-primary" onClick={() => { onClose(); onActivateLicense() }}>
                Activate license
              </button>
            </div>
          )}
        </section>

        <section className="settings-section settings-about">
          <label>About</label>
          <p>Stickieview v1.0.0</p>
          <button
            className="btn-link"
            onClick={() => window.stickyAPI.openExternal('https://stickieview.app')}
          >
            stickieview.app ↗
          </button>
        </section>

        <button className="modal-close" onClick={onClose}>×</button>
      </div>
    </div>
  )
}
