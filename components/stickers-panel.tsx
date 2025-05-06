"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useState } from "react"

interface StickersPanelProps {
  onSelect: (sticker: string) => void
  onClose: () => void
}

const STICKER_CATEGORIES = [
  {
    name: "Emojis",
    stickers: ["😀", "😂", "🤔", "👍", "👎", "❤️", "🔥", "⭐", "🎉", "🚀"],
  },
  {
    name: "Reactions",
    stickers: ["👏", "🙌", "👀", "💡", "❓", "❗", "✅", "❌", "⚠️", "🔄"],
  },
  {
    name: "Objects",
    stickers: ["📝", "📊", "📈", "📉", "📌", "🔍", "⚙️", "🔧", "💻", "📱"],
  },
  {
    name: "Animals",
    stickers: ["🐶", "🐱", "🐭", "🦊", "🐻", "🐼", "🐨", "🦁", "🐮", "🐷"],
  },
  {
    name: "Food",
    stickers: ["🍎", "🍕", "🍔", "🍟", "🍩", "🍦", "🍺", "☕", "🍫", "🍗"],
  },
]

// Flatten all stickers for search
const ALL_STICKERS = STICKER_CATEGORIES.flatMap((category) => category.stickers)

export function StickersPanel({ onSelect, onClose }: StickersPanelProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredStickers = searchQuery ? ALL_STICKERS.filter((sticker) => sticker.includes(searchQuery)) : []

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Sticker</DialogTitle>
        </DialogHeader>

        <div className="relative mb-3">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search stickers..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {searchQuery ? (
          <ScrollArea className="h-60">
            <div className="grid grid-cols-5 gap-2 p-1">
              {filteredStickers.map((sticker) => (
                <Button
                  key={sticker}
                  variant="outline"
                  className="h-12 text-2xl hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => {
                    onSelect(sticker)
                    onClose()
                  }}
                >
                  {sticker}
                </Button>
              ))}
              {filteredStickers.length === 0 && (
                <div className="col-span-5 py-8 text-center text-muted-foreground">No stickers found</div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <Tabs defaultValue="Emojis" className="w-full">
            <TabsList className="w-full flex overflow-x-auto">
              {STICKER_CATEGORIES.map((category) => (
                <TabsTrigger key={category.name} value={category.name} className="flex-1">
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {STICKER_CATEGORIES.map((category) => (
              <TabsContent key={category.name} value={category.name} className="mt-2">
                <ScrollArea className="h-60">
                  <div className="grid grid-cols-5 gap-2 p-1">
                    {category.stickers.map((sticker) => (
                      <Button
                        key={sticker}
                        variant="outline"
                        className="h-12 text-2xl hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => {
                          onSelect(sticker)
                          onClose()
                        }}
                      >
                        {sticker}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
