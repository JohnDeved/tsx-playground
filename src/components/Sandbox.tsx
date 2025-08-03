import { useEffect, useMemo, useRef, useState } from "react"
import { ResizablePanel, ResizableHandle, ResizablePanelGroup } from "@/components/ui/resizable"
import { Button } from "@/components/ui/button"
import Editor from "@monaco-editor/react"
import { useSandboxStore } from "@/lib/store"
import { cn } from "@/lib/utils"



// Editor pane
function EditorPane({
  value,
  onChange,
  fontSize,
}: {
  value: string
  onChange: (v: string) => void
  fontSize: number
}) {
  const monacoTheme = "vs-dark"

  return (
    <div className="h-full w-full overflow-hidden">
      <div className="h-10 border-b border-zinc-800/80 flex items-center px-3 text-xs text-zinc-400 bg-zinc-950/60">
        <span className="truncate">index.html</span>
      </div>
      <Editor
        height="calc(100% - 2.5rem)"
        defaultLanguage="html"
        value={value}
        onChange={(v) => onChange(v ?? "")}
        theme={monacoTheme}
        options={{
          fontSize,
          minimap: { enabled: false },
          roundedSelection: true,
          scrollBeyondLastLine: false,
          wordWrap: "on",
          tabSize: 2,
          automaticLayout: true,
          smoothScrolling: true,
        }}
      />
    </div>
  )
}

