"use client"

import { useState, useEffect } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Palette, Check } from "lucide-react"
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
  const [customColors, setCustomColors] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('custom-colors')
      return saved ? JSON.parse(saved) : []
    }
    return []
  })

  // Save custom colors to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('custom-colors', JSON.stringify(customColors))
  }, [customColors])

  const handleColorChange = (newColor: string) => {
    onChange(newColor)
    // Add to custom colors if it's not already in the list and not in the default colors
    if (!COLORS.includes(newColor) && !customColors.includes(newColor)) {
      setCustomColors(prev => [newColor, ...prev].slice(0, 10)) // Keep only the 10 most recent custom colors
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-md flex items-center justify-center"
        >
          <Palette className="h-4 w-4 text-slate-950" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 px-2 py-4">
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Colors</h4>
          <div className="grid grid-cols-5 gap-1">
            {COLORS.map((c) => (
              <button
                key={c}
                className={cn(
                  "min-w-[24px] min-h-[24px] w-6 h-6 rounded-md border border-muted-foreground/20 focus:outline-none transition-all relative flex items-center justify-center p-0",
                  color === c && "border-primary"
                )}
                style={{ backgroundColor: c }}
                onClick={() => {
                  handleColorChange(c)
                  setOpen(false)
                }}
              >
                {color === c && (
                  <Check className="w-4 h-4 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" />
                )}
              </button>
            ))}
          </div>

          {customColors.length > 0 && (
            <>
              <h4 className="text-sm font-medium mt-5">Custom Colors</h4>
              <div className="grid grid-cols-5 gap-1">
                {customColors.map((c) => (
                  <button
                    key={c}
                    className={cn(
                      "min-w-[24px] min-h-[24px] w-6 h-6 rounded-md border border-muted-foreground/20 focus:outline-none transition-all relative flex items-center justify-center p-0",
                      color === c && "border-primary"
                    )}
                    style={{ backgroundColor: c }}
                    onClick={() => {
                      handleColorChange(c)
                      setOpen(false)
                    }}
                  >
                    {color === c && (
                      <Check className="w-4 h-4 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="flex items-center gap-1 mt-5 pt-4 border-t">
            <div className="flex-1">
              <h4 className="text-sm font-medium mb-3">Custom</h4>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-6 h-6 rounded-md border border-muted-foreground/20 cursor-pointer"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="flex-1 px-2 py-1 border rounded-md text-sm w-20"
                  maxLength={7}
                />
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
