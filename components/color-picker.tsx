"use client"

import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Palette } from "lucide-react"
import { cn } from "@/lib/utils"

const COLORS = [
  "#000000", // Black
  "#4f46e5", // Indigo
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#a855f7", // Purple
  "#ec4899", // Pink
]

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("h-8 border-2 rounded-md flex items-center gap-1", color === "#ffffff" && "border-slate-300")}
          style={{ borderColor: color }}
        >
          <div className="w-4 h-4 rounded-sm flex items-center justify-center" style={{ backgroundColor: color }}>
            <Palette className="h-3 w-3 text-white mix-blend-difference" />
          </div>
          <span className="text-xs">Color</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Colors</h4>
          <div className="grid grid-cols-5 gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                className={cn(
                  "w-10 h-10 rounded-md border border-muted-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary transition-all",
                  color === c && "ring-2 ring-primary scale-110",
                )}
                style={{ backgroundColor: c }}
                onClick={() => {
                  onChange(c)
                  setOpen(false)
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3 pt-2 border-t">
            <div className="flex-1">
              <h4 className="text-sm font-medium mb-1">Custom</h4>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-8 h-8 rounded-md border border-muted-foreground/20"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => onChange(e.target.value)}
                  className="flex-1 px-2 py-1 border rounded-md text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