// Console panel
function ConsolePanel() {
  const logs = useSandboxStore((s) => s.consoleLogs)
  const open = useSandboxStore((s) => s.consoleOpen)
  const setOpen = useSandboxStore((s) => s.setConsoleOpen)
  const clear = useSandboxStore((s) => s.clearConsole)

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
                <div
                  key={i}
                  className={cn(
                    "rounded-md px-2 py-1",
                    l.type === "error"
                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                      : l.type === "warn"
                      ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                      : "bg-zinc-500/10 text-zinc-200 border border-zinc-500/20"
                  )}
                >
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

// Preview pane with sandboxed iframe
function PreviewPane({
  html,
  onRefreshRequestedRef,
}: {
  html: string
  onRefreshRequestedRef: React.MutableRefObject<() => void>
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const appendConsole = useSandboxStore((s) => s.appendConsole)

  // Build a secure srcdoc
  const srcDoc = useMemo(() => {
    const capture = `
<script>
(function(){
  const queue = [];
  function send(type, args){
    try {
      parent.postMessage({ __sandbox_log: true, type, message: args.map(a => {
        try { return typeof a === 'object' ? JSON.stringify(a) : String(a) } catch { return String(a) }
      }).join(' '), time: Date.now() }, '*');
    } catch {}
  }
  ["log","warn","error"].forEach(k => {
    const orig = console[k];
    console[k] = function(...args){ send(k, args); try { orig && orig.apply(console, args) } catch {} }
  });
  window.addEventListener('error', function(e){
    send('error', [e.message + ' @ ' + (e.filename||'') + ':' + (e.lineno||'')]);
  });
  window.addEventListener('unhandledrejection', function(e){
    send('error', ['Unhandled: ' + (e.reason && (e.reason.message || e.reason))]);
  });
})();
</script>`
    // inject capture scripts at head end
    const idx = html.indexOf("</head>")
    if (idx !== -1) {
      return html.slice(0, idx) + capture + html.slice(idx)
    }
    return `<!doctype html><html><head>${capture}</head><body>${html}</body></html>`
  }, [html])

  // Listen to postMessage
  useEffect(() => {
    function onMsg(ev: MessageEvent) {
      const d: any = ev.data
      if (d && d.__sandbox_log) {
        appendConsole({ type: d.type, message: d.message, time: d.time })
      }
    }
    window.addEventListener("message", onMsg)
    return () => window.removeEventListener("message", onMsg)
  }, [appendConsole])

  // Imperative refresh
  useEffect(() => {
    onRefreshRequestedRef.current = () => {
      if (!iframeRef.current) return
      // Reset the srcdoc to force reload
      const el = iframeRef.current
      const cur = el.srcdoc
      el.srcdoc = ""
      // microtask flip
      queueMicrotask(() => (el.srcdoc = cur))
    }
  }, [onRefreshRequestedRef])

  return (
    <div className="h-full w-full overflow-hidden bg-zinc-950">
      <div className="h-10 border-b border-zinc-800/80 flex items-center justify-between px-3 text-xs text-zinc-400 bg-zinc-950/60">
        <span className="truncate">Preview</span>
        <span className="opacity-60">sandboxed</span>
      </div>
      <iframe
        ref={iframeRef}
        title="preview"
        className="w-full h-[calc(100%-2.5rem)] bg-zinc-900"
        sandbox="allow-scripts allow-forms allow-pointer-lock"
        // Avoid allow-top-navigation to prevent escapes
        srcDoc={srcDoc}
      />
    </div>
  )
}

export default function Sandbox() {
  const editorContent = useSandboxStore((s) => s.editorContent)
  const setEditorContent = useSandboxStore((s) => s.setEditorContent)
  const fontSize = useSandboxStore((s) => s.fontSize)
  // const setFontSize = useSandboxStore((s) => s.setFontSize)
  // Dark-only: no theme toggle, force dark Monaco theme
  // dark-only: no theme state needed
  // Removed fullscreen state
  const layout = useSandboxStore((s) => s.layout)
  const setLayout = useSandboxStore((s) => s.setLayout)
  // const resetLayout = useSandboxStore((s) => s.resetLayout)
  // appendConsole is wired inside PreviewPane via postMessage; no direct usage here.
  // const appendConsole = useSandboxStore((s) => s.appendConsole)

  // Debounced content for preview
  const [debouncedHtml, setDebouncedHtml] = useState(editorContent)
  useEffect(() => {
    const id = setTimeout(() => setDebouncedHtml(editorContent), 250)
    return () => clearTimeout(id)
  }, [editorContent])

  // Keyboard shortcuts
  const refreshRef = useRef<() => void>(() => {})
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      // Run / Refresh
      if (mod && e.key.toLowerCase() === "enter") {
        e.preventDefault()
        refreshRef.current?.()
      }
      // Future sidebar toggle
      if (mod && e.key.toLowerCase() === "b") {
        e.preventDefault()
        // placeholder
      }
      // Format sequence Ctrl/Cmd+K then Ctrl/Cmd+F
      // Monaco handles this via command palette; we simulate via custom event
      if (mod && e.key.toLowerCase() === "k") {
        // swallow to allow sequence
        // Next F handled in editor format button; keeping light for now
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Force dark mode only
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.add("dark")
    }
  }, [])

  const isMobile = typeof window !== "undefined" ? window.matchMedia("(max-width: 768px)").matches : false
  useEffect(() => {
    // auto switch orientation based on viewport
    setLayout({ orientation: isMobile ? "vertical" : "horizontal" })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile])



  const editorPane = (
    <div className="h-full">
      <EditorPane
        value={editorContent}
        onChange={setEditorContent}
        fontSize={fontSize}
      />
    </div>
  )

  const previewPane = (
    <div className="h-full">
      <PreviewPane html={debouncedHtml} onRefreshRequestedRef={refreshRef} />
      <ConsolePanel />
    </div>
  )



  // Always use the full page for the main split, no toolbar or fullscreen logic
  return (
    <div className="w-full h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <div className="flex-grow flex flex-col">
        <div className="flex-grow">
          <div className="h-full p-2 sm:p-3">
            <ResizablePanelGroup
              direction={layout.orientation === "vertical" ? "vertical" : "horizontal"}
              className="h-full"
            >
              <ResizablePanel
                defaultSize={layout.editorRatio * 100}
                minSize={15}
                onResize={(s) => {
                  const ratio = (s as number) / 100
                  useSandboxStore.getState().setLayout({ editorRatio: ratio, previewRatio: 1 - ratio })
                }}
              >
                <div className="h-full rounded-lg border border-zinc-800/80 overflow-hidden bg-zinc-950">
                  {editorPane}
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle className="mx-0.5 my-0.5 rounded-full" />
              <ResizablePanel defaultSize={layout.previewRatio * 100} minSize={15}>
                <div className="h-full rounded-lg border border-zinc-800/80 overflow-hidden bg-zinc-950">
                  {previewPane}
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div>
      </div>
    </div>
  )
}