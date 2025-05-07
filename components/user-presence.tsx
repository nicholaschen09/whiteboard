"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface User {
  id: number
  name: string
  avatar: string
  color: string
  x: number
  y: number
  online: boolean
}

interface UserPresenceProps {
  users: User[]
}

export function UserPresence({ users }: UserPresenceProps) {
  return (
    <Card className="absolute bottom-4 right-4 w-64 shadow-lg border border-slate-200">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Collaborators</CardTitle>
          <Badge variant="outline" className="ml-2 text-xs font-normal">
            {users.filter((u) => u.online).length} online
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="py-2 px-4">
        <ScrollArea className="h-60 pr-4">
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-8 w-8 border" style={{ borderColor: user.color }}>
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${user.online ? "bg-green-500" : "bg-gray-300"
                      }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.online ? "Active now" : "Offline"}</p>
                </div>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: user.color }} />
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
