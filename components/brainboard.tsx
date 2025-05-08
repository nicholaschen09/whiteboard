"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Circle,
  MousePointer,
  Pencil,
  Square,
  Trash2,
  Type,
  Download,
  Undo,
  Redo,
  Users,
  Share2,
  ImageIcon,
  Sticker,
  StickyNote,
  ArrowUpRight,
  Eraser,
  Layers,
  Settings,
  HelpCircle,
  Save,
  Sparkles,
} from "lucide-react"
import { ColorPicker } from "./color-picker"
import { UserPresence } from "./user-presence"
import { ShareDialog } from "./share-dialog"
import { StickersPanel } from "./stickers-panel"
import { ImageUploader } from "./image-uploader"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SettingsPanel } from "./settings-panel"
import { LayersPanel } from "./layers-panel"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { HelpDialog } from "./help-dialog"
import { Input } from "@/components/ui/input"
import { AIChat } from "./ai-chat"

// Mock WebSocket connection
const createMockWebSocket = () => {
  const listeners = {
    message: [] as ((data: any) => void)[],
    open: [] as (() => void)[],
  }

  return {
    send: (data: string) => {
      try {
        const parsedData = JSON.parse(data)
        if (parsedData.type === "draw" && parsedData.element) {
          // Simulate broadcasting to other users after a delay
          setTimeout(() => {
            listeners.message.forEach((listener) =>
              listener({
                data: JSON.stringify({
                  ...parsedData,
                  userId: Math.floor(Math.random() * 3) + 2, // Assign to a random user that's not the current user
                }),
              }),
            )
          }, 300)
        }
      } catch (e) {
        console.error("Failed to parse outgoing WebSocket message", e)
      }
    },
    addEventListener: (event: string, callback: any) => {
      if (event === "message") listeners.message.push(callback)
      if (event === "open") {
        listeners.open.push(callback)
        // Simulate connection open
        setTimeout(() => {
          callback()
        }, 500)
      }
    },
    removeEventListener: () => { },
    close: () => { },
  }
}

// Initialize with just the current user
const initialUsers = [
  { id: 1, name: "You", avatar: "/placeholder.svg?height=40&width=40", color: "#FF5733", x: 100, y: 150, online: true }
]

type Tool =
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

type DrawingElement = {
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
}

type Layer = {
  id: string
  name: string
  visible: boolean
  locked: boolean
  elements: DrawingElement[]
}

interface BrainboardProps {
  boardId?: string
}

