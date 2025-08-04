import { useEffect, useRef } from "react"
import { init } from "modern-monaco"
import { MONACO_CONFIG, EDITOR_OPTIONS, PANEL_HEADER_CLASS } from "@/lib/constants"

interface EditorPaneProps {
  value: string
  onChange: (value: string) => void
}

export default function EditorPane({ value, onChange }: EditorPaneProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const editorInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!editorRef.current || editorInstanceRef.current) return

    const initEditor = async () => {
      try {
        const monaco = await init(MONACO_CONFIG)
        
        // Configure TypeScript compiler options - simplified
        if (monaco.languages?.typescript?.typescriptDefaults) {
          monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            jsx: monaco.languages.typescript.JsxEmit.Preserve,
          })
        }
        
        // Create editor with options
        const editor = monaco.editor.create(editorRef.current, EDITOR_OPTIONS)
        editorInstanceRef.current = editor

        // Create or get existing model
        const uri = monaco.Uri.file("App.tsx")
        let model = monaco.editor.getModel(uri)
        if (!model) {
          model = monaco.editor.createModel(value, "typescript", uri)
        } else {
          model.setValue(value)
        }
        editor.setModel(model)

        // Listen for content changes
        model.onDidChangeContent(() => {
          const currentValue = model.getValue()
          onChange(currentValue)
        })

      } catch (error) {
        console.error("Failed to initialize Monaco editor:", error)
      }
    }

    initEditor()

    return () => {
      if (editorInstanceRef.current) {
        editorInstanceRef.current.dispose()
        editorInstanceRef.current = null
      }
    }
  }, [])

  // Update editor value when prop changes
  useEffect(() => {
    if (editorInstanceRef.current) {
      const model = editorInstanceRef.current.getModel()
      if (model && model.getValue() !== value) {
        model.setValue(value)
      }
    }
  }, [value])

  return (
    <div className="h-full w-full overflow-hidden">
      <div className={PANEL_HEADER_CLASS}>
        <span className="truncate">App.tsx</span>
      </div>
      <div 
        ref={editorRef}
        className="h-full w-full"
        style={{ height: 'calc(100% - 2.5rem)' }}
      />
    </div>
  )
}