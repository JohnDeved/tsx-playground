import { useEffect, useMemo, useRef } from "react"
import { useSandboxStore } from "@/lib/store"
import { PANEL_HEADER_CLASS, BACKGROUND_MAIN } from "@/lib/constants"
import { extractImports, extractDefaultExportName } from "@/lib/utils"

interface PreviewPaneProps {
  code: string
}

// Generate the preview iframe HTML template
function generatePreviewTemplate(code: string, imports: string[]): string {
  const importMap = {
    "react": "https://esm.sh/react",
    "react-dom/client": "https://esm.sh/react-dom/client",
    ...Object.fromEntries(imports.map(i => [i, `https://esm.sh/${i}`]))
  };

  // Extract the default export name to render dynamically
  const componentName = extractDefaultExportName(code);

  return `<!DOCTYPE html>
<html>
<head>
  <script type="importmap">
    {
      "imports": ${JSON.stringify(importMap)}
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
    createRoot(root).render(<${componentName} />);
  </script>
</body>
</html>`;
}

interface PreviewPaneProps {
  code: string
}

export default function PreviewPane({ code }: PreviewPaneProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const appendConsole = useSandboxStore((s) => s.appendConsole)

  // Extract imports used in the code
  const foundImports = useMemo(() => extractImports(code), [code])

  console.log("Preview imports:", foundImports)

  const srcDoc = useMemo(() => {
    return generatePreviewTemplate(code, foundImports)
  }, [code, foundImports])

  // Receive logs from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data: any = event.data
      if (data?.__sandbox_log && (data.type === "log" || data.type === "warn" || data.type === "error")) {
        appendConsole({ 
          type: data.type, 
          message: String(data.message ?? ""), 
          time: Number(data.time ?? Date.now()) 
        })
      }
    }
    
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [appendConsole])

  return (
    <div className={`h-full w-full overflow-hidden ${BACKGROUND_MAIN} flex flex-col`}>
      <div className={`${PANEL_HEADER_CLASS} justify-between shrink-0`}>
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