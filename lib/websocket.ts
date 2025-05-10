import { toast } from "@/hooks/use-toast"

interface WebSocketMessage {
    type: "draw" | "userMove" | "clear" | "layerUpdate" | "sync"
    element?: any
    userId?: number
    layerId?: string
    layers?: any[]
    x?: number
    y?: number
}

export class WhiteboardWebSocket {
    private ws: WebSocket | null = null
    private reconnectAttempts = 0
    private maxReconnectAttempts = 5
    private reconnectTimeout = 1000 // Start with 1 second
    private listeners: { [key: string]: ((data: any) => void)[] } = {}
    private boardId: string

    constructor(boardId: string) {
        this.boardId = boardId
        this.connect()
    }

    private connect() {
        // Use secure WebSocket in production, regular in development
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const wsUrl = `${protocol}//${window.location.host}/api/ws/whiteboard/${this.boardId}`

        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
            console.log('WebSocket connected')
            this.reconnectAttempts = 0
            this.reconnectTimeout = 1000
            this.emit('open')
        }

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data) as WebSocketMessage
                this.emit('message', { data: event.data })
            } catch (e) {
                console.error('Failed to parse WebSocket message:', e)
            }
        }

        this.ws.onclose = () => {
            console.log('WebSocket disconnected')
            this.emit('close')
            this.handleReconnect()
        }

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error)
            this.emit('error', error)
        }
    }

    private handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++
            this.reconnectTimeout *= 2 // Exponential backoff

            setTimeout(() => {
                this.connect()
            }, this.reconnectTimeout)
        } else {

        }
    }

    public send(data: string) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(data)
        } else {
            console.warn('WebSocket is not connected')

        }
    }

    public addEventListener(event: string, callback: (data: any) => void) {
        if (!this.listeners[event]) {
            this.listeners[event] = []
        }
        this.listeners[event].push(callback)
    }

    public removeEventListener(event: string, callback: (data: any) => void) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback)
        }
    }

    private emit(event: string, data?: any) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data))
        }
    }

    public close() {
        if (this.ws) {
            this.ws.close()
            this.ws = null
        }
    }
}

export const createWebSocket = (boardId: string) => {
    return new WhiteboardWebSocket(boardId)
} 