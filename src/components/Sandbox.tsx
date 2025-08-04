import { useEffect, useMemo, useRef, useState } from "react"
import { ResizablePanel, ResizableHandle, ResizablePanelGroup } from "@/components/ui/resizable"
import { Button } from "@/components/ui/button"
import { useSandboxStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { init } from "modern-monaco"
import * as monacoTypes from "monaco-editor"
// Use upstream monaco-editor types while keeping modern-monaco for runtime
type Monaco = typeof monacoTypes

/** Minimal Monaco TSX editor (App.tsx) using modern-monaco Manual mode */
function EditorPane(props: { value: string; onChange: (v: string) => void; fontSize: number }) {
  const { value, onChange, fontSize } = props

  const containerRef = useRef<HTMLDivElement | null>(null)
  // Defer typing to runtime to avoid requiring monaco-editor-core type package
  const editorRef = useRef<monacoTypes.editor.IStandaloneCodeEditor | null>(null)
  const modelRef = useRef<monacoTypes.editor.ITextModel | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const resizeObsRef = useRef<ResizeObserver | null>(null)
  const lastEmittedRef = useRef<string>("")

  useEffect(() => {
    let disposed = false
    ;(async () => {
      // Load monaco via modern-monaco
      const monaco: Monaco = await init({
        theme: "tokyo-night",
        langs: ["typescript"],
        lsp: {
          typescript: {
            compilerOptions: {
              jsx: monacoTypes.languages.typescript.JsxEmit.Preserve,
            },
            importMap: {
              imports: {
                react: "https://esm.sh/react",
                "react-dom/client": "https://esm.sh/react-dom/client",
                "framer-motion": "https://esm.sh/framer-motion",
                "react-icons/io5": "https://esm.sh/react-icons/io5",
              },
              scopes: {}
            }
          },
        },
      })
      
      if (disposed) return
      monacoRef.current = monaco

      // // Configure TS compiler options similar to previous setup
      // monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      //   jsx: monaco.languages.typescript.JsxEmit.Preserve,
      // })

      // Create model once
      const model =
        modelRef.current ?? monaco.editor.createModel(value ?? "", "typescript", monaco.Uri.parse("inmemory://model/App.tsx"))
      modelRef.current = model
      lastEmittedRef.current = model.getValue()

      // Create editor
      const editor = monaco.editor.create(containerRef.current!, {
        model,
      })
      editorRef.current = editor

      // Relay changes upward
      const sub = editor.onDidChangeModelContent(() => {
        const text = model.getValue()
        lastEmittedRef.current = text
        onChange(text)
      })

      // Observe size changes
      resizeObsRef.current = new ResizeObserver(() => {
        const el = containerRef.current
        if (!el || !editorRef.current) return
        editorRef.current.layout({ width: el.clientWidth, height: el.clientHeight - 40 /* header height */ })
      })
      if (containerRef.current) {
        resizeObsRef.current.observe(containerRef.current)
      }

      // Initial layout tick
      setTimeout(() => {
        const el = containerRef.current
        if (el && editorRef.current) {
          editorRef.current.layout({ width: el.clientWidth, height: el.clientHeight - 40 })
        }
      }, 0)

      // Cleanup
      return () => {
        sub.dispose()
      }
    })()

    return () => {
      disposed = true
      resizeObsRef.current?.disconnect()
      resizeObsRef.current = null
      if (editorRef.current) {
        editorRef.current.dispose()
        editorRef.current = null
      }
      if (modelRef.current) {
        modelRef.current.dispose()
        modelRef.current = null
      }
      monacoRef.current = null
    }
  }, [])

  // Prop: value -> model (avoid loops)
  useEffect(() => {
    const model = modelRef.current
    if (!model) return
    if (value !== lastEmittedRef.current && value !== model.getValue()) {
      model.setValue(value ?? "")
    }
  }, [value])

  // Prop: fontSize -> editor option
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    editor.updateOptions({ fontSize })
  }, [fontSize])

  return (
    <div className="h-full w-full overflow-hidden">
      <div className="h-10 border-b border-zinc-800/80 flex items-center px-3 text-xs text-zinc-400 bg-zinc-950/60">
        <span className="truncate">App.tsx</span>
      </div>
      <div ref={containerRef} className="h-[calc(100%-2.5rem)] w-full" />
    </div>
  )
}

