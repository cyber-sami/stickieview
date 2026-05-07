import { useState } from 'react'
import TabBar from './TabBar'
import useBoardStore from '../store/boardStore'

const BACKGROUNDS = [
  { id: 'corkboard', label: '🪵 Corkboard' },
  { id: 'whiteboard', label: '⬜ Whiteboard' },
  { id: 'blackboard', label: '🟫 Blackboard' },
  { id: 'graph', label: '📐 Graph' },
  { id: 'linen', label: '🧵 Linen' },
]

export default function Toolbar({ onUpgradePrompt, onOpenLicense, onOpenSettings }) {
  const { boards, activeBoard: activeBoardId, isLicensed, addNote, setBackground } = useBoardStore()
  const [bgPickerOpen, setBgPickerOpen] = useState(false)

  const activeBoard = boards.find(b => b.id === activeBoardId)

  const handleAddNote = () => {
    if (activeBoardId) addNote(activeBoardId)
  }

  const handleBgPick = (bg) => {
    if (activeBoardId) setBackground(activeBoardId, bg)
    setBgPickerOpen(false)
  }

  return (
    <div className="toolbar">
      <div className="toolbar-left no-drag">
        <span className="app-logo">📌</span>
        <span className="app-name">Stickieview</span>
        {isLicensed && <span className="supporter-badge" title="Stickieview+ supporter">⭐</span>}
      </div>

      <div className="toolbar-center no-drag">
        <TabBar onUpgradePrompt={onUpgradePrompt} />
      </div>

      <div className="toolbar-right no-drag">
        <button className="toolbar-btn" onClick={handleAddNote} disabled={!activeBoardId} title="Add sticky note">
          + Add Note
        </button>

        <div className="bg-picker-wrapper">
          <button
            className="toolbar-btn"
            onClick={() => setBgPickerOpen(v => !v)}
            disabled={!activeBoardId}
            title="Change background"
          >
            🎨
          </button>
          {bgPickerOpen && (
            <div className="bg-picker-dropdown">
              {BACKGROUNDS.map(bg => (
                <button
                  key={bg.id}
                  className={`bg-option${activeBoard?.background === bg.id ? ' active' : ''}`}
                  onClick={() => handleBgPick(bg.id)}
                >
                  {bg.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="toolbar-btn" onClick={onOpenSettings} title="Settings">⚙️</button>

        <div className="window-controls">
          <button className="wc-btn" onClick={() => window.stickyAPI.windowMinimize()} title="Minimize">−</button>
          <button className="wc-btn" onClick={() => window.stickyAPI.windowMaximize()} title="Maximize">□</button>
          <button className="wc-btn wc-close" onClick={() => window.stickyAPI.windowClose()} title="Close">×</button>
        </div>
      </div>
    </div>
  )
}
