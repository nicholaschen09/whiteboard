"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const SHORTCUTS = [
    { key: "Ctrl/Cmd + Z", description: "Undo last action" },
    { key: "Ctrl/Cmd + Shift + Z", description: "Redo last action" },
    { key: "Delete", description: "Delete selected element" },
    { key: "Ctrl/Cmd + C", description: "Copy selected element" },
    { key: "Ctrl/Cmd + V", description: "Paste element" },
    { key: "Ctrl/Cmd + D", description: "Duplicate selected element" },
    { key: "Space + Drag", description: "Pan canvas" },
    { key: "Ctrl/Cmd + Mouse Wheel", description: "Zoom in/out" },
]

const TIPS = [
    "Use the grid to align elements precisely",
    "Double-click any element to edit its properties",
    "Hold Shift while drawing to create perfect shapes",
    "Use layers to organize your work",
    "Right-click for context menu options",
    "Use the color picker to save custom colors",
    "Share your board with others for collaboration",
    "Download your work as an image when done",
]

const TOOLS = [
    { name: "Select", description: "Select and move elements" },
    { name: "Pen", description: "Draw freehand lines" },
    { name: "Rectangle", description: "Draw rectangles and squares" },
    { name: "Circle", description: "Draw circles and ovals" },
    { name: "Text", description: "Add text to your board" },
    { name: "Sticker", description: "Add emoji and stickers" },
    { name: "Image", description: "Upload and add images" },
    { name: "Eraser", description: "Erase parts of your drawing" },
]

export function HelpDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-md">
                    <HelpCircle className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Help & Tips</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="tips" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="tips">Tips</TabsTrigger>
                        <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
                        <TabsTrigger value="tools">Tools</TabsTrigger>
                    </TabsList>

                    <TabsContent value="tips" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            {TIPS.map((tip, index) => (
                                <div key={index} className="flex items-start space-x-2 p-3 bg-slate-50 rounded-lg">
                                    <span className="text-slate-500">•</span>
                                    <span className="text-sm">{tip}</span>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="shortcuts" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            {SHORTCUTS.map((shortcut, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <span className="text-sm font-medium">{shortcut.description}</span>
                                    <kbd className="px-2 py-1 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-200 rounded">
                                        {shortcut.key}
                                    </kbd>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="tools" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            {TOOLS.map((tool, index) => (
                                <div key={index} className="flex flex-col p-3 bg-slate-50 rounded-lg">
                                    <span className="text-sm font-medium">{tool.name}</span>
                                    <span className="text-sm text-slate-500">{tool.description}</span>
                                </div>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
} 