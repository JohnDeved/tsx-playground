import { useEffect, useState } from "react"
import { ResizablePanel, ResizableHandle, ResizablePanelGroup } from "@/components/ui/resizable"
import { useSandboxStore } from "@/lib/store"
import { EditorPane } from "@/components/editor/EditorPane"
import { PreviewPane } from "@/components/preview/PreviewPane"
import { ConsolePanel } from "@/components/console/ConsolePanel"

export default function Sandbox() {
  const editorContent = useSandboxStore((s) => s.editorContent)
  const setEditorContent = useSandboxStore((s) => s.setEditorContent)
  const fontSize = useSandboxStore((s) => s.fontSize)
  const { orientation, editorRatio, previewRatio } = useSandboxStore((s) => s.layout)
  const setLayout = useSandboxStore((s) => s.setLayout)

  // Debounce preview updates
  const [debouncedCode, setDebouncedCode] = useState(editorContent)
  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedCode(editorContent), 250)
    return () => clearTimeout(timeoutId)
  }, [editorContent])

  // Force dark mode class
  useEffect(() => {
    document?.documentElement.classList.add("dark")
  }, [])

  // Responsive orientation
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)")
    const handleChange = () => setLayout({ 
      orientation: mediaQuery.matches ? "vertical" : "horizontal" 
    })
    
    handleChange()
    mediaQuery.addEventListener?.("change", handleChange)
    return () => mediaQuery.removeEventListener?.("change", handleChange)
  }, [setLayout])

  const handleResize = (size: number | string) => {
    const ratio = (size as number) / 100
    useSandboxStore.getState().setLayout({ 
      editorRatio: ratio, 
      previewRatio: 1 - ratio 
    })
  }

  return (
    <div className="w-full h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <div className="flex-grow flex flex-col">
        <div className="flex-grow">
          <div className="h-full p-2 sm:p-3">
            <ResizablePanelGroup 
              direction={orientation === "vertical" ? "vertical" : "horizontal"} 
              className="h-full"
            >
              <ResizablePanel 
                defaultSize={editorRatio * 100} 
                minSize={15} 
                onResize={handleResize}
              >
                <div className="h-full rounded-lg border border-zinc-800/80 overflow-hidden bg-zinc-950">
                  <EditorPane 
                    value={editorContent} 
                    onChange={setEditorContent} 
                    fontSize={fontSize} 
                  />
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