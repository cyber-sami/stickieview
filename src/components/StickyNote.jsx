import { useRef, useState, useEffect, useCallback } from 'react'
import useBoardStore from '../store/boardStore'

const COLORS = {
  yellow: { bg: '#FFF176', header: '#F9E822' },
  pink:   { bg: '#F8BBD0', header: '#F48FB1' },
  blue:   { bg: '#B3E5FC', header: '#81D4FA' },
  green:  { bg: '#C8E6C9', header: '#A5D6A7' },
  purple: { bg: '#E1BEE7', header: '#CE93D8' },
  orange: { bg: '#FFE0B2', header: '#FFCC80' },
  white:  { bg: '#FAFAFA', header: '#E0E0E0' },
}

export default function StickyNote({ note, boardId }) {
  const { updateNote, updateNotePosition, updateNoteSize, removeNote, bringToFront } = useBoardStore()
  const [editing, setEditing] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const noteRef = useRef(null)
  const textRef = useRef(null)
  const dragStart = useRef(null)
  const resizeStart = useRef(null)

  const colors = COLORS[note.color] || COLORS.yellow

  // ── Drag ─────────────────────────────────────────────────────────────────

  const onMouseDownDrag = useCallback((e) => {
    if (e.target.closest('.note-controls') || e.target.closest('.note-body') || e.target.closest('.resize-handle')) return
    e.preventDefault()
    bringToFront(boardId, note.id)
    dragStart.current = { mouseX: e.clientX, mouseY: e.clientY, noteX: note.x, noteY: note.y }
    setDragging(true)
  }, [note.x, note.y, boardId, note.id, bringToFront])

  useEffect(() => {
    if (!dragging) return
    const onMove = (e) => {
      const dx = e.clientX - dragStart.current.mouseX
      const dy = e.clientY - dragStart.current.mouseY
      noteRef.current.style.left = `${dragStart.current.noteX + dx}px`
      noteRef.current.style.top = `${dragStart.current.noteY + dy}px`
    }
    const onUp = (e) => {
      const dx = e.clientX - dragStart.current.mouseX
      const dy = e.clientY - dragStart.current.mouseY
      updateNotePosition(boardId, note.id, dragStart.current.noteX + dx, dragStart.current.noteY + dy)
      setDragging(false)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging, boardId, note.id, updateNotePosition])

  // ── Resize ───────────────────────────────────────────────────────────────

  const onMouseDownResize = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    bringToFront(boardId, note.id)
    resizeStart.current = {
      mouseX: e.clientX, mouseY: e.clientY,
      w: note.width, h: note.height,
    }
    const onMove = (e) => {
      const dw = e.clientX - resizeStart.current.mouseX
      const dh = e.clientY - resizeStart.current.mouseY
      noteRef.current.style.width = `${Math.max(140, resizeStart.current.w + dw)}px`
      noteRef.current.style.height = `${Math.max(100, resizeStart.current.h + dh)}px`
    }
    const onUp = (e) => {
      const dw = e.clientX - resizeStart.current.mouseX
      const dh = e.clientY - resizeStart.current.mouseY
      updateNoteSize(boardId, note.id,
        Math.max(140, resizeStart.current.w + dw),
        Math.max(100, resizeStart.current.h + dh)
      )
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [note.width, note.height, boardId, note.id, bringToFront, updateNoteSize])

  // ── Edit ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!editing || !textRef.current) return
    textRef.current.focus()
    try {
      const range = document.createRange()
      const sel = window.getSelection()
      range.selectNodeContents(textRef.current)
      range.collapse(false)
      sel.removeAllRanges()
      sel.addRange(range)
    } catch {}
  }, [editing])

  const startEditing = () => {
    bringToFront(boardId, note.id)
    setEditing(true)
  }

  const stopEditing = () => {
    const content = textRef.current?.innerText ?? note.content
    setEditing(false)
    updateNote(boardId, note.id, { content })
  }

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); stopEditing() }
  }

  // ── Color picker ─────────────────────────────────────────────────────────

  const pickColor = (color) => {
    updateNote(boardId, note.id, { color })
    setShowColorPicker(false)
  }

  return (
    <div
      ref={noteRef}
      className={`sticky-note${dragging ? ' dragging' : ''}`}
      style={{
        left: note.x,
        top: note.y,
        width: note.width,
        height: note.height,
        zIndex: note.zIndex,
        transform: `rotate(${note.rotation}deg)`,
        backgroundColor: colors.bg,
      }}
      onMouseDown={onMouseDownDrag}
      onClick={() => bringToFront(boardId, note.id)}
    >
      {/* Header strip */}
      <div
        className="note-header"
        style={{ backgroundColor: colors.header }}
      >
        <button
          className="note-controls color-btn"
          title="Change color"
          onClick={(e) => { e.stopPropagation(); setShowColorPicker(v => !v) }}
        >
          🎨
        </button>
        <button
          className="note-controls delete-btn"
          title="Delete note"
          onClick={(e) => { e.stopPropagation(); removeNote(boardId, note.id) }}
        >
          ×
        </button>
      </div>

      {/* Color picker */}
      {showColorPicker && (
        <div className="color-picker" onClick={e => e.stopPropagation()}>
          {Object.entries(COLORS).map(([name, c]) => (
            <button
              key={name}
              className="color-swatch"
              style={{ backgroundColor: c.bg, outline: note.color === name ? '2px solid #333' : 'none' }}
              onClick={() => pickColor(name)}
              title={name}
            />
          ))}
        </div>
      )}

      {/* Body — view mode */}
      {!editing && (
        <div
          className="note-body"
          onDoubleClick={startEditing}
          style={{ cursor: 'default' }}
        >
          {note.content
            ? note.content.split('\n').map((line, i) => (
                <span key={i}>{line}<br /></span>
              ))
            : <span className="placeholder">Double-click to write…</span>
          }
        </div>
      )}

      {/* Body — edit mode */}
      {editing && (
        <div
          ref={textRef}
          className="note-body"
          contentEditable
          suppressContentEditableWarning
          onBlur={stopEditing}
          onKeyDown={onKeyDown}
          style={{ cursor: 'text', outline: 'none' }}
        >
          {note.content}
        </div>
      )}

      {/* Resize handle */}
      <div className="resize-handle" onMouseDown={onMouseDownResize} />
    </div>
  )
}