/** Collapsible console viewer */
function ConsolePanel() {
  const logs = useSandboxStore((s) => s.consoleLogs)
  const open = useSandboxStore((s) => s.consoleOpen)
  const setOpen = useSandboxStore((s) => s.setConsoleOpen)
  const clear = useSandboxStore((s) => s.clearConsole)

  const itemClass = (t: "log" | "warn" | "error") =>
    cn(
      "rounded-md px-2 py-1",
      t === "error"
        ? "bg-red-500/10 text-red-400 border border-red-500/20"
        : t === "warn"
        ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
        : "bg-zinc-500/10 text-zinc-200 border border-zinc-500/20"
    )

  return (
    <div className="w-full border-t border-zinc-800/80 bg-zinc-950/70">
      <button
        className="w-full text-left text-xs px-3 py-2 hover:bg-zinc-800/50 transition-colors flex items-center justify-between"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="font-medium">Console</span>
        <span className="text-muted-foreground">{logs.length} entries</span>
      </button>
      {open && (
        <div>
          <div className="max-h-40 overflow-auto text-xs font-mono px-3 py-2 space-y-1">
            {logs.length === 0 ? (
              <div className="text-muted-foreground">No messages</div>
            ) : (
              logs.map((l, i) => (
                <div key={i} className={itemClass(l.type)}>
                  <span className="opacity-60 mr-2">{new Date(l.time).toLocaleTimeString()}</span>
                  <span className="break-words">{l.message}</span>
                </div>
              ))
            )}
          </div>
          <div className="px-3 pb-2">
            <Button size="sm" variant="outline" onClick={clear}>Clear</Button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * PreviewPane: run App.tsx using esm.sh/tsx and render default export into #root.
 */
function PreviewPane({
  code,
}: {
  code: string
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const appendConsole = useSandboxStore((s) => s.appendConsole)

  // extract imports used in the code
  const found: string[] = useMemo(() => {
    if (!code) return []
    return Array.from(code.matchAll(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g), m => m[1])
  }, [code])

  console.log("Preview imports:", found)

  const srcDoc = useMemo(() => {
    const bootstrap = `<!DOCTYPE html>
      <html>
      <head>
        <script type="importmap">
          {
            "imports": ${JSON.stringify({
              "react": "https://esm.sh/react",
              "react-dom/client": "https://esm.sh/react-dom/client",
              ...Object.fromEntries(Array.from(found).map(i => [i, `https://esm.sh/${i}`]))
            })}
          }
        </script>
        <script type="module" src="https://esm.sh/tsx"></script>
        <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
      </head>
      <body>
        <div id="root"></div>
        <script type="text/babel">
        import { createRoot } from "react-dom/client";
         ${code}
          createRoot(root).render(<App />);
        </script>
      </body>
      </html>`
    return bootstrap
  }, [code])

  // Receive logs from iframe
  useEffect(() => {
    const onMsg = (ev: MessageEvent) => {
      const d: any = ev.data
      if (d?.__sandbox_log && (d.type === "log" || d.type === "warn" || d.type === "error")) {
        appendConsole({ type: d.type, message: String(d.message ?? ""), time: Number(d.time ?? Date.now()) })
      }
    }
    window.addEventListener("message", onMsg)
    return () => window.removeEventListener("message", onMsg)
  }, [appendConsole])

  return (
    <div className="h-full w-full overflow-hidden bg-zinc-950 flex flex-col">
      <div className="h-10 border-b border-zinc-800/80 flex items-center justify-between px-3 text-xs text-zinc-400 bg-zinc-950/60 shrink-0">
        <span className="truncate">Preview</span>
        <span className="opacity-60">tsx via esm.sh</span>
      </div>
      <div className="flex-1 min-h-0">
        <iframe
          ref={iframeRef}
          title="preview"
          className="w-full h-full bg-zinc-900"
          sandbox="allow-scripts allow-forms allow-pointer-lock allow-same-origin allow-popups"
          referrerPolicy="no-referrer"
          srcDoc={srcDoc}
        />
      </div>
    </div>
  )
}

export default function Sandbox() {
  const editorContent = useSandboxStore((s) => s.editorContent)
  const setEditorContent = useSandboxStore((s) => s.setEditorContent)
  const fontSize = useSandboxStore((s) => s.fontSize)
  const { orientation, editorRatio, previewRatio } = useSandboxStore((s) => s.layout)
  const setLayout = useSandboxStore((s) => s.setLayout)

  // Debounce preview updates
  const [debouncedCode, setDebouncedCode] = useState(editorContent)
  useEffect(() => {
    const id = setTimeout(() => setDebouncedCode(editorContent), 250)
    return () => clearTimeout(id)
  }, [editorContent])

  // Keyboard: Ctrl/Cmd+Enter to refresh
  const refreshRef = useRef<() => void>(() => {})
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "enter") {
        e.preventDefault()
        refreshRef.current?.()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Force dark mode class
  useEffect(() => {
    document?.documentElement.classList.add("dark")
  }, [])

  // Responsive orientation
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 768px)")
    const apply = () => setLayout({ orientation: mql.matches ? "vertical" : "horizontal" })
    apply()
    const listener = () => apply()
    mql.addEventListener?.("change", listener)
    return () => mql.removeEventListener?.("change", listener)
  }, [setLayout])

  const onResize = (size: number | string) => {
    const ratio = (size as number) / 100
    useSandboxStore.getState().setLayout({ editorRatio: ratio, previewRatio: 1 - ratio })
  }

  return (
    <div className="w-full h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <div className="flex-grow flex flex-col">
        <div className="flex-grow">
          <div className="h-full p-2 sm:p-3">
            <ResizablePanelGroup direction={orientation === "vertical" ? "vertical" : "horizontal"} className="h-full">
              <ResizablePanel defaultSize={editorRatio * 100} minSize={15} onResize={onResize}>
                <div className="h-full rounded-lg border border-zinc-800/80 overflow-hidden bg-zinc-950">
                  <EditorPane value={editorContent} onChange={setEditorContent} fontSize={fontSize} />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle className="mx-0.5 my-0.5 rounded-full" />
              <ResizablePanel defaultSize={previewRatio * 100} minSize={15}>
                <div className="h-full rounded-lg border border-zinc-800/80 overflow-hidden bg-zinc-950 flex flex-col">
                  <div className="flex-1 min-h-0">
                    <PreviewPane code={debouncedCode} />
                  </div>
                  <ConsolePanel />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div>
      </div>
    </div>
  )
}