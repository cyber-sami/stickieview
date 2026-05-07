import { useState, useRef, useEffect } from 'react'
import useBoardStore from '../store/boardStore'

const FREE_TAB_LIMIT = 3

export default function TabBar({ onUpgradePrompt }) {
  const { boards, activeBoard, isLicensed, addBoard, removeBoard, renameBoard, setActiveBoard } = useBoardStore()
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [contextMenu, setContextMenu] = useState(null)
  const renameRef = useRef(null)

  const canAddTab = isLicensed || boards.length < FREE_TAB_LIMIT

  useEffect(() => {
    if (renamingId) renameRef.current?.focus()
  }, [renamingId])

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return
    const close = () => setContextMenu(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [contextMenu])

  const handleAddTab = () => {
    if (canAddTab) addBoard()
    else onUpgradePrompt()
  }

  const startRename = (board, e) => {
    e?.stopPropagation()
    setContextMenu(null)
    setRenamingId(board.id)
    setRenameValue(board.name)
  }

  const commitRename = () => {
    if (renameValue.trim()) renameBoard(renamingId, renameValue.trim())
    setRenamingId(null)
  }

  const handleRenameKey = (e) => {
    if (e.key === 'Enter') commitRename()
    if (e.key === 'Escape') setRenamingId(null)
  }

  const handleContextMenu = (e, board) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, board })
  }

  const handleDelete = (board) => {
    if (boards.length <= 1) return
    if (window.confirm(`Delete board "${board.name}"? This cannot be undone.`)) {
      removeBoard(board.id)
    }
    setContextMenu(null)
  }

  return (
    <div className="tab-bar">
      {boards.map(board => (
        <div
          key={board.id}
          className={`tab${board.id === activeBoard ? ' tab-active' : ''}`}
          onClick={() => setActiveBoard(board.id)}
          onDoubleClick={(e) => startRename(board, e)}
          onContextMenu={(e) => handleContextMenu(e, board)}
        >
          {renamingId === board.id ? (
            <input
              ref={renameRef}
              className="tab-rename-input"
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={handleRenameKey}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span className="tab-name">{board.name}</span>
          )}
        </div>
      ))}

      <button className="tab-add-btn" onClick={handleAddTab} title={canAddTab ? 'Add board' : 'Upgrade to add more boards'}>
        {canAddTab ? '+' : '🔒'}
      </button>

      {contextMenu && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={e => e.stopPropagation()}
        >
          <button onClick={() => startRename(contextMenu.board)}>Rename</button>
          <button
            className="danger"
            onClick={() => handleDelete(contextMenu.board)}
            disabled={boards.length <= 1}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
