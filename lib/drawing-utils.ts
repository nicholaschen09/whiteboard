import type { DrawingElement, Layer } from "./types"

export const drawGrid = (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement, showGrid: boolean, GRID_SIZE: number) => {
    if (!context || !canvas || !showGrid) return

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

export const snapToGridPoint = (x: number, y: number, snapToGrid: boolean, GRID_SIZE: number) => {
    if (!snapToGrid) return { x, y }
    return {
        x: Math.round(x / GRID_SIZE) * GRID_SIZE,
        y: Math.round(y / GRID_SIZE) * GRID_SIZE
    }
}

export const drawElements = (context: CanvasRenderingContext2D, layers: Layer[], currentElement?: DrawingElement) => {
    if (!context) return

    // Draw all elements from layers
    layers.forEach(layer => {
        if (layer.visible) {
            layer.elements.forEach(element => {
                drawElement(context, element)
            })
        }
    })

    // Draw current element if provided
    if (currentElement) {
        drawElement(context, currentElement)
    }
}

const drawElement = (context: CanvasRenderingContext2D, element: DrawingElement) => {
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
} 