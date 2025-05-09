import { DrawingElement, Layer } from './types'

export const drawGrid = (
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    showGrid: boolean,
    gridSize: number
) => {
    if (!showGrid) return

    context.save()
    context.strokeStyle = 'rgba(229, 231, 235, 0.8)'
    context.lineWidth = 1

    for (let x = 0; x <= canvas.width; x += gridSize) {
        context.beginPath()
        context.moveTo(x, 0)
        context.lineTo(x, canvas.height)
        context.stroke()
    }

    for (let y = 0; y <= canvas.height; y += gridSize) {
        context.beginPath()
        context.moveTo(0, y)
        context.lineTo(canvas.width, y)
        context.stroke()
    }

    context.restore()
}

export const snapToGridPoint = (x: number, y: number, gridSize: number, snapToGrid: boolean) => {
    if (!snapToGrid) return { x, y }
    return {
        x: Math.round(x / gridSize) * gridSize,
        y: Math.round(y / gridSize) * gridSize
    }
}

export const drawElement = (
    context: CanvasRenderingContext2D,
    element: DrawingElement,
    imageCache: { [key: string]: HTMLImageElement }
) => {
    context.strokeStyle = element.color
    context.fillStyle = element.color
    context.lineWidth = element.lineWidth || 2

    switch (element.type) {
        case "pen":
            if (element.points && element.points.length > 0) {
                context.beginPath()
                context.lineCap = "round"
                context.lineJoin = "round"
                context.moveTo(element.points[0].x, element.points[0].y)

                if (element.points.length === 2) {
                    context.lineTo(element.points[1].x, element.points[1].y)
                } else {
                    for (let i = 1; i < element.points.length - 1; i++) {
                        const xc = (element.points[i].x + element.points[i + 1].x) / 2
                        const yc = (element.points[i].y + element.points[i + 1].y) / 2
                        context.quadraticCurveTo(element.points[i].x, element.points[i].y, xc, yc)
                    }
                    context.lineTo(element.points[element.points.length - 1].x, element.points[element.points.length - 1].y)
                }
                context.stroke()
            }
            break

        case "rectangle":
            if (element.x !== undefined && element.y !== undefined &&
                element.width !== undefined && element.height !== undefined) {
                context.beginPath()
                context.rect(element.x, element.y, element.width, element.height)
                context.stroke()
            }
            break

        case "circle":
            if (element.x !== undefined && element.y !== undefined && element.width !== undefined) {
                const centerX = element.x + element.width / 2
                const centerY = element.y + element.width / 2
                const radius = element.width / 2
                context.beginPath()
                context.arc(centerX, centerY, radius, 0, Math.PI * 2)
                context.stroke()
            }
            break

        case "text":
            if (element.x !== undefined && element.y !== undefined && element.text) {
                context.font = `${element.fontSize || 16}px Inter, sans-serif`
                context.fillText(element.text, element.x, element.y)
            }
            break

        case "image":
            if (element.x !== undefined && element.y !== undefined &&
                element.width !== undefined && element.height !== undefined &&
                element.imageUrl) {
                const img = imageCache[element.imageUrl]
                if (img?.complete) {
                    context.drawImage(img, element.x, element.y, element.width, element.height)
                }
            }
            break

        case "arrow":
            if (element.points && element.points.length > 1) {
                const start = element.points[0]
                const end = element.points[element.points.length - 1]
                const lineWidth = element.lineWidth || 2
                const arrowSize = Math.max(25, lineWidth * 5)
                const angle = Math.atan2(end.y - start.y, end.x - start.x)
                const arrowAngle = Math.PI / 6

                const lineEndX = end.x - (arrowSize * 0.3) * Math.cos(angle)
                const lineEndY = end.y - (arrowSize * 0.3) * Math.sin(angle)

                context.beginPath()
                context.moveTo(start.x, start.y)
                context.lineTo(lineEndX, lineEndY)
                context.stroke()

                context.beginPath()
                context.moveTo(end.x, end.y)
                context.lineTo(
                    end.x - arrowSize * Math.cos(angle - arrowAngle),
                    end.y - arrowSize * Math.sin(angle - arrowAngle)
                )
                context.lineTo(
                    end.x - arrowSize * Math.cos(angle + arrowAngle),
                    end.y - arrowSize * Math.sin(angle + arrowAngle)
                )
                context.closePath()
                context.fill()
            }
            break
    }
}

export const drawElements = (
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    layers: Layer[],
    showGrid: boolean,
    gridSize: number,
    imageCache: { [key: string]: HTMLImageElement }
) => {
    if (!context || !canvas) return

    context.clearRect(0, 0, canvas.width, canvas.height)

    if (showGrid) {
        drawGrid(context, canvas, showGrid, gridSize)
    }

    layers.forEach(layer => {
        if (layer.visible) {
            layer.elements.forEach(element => {
                drawElement(context, element, imageCache)
            })
        }
    })
} 