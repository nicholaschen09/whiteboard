"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, LinkIcon } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ImageUploaderProps {
  onUpload: (imageUrl: string) => void
  onClose: () => void
}

// Sample images for quick selection
const SAMPLE_IMAGES = [
  "/placeholder.svg?height=200&width=300",
  "/placeholder.svg?height=300&width=300",
  "/placeholder.svg?height=200&width=400",
  "/placeholder.svg?height=250&width=250",
  "/placeholder.svg?height=200&width=200",
  "/placeholder.svg?height=150&width=300",
]

export function ImageUploader({ onUpload, onClose }: ImageUploaderProps) {
  const [imageUrl, setImageUrl] = useState("")

  const handleUrlUpload = () => {
    if (imageUrl) {
      onUpload(imageUrl)
      onClose()
    }
  }

  // In a real app, this would handle file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // For demo purposes, we'll just use a placeholder
      onUpload("/placeholder.svg?height=300&width=400")
      onClose()
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Image</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="url">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="url">URL</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="sample">Sample</TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <div className="flex items-center gap-2">
                <div className="bg-slate-100 p-2 rounded-l-md">
                  <LinkIcon className="w-4 h-4 text-slate-500" />
                </div>
                <Input
                  id="image-url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="flex-1 rounded-l-none"
                />
              </div>
            </div>
            <Button onClick={handleUrlUpload} disabled={!imageUrl} className="w-full">
              Add Image
            </Button>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4 py-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center bg-slate-50">
              <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
              <p className="text-sm text-slate-600 mb-2">Drag and drop an image, or click to browse</p>
              <Input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              <Label htmlFor="file-upload" asChild>
                <Button variant="outline" className="mt-2">
                  Choose File
                </Button>
              </Label>
            </div>
          </TabsContent>

          <TabsContent value="sample" className="py-4">
            <ScrollArea className="h-60">
              <div className="grid grid-cols-2 gap-3">
                {SAMPLE_IMAGES.map((img, index) => (
                  <button
                    key={index}
                    className="border rounded-md overflow-hidden hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    onClick={() => {
                      onUpload(img)
                      onClose()
                    }}
                  >
                    <div className="w-full h-32 bg-slate-100 flex items-center justify-center relative group">
                      <img
                        src={img || "/placeholder.svg"}
                        alt={`Sample ${index + 1}`}
                        className="max-h-full max-w-full object-contain"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button variant="secondary" size="sm" className="pointer-events-none">
                          Select
                        </Button>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
