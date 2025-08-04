import { ResizablePanel, ResizableHandle, ResizablePanelGroup } from "@/components/ui/resizable"
import { useSandboxStore } from "@/lib/store"
import { EditorPane } from "@/components/editor/EditorPane"
import { PreviewPane } from "@/components/preview/PreviewPane"
import { ConsolePanel } from "@/components/console/ConsolePanel"
import { PREVIEW_DEBOUNCE_DELAY, PANEL_CONTAINER_CLASS } from "@/lib/constants"
import { useDebounce, useResponsiveLayout, useDarkMode } from "@/hooks"

export default function Sandbox() {
  const editorContent = useSandboxStore((s) => s.editorContent)
  const setEditorContent = useSandboxStore((s) => s.setEditorContent)
  const fontSize = useSandboxStore((s) => s.fontSize)
  const { orientation, editorRatio, previewRatio } = useSandboxStore((s) => s.layout)
  const setLayout = useSandboxStore((s) => s.setLayout)

  // Use custom hooks for cleaner logic
  const debouncedCode = useDebounce(editorContent, PREVIEW_DEBOUNCE_DELAY)
  useDarkMode()
  useResponsiveLayout(setLayout)

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
                <div className={PANEL_CONTAINER_CLASS}>
                  <EditorPane 
                    value={editorContent} 
                    onChange={setEditorContent} 
                    fontSize={fontSize} 
                  />
                </div>
              </ResizablePanel>
              
              <ResizableHandle withHandle className="mx-0.5 my-0.5 rounded-full" />
              
              <ResizablePanel defaultSize={previewRatio * 100} minSize={15}>
                <div className={`${PANEL_CONTAINER_CLASS} flex flex-col`}>
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