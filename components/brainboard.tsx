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

// Mock WebSocket connection
const createMockWebSocket = () => {
  const listeners = {
    message: [] as ((data: any) => void)[],
    open: [] as (() => void)[],
  }

  return {
    send: (data: string) => {
      // Simulate broadcasting to other users after a delay
      setTimeout(() => {
        const parsedData = JSON.parse(data)
        if (parsedData.type === "draw") {
          listeners.message.forEach((listener) =>
            listener({
              data: JSON.stringify({
                ...parsedData,
                userId: Math.floor(Math.random() * 3) + 2, // Assign to a random user that's not the current user
              }),
            }),
          )
        }
      }, 300)
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
  const [elements, setElements] = useState<DrawingElement[]>(() => {
    if (typeof window !== 'undefined') {
      const savedElements = localStorage.getItem('whiteboard-elements')
      return savedElements ? JSON.parse(savedElements) : []
    }
    return []
  })
  const [history, setHistory] = useState<DrawingElement[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
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
  const [layers, setLayers] = useState<Layer[]>(() => {
    if (typeof window !== 'undefined') {
      const savedLayers = localStorage.getItem('whiteboard-layers')
      if (savedLayers) {
        const parsedLayers = JSON.parse(savedLayers)
        return parsedLayers
      }
    }
    return [{
      id: "default",
      name: "Default Layer",
      visible: true,
      locked: false,
      elements: []
    }]
  })
  const [showLayers, setShowLayers] = useState(false)
  const [activeLayer, setActiveLayer] = useState<string>("default")
  const [showGrid, setShowGrid] = useState(false)
  const [snapToGrid, setSnapToGrid] = useState(false)
  const GRID_SIZE = 20 // Size of grid cells in pixels
  const [eraserSize, setEraserSize] = useState(10) // Default eraser size

  // Add temporary canvas ref
  const tempCanvasRef = useRef<HTMLCanvasElement>(null)
  const [tempContext, setTempContext] = useState<CanvasRenderingContext2D | null>(null)

  // Load saved data on initial render
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load saved elements
      const savedElements = localStorage.getItem('whiteboard-elements')
      if (savedElements) {
        setElements(JSON.parse(savedElements))
      }

      // Load saved layers
      const savedLayers = localStorage.getItem('whiteboard-layers')
      if (savedLayers) {
        const parsedLayers = JSON.parse(savedLayers)
        setLayers(parsedLayers)
        // Set active layer to the first visible layer
        const firstVisibleLayer = parsedLayers.find((layer: Layer) => layer.visible)
        if (firstVisibleLayer) {
          setActiveLayer(firstVisibleLayer.id)
        }
      }
    }
  }, []) // Empty dependency array to run only once on mount

  // Save elements whenever they change
  useEffect(() => {
    localStorage.setItem('whiteboard-elements', JSON.stringify(elements))
  }, [elements])

  // Save layers whenever they change
  useEffect(() => {
    localStorage.setItem('whiteboard-layers', JSON.stringify(layers))
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
        const data = JSON.parse(event.data)
        if (data.type === "draw") {
          setElements((prev) => [...prev, data.element])
        } else if (data.type === "userMove") {
          setUsers((prev) => prev.map((user) => (user.id === data.userId ? { ...user, x: data.x, y: data.y } : user)))
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message", e)
      }
    })

    setSocket(ws)

    return () => {
      ws.close()
    }
  }, [])

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

  // Update drawGrid function to ensure it's visible
  const drawGrid = () => {
    if (!context || !canvasRef.current || !showGrid) return

    const canvas = canvasRef.current
    context.save()
    context.strokeStyle = '#e5e7eb' // Light grey color for grid
    context.lineWidth = 1 // Make lines slightly more visible

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

  // Update drawElements to ensure grid is drawn correctly
  const drawElements = () => {
    if (!context || !canvasRef.current) return

    const canvas = canvasRef.current
    context.clearRect(0, 0, canvas.width, canvas.height)

    // Draw grid first
    drawGrid()

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

                element.points.forEach((point) => {
                  context.lineTo(point.x, point.y)
                })

                context.stroke()
              }
              break

            case "rectangle":
              if (
                element.x !== undefined &&
                element.y !== undefined &&
                element.width !== undefined &&
                element.height !== undefined
              ) {
                context.beginPath()
                context.rect(element.x, element.y, element.width, element.height)
                context.stroke()
              }
              break

            case "circle":
              if (element.x !== undefined && element.y !== undefined && element.width !== undefined) {
                context.beginPath()
                context.arc(element.x + element.width / 2, element.y + element.width / 2, element.width / 2, 0, Math.PI * 2)
                context.stroke()
              }
              break

            case "text":
              if (element.x !== undefined && element.y !== undefined && element.text) {
                context.font = "16px Inter, sans-serif"
                context.fillText(element.text, element.x, element.y)
              }
              break

            case "sticker":
              if (element.x !== undefined && element.y !== undefined && element.stickerType) {
                context.font = "32px sans-serif"
                context.fillText(element.stickerType, element.x, element.y)
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
                  context.drawImage(img, element.x!, element.y!, element.width!, element.height!)
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
              }
              break

            case "note":
              if (
                element.x !== undefined &&
                element.y !== undefined &&
                element.width !== undefined &&
                element.height !== undefined &&
                element.text
              ) {
                // Draw sticky note background
                context.fillStyle = element.color + "80" // Add transparency
                context.fillRect(element.x, element.y, element.width, element.height)

                // Draw text
                context.fillStyle = "#000000"
                context.font = "14px Inter, sans-serif"

                // Wrap text
                const words = element.text.split(" ")
                let line = ""
                const lineHeight = 18
                let offsetY = 20

                for (let i = 0; i < words.length; i++) {
                  const testLine = line + words[i] + " "
                  const metrics = context.measureText(testLine)
                  const testWidth = metrics.width

                  if (testWidth > element.width - 20 && i > 0) {
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
  }

  // Add function to snap coordinates to grid
  const snapToGridPoint = (x: number, y: number) => {
    if (!snapToGrid) return { x, y }
    return {
      x: Math.round(x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(y / GRID_SIZE) * GRID_SIZE
    }
  }

  // Update handleMouseDown to handle eraser
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
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

    setIsDrawing(true)

    // Update current user position
    setUsers((prevUsers) => prevUsers.map((user) => (user.id === 1 ? { ...user, x, y } : user)))

    // Handle eraser tool
    if (currentTool === "eraser") {
      handleErasing(x, y)
      return
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

      case "text":
        const text = prompt("Enter text:")
        if (text) {
          newElement.x = x
          newElement.y = y
          newElement.text = text
          addElement(newElement)
        }
        return

      case "sticker":
        setShowStickers(true)
        // Store current position for later use when sticker is selected
        setCurrentPosition({ x, y })
        return

      case "image":
        setShowImageUploader(true)
        // Store current position for later use when image is selected
        setCurrentPosition({ x, y })
        return

      case "select":
        // Handle selection (not implemented in this demo)
        return
    }

    setCurrentElement(newElement)
  }

  // Update handleMouseMove to remove eraser handling
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

    // If not drawing, just update cursor position and return
    if (!isDrawing || !currentElement) return

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
    if (!isDrawing || !currentElement) return

    addElement(currentElement)
    setCurrentElement(null)
    setIsDrawing(false)
  }

  const addElement = (element: DrawingElement) => {
    // Add to history for undo/redo
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push([...elements])
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)

    // Add the new element to the active layer
    setLayers(prevLayers => {
      return prevLayers.map(layer => {
        if (layer.id === activeLayer) {
          return {
            ...layer,
            elements: [...layer.elements, element]
          }
        }
        return layer
      })
    })

    // Update elements state
    setElements(prevElements => [...prevElements, element])

    // Send to WebSocket if connected
    if (socket && isConnected) {
      socket.send(
        JSON.stringify({
          type: "draw",
          element,
        }),
      )
    }
  }

  const handleUndo = () => {
    if (historyIndex >= 0) {
      setElements(history[historyIndex])
      setHistoryIndex(historyIndex - 1)
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setElements(history[historyIndex + 2])
      setHistoryIndex(historyIndex + 1)
    }
  }

  const handleClear = () => {
    // Add current state to history
    const newHistory = [...history, [...elements]]
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)

    // Clear the canvas
    setElements([])
  }

  const handleEraseBoard = () => {
    // Clear all layers
    setLayers(prevLayers =>
      prevLayers.map(layer => ({
        ...layer,
        elements: []
      }))
    )

    // Clear elements state
    setElements([])

    // Clear history
    setHistory([])
    setHistoryIndex(-1)

    // Clear localStorage
    localStorage.removeItem('whiteboard-elements')
    localStorage.removeItem('whiteboard-layers')

    // Redraw empty canvas
    if (context && canvasRef.current) {
      drawElements()
    }
  }

  const handleDownload = () => {
    if (!canvasRef.current) return

    const link = document.createElement("a")
    link.download = "brainboard.png"
    link.href = canvasRef.current.toDataURL()
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

    // Use the stored position from when the image tool was selected
    // Or default to center if not available
    const x = currentPosition ? currentPosition.x - 100 : canvas.width / 2 - 100
    const y = currentPosition ? currentPosition.y - 100 : canvas.height / 2 - 100

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
    // Reset current position
    setCurrentPosition(null)
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
            return points.some(point => isNearPoint(point.x, point.y))
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
            return Math.abs(distance - radius) < eraserSize || distance < eraserSize
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

  return (
    <div className="flex flex-col h-[95vh] border rounded-lg overflow-hidden bg-slate-50 shadow-lg">
      <div className="flex items-center justify-between p-2 border-b bg-slate-50">
        <Tabs defaultValue="draw" className="w-full" onValueChange={setActiveTab}>
          <div className="flex items-center justify-between w-full">
            <TabsList className="grid grid-cols-3 w-auto bg-slate-100">
              <TabsTrigger value="draw" className="px-4 data-[state=active]:bg-white">
                Draw
              </TabsTrigger>
              <TabsTrigger value="insert" className="px-4 data-[state=active]:bg-white">
                Insert
              </TabsTrigger>
              <TabsTrigger value="view" className="px-4 data-[state=active]:bg-white">
                View
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center space-x-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleUndo}
                      disabled={historyIndex < 0}
                      className="rounded-md"
                    >
                      <Undo className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Undo</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRedo}
                      disabled={historyIndex >= history.length - 1}
                      className="rounded-md"
                    >
                      <Redo className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Redo</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Separator orientation="vertical" className="h-6 mx-1" />

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleEraseBoard} className="rounded-md">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Erase Board</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleDownload} className="rounded-md">
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
                    <Button variant="ghost" size="icon" onClick={() => setShowShareDialog(true)} className="rounded-md">
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
                      variant={showUsers ? "default" : "ghost"}
                      size="icon"
                      onClick={() => setShowUsers(!showUsers)}
                      className={cn("rounded-md relative", isConnected ? "text-green-600" : "text-amber-600")}
                    >
                      <Users className="h-4 w-4" />
                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 text-[10px] flex items-center justify-center">
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
                      size="icon"
                      onClick={() => setShowSettings(true)}
                      className="rounded-md"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Settings</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <TabsContent value="draw" className="mt-0 pt-2 border-t">
            <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-hide">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={currentTool === "select" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCurrentTool("select")}
                      className="rounded-md"
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
                      variant={currentTool === "pen" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCurrentTool("pen")}
                      className="rounded-md"
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
                      variant={currentTool === "eraser" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCurrentTool("eraser")}
                      className="rounded-md"
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
                      variant={currentTool === "rectangle" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCurrentTool("rectangle")}
                      className="rounded-md"
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
                      variant={currentTool === "circle" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCurrentTool("circle")}
                      className="rounded-md"
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
                      variant={currentTool === "arrow" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCurrentTool("arrow")}
                      className="rounded-md"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Arrow</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Separator orientation="vertical" className="h-6 mx-1" />

              <ColorPicker color={currentColor} onChange={setCurrentColor} />

              <div className="flex items-center space-x-1 ml-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={lineWidth}
                  onChange={(e) => setLineWidth(Number.parseInt(e.target.value))}
                  className="w-20"
                />
                <span className="text-xs text-slate-500 w-4">{lineWidth}</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="insert" className="mt-0 pt-2 border-t">
            <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-hide">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={currentTool === "text" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCurrentTool("text")}
                      className="rounded-md"
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
                      variant={currentTool === "note" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCurrentTool("note")}
                      className="rounded-md"
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
                      variant={currentTool === "sticker" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCurrentTool("sticker")}
                      className="rounded-md"
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
                      variant={currentTool === "image" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCurrentTool("image")}
                      className="rounded-md"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add Image</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </TabsContent>

          <TabsContent value="view" className="mt-0 pt-2 border-t">
            <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-hide">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-md"
                      onClick={() => setShowLayers(true)}
                    >
                      <Layers className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Manage Layers</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="relative flex-grow bg-slate-100">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair bg-white"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
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

      {showUsers && <UserPresence users={users} />}
      {showShareDialog && <ShareDialog onShare={handleShare} onCancel={() => setShowShareDialog(false)} />}
      {showStickers && <StickersPanel onSelect={handleAddSticker} onClose={() => setShowStickers(false)} />}
      {showImageUploader && <ImageUploader onUpload={handleAddImage} onClose={() => setShowImageUploader(false)} />}
      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          showGrid={showGrid}
          onShowGridChange={setShowGrid}
          snapToGrid={snapToGrid}
          onSnapToGridChange={setSnapToGrid}
        />
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
    </div>
  )
}
