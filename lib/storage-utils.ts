import { Layer } from './types'

export interface SaveData {
    layers: Layer[]
    activeLayer: string
    currentColor: string
    lineWidth: number
    showGrid: boolean
    snapToGrid: boolean
}

export const saveToLocalStorage = (boardId: string, data: SaveData): void => {
    try {
        localStorage.setItem(`whiteboard_${boardId}`, JSON.stringify(data))
    } catch (error) {
        console.error('Failed to save to localStorage:', error)
        throw new Error('Failed to save whiteboard data')
    }
}

export const loadFromLocalStorage = (boardId: string): SaveData | null => {
    try {
        const savedData = localStorage.getItem(`whiteboard_${boardId}`)
        if (!savedData) return null
        return JSON.parse(savedData) as SaveData
    } catch (error) {
        console.error('Failed to load from localStorage:', error)
        return null
    }
}

export const clearLocalStorage = (boardId: string): void => {
    try {
        localStorage.removeItem(`whiteboard_${boardId}`)
    } catch (error) {
        console.error('Failed to clear localStorage:', error)
    }
}

export const exportToJSON = (data: SaveData): string => {
    return JSON.stringify(data, null, 2)
}

export const importFromJSON = (json: string): SaveData => {
    try {
        return JSON.parse(json) as SaveData
    } catch (error) {
        console.error('Failed to parse JSON:', error)
        throw new Error('Invalid JSON data')
    }
} 