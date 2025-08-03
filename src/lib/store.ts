import { create } from "zustand"

type Orientation = "horizontal" | "vertical"
type Fullscreen = "none" | "editor" | "preview"
type ConsoleEntry = { type: "log" | "warn" | "error"; message: string; time: number }

type LayoutState = {
  orientation: Orientation
  // ratios between 0 and 1
  editorRatio: number
  previewRatio: number
}

type SandboxState = {
  editorContent: string
  fontSize: number
  theme: "light" | "dark"
  fullscreen: Fullscreen
  layout: LayoutState
  consoleOpen: boolean
  consoleLogs: ConsoleEntry[]

  setEditorContent: (v: string) => void
  setFontSize: (v: number) => void
  setTheme: (v: "light" | "dark") => void
  setFullscreen: (v: Fullscreen) => void
  setLayout: (v: Partial<LayoutState>) => void
  resetLayout: () => void

  appendConsole: (e: ConsoleEntry | ConsoleEntry[]) => void
  clearConsole: () => void
  setConsoleOpen: (v: boolean) => void
}

// Simple, tiny persistence layer with versioning
const STORAGE_KEY = "sandbox:v1"

function loadInitial(): Omit<SandboxState, keyof Pick<SandboxState,
  "setEditorContent" | "setFontSize" | "setTheme" | "setFullscreen" | "setLayout" | "resetLayout" |
  "appendConsole" | "clearConsole" | "setConsoleOpen"
>> {
  let initial: any = null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) initial = JSON.parse(raw)
  } catch {
    // ignore
  }

  const defaultHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Live Preview</title>
  <style>
    :root { color-scheme: light dark; }
    body { font: 14px/1.5 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; margin: 0; padding: 16px; }
    .card { border-radius: 12px; padding: 16px; border: 1px solid #00000022; background: color-mix(in oklab, Canvas, CanvasText 2% / 6%); box-shadow: 0 6px 24px #00000014; }
    button { border-radius: 10px; border: 1px solid #00000022; padding: 8px 12px; background: #3b82f6; color: white; box-shadow: 0 2px 8px #00000033; }
    button:hover { filter: brightness(1.05); }
  </style>
</head>
<body>
  <div class="card">
    <h1>Hello Sandbox 👋</h1>
    <p>Edit the code on the left and see updates here in real-time.</p>
    <button id="btn">Click me</button>
    <div id="out" style="margin-top:8px; opacity:.8">No clicks yet</div>
  </div>
  <script>
    const out = document.getElementById('out');
    const btn = document.getElementById('btn');
    let n = 0;
    btn.addEventListener('click', () => {
      n++;
      console.log('Clicked', n);
      out.textContent = \`Clicked \${n} times\`;
    });
  </script>
</body>
</html>`

  return {
    editorContent: initial?.editorContent ?? defaultHtml,
    fontSize: initial?.fontSize ?? 14,
    theme: initial?.theme ?? "light",
    fullscreen: initial?.fullscreen ?? "none",
    layout: {
      orientation: initial?.layout?.orientation ?? ("horizontal" as Orientation),
      editorRatio: clamp01(initial?.layout?.editorRatio ?? 0.5),
      previewRatio: clamp01(initial?.layout?.previewRatio ?? 0.5),
    },
    consoleOpen: false,
    consoleLogs: [],
  }
}

function clamp01(v: number) {
  if (typeof v !== "number" || Number.isNaN(v)) return 0.5
  return Math.max(0, Math.min(1, v))
}

export const useSandboxStore = create<SandboxState>((set, get) => ({
  ...loadInitial(),

  setEditorContent(v) {
    set({ editorContent: v })
    persist()
  },
  setFontSize(v) {
    set({ fontSize: Math.max(10, Math.min(28, v)) })
    persist()
  },
  setTheme(v) {
    // Update html class immediately for Tailwind dark mode
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", v === "dark")
    }
    set({ theme: v })
    persist()
  },
  setFullscreen(v) {
    set({ fullscreen: v })
    persist()
  },
  setLayout(v) {
    const cur = get().layout
    const next = {
      ...cur,
      ...v,
    }
    // normalize ratios
    const total = (next.editorRatio ?? 0.5) + (next.previewRatio ?? 0.5)
    if (total !== 1 && total > 0) {
      const e = clamp01((next.editorRatio ?? 0.5) / total)
      const p = clamp01((next.previewRatio ?? 0.5) / total)
      next.editorRatio = e
      next.previewRatio = p
    }
    set({ layout: next })
    persist()
  },
  resetLayout() {
    set({
      layout: { orientation: "horizontal", editorRatio: 0.5, previewRatio: 0.5 },
      fullscreen: "none",
    })
    persist()
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
    const { editorContent, fontSize, theme, fullscreen, layout } = useSandboxStore.getState()
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ editorContent, fontSize, theme, fullscreen, layout }),
    )
  } catch {
    // ignore
  }
}