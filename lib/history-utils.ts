import { DrawingElement, Layer } from './types'

export interface HistoryState {
    layers: Layer[]
    activeLayer: string
}

export const createHistoryState = (layers: Layer[], activeLayer: string): HistoryState => ({
    layers: layers.map(layer => ({
        ...layer,
        elements: [...layer.elements]
    })),
    activeLayer
})

export const pushToHistory = (
    history: HistoryState[],
    currentState: HistoryState,
    maxHistoryLength: number = 50
): HistoryState[] => {
    const newHistory = [...history, currentState]
    if (newHistory.length > maxHistoryLength) {
        return newHistory.slice(-maxHistoryLength)
    }
    return newHistory
}

export const undo = (history: HistoryState[], currentIndex: number): { history: HistoryState[], index: number } => {
    if (currentIndex > 0) {
        return {
            history,
            index: currentIndex - 1
        }
    }
    return { history, index: currentIndex }
}

export const redo = (history: HistoryState[], currentIndex: number): { history: HistoryState[], index: number } => {
    if (currentIndex < history.length - 1) {
        return {
            history,
            index: currentIndex + 1
        }
    }
    return { history, index: currentIndex }
}

export const getCurrentState = (history: HistoryState[], currentIndex: number): HistoryState | null => {
    if (currentIndex >= 0 && currentIndex < history.length) {
        return history[currentIndex]
    }
    return null
} 