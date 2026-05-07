import useBoardStore from '../store/boardStore'

export function useBoard() {
  const store = useBoardStore()
  const activeBoard = store.boards.find(b => b.id === store.activeBoard) || null
  return { ...store, activeBoard }
}
