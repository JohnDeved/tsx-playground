import { create } from "zustand"
import { getDefaultAppContent } from "@/templates"

type Orientation = "horizontal" | "vertical"
type ConsoleEntry = { type: "log" | "warn" | "error"; message: string; time: number }

type LayoutState = {
  orientation: Orientation
  editorRatio: number // 0..1
  previewRatio: number // 0..1
}

type SandboxState = {
  editorContent: string
  fontSize: number
  theme: "light" | "dark"
  layout: LayoutState
  consoleOpen: boolean
  consoleLogs: ConsoleEntry[]

  setEditorContent: (v: string) => void
  setFontSize: (v: number) => void
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
  "setEditorContent" | "setFontSize" | "setTheme" | "setLayout" | "appendConsole" | "clearConsole" | "setConsoleOpen"
> {
  let initial: any = null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) initial = JSON.parse(raw)
  } catch {}

  return {
    editorContent: initial?.editorContent ?? getDefaultAppContent(),
    fontSize: initial?.fontSize ?? 14,
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
  setFontSize(v) {
    set({ fontSize: Math.max(10, Math.min(28, v)) }); persist()
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
    const { editorContent, fontSize, theme, layout } = useSandboxStore.getState()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ editorContent, fontSize, theme, layout }))
  } catch {}
}