import { create } from "zustand"

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
    button { border-radius: 10px; border: 1px solid #00000022; padding: 8px 12px; background: #3b82f6; color: white; box-shadow: 0 2px 8px #00000033; cursor: pointer; }
    button:hover { filter: brightness(1.05); }
    .note { font-size: 12px; opacity: .7; margin-top: 6px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Hello Sandbox 👋</h1>
    <p>Edit the code on the left and see updates here in real-time.</p>
    <button id="btn">Click me</button>
    <div id="out" style="margin-top:8px; opacity:.8">No clicks yet</div>
    <div class="note">This demo posts to the parent console panel.</div>
  </div>
  <script>
    const out = document.getElementById('out');
    const btn = document.getElementById('btn');
    let n = 0;

    function postToParent(type, message){
      try {
        parent.postMessage({ __sandbox_log: true, type, message, time: Date.now() }, '*');
      } catch {}
    }

    btn.addEventListener('click', () => {
      n++;
      const msg = 'Clicked ' + n + ' time' + (n === 1 ? '' : 's');
      out.textContent = msg;
      // Send to parent's console panel without needing injected scripts
      postToParent('log', msg);
    });

    // Example: also forward window errors to parent panel
    window.addEventListener('error', (e) => {
      postToParent('error', e.message + ' @ ' + (e.filename||'') + ':' + (e.lineno||''));
    });
    window.addEventListener('unhandledrejection', (e) => {
      postToParent('error', 'Unhandled: ' + (e.reason && (e.reason.message || e.reason)));
    });
  </script>
</body>
</html>`

  return {
    editorContent: initial?.editorContent ?? defaultHtml,
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