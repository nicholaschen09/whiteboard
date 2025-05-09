export type Tool =
    | "select"
    | "pen"
    | "rectangle"
    | "circle"
    | "text"
    | "sticker"
    | "image"
    | "arrow"
    | "note"
    | "eraser"

export type DrawingElement = {
    id: string
    type: Tool
    points?: { x: number; y: number }[]
    x?: number
    y?: number
    width?: number
    height?: number
    text?: string
    color: string
    userId: number
    stickerType?: string
    imageUrl?: string
    lineWidth?: number
    fontSize?: number
}

export type Layer = {
    id: string
    name: string
    visible: boolean
    locked: boolean
    elements: DrawingElement[]
}

export interface BrainboardProps {
    boardId?: string
} 