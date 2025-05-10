import { toast } from "@/hooks/use-toast"

interface WebSocketMessage {
    type: "draw" | "userMove" | "clear" | "layerUpdate" | "sync" | "ping" | "pong"
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
    private pingInterval: NodeJS.Timeout | null = null
    private connectionTimeout: NodeJS.Timeout | null = null

    constructor(boardId: string) {
        this.boardId = boardId
        this.connect()
    }

    private getWebSocketUrl(): string {
        // Use environment variable for WebSocket host in production
        const wsHost = process.env.NEXT_PUBLIC_WS_HOST || window.location.host
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        return `${protocol}//${wsHost}/api/ws/whiteboard/${this.boardId}`
    }

    private connect() {
        try {
            const wsUrl = this.getWebSocketUrl()
            this.ws = new WebSocket(wsUrl)

            // Set connection timeout
            this.connectionTimeout = setTimeout(() => {
                if (this.ws?.readyState !== WebSocket.OPEN) {
                    this.ws?.close()
                    this.handleReconnect()
                }
            }, 5000) // 5 second timeout

            this.ws.onopen = () => {
                console.log('WebSocket connected')
                this.reconnectAttempts = 0
                this.reconnectTimeout = 1000
                this.emit('open')

                // Clear connection timeout
                if (this.connectionTimeout) {
                    clearTimeout(this.connectionTimeout)
                    this.connectionTimeout = null
                }

                // Start ping interval to keep connection alive
                this.startPingInterval()
            }

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data) as WebSocketMessage
                    if (data.type === 'pong') {
                        return // Ignore pong messages
                    }
                    this.emit('message', { data: event.data })
                } catch (e) {
                    console.error('Failed to parse WebSocket message:', e)
                }
            }

            this.ws.onclose = (event) => {
                console.log('WebSocket disconnected:', event.code, event.reason)
                this.emit('close')
                this.stopPingInterval()
                this.handleReconnect()
            }

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error)
                this.emit('error', error)
                toast({
                    title: "Connection Error",
                    description: "Failed to connect to the whiteboard. Retrying...",
                    variant: "destructive"
                })
            }
        } catch (error) {
            console.error('Failed to create WebSocket:', error)
            this.handleReconnect()
        }
    }

    private startPingInterval() {
        this.stopPingInterval() // Clear any existing interval
        this.pingInterval = setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.send(JSON.stringify({ type: 'ping' }))
            }
        }, 30000) // Send ping every 30 seconds
    }

    private stopPingInterval() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval)
            this.pingInterval = null
        }
    }

    private handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++
            this.reconnectTimeout *= 2 // Exponential backoff

            toast({
                title: "Reconnecting...",
                description: `Attempt ${this.reconnectAttempts} of ${this.maxReconnectAttempts}`,
                variant: "default"
            })

            setTimeout(() => {
                this.connect()
            }, this.reconnectTimeout)
        } else {
            toast({
                title: "Connection Failed",
                description: "Unable to connect to the whiteboard. Please refresh the page.",
                variant: "destructive"
            })
        }
    }

    public send(data: string) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            try {
                this.ws.send(data)
            } catch (error) {
                console.error('Failed to send WebSocket message:', error)
                this.handleReconnect()
            }
        } else {
            console.warn('WebSocket is not connected')
            this.handleReconnect()
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
        this.stopPingInterval()
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout)
            this.connectionTimeout = null
        }
        if (this.ws) {
            this.ws.close()
            this.ws = null
        }
    }
}

export const createWebSocket = (boardId: string) => {
    return new WhiteboardWebSocket(boardId)
} 