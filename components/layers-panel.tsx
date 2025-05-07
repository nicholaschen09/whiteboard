"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { X, Eye, EyeOff, ArrowUp, ArrowDown, Trash2 } from "lucide-react"

interface Layer {
    id: string
    name: string
    visible: boolean
    locked: boolean
}

interface LayersPanelProps {
    layers: Layer[]
    onClose: () => void
    onLayerVisibilityChange: (layerId: string, visible: boolean) => void
    onLayerLockChange: (layerId: string, locked: boolean) => void
    onLayerMove: (layerId: string, direction: 'up' | 'down') => void
    onLayerDelete: (layerId: string) => void
}

export function LayersPanel({
    layers,
    onClose,
    onLayerVisibilityChange,
    onLayerLockChange,
    onLayerMove,
    onLayerDelete,
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
                {layers.map((layer, index) => (
                    <div
                        key={layer.id}
                        className="flex items-center justify-between p-2 rounded-md bg-slate-100 dark:bg-slate-800"
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
                            <span className="text-sm">{layer.name}</span>
                        </div>

                        <div className="flex items-center space-x-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onLayerMove(layer.id, 'up')}
                                disabled={index === 0}
                                className="h-6 w-6"
                            >
                                <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onLayerMove(layer.id, 'down')}
                                disabled={index === layers.length - 1}
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
                    onClick={() => {
                        // Add new layer functionality will be implemented in Brainboard
                    }}
                >
                    Add Layer
                </Button>
            </div>
        </Card>
    )
} 