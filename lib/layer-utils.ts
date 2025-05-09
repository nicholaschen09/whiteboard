import { Layer, DrawingElement } from './types'

export const handleLayerVisibilityChange = (
    layers: Layer[],
    layerId: string,
    visible: boolean
): Layer[] => {
    return layers.map(layer =>
        layer.id === layerId ? { ...layer, visible } : layer
    )
}

export const handleLayerLockChange = (
    layers: Layer[],
    layerId: string,
    locked: boolean
): Layer[] => {
    return layers.map(layer =>
        layer.id === layerId ? { ...layer, locked } : layer
    )
}

export const handleLayerMove = (
    layers: Layer[],
    layerId: string,
    direction: 'up' | 'down'
): Layer[] => {
    const newLayers = [...layers]
    const currentIndex = newLayers.findIndex(layer => layer.id === layerId)
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    if (newIndex >= 0 && newIndex < newLayers.length) {
        [newLayers[currentIndex], newLayers[newIndex]] = [newLayers[newIndex], newLayers[currentIndex]]
    }

    return newLayers
}

export const handleLayerDelete = (
    layers: Layer[],
    layerId: string
): { newLayers: Layer[], newActiveLayer: Layer | null } => {
    if (layers.length > 1) {
        const remainingLayers = layers.filter(layer => layer.id !== layerId)
        const newActiveLayer = remainingLayers[0]
        return { newLayers: remainingLayers, newActiveLayer }
    }
    return { newLayers: layers, newActiveLayer: null }
}

export const createNewLayer = (layers: Layer[]): Layer => {
    return {
        id: Date.now().toString(),
        name: `Layer ${layers.length + 1}`,
        visible: true,
        locked: false,
        elements: []
    }
}

export const getLayerElements = (layers: Layer[], layerId: string): DrawingElement[] => {
    const layer = layers.find(l => l.id === layerId)
    return layer?.elements || []
} 