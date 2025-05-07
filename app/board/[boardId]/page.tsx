import { Brainboard } from "@/components/brainboard"

export default function BoardPage({ params }: { params: { boardId: string } }) {
  return (
    <main className="container mx-auto p-4 min-h-screen bg-background pb-32">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center space-y-4 py-8">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Whiteboard
          </h1>
          <p className="text-lg text-muted-foreground text-center max-w-2xl">
            A collaborative whiteboard application for brainstorming and visual thinking
          </p>
        </div>
        <Brainboard boardId={params.boardId} />
      </div>
    </main>
  )
}
