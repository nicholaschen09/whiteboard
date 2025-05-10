"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, Eye, EyeOff, ArrowUp, ArrowDown, Trash2, Lock, LockOpen } from "lucide-react"
import { cn } from "@/lib/utils"

interface Layer {
    id: string
    name: string
    visible: boolean
    locked: boolean
}

interface LayersPanelProps {
    layers: Layer[]
    activeLayer: string
    onClose: () => void
    onLayerVisibilityChange: (layerId: string, visible: boolean) => void
    onLayerLockChange: (layerId: string, locked: boolean) => void
    onLayerMove: (layerId: string, direction: 'up' | 'down') => void
    onLayerDelete: (layerId: string) => void
    onAddLayer: () => void
    onLayerSelect: (layerId: string) => void
}

export function LayersPanel({
    layers,
    activeLayer,
    onClose,
    onLayerVisibilityChange,
    onLayerLockChange,
    onLayerMove,
    onLayerDelete,
    onAddLayer,
    onLayerSelect
}: LayersPanelProps) {
    return (
        <Card className="absolute bottom-4 right-4 w-80 p-4 shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Layers</h3>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="space-y-2">
                {layers.map((layer) => (
                    <div
                        key={layer.id}
                        className={cn(
                            "flex items-center justify-between p-2 rounded-md",
                            layer.id === activeLayer && "bg-slate-100"
                        )}
                    >
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onLayerVisibilityChange(layer.id, !layer.visible)}
                                className="h-6 w-6"
                            >
                                {layer.visible ? (
                                    <Eye className="h-4 w-4" />
                                ) : (
                                    <EyeOff className="h-4 w-4" />
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onLayerLockChange(layer.id, !layer.locked)}
                                className="h-6 w-6"
                            >
                                {layer.locked ? (
                                    <Lock className="h-4 w-4" />
                                ) : (
                                    <LockOpen className="h-4 w-4" />
                                )}
                            </Button>
                            <span
                                className="text-sm cursor-pointer"
                                onClick={() => onLayerSelect(layer.id)}
                            >
                                {layer.name}
                            </span>
                        </div>

                        <div className="flex items-center space-x-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onLayerMove(layer.id, 'up')}
                                disabled={layers.indexOf(layer) === 0}
                                className="h-6 w-6"
                            >
                                <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onLayerMove(layer.id, 'down')}
                                disabled={layers.indexOf(layer) === layers.length - 1}
                                className="h-6 w-6"
                            >
                                <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onLayerDelete(layer.id)}
                                className="h-6 w-6 text-destructive"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4">
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={onAddLayer}
                >
                    Add Layer
                </Button>
            </div>
        </Card>
    )
} 