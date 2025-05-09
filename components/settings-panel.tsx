"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { X } from "lucide-react"

interface SettingsPanelProps {
    onClose: () => void
    showGrid: boolean
    onShowGridChange: (show: boolean) => void
}

export function SettingsPanel({
    onClose,
    showGrid,
    onShowGridChange,
}: SettingsPanelProps) {
    return (
        <Card className="absolute bottom-4 right-4 w-80 p-4 shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Settings</h3>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label htmlFor="show-grid">Show Grid</Label>
                    <Switch
                        id="show-grid"
                        checked={showGrid}
                        onCheckedChange={onShowGridChange}
                    />
                </div>
            </div>
        </Card>
    )
} 