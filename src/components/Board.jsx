import StickyNote from './StickyNote'

const BG_CLASSES = {
  corkboard: 'bg-corkboard',
  whiteboard: 'bg-whiteboard',
  blackboard: 'bg-blackboard',
  graph: 'bg-graph',
  linen: 'bg-linen',
}

export default function Board({ board }) {
  if (!board) {
    return (
      <div className="board-empty">
        <p>No boards yet. Create one with the + button above.</p>
      </div>
    )
  }

  const bgClass = BG_CLASSES[board.background] || 'bg-corkboard'

  return (
    <div className={`board ${bgClass}`}>
      {board.notes.map(note => (
        <StickyNote key={note.id} note={note} boardId={board.id} />
      ))}
    </div>
  )
}
