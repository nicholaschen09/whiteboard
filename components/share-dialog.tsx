"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Mail, LinkIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ShareDialogProps {
  onShare: (emails: string[], shareLink: string, boardId: string) => void
  onCancel: () => void
}

export function ShareDialog({ onShare, onCancel }: ShareDialogProps) {
  const [emails, setEmails] = useState("")
  const [boardId, setBoardId] = useState("abc123")
  const [shareLink, setShareLink] = useState("")
  const { toast } = useToast()

  // Generate a real share link when the component mounts
  useEffect(() => {
    // Create a unique board ID if not already set
    const newBoardId = boardId || Math.random().toString(36).substring(2, 8)
    setBoardId(newBoardId)

    // Generate the full URL including the current hostname
    const host = window.location.host
    const protocol = window.location.protocol
    const newShareLink = `${protocol}//${host}/board/${newBoardId}`
    setShareLink(newShareLink)
  }, [boardId])

  const handleShare = () => {
    const emailList = emails
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email !== "")

    // Send the actual share link with the emails
    onShare(emailList, shareLink, boardId)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink)
    toast({
      title: "Link copied!",
      description: "Share link copied to clipboard",
    })
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Brainboard</DialogTitle>
          <DialogDescription>Invite others to collaborate on this whiteboard in real-time.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link">Share Link</TabsTrigger>
            <TabsTrigger value="email">Invite by Email</TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="link" className="text-sm">
                Anyone with this link can access this board
              </Label>
              <div className="flex items-center gap-2">
                <div className="bg-slate-100 p-2 rounded-l-md">
                  <LinkIcon className="w-4 h-4 text-slate-500" />
                </div>
                <Input id="link" value={shareLink} readOnly className="flex-1 rounded-l-none" />
                <Button variant="outline" size="icon" onClick={copyLink} className="shrink-0">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={copyLink}>Copy Link</Button>
            </div>
          </TabsContent>

          <TabsContent value="email" className="space-y-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="emails">Email addresses</Label>
              <div className="flex items-center gap-2">
                <div className="bg-slate-100 p-2 rounded-l-md">
                  <Mail className="w-4 h-4 text-slate-500" />
                </div>
                <Input
                  id="emails"
                  placeholder="email@example.com, another@example.com"
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                  className="flex-1 rounded-l-none"
                />
              </div>
              <p className="text-xs text-muted-foreground">Separate multiple emails with commas</p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" onClick={handleShare} disabled={!emails.trim()}>
                Send Invites
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
