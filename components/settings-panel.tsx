"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { X } from "lucide-react"
import { useEffect, useState } from "react"

interface SettingsPanelProps {
    onClose: () => void
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return document.documentElement.classList.contains('dark')
        }
        return false
    })

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, [darkMode])

    return (
        <Card className="absolute bottom-4 right-4 w-80 p-4 shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Board Settings</h3>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label htmlFor="auto-save">Auto-save</Label>
                    <Switch id="auto-save" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                    <Label htmlFor="show-grid">Show Grid</Label>
                    <Switch id="show-grid" />
                </div>

                <div className="flex items-center justify-between">
                    <Label htmlFor="dark-mode">Dark Mode</Label>
                    <Switch
                        id="dark-mode"
                        checked={darkMode}
                        onCheckedChange={setDarkMode}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <Label htmlFor="snap-to-grid">Snap to Grid</Label>
                    <Switch id="snap-to-grid" />
                </div>
            </div>
        </Card>
    )
} 