import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sparkles, Send, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
    role: "user" | "assistant"
    content: string
}

interface AIChatProps {
    onClose: () => void
}

export function AIChat({ onClose }: AIChatProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    const GEMINI_API_KEY = "AIzaSyAtCuog5tDMwUEUIWPFZcYOd-I7E3tMtPo"
    const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return

        const userMessage = input.trim()
        setInput("")
        setMessages(prev => [...prev, { role: "user", content: userMessage }])
        setIsLoading(true)

        try {
            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: userMessage
                        }]
                    }]
                })
            })

            const data = await response.json()
            const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't process that request."

            setMessages(prev => [...prev, { role: "assistant", content: aiResponse }])
        } catch (error) {
            console.error("Error calling Gemini API:", error)
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "Sorry, I encountered an error while processing your request."
            }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white rounded-lg shadow-lg border flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center space-x-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    <h3 className="font-medium">AI Assistant</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <ScrollArea ref={scrollRef} className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={cn(
                                "flex",
                                message.role === "user" ? "justify-end" : "justify-start"
                            )}
                        >
                            <div
                                className={cn(
                                    "max-w-[80%] rounded-lg p-3",
                                    message.role === "user"
                                        ? "bg-blue-500 text-white"
                                        : "bg-gray-100 text-gray-900"
                                )}
                            >
                                {message.content}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-100 rounded-lg p-3 text-gray-900">
                                Thinking...
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            <form onSubmit={handleSubmit} className="p-4 border-t">
                <div className="flex space-x-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask me anything..."
                        disabled={isLoading}
                    />
                    <Button type="submit" disabled={isLoading}>
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </form>
        </div>
    )
} 