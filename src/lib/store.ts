import { create } from "zustand"

const DEFAULT_APP_CONTENT = `import { IoSparkles } from "react-icons/io5";
import { motion } from "framer-motion";

export default function App() {
  return (
    // Main container with a dark, gradient background
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-900 p-6">
      
      {/* Background Aurora Effect */}
      <div className="absolute -top-1/4 -left-1/4 w-96 h-96 bg-purple-500/50 rounded-full filter blur-3xl opacity-40 animate-blob"></div>
      <div className="absolute -bottom-1/4 -right-1/4 w-96 h-96 bg-cyan-500/50 rounded-full filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>

      {/* Main Card with Glassmorphism effect */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        whileHover={{ scale: 1.03, y: -5 }}
        className="relative z-10 bg-slate-800/50 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center space-y-6"
      >
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-4xl font-bold flex justify-center items-center gap-3 bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent"
        >
          Welcome!
          <motion.span
            animate={{ scale: [1, 1.25, 1], rotate: [0, 15, -15, 0] }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: "easeInOut",
            }}
          >
            <IoSparkles className="text-cyan-400" />
          </motion.span>
        </motion.h1>

        <p className="text-slate-400">
          Start editing{" "}
          <code className="bg-slate-700 text-cyan-400 px-2 py-1 rounded-md font-mono">
            App.tsx
          </code>{" "}
          to refresh the preview.
        </p>
      </motion.div>
    </div>
  );
}`

type Orientation = "horizontal" | "vertical"
type ConsoleEntry = { type: "log" | "warn" | "error"; message: string; time: number }

type LayoutState = {
  orientation: Orientation
  editorRatio: number // 0..1
  previewRatio: number // 0..1
}

type SandboxState = {
  editorContent: string
  theme: "light" | "dark"
  layout: LayoutState
  consoleOpen: boolean
  consoleLogs: ConsoleEntry[]

  setEditorContent: (v: string) => void
  setTheme: (v: "light" | "dark") => void
  setLayout: (v: Partial<LayoutState>) => void

  appendConsole: (e: ConsoleEntry | ConsoleEntry[]) => void
  clearConsole: () => void
  setConsoleOpen: (v: boolean) => void
}

const STORAGE_KEY = "sandbox:v1"

function clamp01(v: number) {
  return Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0.5))
}

function loadInitial(): Omit<
  SandboxState,
  "setEditorContent" | "setTheme" | "setLayout" | "appendConsole" | "clearConsole" | "setConsoleOpen"
> {
  let initial: any = null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) initial = JSON.parse(raw)
  } catch {}

  return {
    editorContent: initial?.editorContent ?? DEFAULT_APP_CONTENT,
    theme: initial?.theme ?? "light",
    layout: {
      orientation: initial?.layout?.orientation ?? "horizontal",
      editorRatio: clamp01(initial?.layout?.editorRatio ?? 0.5),
      previewRatio: clamp01(initial?.layout?.previewRatio ?? 0.5),
    },
    consoleOpen: false,
    consoleLogs: [],
  }
}

export const useSandboxStore = create<SandboxState>((set, get) => ({
  ...loadInitial(),

  setEditorContent(v) {
    set({ editorContent: v }); persist()
  },
  setTheme(v) {
    document?.documentElement.classList.toggle("dark", v === "dark")
    set({ theme: v }); persist()
  },
  setLayout(v) {
    const cur = get().layout
    const next = { ...cur, ...v }
    const total = (next.editorRatio ?? 0.5) + (next.previewRatio ?? 0.5)
    if (total > 0 && total !== 1) {
      const e = clamp01((next.editorRatio ?? 0.5) / total)
      next.editorRatio = e
      next.previewRatio = clamp01(1 - e)
    }
    set({ layout: next }); persist()
  },

  appendConsole(e) {
    const arr = Array.isArray(e) ? e : [e]
    set({ consoleLogs: [...get().consoleLogs, ...arr] })
  },
  clearConsole() {
    set({ consoleLogs: [] })
  },
  setConsoleOpen(v) {
    set({ consoleOpen: v })
  },
}))

function persist() {
  try {
    const { editorContent, theme, layout } = useSandboxStore.getState()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ editorContent, theme, layout }))
  } catch {}
}