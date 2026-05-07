import { useState } from 'react'

export default function UpdateBar() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="update-bar">
      <button className="update-bar-text" onClick={() => window.stickyAPI.installUpdate()}>
        ✨ Update available — click to install
      </button>
      <button className="update-bar-dismiss" onClick={() => setDismissed(true)} title="Dismiss">×</button>
    </div>
  )
}
