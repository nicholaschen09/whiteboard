"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Circle, MousePointer, Pencil, Square, Trash2, Type, Download, Undo, Redo, Users } from "lucide-react"
import { ColorPicker } from "./color-picker"
import { UserPresence } from "./user-presence"

// Initialize with just the current user
const initialUsers = [
  { id: 1, name: "You", avatar: "/placeholder.svg?height=40&width=40", color: "#FF5733", x: 100, y: 150, online: true }
]

type Tool = "select" | "pen" | "rectangle" | "circle" | "text"
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
  selected?: boolean
}

export function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentTool, setCurrentTool] = useState<Tool>("pen")
  const [currentColor, setCurrentColor] = useState("#000000")
  const [elements, setElements] = useState<DrawingElement[]>([])
  const [history, setHistory] = useState<DrawingElement[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [currentElement, setCurrentElement] = useState<DrawingElement | null>(null)
  const [users, setUsers] = useState(initialUsers)
  const [showUsers, setShowUsers] = useState(false)
  const [selectedElement, setSelectedElement] = useState<DrawingElement | null>(null)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [pendingTool, setPendingTool] = useState<Tool | null>(null)

  // Initialize canvas context
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")

      // Set canvas size to match parent container
      const resizeCanvas = () => {
        const container = canvas.parentElement
        if (container) {
          canvas.width = container.clientWidth
          canvas.height = container.clientHeight
          drawElements()
        }
      }

      window.addEventListener("resize", resizeCanvas)
      resizeCanvas()

      if (ctx) {
        setContext(ctx)
      }

      return () => {
        window.removeEventListener("resize", resizeCanvas)
      }
    }
  }, [])

  // Redraw all elements when they change
  useEffect(() => {
    drawElements()
  }, [elements])

  // Simulate other users moving around
  useEffect(() => {
    const interval = setInterval(() => {
      setUsers((prevUsers) =>
        prevUsers.map((user) => {
          if (user.id !== 1) {
            // Don't move the current user
            return {
              ...user,
              x: user.x + (Math.random() * 20 - 10),
              y: user.y + (Math.random() * 20 - 10),
            }
          }
          return user
        }),
      )
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const drawElements = () => {
    if (!context || !canvasRef.current) return

    const canvas = canvasRef.current
    context.clearRect(0, 0, canvas.width, canvas.height)

    elements.forEach((element) => {
      context.strokeStyle = element.color
      context.fillStyle = element.color
      context.lineWidth = 2

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
            context.fill()
            context.stroke()

            // Draw selection indicator
            if (element === selectedElement) {
              context.strokeStyle = "#3b82f6"
              context.lineWidth = 2
              context.strokeRect(
                element.x - 2,
                element.y - 2,
                element.width + 4,
                element.height + 4
              )
            }
          }
          break

        case "circle":
          if (element.x !== undefined && element.y !== undefined && element.width !== undefined) {
            context.beginPath()
            context.arc(
              element.x + element.width / 2,
              element.y + element.width / 2,
              element.width / 2,
              0,
              Math.PI * 2
            )
            context.fill()
            context.stroke()

            // Draw selection indicator
            if (element === selectedElement) {
              context.strokeStyle = "#3b82f6"
              context.lineWidth = 2
              context.beginPath()
              context.arc(
                element.x + element.width / 2,
                element.y + element.width / 2,
                element.width / 2 + 2,
                0,
                Math.PI * 2
              )
              context.stroke()
            }
          }
          break

        case "text":
          if (element.x !== undefined && element.y !== undefined && element.text) {
            context.font = "16px sans-serif"
            context.fillText(element.text, element.x, element.y)
          }
          break
      }
    })
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Update current user position
    setUsers((prevUsers) => prevUsers.map((user) => (user.id === 1 ? { ...user, x, y } : user)))

    if (currentTool === "select" as Tool) {
      // Find clicked element
      const clickedElement = elements.find(element => isPointInShape(x, y, element))
      setSelectedElement(clickedElement || null)
      return
    }

    setIsDrawing(true)

    const newElement: DrawingElement = {
      id: Date.now().toString(),
      type: currentTool,
      color: currentColor,
      userId: 1,
    }

    switch (currentTool) {
      case "pen":
        newElement.points = [{ x, y }]
        break

      case "rectangle":
      case "circle":
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

      case "select":
        // Handle selection (not implemented in this demo)
        return
    }

    setCurrentElement(newElement)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentElement || !canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Update current user position
    setUsers((prevUsers) => prevUsers.map((user) => (user.id === 1 ? { ...user, x, y } : user)))

    const updatedElement = { ...currentElement }

    switch (currentTool) {
      case "pen":
        updatedElement.points = [...(updatedElement.points || []), { x, y }]
        break

      case "rectangle":
      case "circle":
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
      context.lineWidth = 2

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
          if (updatedElement.x !== undefined && updatedElement.y !== undefined && updatedElement.width !== undefined) {
            context.beginPath()
            context.arc(
              updatedElement.x + updatedElement.width / 2,
              updatedElement.y + updatedElement.width / 2,
              Math.abs(updatedElement.width / 2),
              0,
              Math.PI * 2,
            )
            context.stroke()
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

    // Add the new element
    setElements((prevElements) => [...prevElements, element])
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

  const handleDownload = () => {
    if (!canvasRef.current) return

    const link = document.createElement("a")
    link.download = "whiteboard.png"
    link.href = canvasRef.current.toDataURL()
    link.click()
  }

  // Add function to check if a point is inside a shape
  const isPointInShape = (x: number, y: number, element: DrawingElement) => {
    switch (element.type) {
      case "rectangle":
        if (element.x !== undefined && element.y !== undefined &&
          element.width !== undefined && element.height !== undefined) {
          return x >= element.x && x <= element.x + element.width &&
            y >= element.y && y <= element.y + element.height
        }
        return false

      case "circle":
        if (element.x !== undefined && element.y !== undefined && element.width !== undefined) {
          const centerX = element.x + element.width / 2
          const centerY = element.y + element.width / 2
          const radius = element.width / 2
          const dx = x - centerX
          const dy = y - centerY
          return Math.sqrt(dx * dx + dy * dy) <= radius
        }
        return false

      default:
        return false
    }
  }

  // Add function to update color of selected element
  const updateSelectedColor = (newColor: string) => {
    if (selectedElement) {
      const updatedElements = elements.map(element =>
        element === selectedElement ? { ...element, color: newColor } : element
      )
      setElements(updatedElements)
    }
  }

  return (
    <div className="flex flex-col h-[80vh] border rounded-lg overflow-hidden bg-white">
      <div className="flex items-center justify-between p-2 border-b">
        <div className="flex items-center space-x-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={currentTool === "select" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setCurrentTool("select")}
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
                  variant={currentTool === "pen" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setCurrentTool("pen")}
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
                  variant={currentTool === "rectangle" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setCurrentTool("rectangle")}
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
                  variant={currentTool === "circle" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setCurrentTool("circle")}
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
                  variant={currentTool === "text" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setCurrentTool("text")}
                >
                  <Type className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Text</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <ColorPicker
            color={selectedElement ? selectedElement.color : currentColor}
            onChange={(color) => {
              if (selectedElement) {
                updateSelectedColor(color)
              } else {
                setCurrentColor(color)
              }
            }}
          />
        </div>

        <div className="flex items-center space-x-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleUndo} disabled={historyIndex < 0}>
                  <Undo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleRedo} disabled={historyIndex >= history.length - 1}>
                  <Redo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleClear}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant={showUsers ? "default" : "ghost"} size="icon" onClick={() => setShowUsers(!showUsers)}>
                  <Users className="h-4 w-4" />
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 text-[10px] flex items-center justify-center">
                    {users.length}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Users</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="relative flex-grow">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        {/* User cursors */}
        {users.map((user) => (
          <div
            key={user.id}
            className="absolute pointer-events-none"
            style={{
              left: `${user.x}px`,
              top: `${user.y}px`,
              transition: user.id === 1 ? "none" : "all 0.5s ease-out",
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
    </div>
  )
}
