import { useState, useEffect } from 'react'

export default function UpdateBar() {
  const [state, setState] = useState(null) // null | 'available' | 'downloading' | 'ready'
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    window.stickyAPI.onUpdateAvailable(() => setState('available'))
    window.stickyAPI.onUpdateDownloaded(() => setState('ready'))
  }, [])

  if (!state || dismissed) return null

  const handleAction = () => {
    if (state === 'available') {
      setState('downloading')
      window.stickyAPI.downloadUpdate()
    } else if (state === 'ready') {
      window.stickyAPI.installUpdate()
    }
  }

  const messages = {
    available:    '✨ Update available — click to download',
    downloading:  '⏳ Downloading update…',
    ready:        '🚀 Update ready — click to restart and install',
  }

  return (
    <div className="update-bar">
      <button
        className="update-bar-text"
        onClick={handleAction}
        disabled={state === 'downloading'}
      >
        {messages[state]}
      </button>
      {state !== 'downloading' && (
        <button className="update-bar-dismiss" onClick={() => setDismissed(true)} title="Dismiss">×</button>
      )}
    </div>
  )
}
