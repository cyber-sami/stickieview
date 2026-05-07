import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

let saveTimer = null

function debounceAutosave(boards) {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    boards.forEach(board => {
      const filename = `${board.id}.json`
      window.stickyAPI.saveBoard(filename, board)
    })
  }, 500)
}

const useBoardStore = create((set, get) => ({
  boards: [],
  activeBoard: null,
  isLicensed: false,
  config: {},

  // ── Init ──────────────────────────────────────────────────────────────────

  loadFromDisk: async () => {
    const [boards, license, config] = await Promise.all([
      window.stickyAPI.loadBoards(),
      window.stickyAPI.getLicense(),
      window.stickyAPI.getConfig(),
    ])

    let sorted = boards.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

    // Create a default board on first launch
    if (sorted.length === 0) {
      const firstBoard = {
        id: uuidv4(),
        name: 'My Board',
        background: 'corkboard',
        createdAt: new Date().toISOString(),
        notes: [],
      }
      await window.stickyAPI.saveBoard(`${firstBoard.id}.json`, firstBoard)
      sorted = [firstBoard]
    }

    const lastId = config.lastActiveBoard
    const active = sorted.find(b => b.id === lastId) || sorted[0] || null

    set({
      boards: sorted,
      activeBoard: active?.id || null,
      isLicensed: license.isLicensed || false,
      config,
    })
  },

  // ── Board actions ─────────────────────────────────────────────────────────

  addBoard: (name = 'New Board') => {
    const board = {
      id: uuidv4(),
      name,
      background: 'corkboard',
      createdAt: new Date().toISOString(),
      notes: [],
    }
    set(state => {
      const boards = [...state.boards, board]
      window.stickyAPI.saveBoard(`${board.id}.json`, board)
      window.stickyAPI.setConfig('lastActiveBoard', board.id)
      return { boards, activeBoard: board.id }
    })
  },

  removeBoard: (boardId) => {
    set(state => {
      const boards = state.boards.filter(b => b.id !== boardId)
      window.stickyAPI.deleteBoard(`${boardId}.json`)
      const newActive = boards.find(b => b.id !== boardId)?.id || boards[0]?.id || null
      if (newActive) window.stickyAPI.setConfig('lastActiveBoard', newActive)
      return { boards, activeBoard: state.activeBoard === boardId ? newActive : state.activeBoard }
    })
  },

  renameBoard: (boardId, name) => {
    set(state => {
      const boards = state.boards.map(b => b.id === boardId ? { ...b, name } : b)
      debounceAutosave(boards)
      return { boards }
    })
  },

  setActiveBoard: (boardId) => {
    window.stickyAPI.setConfig('lastActiveBoard', boardId)
    set({ activeBoard: boardId })
  },

  setBackground: (boardId, background) => {
    set(state => {
      const boards = state.boards.map(b => b.id === boardId ? { ...b, background } : b)
      debounceAutosave(boards)
      return { boards }
    })
  },

  // ── Note actions ──────────────────────────────────────────────────────────

  addNote: (boardId) => {
    const note = {
      id: uuidv4(),
      x: 80 + Math.random() * 200,
      y: 80 + Math.random() * 150,
      width: 200,
      height: 160,
      color: 'yellow',
      content: '',
      zIndex: Date.now(),
      rotation: (Math.random() * 6 - 3).toFixed(2) * 1,
    }
    set(state => {
      const boards = state.boards.map(b =>
        b.id === boardId ? { ...b, notes: [...b.notes, note] } : b
      )
      debounceAutosave(boards)
      return { boards }
    })
    return note.id
  },

  updateNote: (boardId, noteId, updates) => {
    set(state => {
      const boards = state.boards.map(b =>
        b.id === boardId
          ? { ...b, notes: b.notes.map(n => n.id === noteId ? { ...n, ...updates } : n) }
          : b
      )
      debounceAutosave(boards)
      return { boards }
    })
  },

  removeNote: (boardId, noteId) => {
    set(state => {
      const boards = state.boards.map(b =>
        b.id === boardId ? { ...b, notes: b.notes.filter(n => n.id !== noteId) } : b
      )
      debounceAutosave(boards)
      return { boards }
    })
  },

  updateNotePosition: (boardId, noteId, x, y) => {
    set(state => {
      const boards = state.boards.map(b =>
        b.id === boardId
          ? { ...b, notes: b.notes.map(n => n.id === noteId ? { ...n, x, y } : n) }
          : b
      )
      debounceAutosave(boards)
      return { boards }
    })
  },

  updateNoteSize: (boardId, noteId, width, height) => {
    set(state => {
      const boards = state.boards.map(b =>
        b.id === boardId
          ? { ...b, notes: b.notes.map(n => n.id === noteId ? { ...n, width, height } : n) }
          : b
      )
      debounceAutosave(boards)
      return { boards }
    })
  },

  bringToFront: (boardId, noteId) => {
    set(state => {
      const boards = state.boards.map(b =>
        b.id === boardId
          ? { ...b, notes: b.notes.map(n => n.id === noteId ? { ...n, zIndex: Date.now() } : n) }
          : b
      )
      return { boards }
    })
  },

  // ── License ───────────────────────────────────────────────────────────────

  setLicensed: (key) => {
    window.stickyAPI.saveLicense(key)
    set({ isLicensed: true })
  },

  removeLicense: () => {
    window.stickyAPI.removeLicense()
    set({ isLicensed: false })
  },

  // ── Config ─────────────────────────────────────────────────────────────────

  updateConfig: (key, value) => {
    window.stickyAPI.setConfig(key, value)
    set(state => ({ config: { ...state.config, [key]: value } }))
  },
}))

export default useBoardStore