export function Brainboard({ boardId }: BrainboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentTool, setCurrentTool] = useState<Tool>("pen")
  const [currentColor, setCurrentColor] = useState("#4B5563") // Slate-600 grey color
  const [elements, setElements] = useState<DrawingElement[]>([])
  const [history, setHistory] = useState<DrawingElement[][]>([[]])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [currentElement, setCurrentElement] = useState<DrawingElement | null>(null)
  const [users, setUsers] = useState(initialUsers)
  const [showUsers, setShowUsers] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showStickers, setShowStickers] = useState(false)
  const [showImageUploader, setShowImageUploader] = useState(false)
  const [lineWidth, setLineWidth] = useState(2)
  const [socket, setSocket] = useState<any>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { toast } = useToast()
  const [currentPosition, setCurrentPosition] = useState<{ x: number; y: number } | null>(null)
  const [activeTab, setActiveTab] = useState<string>("draw")
  const [showSettings, setShowSettings] = useState(false)
  const [layers, setLayers] = useState<Layer[]>([{
    id: "default",
    name: "Default Layer",
    visible: true,
    locked: false,
    elements: []
  }])
  const [showLayers, setShowLayers] = useState(false)
  const [activeLayer, setActiveLayer] = useState<string>("default")
  const [showGrid, setShowGrid] = useState(false)
  const [snapToGrid, setSnapToGrid] = useState(false)
  const GRID_SIZE = 20 // Size of grid cells in pixels
  const [eraserSize, setEraserSize] = useState(10) // Default eraser size
  const [showHelp, setShowHelp] = useState(false)
  const [showTextInput, setShowTextInput] = useState(false)
  const [textInputPosition, setTextInputPosition] = useState<{ x: number; y: number } | null>(null)
  const [textInputValue, setTextInputValue] = useState("")
  const [selectedElement, setSelectedElement] = useState<DrawingElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<'nw' | 'ne' | 'sw' | 'se' | null>(null)
  const [originalSize, setOriginalSize] = useState<{ width: number; height: number; x: number; y: number } | null>(null)
  const [resizeStartPoint, setResizeStartPoint] = useState<{ x: number; y: number } | null>(null)

  // Add temporary canvas ref
  const tempCanvasRef = useRef<HTMLCanvasElement>(null)
  const [tempContext, setTempContext] = useState<CanvasRenderingContext2D | null>(null)

  // Add image cache state
  const [imageCache, setImageCache] = useState<{ [key: string]: HTMLImageElement }>({})

  // Add function to preload image
  const preloadImage = (imageUrl: string) => {
    if (imageCache[imageUrl]) return imageCache[imageUrl]

    const img = new Image()
    img.src = imageUrl
    img.crossOrigin = "anonymous"
    setImageCache(prev => ({ ...prev, [imageUrl]: img }))
    return img
  }

  // Load saved data on initial render
  useEffect(() => {
    try {
      const savedElements = localStorage.getItem('whiteboard-elements')
      if (savedElements) {
        const parsedElements = JSON.parse(savedElements)
        setElements(parsedElements)
      }

      const savedLayers = localStorage.getItem('whiteboard-layers')
      if (savedLayers) {
        const parsedLayers = JSON.parse(savedLayers)
        setLayers(parsedLayers)
      }
    } catch (e) {
      console.error('Failed to load saved data:', e)
    }
  }, [])

  // Save elements whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('whiteboard-elements', JSON.stringify(elements))
    } catch (e) {
      console.error('Failed to save elements:', e)
    }
  }, [elements])

  // Save layers whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('whiteboard-layers', JSON.stringify(layers))
    } catch (e) {
      console.error('Failed to save layers:', e)
    }
  }, [layers])

  // Update elements when active layer changes
  useEffect(() => {
    const currentLayer = layers.find(layer => layer.id === activeLayer)
    if (currentLayer) {
      setElements(currentLayer.elements)
    }
  }, [activeLayer])

  // Update layers when elements change
  useEffect(() => {
    setLayers(prevLayers => {
      return prevLayers.map(layer => {
        if (layer.id === activeLayer) {
          return {
            ...layer,
            elements: elements
          }
        }
        return layer
      })
    })
  }, [elements, activeLayer])

  // Set initial active layer
  useEffect(() => {
    if (layers.length > 0) {
      const firstVisibleLayer = layers.find(layer => layer.visible)
      if (firstVisibleLayer) {
        setActiveLayer(firstVisibleLayer.id)
      }
    }
  }, []) // Run only once on mount

  // Add this near the top of the component, after the useState declarations
  useEffect(() => {
    // Check if there's a board ID in the URL (for joining via share link)
    const checkForBoardId = () => {
      if (boardId) {
        // We found a board ID in the URL, so we're joining an existing board
        toast({
          title: "Joining Brainboard",
          description: `Connecting to board ${boardId}...`,
        })

        // In a real app, we would fetch the board data from the server
        // For now, we'll just simulate joining
        setTimeout(() => {
          toast({
            title: "Connected!",
            description: "You've joined the collaborative whiteboard",
          })
        }, 1500)

        return boardId
      }

      const path = window.location.pathname
      const boardIdMatch = path.match(/\/board\/([a-zA-Z0-9]+)/)

      if (boardIdMatch && boardIdMatch[1]) {
        const urlBoardId = boardIdMatch[1]

        // We found a board ID in the URL, so we're joining an existing board
        toast({
          title: "Joining Brainboard",
          description: `Connecting to board ${urlBoardId}...`,
        })

        // In a real app, we would fetch the board data from the server
        // For now, we'll just simulate joining
        setTimeout(() => {
          toast({
            title: "Connected!",
            description: "You've joined the collaborative whiteboard",
          })
        }, 1500)

        return urlBoardId
      }

      // No board ID in URL, check localStorage for previously created board
      return localStorage.getItem("brainboard-id") || null
    }

    const detectedBoardId = checkForBoardId()
    if (detectedBoardId) {
      console.log("Connected to board:", detectedBoardId)
      // In a real app, we would use this ID to connect to the specific board
    }
  }, [boardId])

  // Initialize WebSocket connection
  useEffect(() => {
    const ws = createMockWebSocket()

    ws.addEventListener("open", () => {
      setIsConnected(true)
      toast({
        title: "Connected to Brainboard",
        description: "You are now collaborating in real-time",
      })
    })

    ws.addEventListener("message", (event: any) => {
      try {
        if (!event.data) return

        const data = JSON.parse(event.data)
        if (!data) return

        if (data.type === "draw" && data.element) {
          // Add the element to the current layer
          setLayers(prevLayers =>
            prevLayers.map(layer =>
              layer.id === activeLayer
                ? { ...layer, elements: [...layer.elements, data.element] }
                : layer
            )
          )
          setElements(prev => [...prev, data.element])
        } else if (data.type === "userMove" && typeof data.userId === 'number' && typeof data.x === 'number' && typeof data.y === 'number') {
          setUsers(prev => prev.map(user =>
            user.id === data.userId
              ? { ...user, x: data.x, y: data.y }
              : user
          ))
        } else if (data.type === "clear" && data.userId) {
          // Handle board clear from other users
          setLayers(prevLayers =>
            prevLayers.map(layer => ({
              ...layer,
              elements: []
            }))
          )
          setElements([])
          setHistory([])
          setHistoryIndex(-1)
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message", e)
      }
    })

    setSocket(ws)

    return () => {
      ws.close()
    }
  }, [activeLayer]) // Add activeLayer to dependencies

  // Initialize canvas context
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d", { willReadFrequently: true })

      // Set canvas size to match parent container
      const resizeCanvas = () => {
        const container = canvas.parentElement
        if (container) {
          const dpr = window.devicePixelRatio || 1
          const rect = container.getBoundingClientRect()

          // Set the canvas size accounting for device pixel ratio
          canvas.width = rect.width * dpr
          canvas.height = rect.height * dpr

          // Scale the context to ensure correct drawing
          ctx?.scale(dpr, dpr)

          // Set the canvas CSS size
          canvas.style.width = `${rect.width}px`
          canvas.style.height = `${rect.height}px`

          // Draw elements immediately after resizing
          if (ctx) {
            drawElements()
          }
        }
      }

      // Set initial size
      resizeCanvas()

      // Add resize listener
      window.addEventListener("resize", resizeCanvas)

      if (ctx) {
        setContext(ctx)
        // Draw elements immediately after setting context
        drawElements()
      }

      return () => {
        window.removeEventListener("resize", resizeCanvas)
      }
    }
  }, []) // Empty dependency array since we only want this to run once on mount

  // Redraw all elements when they change
  useEffect(() => {
    if (context && canvasRef.current) {
      drawElements()
    }
  }, [elements, context]) // Add context to dependencies

  // Add a new effect to handle initial load
  useEffect(() => {
    if (elements.length > 0 && context && canvasRef.current) {
      drawElements()
    }
  }, [context]) // This will run when context is first set

  // Simulate other users moving around
  useEffect(() => {
    const interval = setInterval(() => {
      setUsers((prevUsers) =>
        prevUsers.map((user) => {
          if (user.id !== 1 && user.online) {
            // Don't move the current user
            const newX = user.x + (Math.random() * 20 - 10)
            const newY = user.y + (Math.random() * 20 - 10)

            // Broadcast user movement
            if (socket && isConnected) {
              socket.send(
                JSON.stringify({
                  type: "userMove",
                  userId: user.id,
                  x: newX,
                  y: newY,
                }),
              )
            }

            return {
              ...user,
              x: newX,
              y: newY,
            }
          }
          return user
        }),
      )
    }, 2000)

    return () => clearInterval(interval)
  }, [socket, isConnected])

  // Add effect to redraw when grid settings change
  useEffect(() => {
    if (context && canvasRef.current) {
      drawElements()
    }
  }, [showGrid, snapToGrid]) // Add grid settings to dependencies

  // Update drawGrid function to make grid more visible
  const drawGrid = () => {
    if (!context || !canvasRef.current || !showGrid) return

    const canvas = canvasRef.current
    context.save()
    context.strokeStyle = 'rgba(229, 231, 235, 0.8)' // Light grey color with less transparency
    context.lineWidth = 1 // Make lines more visible

    // Draw vertical lines
    for (let x = 0; x <= canvas.width; x += GRID_SIZE) {
      context.beginPath()
      context.moveTo(x, 0)
      context.lineTo(x, canvas.height)
      context.stroke()
    }

    // Draw horizontal lines
    for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
      context.beginPath()
      context.moveTo(0, y)
      context.lineTo(canvas.width, y)
      context.stroke()
    }

    context.restore()
  }

  // Update drawElements to show selection indicator for all element types
  const drawElements = () => {
    if (!context || !canvasRef.current) return

    const canvas = canvasRef.current
    context.clearRect(0, 0, canvas.width, canvas.height)

    // Draw grid first
    if (showGrid) {
      drawGrid()
    }

    // Draw elements from all visible layers
    layers.forEach(layer => {
      if (layer.visible) {
        layer.elements.forEach(element => {
          context.strokeStyle = element.color
          context.fillStyle = element.color
          context.lineWidth = element.lineWidth || 2

          switch (element.type) {
            case "pen":
              if (element.points && element.points.length > 0) {
                context.beginPath()
                context.moveTo(element.points[0].x, element.points[0].y)
                element.points.forEach(point => {
                  context.lineTo(point.x, point.y)
                })
                context.stroke()

                // Draw selection indicator if this element is selected
                if (selectedElement && selectedElement.id === element.id) {
                  const bounds = element.points.reduce(
                    (acc, point) => ({
                      minX: Math.min(acc.minX, point.x),
                      minY: Math.min(acc.minY, point.y),
                      maxX: Math.max(acc.maxX, point.x),
                      maxY: Math.max(acc.maxY, point.y)
                    }),
                    {
                      minX: element.points[0].x,
                      minY: element.points[0].y,
                      maxX: element.points[0].x,
                      maxY: element.points[0].y
                    }
                  )
                  context.strokeStyle = "#3b82f6"
                  context.lineWidth = 1
                  context.strokeRect(
                    bounds.minX - 2,
                    bounds.minY - 2,
                    bounds.maxX - bounds.minX + 4,
                    bounds.maxY - bounds.minY + 4
                  )

                  // Draw resize handles
                  const handleSize = 8
                  context.fillStyle = "#3b82f6"
                  // Top-left
                  context.fillRect(bounds.minX - handleSize / 2, bounds.minY - handleSize / 2, handleSize, handleSize)
                  // Top-right
                  context.fillRect(bounds.maxX - handleSize / 2, bounds.minY - handleSize / 2, handleSize, handleSize)
                  // Bottom-left
                  context.fillRect(bounds.minX - handleSize / 2, bounds.maxY - handleSize / 2, handleSize, handleSize)
                  // Bottom-right
                  context.fillRect(bounds.maxX - handleSize / 2, bounds.maxY - handleSize / 2, handleSize, handleSize)
                }
              }
              break

            case "rectangle":
            case "circle":
            case "image":
            case "note":
              if (
                element.x !== undefined &&
                element.y !== undefined &&
                element.width !== undefined &&
                element.height !== undefined
              ) {
                // Draw the element
                if (element.type === "rectangle") {
                  context.beginPath()
                  context.rect(element.x, element.y, element.width, element.height)
                  context.stroke()
                } else if (element.type === "circle") {
                  const centerX = element.x + element.width / 2
                  const centerY = element.y + element.width / 2
                  const radius = element.width / 2
                  context.beginPath()
                  context.arc(centerX, centerY, radius, 0, Math.PI * 2)
                  context.stroke()
                } else if (element.type === "image" && element.imageUrl) {
                  const img = imageCache[element.imageUrl] || preloadImage(element.imageUrl)
                  if (img.complete) {
                    context.drawImage(img, element.x, element.y, element.width, element.height)
                  }
                } else if (element.type === "note" && element.text) {
                  // Draw sticky note background with solid color
                  context.fillStyle = element.color
                  context.fillRect(element.x, element.y, element.width, element.height)
                  // Draw text
                  context.fillStyle = "#000000"
                  context.font = "14px Inter, sans-serif"
                  const words = element.text.split(" ")
                  let line = ""
                  const lineHeight = 18
                  let offsetY = 20
                  for (let i = 0; i < words.length; i++) {
                    const testLine = line + words[i] + " "
                    const metrics = context.measureText(testLine)
                    if (metrics.width > element.width - 20 && i > 0) {
                      context.fillText(line, element.x + 10, element.y + offsetY)
                      line = words[i] + " "
                      offsetY += lineHeight
                    } else {
                      line = testLine
                    }
                  }
                  context.fillText(line, element.x + 10, element.y + offsetY)
                }

                // Draw selection indicator if this element is selected
                if (selectedElement && selectedElement.id === element.id) {
                  context.strokeStyle = "#3b82f6"
                  context.lineWidth = 1
                  context.strokeRect(
                    element.x - 2,
                    element.y - 2,
                    element.width + 4,
                    element.height + 4
                  )

                  // Draw resize handles
                  const handleSize = 8
                  context.fillStyle = "#3b82f6"
                  // Top-left
                  context.fillRect(element.x - handleSize / 2, element.y - handleSize / 2, handleSize, handleSize)
                  // Top-right
                  context.fillRect(element.x + element.width - handleSize / 2, element.y - handleSize / 2, handleSize, handleSize)
                  // Bottom-left
                  context.fillRect(element.x - handleSize / 2, element.y + element.height - handleSize / 2, handleSize, handleSize)
                  // Bottom-right
                  context.fillRect(element.x + element.width - handleSize / 2, element.y + element.height - handleSize / 2, handleSize, handleSize)
                }
              }
              break

            case "text":
              if (element.x !== undefined && element.y !== undefined && element.text) {
                context.font = "16px Inter, sans-serif"
                context.fillStyle = element.color
                context.fillText(element.text, element.x, element.y)

                // Draw selection indicator if this element is selected
                if (selectedElement && selectedElement.id === element.id) {
                  const metrics = context.measureText(element.text)
                  context.strokeStyle = "#3b82f6"
                  context.lineWidth = 1
                  context.strokeRect(
                    element.x - 2,
                    element.y - 16,
                    metrics.width + 4,
                    20
                  )

                  // Draw resize handles
                  const handleSize = 8
                  context.fillStyle = "#3b82f6"
                  // Top-left
                  context.fillRect(element.x - handleSize / 2, element.y - 16 - handleSize / 2, handleSize, handleSize)
                  // Top-right
                  context.fillRect(element.x + metrics.width - handleSize / 2, element.y - 16 - handleSize / 2, handleSize, handleSize)
                  // Bottom-left
                  context.fillRect(element.x - handleSize / 2, element.y + 4 - handleSize / 2, handleSize, handleSize)
                  // Bottom-right
                  context.fillRect(element.x + metrics.width - handleSize / 2, element.y + 4 - handleSize / 2, handleSize, handleSize)
                }
              }
              break

            case "sticker":
              if (element.x !== undefined && element.y !== undefined && element.stickerType) {
                context.font = "32px sans-serif"
                context.fillText(element.stickerType, element.x, element.y)

                // Draw selection indicator if this element is selected
                if (selectedElement && selectedElement.id === element.id) {
                  const metrics = context.measureText(element.stickerType)
                  context.strokeStyle = "#3b82f6"
                  context.lineWidth = 1
                  context.strokeRect(
                    element.x - 2,
                    element.y - 32,
                    metrics.width + 4,
                    36
                  )

                  // Draw resize handles
                  const handleSize = 8
                  context.fillStyle = "#3b82f6"
                  // Top-left
                  context.fillRect(element.x - handleSize / 2, element.y - 32 - handleSize / 2, handleSize, handleSize)
                  // Top-right
                  context.fillRect(element.x + metrics.width - handleSize / 2, element.y - 32 - handleSize / 2, handleSize, handleSize)
                  // Bottom-left
                  context.fillRect(element.x - handleSize / 2, element.y + 4 - handleSize / 2, handleSize, handleSize)
                  // Bottom-right
                  context.fillRect(element.x + metrics.width - handleSize / 2, element.y + 4 - handleSize / 2, handleSize, handleSize)
                }
              }
              break

            case "arrow":
              if (element.points && element.points.length > 1) {
                const start = element.points[0]
                const end = element.points[element.points.length - 1]

                // Draw line
                context.beginPath()
                context.moveTo(start.x, start.y)
                context.lineTo(end.x, end.y)
                context.stroke()

                // Draw arrowhead
                const angle = Math.atan2(end.y - start.y, end.x - start.x)
                context.beginPath()
                context.moveTo(end.x, end.y)
                context.lineTo(end.x - 15 * Math.cos(angle - Math.PI / 6), end.y - 15 * Math.sin(angle - Math.PI / 6))
                context.lineTo(end.x - 15 * Math.cos(angle + Math.PI / 6), end.y - 15 * Math.sin(angle + Math.PI / 6))
                context.closePath()
                context.fill()

                // Draw selection indicator if this element is selected
                if (selectedElement && selectedElement.id === element.id) {
                  const bounds = element.points.reduce(
                    (acc, point) => ({
                      minX: Math.min(acc.minX, point.x),
                      minY: Math.min(acc.minY, point.y),
                      maxX: Math.max(acc.maxX, point.x),
                      maxY: Math.max(acc.maxY, point.y)
                    }),
                    {
                      minX: element.points[0].x,
                      minY: element.points[0].y,
                      maxX: element.points[0].x,
                      maxY: element.points[0].y
                    }
                  )
                  context.strokeStyle = "#3b82f6"
                  context.lineWidth = 1
                  context.strokeRect(
                    bounds.minX - 2,
                    bounds.minY - 2,
                    bounds.maxX - bounds.minX + 4,
                    bounds.maxY - bounds.minY + 4
                  )

                  // Draw resize handles
                  const handleSize = 8
                  context.fillStyle = "#3b82f6"
                  // Top-left
                  context.fillRect(bounds.minX - handleSize / 2, bounds.minY - handleSize / 2, handleSize, handleSize)
                  // Top-right
                  context.fillRect(bounds.maxX - handleSize / 2, bounds.minY - handleSize / 2, handleSize, handleSize)
                  // Bottom-left
                  context.fillRect(bounds.minX - handleSize / 2, bounds.maxY - handleSize / 2, handleSize, handleSize)
                  // Bottom-right
                  context.fillRect(bounds.maxX - handleSize / 2, bounds.maxY - handleSize / 2, handleSize, handleSize)
                }
              }
              break
          }
        })
      }
    })
  }

  // Add function to snap coordinates to grid
  const snapToGridPoint = (x: number, y: number) => {
    if (!snapToGrid) return { x, y }
    return {
      x: Math.round(x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(y / GRID_SIZE) * GRID_SIZE
    }
  }

  // Update handleMouseDown to better handle resize initiation
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!context || !canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()

    // Calculate the exact cursor position relative to the canvas
    let x = e.clientX - rect.left
    let y = e.clientY - rect.top

    // Apply grid snapping
    const snapped = snapToGridPoint(x, y)
    x = snapped.x
    y = snapped.y

    // Check if clicking on a sticky note
    const isClickingOnNote = elements.some(element =>
      element.type === "note" &&
      element.x !== undefined &&
      element.y !== undefined &&
      element.width !== undefined &&
      element.height !== undefined &&
      x >= element.x &&
      x <= element.x + element.width &&
      y >= element.y &&
      y <= element.y + element.height
    )

    // If clicking on a note and not using select tool, don't start drawing
    if (isClickingOnNote && currentTool !== "select") {
      return
    }

    setIsDrawing(true)

    // Update current user position
    setUsers((prevUsers) => prevUsers.map((user) => (user.id === 1 ? { ...user, x, y } : user)))

    // Handle eraser tool
    if (currentTool === "eraser") {
      handleErasing(x, y)
      return
    }

    // Handle select tool
    if (currentTool === "select") {
      // Check if we clicked on any element
      const clickedElement = elements.find(element => {
        if (!element) return false

        switch (element.type) {
          case "text":
          case "sticker":
            if (element.x !== undefined && element.y !== undefined) {
              const dx = x - element.x
              const dy = y - element.y
              return Math.sqrt(dx * dx + dy * dy) < 20 // 20px click radius
            }
            return false

          case "rectangle":
          case "circle":
          case "image":
          case "note":
            if (element.x !== undefined && element.y !== undefined &&
              element.width !== undefined && element.height !== undefined) {
              // Check if click is on resize handle
              const handleSize = 8
              const isOnResizeHandle =
                (x >= element.x + element.width - handleSize && x <= element.x + element.width + handleSize &&
                  y >= element.y + element.height - handleSize && y <= element.y + element.height + handleSize) ? 'se' :
                  (x >= element.x - handleSize && x <= element.x + handleSize &&
                    y >= element.y - handleSize && y <= element.y + handleSize) ? 'nw' :
                    (x >= element.x + element.width - handleSize && x <= element.x + element.width + handleSize &&
                      y >= element.y - handleSize && y <= element.y + handleSize) ? 'ne' :
                      (x >= element.x - handleSize && x <= element.x + handleSize &&
                        y >= element.y + element.height - handleSize && y <= element.y + element.height + handleSize) ? 'sw' : null

              if (isOnResizeHandle) {
                setIsResizing(true)
                setResizeDirection(isOnResizeHandle)
                setOriginalSize({
                  width: element.width,
                  height: element.height,
                  x: element.x,
                  y: element.y
                })
                setResizeStartPoint({ x, y })
                return true
              }

              return x >= element.x && x <= element.x + element.width &&
                y >= element.y && y <= element.y + element.height
            }
            return false

          case "pen":
          case "arrow":
            if (element.points) {
              return element.points.some(point => {
                const dx = x - point.x
                const dy = y - point.y
                return Math.sqrt(dx * dx + dy * dy) < 10 // 10px click radius
              })
            }
            return false

          default:
            return false
        }
      })

      if (clickedElement) {
        setSelectedElement(clickedElement)
        setIsDragging(true)
        setDragOffset({
          x: x - (clickedElement.x || 0),
          y: y - (clickedElement.y || 0)
        })
        return
      } else {
        setSelectedElement(null)
      }
    }

    const newElement: DrawingElement = {
      id: Date.now().toString(),
      type: currentTool,
      color: currentColor,
      userId: 1,
      lineWidth,
    }

    switch (currentTool) {
      case "pen":
      case "arrow":
        newElement.points = [{ x, y }]
        break

      case "rectangle":
        newElement.x = x
        newElement.y = y
        newElement.width = 0
        newElement.height = 0
        break

      case "circle":
        newElement.x = x
        newElement.y = y
        newElement.width = 0
        newElement.height = 0
        break

      case "select":
        return
    }

    setCurrentElement(newElement)
  }

  const handleTextSubmit = () => {
    if (textInputValue.trim()) {
      // Get the center of the canvas for text placement
      const canvas = canvasRef.current
      if (canvas) {
        // Convert canvas coordinates to account for device pixel ratio
        const dpr = window.devicePixelRatio || 1
        const x = (canvas.width / dpr) / 2
        const y = (canvas.height / dpr) / 2

        const newElement: DrawingElement = {
          id: Date.now().toString(),
          type: "text",
          x,
          y,
          text: textInputValue,
          color: currentColor,
          userId: 1,
          lineWidth,
        }
        addElement(newElement)

        // Force a redraw of the canvas
        if (context) {
          drawElements()
        }
      }
    }
    setShowTextInput(false)
    setTextInputValue("")
  }

  // Update handleMouseMove to make resizing smoother
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()

    // Calculate the exact cursor position relative to the canvas
    let x = e.clientX - rect.left
    let y = e.clientY - rect.top

    // Apply grid snapping
    const snapped = snapToGridPoint(x, y)
    x = snapped.x
    y = snapped.y

    // Update current user position
    setUsers((prevUsers) => prevUsers.map((user) => (user.id === 1 ? { ...user, x, y } : user)))

    // Handle resizing
    if (isResizing && selectedElement && originalSize && resizeStartPoint) {
      const element = selectedElement
      let newWidth = originalSize.width
      let newHeight = originalSize.height
      let newX = originalSize.x
      let newY = originalSize.y

      // Calculate the change in position
      const dx = x - resizeStartPoint.x
      const dy = y - resizeStartPoint.y

      switch (resizeDirection) {
        case 'se':
          if (element.type === 'circle') {
            const radius = Math.max(20, Math.sqrt(dx * dx + dy * dy))
            newWidth = radius * 2
            newHeight = radius * 2
          } else {
            newWidth = Math.max(20, originalSize.width + dx)
            newHeight = Math.max(20, originalSize.height + dy)
          }
          break
        case 'sw':
          if (element.type === 'circle') {
            const radius = Math.max(20, Math.sqrt(dx * dx + dy * dy))
            newWidth = radius * 2
            newHeight = radius * 2
            newX = originalSize.x + originalSize.width - newWidth
          } else {
            newWidth = Math.max(20, originalSize.width - dx)
            newHeight = Math.max(20, originalSize.height + dy)
            newX = originalSize.x + dx
          }
          break
        case 'ne':
          if (element.type === 'circle') {
            const radius = Math.max(20, Math.sqrt(dx * dx + dy * dy))
            newWidth = radius * 2
            newHeight = radius * 2
            newY = originalSize.y + originalSize.height - newHeight
          } else {
            newWidth = Math.max(20, originalSize.width + dx)
            newHeight = Math.max(20, originalSize.height - dy)
            newY = originalSize.y + dy
          }
          break
        case 'nw':
          if (element.type === 'circle') {
            const radius = Math.max(20, Math.sqrt(dx * dx + dy * dy))
            newWidth = radius * 2
            newHeight = radius * 2
            newX = originalSize.x + originalSize.width - newWidth
            newY = originalSize.y + originalSize.height - newHeight
          } else {
            newWidth = Math.max(20, originalSize.width - dx)
            newHeight = Math.max(20, originalSize.height - dy)
            newX = originalSize.x + dx
            newY = originalSize.y + dy
          }
          break
      }

      // Update the element's position and size
      const updatedElement = {
        ...element,
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight
      }

      // Update the elements array
      setElements(prevElements =>
        prevElements.map(el =>
          el.id === selectedElement.id ? updatedElement : el
        )
      )

      // Update the layers
      setLayers(prevLayers =>
        prevLayers.map(layer =>
          layer.id === activeLayer
            ? {
              ...layer,
              elements: layer.elements.map(el =>
                el.id === selectedElement.id ? updatedElement : el
              )
            }
            : layer
        )
      )

      // Force a redraw
      if (context) {
        drawElements()
      }
      return
    }

    // Handle dragging selected element
    if (isDragging && selectedElement) {
      const newX = x - dragOffset.x
      const newY = y - dragOffset.y

      // Update state and redraw in a single animation frame
      requestAnimationFrame(() => {
        const updatedElements = elements.map(element =>
          element.id === selectedElement.id
            ? {
              ...element,
              x: newX,
              y: newY,
              points: element.points?.map(point => ({
                x: point.x + (newX - (element.x || 0)),
                y: point.y + (newY - (element.y || 0))
              }))
            }
            : element
        )

        setElements(updatedElements)
        setLayers(prevLayers =>
          prevLayers.map(layer =>
            layer.id === activeLayer
              ? { ...layer, elements: updatedElements }
              : layer
          )
        )

        if (context) {
          drawElements()
        }
      })
      return
    }

    // If not drawing, just update cursor position and return
    if (!isDrawing || !currentElement) return

    // Check if current position is on a sticky note
    const isOnNote = elements.some(element => 
      element.type === "note" &&
      element.x !== undefined &&
      element.y !== undefined &&
      element.width !== undefined &&
      element.height !== undefined &&
      x >= element.x &&
      x <= element.x + element.width &&
      y >= element.y &&
      y <= element.y + element.height
    )

    // If on a note, stop drawing
    if (isOnNote) {
      setIsDrawing(false)
      if (currentElement) {
        addElement(currentElement)
        setCurrentElement(null)
      }
      return
    }

    const updatedElement = { ...currentElement }

    switch (currentTool) {
      case "pen":
      case "arrow":
        updatedElement.points = [...(updatedElement.points || []), { x, y }]
        break

      case "rectangle":
        if (updatedElement.x !== undefined && updatedElement.y !== undefined) {
          updatedElement.width = x - updatedElement.x
          updatedElement.height = y - updatedElement.y
        }
        break

      case "circle":
        if (updatedElement.x !== undefined && updatedElement.y !== undefined) {
          const dx = x - updatedElement.x
          const dy = y - updatedElement.y
          const radius = Math.sqrt(dx * dx + dy * dy)
          updatedElement.width = radius * 2
          updatedElement.height = radius * 2
        }
        break
    }

    setCurrentElement(updatedElement)

    // Redraw everything including the current element
    if (context) {
      drawElements()

      // Draw the current element
      context.strokeStyle = updatedElement.color
      context.fillStyle = updatedElement.color
      context.lineWidth = updatedElement.lineWidth || lineWidth

      switch (updatedElement.type) {
        case "pen":
          if (updatedElement.points && updatedElement.points.length > 0) {
            context.beginPath()
            context.moveTo(updatedElement.points[0].x, updatedElement.points[0].y)

            updatedElement.points.forEach((point) => {
              context.lineTo(point.x, point.y)
            })

            context.stroke()
          }
          break

        case "rectangle":
          if (
            updatedElement.x !== undefined &&
            updatedElement.y !== undefined &&
            updatedElement.width !== undefined &&
            updatedElement.height !== undefined
          ) {
            context.beginPath()
            context.rect(updatedElement.x, updatedElement.y, updatedElement.width, updatedElement.height)
            context.stroke()
          }
          break

        case "circle":
          if (
            updatedElement.x !== undefined &&
            updatedElement.y !== undefined &&
            updatedElement.width !== undefined
          ) {
            const centerX = updatedElement.x + updatedElement.width / 2
            const centerY = updatedElement.y + updatedElement.width / 2
            const radius = updatedElement.width / 2

            context.beginPath()
            context.arc(centerX, centerY, radius, 0, Math.PI * 2)
            context.stroke()
          }
          break

        case "arrow":
          if (updatedElement.points && updatedElement.points.length > 1) {
            const start = updatedElement.points[0]
            const end = updatedElement.points[updatedElement.points.length - 1]

            // Draw line
            context.beginPath()
            context.moveTo(start.x, start.y)
            context.lineTo(end.x, end.y)
            context.stroke()

            // Draw arrowhead
            const angle = Math.atan2(end.y - start.y, end.x - start.x)
            context.beginPath()
            context.moveTo(end.x, end.y)
            context.lineTo(end.x - 15 * Math.cos(angle - Math.PI / 6), end.y - 15 * Math.sin(angle - Math.PI / 6))
            context.lineTo(end.x - 15 * Math.cos(angle + Math.PI / 6), end.y - 15 * Math.sin(angle + Math.PI / 6))
            context.closePath()
            context.fill()
          }
          break
      }
    }
  }

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false)
    }
    if (isResizing) {
      setIsResizing(false)
      setResizeDirection(null)
      setOriginalSize(null)
      setResizeStartPoint(null)
    }
    if (!isDrawing || !currentElement) return

    addElement(currentElement)
    setCurrentElement(null)
    setIsDrawing(false)
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      const previousElements = history[newIndex]

      // Batch all state updates together
      Promise.resolve().then(() => {
        setHistoryIndex(newIndex)
        setElements(previousElements)
        setLayers(prevLayers =>
          prevLayers.map(layer =>
            layer.id === activeLayer
              ? { ...layer, elements: previousElements }
              : layer
          )
        )
      })

      // Force immediate redraw
      if (context && canvasRef.current) {
        drawElements()
      }
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      const nextElements = history[newIndex]

      // Batch all state updates together
      Promise.resolve().then(() => {
        setHistoryIndex(newIndex)
        setElements(nextElements)
        setLayers(prevLayers =>
          prevLayers.map(layer =>
            layer.id === activeLayer
              ? { ...layer, elements: nextElements }
              : layer
          )
        )
      })

      // Force immediate redraw
      if (context && canvasRef.current) {
        drawElements()
      }
    }
  }

  const addElement = (element: DrawingElement) => {
    // Create new state
    const updatedElements = [...elements, element]

    // Update history
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(updatedElements)

    // Batch all state updates together
    Promise.resolve().then(() => {
      setHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)
      setElements(updatedElements)
      setLayers(prevLayers =>
        prevLayers.map(layer =>
          layer.id === activeLayer
            ? { ...layer, elements: updatedElements }
            : layer
        )
      )
    })

    // Force immediate redraw
    if (context && canvasRef.current) {
      drawElements()
    }

    // Send to WebSocket if connected
    if (socket && isConnected) {
      socket.send(
        JSON.stringify({
          type: "draw",
          element,
          layerId: activeLayer
        })
      )
    }
  }

  // Update the keyboard shortcuts effect to use the latest functions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        if (e.shiftKey) {
          handleRedo()
        } else {
          handleUndo()
        }
      } else if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleRedo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [history, historyIndex, elements, activeLayer]) // Add all dependencies

  const handleClear = () => {
    // Create new state
    const emptyElements: DrawingElement[] = []

    // Update history
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(emptyElements)

    // Update all states at once
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    setElements(emptyElements)
    setLayers(prevLayers =>
      prevLayers.map(layer =>
        layer.id === activeLayer
          ? { ...layer, elements: emptyElements }
          : layer
      )
    )

    // Force immediate redraw
    requestAnimationFrame(() => {
      if (context && canvasRef.current) {
        context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        if (showGrid) {
          drawGrid()
        }
      }
    })
  }

  const handleEraseBoard = () => {
    // Create new state
    const emptyElements: DrawingElement[] = []

    // Update history
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(emptyElements)

    // Update all states at once
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    setElements(emptyElements)
    setLayers(prevLayers =>
      prevLayers.map(layer => ({
        ...layer,
        elements: emptyElements
      }))
    )

    // Force immediate redraw
    requestAnimationFrame(() => {
      if (context && canvasRef.current) {
        context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        if (showGrid) {
          drawGrid()
        }
      }
    })

    // Clear localStorage
    try {
      localStorage.removeItem('whiteboard-elements')
      localStorage.removeItem('whiteboard-layers')
    } catch (e) {
      console.error('Failed to clear localStorage:', e)
    }

    // Notify other users
    if (socket && isConnected) {
      socket.send(
        JSON.stringify({
          type: "clear",
          userId: 1
        })
      )
    }
  }

  const handleDownload = () => {
    if (!canvasRef.current) return

    // Create a temporary canvas for the download
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')
    if (!tempCtx) return

    // Set the temporary canvas size to match the original
    tempCanvas.width = canvasRef.current.width
    tempCanvas.height = canvasRef.current.height

    // Draw all elements except the grid
    tempCtx.save()
    layers.forEach(layer => {
      if (layer.visible) {
        layer.elements.forEach(element => {
          tempCtx.strokeStyle = element.color
          tempCtx.fillStyle = element.color
          tempCtx.lineWidth = element.lineWidth || 2

          switch (element.type) {
            case "pen":
              if (element.points && element.points.length > 0) {
                tempCtx.beginPath()
                tempCtx.moveTo(element.points[0].x, element.points[0].y)

                element.points.forEach((point) => {
                  tempCtx.lineTo(point.x, point.y)
                })

                tempCtx.stroke()
              }
              break

            case "rectangle":
              if (
                element.x !== undefined &&
                element.y !== undefined &&
                element.width !== undefined &&
                element.height !== undefined
              ) {
                tempCtx.beginPath()
                tempCtx.rect(element.x, element.y, element.width, element.height)
                tempCtx.stroke()
              }
              break

            case "circle":
              if (element.x !== undefined && element.y !== undefined && element.width !== undefined) {
                tempCtx.beginPath()
                tempCtx.arc(element.x + element.width / 2, element.y + element.width / 2, element.width / 2, 0, Math.PI * 2)
                tempCtx.stroke()
              }
              break

            case "text":
              if (element.x !== undefined && element.y !== undefined && element.text) {
                tempCtx.font = "16px Inter, sans-serif"
                tempCtx.fillText(element.text, element.x, element.y)
              }
              break

            case "sticker":
              if (element.x !== undefined && element.y !== undefined && element.stickerType) {
                tempCtx.font = "32px sans-serif"
                tempCtx.fillText(element.stickerType, element.x, element.y)
              }
              break

            case "image":
              if (
                element.x !== undefined &&
                element.y !== undefined &&
                element.width !== undefined &&
                element.height !== undefined &&
                element.imageUrl
              ) {
                const img = new Image()
                img.src = element.imageUrl
                img.crossOrigin = "anonymous"
                img.onload = () => {
                  tempCtx.drawImage(img, element.x!, element.y!, element.width!, element.height!)
                }
              }
              break

            case "arrow":
              if (element.points && element.points.length > 1) {
                const start = element.points[0]
                const end = element.points[element.points.length - 1]

                // Draw line
                tempCtx.beginPath()
                tempCtx.moveTo(start.x, start.y)
                tempCtx.lineTo(end.x, end.y)
                tempCtx.stroke()

                // Draw arrowhead
                const angle = Math.atan2(end.y - start.y, end.x - start.x)
                tempCtx.beginPath()
                tempCtx.moveTo(end.x, end.y)
                tempCtx.lineTo(end.x - 15 * Math.cos(angle - Math.PI / 6), end.y - 15 * Math.sin(angle - Math.PI / 6))
                tempCtx.lineTo(end.x - 15 * Math.cos(angle + Math.PI / 6), end.y - 15 * Math.sin(angle + Math.PI / 6))
                tempCtx.closePath()
                tempCtx.fill()
              }
              break

            case "note":
              if (
                element.x !== undefined &&
                element.y !== undefined &&
                element.width !== undefined &&
                element.height !== undefined &&
                element.text &&
                context
              ) {
                // Draw sticky note background with solid color
                context.fillStyle = element.color
                context.fillRect(element.x, element.y, element.width, element.height)
                // Draw text
                context.fillStyle = "#000000"
                context.font = "14px Inter, sans-serif"
                const words = element.text.split(" ")
                let line = ""
                const lineHeight = 18
                let offsetY = 20
                for (let i = 0; i < words.length; i++) {
                  const testLine = line + words[i] + " "
                  const metrics = context.measureText(testLine)
                  if (metrics.width > element.width - 20 && i > 0) {
                    context.fillText(line, element.x + 10, element.y + offsetY)
                    line = words[i] + " "
                    offsetY += lineHeight
                  } else {
                    line = testLine
                  }
                }
                context.fillText(line, element.x + 10, element.y + offsetY)
              }
              break
          }
        })
      }
    })
    tempCtx.restore()

    // Create download link
    const link = document.createElement("a")
    link.download = "brainboard.png"
    link.href = tempCanvas.toDataURL()
    link.click()
  }

  // Replace the handleAddSticker function with this improved version:
  const handleAddSticker = (stickerType: string) => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current

    // Use the stored position from when the sticker tool was selected
    // Or default to center if not available
    const x = currentPosition ? currentPosition.x : canvas.width / 2
    const y = currentPosition ? currentPosition.y : canvas.height / 2

    const newElement: DrawingElement = {
      id: Date.now().toString(),
      type: "sticker",
      color: currentColor,
      userId: 1,
      x,
      y,
      stickerType,
    }

    addElement(newElement)
    setShowStickers(false)
    // Reset current position
    setCurrentPosition(null)
  }

  // Replace the handleAddImage function with this improved version:
  const handleAddImage = (imageUrl: string) => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()

    // Calculate center position
    const x = (rect.width / 2) - 100 // Half of default image width
    const y = (rect.height / 2) - 100 // Half of default image height

    // Preload the image
    preloadImage(imageUrl)

    const newElement: DrawingElement = {
      id: Date.now().toString(),
      type: "image",
      color: currentColor,
      userId: 1,
      x,
      y,
      width: 200,
      height: 200,
      imageUrl,
    }

    addElement(newElement)
    setShowImageUploader(false)
  }

  const handleShare = (emails: string[], shareLink: string, boardId: string) => {
    toast({
      title: "Invitation sent!",
      description: `Invited ${emails.length} people to collaborate`,
    })

    // Store the board ID for future reference
    localStorage.setItem("brainboard-id", boardId)

    // Add simulated users
    if (emails.length > 0) {
      const newUser = {
        id: users.length + 1,
        name: emails[0].split("@")[0],
        avatar: "/placeholder.svg?height=40&width=40",
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        x: Math.random() * 500,
        y: Math.random() * 500,
        online: false,
      }

      setUsers((prev) => [...prev, newUser])

      // Simulate user coming online after a delay
      setTimeout(() => {
        setUsers((prev) => prev.map((user) => (user.id === newUser.id ? { ...user, online: true } : user)))

        toast({
          title: `${newUser.name} joined`,
          description: "A new collaborator has joined your Brainboard",
        })
      }, 3000)
    }

    setShowShareDialog(false)
  }

  const handleLayerVisibilityChange = (layerId: string, visible: boolean) => {
    setLayers(prevLayers =>
      prevLayers.map(layer =>
        layer.id === layerId ? { ...layer, visible } : layer
      )
    )
  }

  const handleLayerLockChange = (layerId: string, locked: boolean) => {
    setLayers(prevLayers =>
      prevLayers.map(layer =>
        layer.id === layerId ? { ...layer, locked } : layer
      )
    )
  }

  const handleLayerMove = (layerId: string, direction: 'up' | 'down') => {
    setLayers(prevLayers => {
      const newLayers = [...prevLayers]
      const currentIndex = newLayers.findIndex(layer => layer.id === layerId)
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

      if (newIndex >= 0 && newIndex < newLayers.length) {
        const temp = newLayers[currentIndex]
        newLayers[currentIndex] = newLayers[newIndex]
        newLayers[newIndex] = temp
      }

      return newLayers
    })
  }

  const handleLayerDelete = (layerId: string) => {
    if (layers.length > 1) {
      setLayers(prevLayers => prevLayers.filter(layer => layer.id !== layerId))
      if (activeLayer === layerId) {
        setActiveLayer(layers[0].id)
      }
    }
  }

  const handleAddLayer = () => {
    const newLayer: Layer = {
      id: Date.now().toString(),
      name: `Layer ${layers.length + 1}`,
      visible: true,
      locked: false,
      elements: []
    }
    setLayers(prevLayers => [...prevLayers, newLayer])
    setActiveLayer(newLayer.id)
  }

  // Update handleErasing to properly remove elements
  const handleErasing = (x: number, y: number) => {
    // Get the current active layer
    const currentLayer = layers.find(layer => layer.id === activeLayer)
    if (!currentLayer) return

    // Find elements that intersect with the eraser
    const elementsToRemove = currentLayer.elements.filter(element => {
      // For all elements, check if the eraser point is within the eraser size
      const isNearPoint = (pointX: number, pointY: number) => {
        const dx = pointX - x
        const dy = pointY - y
        return Math.sqrt(dx * dx + dy * dy) < eraserSize
      }

      switch (element.type) {
        case "pen":
          if (element.points) {
            return element.points.some(point => isNearPoint(point.x, point.y))
          }
          return false

        case "rectangle":
          if (element.x !== undefined && element.y !== undefined &&
            element.width !== undefined && element.height !== undefined) {
            // Check if eraser point is near any of the rectangle's edges or corners
            const points = [
              { x: element.x, y: element.y }, // top-left
              { x: element.x + element.width, y: element.y }, // top-right
              { x: element.x, y: element.y + element.height }, // bottom-left
              { x: element.x + element.width, y: element.y + element.height }, // bottom-right
              { x: element.x + element.width / 2, y: element.y }, // top-center
              { x: element.x + element.width / 2, y: element.y + element.height }, // bottom-center
              { x: element.x, y: element.y + element.height / 2 }, // left-center
              { x: element.x + element.width, y: element.y + element.height / 2 } // right-center
            ]

            // Check if eraser is near any corner or edge point
            if (points.some(point => isNearPoint(point.x, point.y))) {
              return true
            }

            // Check if eraser is inside the rectangle
            if (x >= element.x && x <= element.x + element.width &&
              y >= element.y && y <= element.y + element.height) {
              return true
            }

            // Check if eraser is near any edge of the rectangle
            const isNearEdge = (
              (Math.abs(x - element.x) < eraserSize && y >= element.y && y <= element.y + element.height) || // left edge
              (Math.abs(x - (element.x + element.width)) < eraserSize && y >= element.y && y <= element.y + element.height) || // right edge
              (Math.abs(y - element.y) < eraserSize && x >= element.x && x <= element.x + element.width) || // top edge
              (Math.abs(y - (element.y + element.height)) < eraserSize && x >= element.x && x <= element.x + element.width) // bottom edge
            )

            return isNearEdge
          }
          return false

        case "circle":
          if (element.x !== undefined && element.y !== undefined && element.width !== undefined) {
            const centerX = element.x + element.width / 2
            const centerY = element.y + element.width / 2
            const radius = element.width / 2
            const dx = x - centerX
            const dy = y - centerY
            const distance = Math.sqrt(dx * dx + dy * dy)

            // Check if eraser is near the circle's edge or center
            if (Math.abs(distance - radius) < eraserSize || distance < eraserSize) {
              return true
            }

            // Check if eraser is near any point on the circle's circumference
            const angle = Math.atan2(dy, dx)
            const edgeX = centerX + radius * Math.cos(angle)
            const edgeY = centerY + radius * Math.sin(angle)
            const edgeDistance = Math.sqrt(Math.pow(x - edgeX, 2) + Math.pow(y - edgeY, 2))

            return edgeDistance < eraserSize
          }
          return false

        case "arrow":
          if (element.points && element.points.length > 1) {
            // Check if eraser is near any point in the arrow's path
            return element.points.some(point => isNearPoint(point.x, point.y))
          }
          return false

        case "text":
        case "sticker":
          if (element.x !== undefined && element.y !== undefined) {
            return isNearPoint(element.x, element.y)
          }
          return false

        case "image":
        case "note":
          if (element.x !== undefined && element.y !== undefined &&
            element.width !== undefined && element.height !== undefined) {
            // Check if eraser is near any corner or edge of the image/note
            const points = [
              { x: element.x, y: element.y }, // top-left
              { x: element.x + element.width, y: element.y }, // top-right
              { x: element.x, y: element.y + element.height }, // bottom-left
              { x: element.x + element.width, y: element.y + element.height }, // bottom-right
              { x: element.x + element.width / 2, y: element.y }, // top-center
              { x: element.x + element.width / 2, y: element.y + element.height }, // bottom-center
              { x: element.x, y: element.y + element.height / 2 }, // left-center
              { x: element.x + element.width, y: element.y + element.height / 2 } // right-center
            ]
            return points.some(point => isNearPoint(point.x, point.y))
          }
          return false

        default:
          return false
      }
    })

    if (elementsToRemove.length > 0) {
      // Remove the elements from the current layer
      const newElements = currentLayer.elements.filter(element => !elementsToRemove.includes(element))

      // Update the layers state
      setLayers(prevLayers =>
        prevLayers.map(layer =>
          layer.id === activeLayer
            ? { ...layer, elements: newElements }
            : layer
        )
      )

      // Update the elements state
      setElements(newElements)

      // Add to history for undo/redo
      const newHistory = history.slice(0, historyIndex + 1)
      newHistory.push([...elements])
      setHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)

      // Redraw the canvas
      if (context && canvasRef.current) {
        drawElements()
      }
    }
  }

  const helpContent = [
    {
      title: "Drawing Tools",
      items: [
        "Select tool (S): Click and drag to select elements",
        "Pen tool (P): Draw freehand lines",
        "Rectangle tool (R): Click and drag to draw rectangles",
        "Circle tool (C): Click and drag to draw circles",
        "Arrow tool (A): Click and drag to create arrows",
        "Text tool (T): Click anywhere to add text",
        "Eraser tool (E): Click and drag to erase elements"
      ]
    },
    {
      title: "Insert Tools",
      items: [
        "Sticky Notes: Add text notes with background color",
        "Stickers: Add emoji and symbols",
        "Images: Upload and insert images",
        "Custom Colors: Use the color picker to create custom colors"
      ]
    },
    {
      title: "View & Organization",
      items: [
        "Layers: Organize elements in different layers",
        "Grid: Toggle grid for precise alignment",
        "Snap to Grid: Enable to align elements perfectly",
        "Zoom: Use mouse wheel to zoom in/out",
        "Pan: Hold Space + drag to move canvas"
      ]
    },
    {
      title: "Keyboard Shortcuts",
      items: [
        "Ctrl/Cmd + Z: Undo",
        "Ctrl/Cmd + Y: Redo",
        "Delete: Remove selected elements",
        "Ctrl/Cmd + C: Copy selected elements",
        "Ctrl/Cmd + V: Paste elements",
        "Ctrl/Cmd + S: Save board",
        "Esc: Cancel current operation"
      ]
    }
  ]

  const handleSave = () => {
    try {
      // Save all layers and their elements
      const saveData = {
        layers,
        elements,
        history,
        historyIndex,
        activeLayer,
        currentColor,
        lineWidth
      }

      localStorage.setItem('whiteboard-data', JSON.stringify(saveData))

      toast({
        title: "Saved!",
        description: "Your whiteboard has been saved successfully.",
      })
    } catch (e) {
      console.error('Failed to save whiteboard:', e)
      toast({
        title: "Error",
        description: "Failed to save whiteboard. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Replace the existing load effect with this enhanced version
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('whiteboard-data')
      if (savedData) {
        const data = JSON.parse(savedData)

        // Restore all saved data
        if (data.layers) setLayers(data.layers)
        if (data.elements) setElements(data.elements)
        if (data.history) setHistory(data.history)
        if (data.historyIndex !== undefined) setHistoryIndex(data.historyIndex)
        if (data.activeLayer) setActiveLayer(data.activeLayer)
        if (data.currentColor) setCurrentColor(data.currentColor)
        if (data.lineWidth) setLineWidth(data.lineWidth)

        // Force a redraw after loading
        if (context && canvasRef.current) {
          drawElements()
        }
      }
    } catch (e) {
      console.error('Failed to load saved data:', e)
    }
  }, []) // Empty dependency array means this runs once on mount

  // Update the auto-save effect
  useEffect(() => {
    const autoSave = () => {
      try {
        const saveData = {
          layers,
          elements,
          history,
          historyIndex,
          activeLayer,
          currentColor,
          lineWidth
        }
        localStorage.setItem('whiteboard-data', JSON.stringify(saveData))
      } catch (e) {
        console.error('Failed to auto-save:', e)
      }
    }

    // Auto-save every 10 seconds
    const interval = setInterval(autoSave, 10000)

    return () => clearInterval(interval)
  }, [layers, elements, history, historyIndex, activeLayer, currentColor, lineWidth])

  // Add save on window unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        const saveData = {
          layers,
          elements,
          history,
          historyIndex,
          activeLayer,
          currentColor,
          lineWidth
        }
        localStorage.setItem('whiteboard-data', JSON.stringify(saveData))
      } catch (e) {
        console.error('Failed to save on unload:', e)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [layers, elements, history, historyIndex, activeLayer, currentColor, lineWidth])

  const [showAIChat, setShowAIChat] = useState(false)

  // Add back the note editing states
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [noteInputValue, setNoteInputValue] = useState("")
  const [notePosition, setNotePosition] = useState({ x: 0, y: 0 })
  const [noteColor, setNoteColor] = useState("#FFEB3B") // Default yellow color

  // Add double-click handler for editing notes
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Find if we clicked on a note
    const clickedNote = elements.find(element =>
      element.type === "note" &&
      element.x !== undefined &&
      element.y !== undefined &&
      element.width !== undefined &&
      element.height !== undefined &&
      x >= element.x &&
      x <= element.x + element.width &&
      y >= element.y &&
      y <= element.y + element.height
    )

    if (clickedNote) {
      setSelectedElement(clickedNote)
      setShowNoteInput(true)
      setNoteInputValue(clickedNote.text || "")
      setNotePosition({ x: clickedNote.x || 0, y: clickedNote.y || 0 })
    }
  }

  // Update createNote function to use selected color
  const createNote = () => {
    if (!canvasRef.current || !noteInputValue.trim()) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()

    // Calculate center position
    const x = (rect.width / 2) - 100 // Half of note width
    const y = (rect.height / 2) - 75 // Half of note height

    const newElement: DrawingElement = {
      id: Date.now().toString(),
      type: "note",
      x,
      y,
      width: 200,
      height: 150,
      color: noteColor, // Use the selected color
      text: noteInputValue,
      userId: 1,
      lineWidth: 2
    }

    addElement(newElement)
    setNoteInputValue("")
    setShowNoteInput(false)
    setCurrentTool("select")
  }

  return (
    <div className="flex flex-col h-[95vh] border rounded-lg overflow-hidden bg-slate-50 shadow-lg">
      <div className="flex items-center justify-between p-2 border-b bg-slate-50">
        <div className="flex items-center space-x-auto pb-1 scrollbar-hide">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentTool("select")}
                  className={cn("rounded-md", currentTool === "select" && "bg-slate-200 hover:bg-slate-300")}
                >
                  <MousePointer className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Select</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentTool("pen")}
                  className={cn("rounded-md", currentTool === "pen" && "bg-slate-200 hover:bg-slate-300")}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Pen</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentTool("eraser")}
                  className={cn("rounded-md", currentTool === "eraser" && "bg-slate-200 hover:bg-slate-300")}
                >
                  <Eraser className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Eraser</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentTool("rectangle")}
                  className={cn("rounded-md", currentTool === "rectangle" && "bg-slate-200 hover:bg-slate-300")}
                >
                  <Square className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rectangle</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentTool("circle")}
                  className={cn("rounded-md", currentTool === "circle" && "bg-slate-200 hover:bg-slate-300")}
                >
                  <Circle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Circle</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentTool("arrow")}
                  className={cn("rounded-md", currentTool === "arrow" && "bg-slate-200 hover:bg-slate-300")}
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Arrow</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCurrentTool("text")
                    setShowTextInput(true)
                  }}
                  className={cn("rounded-md", currentTool === "text" && "bg-slate-200 hover:bg-slate-300")}
                >
                  <Type className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Text</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCurrentTool("note")
                    setShowNoteInput(true)
                  }}
                  className={cn("rounded-md", currentTool === "note" && "bg-slate-200 hover:bg-slate-300")}
                >
                  <StickyNote className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Sticky Note</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCurrentTool("sticker")
                    setShowStickers(true)
                  }}
                  className={cn("rounded-md", currentTool === "sticker" && "bg-slate-200 hover:bg-slate-300")}
                >
                  <Sticker className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Stickers</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCurrentTool("image")
                    setShowImageUploader(true)
                  }}
                  className={cn("rounded-md", currentTool === "image" && "bg-slate-200 hover:bg-slate-300")}
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Image</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <ColorPicker color={currentColor} onChange={setCurrentColor} />

          <div className="flex items-center space-x-2 ml-2 bg-slate-50 px-3 py-1.5 rounded-md">
            <span className="text-xs text-slate-900">Width</span>
            <input
              type="range"
              min="1"
              max="10"
              value={lineWidth}
              onChange={(e) => setLineWidth(Number.parseInt(e.target.value))}
              className="w-24 h-6 accent-slate-600 
                [&::-webkit-slider-runnable-track]:h-1.5 
                [&::-webkit-slider-runnable-track]:rounded-full
                [&::-webkit-slider-runnable-track]:bg-slate-300
                [&::-webkit-slider-thumb]:h-4 
                [&::-webkit-slider-thumb]:w-4 
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-slate-600
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:-mt-1
                [&::-moz-range-track]:h-1.5
                [&::-moz-range-track]:rounded-full
                [&::-moz-range-track]:bg-slate-300
                [&::-moz-range-thumb]:h-4 
                [&::-moz-range-thumb]:w-4 
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-slate-600
                [&::-moz-range-thumb]:-mt-1"
            />
            <div className="flex items-center justify-center w-6 h-6 bg-white border rounded-md">
              <span className="text-xs font-medium">{lineWidth}</span>
            </div>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className="rounded-md"
                >
                  <Undo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className="rounded-md"
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={handleEraseBoard} className="rounded-md">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Erase Board</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={handleDownload} className="rounded-md">
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={() => setShowShareDialog(true)} className="rounded-md">
                  <Share2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Share</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showUsers ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setShowUsers(!showUsers)}
                  className={cn("rounded-md relative", showUsers && "bg-slate-200 hover:bg-slate-300")}
                >
                  <Users className="h-4 w-4" />
                  <span className="absolute top-0.5 -right-0.5 bg-primary text-primary-foreground rounded-full w-4 h-4 text-[10px] flex items-center justify-center">
                    {users.filter((u) => u.online).length}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isConnected ? "Connected Users" : "Connecting..."}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                  className="rounded-md"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Settings</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLayers(true)}
                  className="rounded-md"
                >
                  <Layers className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Manage Layers</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpDialog />
              </TooltipTrigger>
              <TooltipContent>Help & Tips</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAIChat(true)}
                  className="rounded-md"
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>AI Assistant</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSave}
                  className="rounded-md"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="relative flex-grow bg-slate-100">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair bg-white"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          style={{ touchAction: 'none' }}
        />

        {/* User cursors */}
        {users
          .filter((u) => u.online)
          .map((user) => (
            <div
              key={user.id}
              className="absolute pointer-events-none"
              style={{
                left: `${user.x / (canvasRef.current ? canvasRef.current.width / canvasRef.current.clientWidth : 1)}px`,
                top: `${user.y / (canvasRef.current ? canvasRef.current.height / canvasRef.current.clientHeight : 1)}px`,
                transition: user.id === 1 ? "none" : "all 0.5s ease-out",
                zIndex: 10,
              }}
            >
              {user.id !== 1 && (
                <div className="absolute -mt-6 -ml-4 whitespace-nowrap text-black text-xs px-1 py-0.5">
                  {user.name}
                </div>
              )}
            </div>
          ))}
      </div>

      {showUsers && (
        <div className="absolute top-16 right-2 z-50 bg-white rounded-lg shadow-lg border p-4 min-w-[200px]">
          <div className="space-y-2">
            <h3 className="font-medium mb-2">Connected Users</h3>
            {users.map((user) => (
              <div key={user.id} className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: user.color }} />
                <span className="text-sm">{user.name}</span>
                {user.online && <span className="text-xs text-green-500">• Online</span>}
              </div>
            ))}
          </div>
        </div>
      )}
      {showShareDialog && <ShareDialog onShare={handleShare} onCancel={() => setShowShareDialog(false)} />}
      {showStickers && <StickersPanel onSelect={handleAddSticker} onClose={() => setShowStickers(false)} />}
      {showImageUploader && <ImageUploader onUpload={handleAddImage} onClose={() => setShowImageUploader(false)} />}
      {showSettings && (
        <div className="absolute top-56 right-2 z-50">
          <SettingsPanel
            onClose={() => setShowSettings(false)}
            showGrid={showGrid}
            onShowGridChange={setShowGrid}
            snapToGrid={snapToGrid}
            onSnapToGridChange={setSnapToGrid}
          />
        </div>
      )}
      {showLayers && (
        <LayersPanel
          layers={layers}
          onClose={() => setShowLayers(false)}
          onLayerVisibilityChange={handleLayerVisibilityChange}
          onLayerLockChange={handleLayerLockChange}
          onLayerMove={handleLayerMove}
          onLayerDelete={handleLayerDelete}
        />
      )}
      {showTextInput && (
        <Dialog open={showTextInput} onOpenChange={setShowTextInput}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Text</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input
                value={textInputValue}
                onChange={(e) => setTextInputValue(e.target.value)}
                placeholder="Enter your text..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleTextSubmit()
                  }
                }}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowTextInput(false)}>
                  Cancel
                </Button>
                <Button onClick={handleTextSubmit}>
                  Add Text
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {showAIChat && <AIChat onClose={() => setShowAIChat(false)} />}
      {showNoteInput && (
        <Dialog open={showNoteInput} onOpenChange={setShowNoteInput}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Sticky Note</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Note Color</label>
                <div className="flex items-center gap-2">
                  <ColorPicker color={noteColor} onChange={setNoteColor} />
                  <div className="flex-1">
                    <Input
                      value={noteInputValue}
                      onChange={(e) => setNoteInputValue(e.target.value)}
                      placeholder="Enter your note..."
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          createNote()
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setShowNoteInput(false)
                  setCurrentTool("select")
                }}>
                  Cancel
                </Button>
                <Button onClick={createNote}>
                  Done
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
