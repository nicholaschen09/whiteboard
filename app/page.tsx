import { Brainboard } from "@/components/brainboard"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Brainboard</h1>
            <p className="text-slate-500">Collaborative brainstorming in real-time</p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
            <div className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
              <span>Real-time collaboration</span>
            </div>
          </div>
        </div>
        <Brainboard />
      </div>
    </main>
  )
}
