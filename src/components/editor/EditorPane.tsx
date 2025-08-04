import { useEffect, useRef } from "react"
import { init } from "modern-monaco"

interface EditorPaneProps {
  value: string
  onChange: (value: string) => void
  fontSize: number
}

export function EditorPane({ value, onChange, fontSize }: EditorPaneProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const monacoRef = useRef<any>(null)
  const editorInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!editorRef.current || editorInstanceRef.current) return

    const initEditor = async () => {
      try {
        // Use the simplified init approach
        const monaco = await init({
          theme: "vitesse-dark",
          lsp: {
            typescript: {
              compilerOptions: {
                jsx: 2, // JSX.ReactJSX
                strict: true,
                target: 99, // ESNext
                module: 99, // ESNext
                moduleResolution: 100, // Bundler
                allowImportingTsExtensions: true,
                allowJs: true,
                noEmit: true,
              },
              importMap: {
                "react": "https://esm.sh/react@18",
                "react-dom": "https://esm.sh/react-dom@18", 
                "react-dom/client": "https://esm.sh/react-dom@18/client",
                "react-icons": "https://esm.sh/react-icons@5",
                "react-icons/io5": "https://esm.sh/react-icons@5/io5",
                "framer-motion": "https://esm.sh/framer-motion@12",
              } as any,
            },
          },
        })

        monacoRef.current = monaco
        
        // Create editor with simplified options
        const editor = monaco.editor.create(editorRef.current, {
          fontSize,
          minimap: { enabled: false },
          roundedSelection: true,
          scrollBeyondLastLine: false,
          wordWrap: "on",
          tabSize: 2,
          automaticLayout: true,
          smoothScrolling: true,
          theme: "vitesse-dark",
        })

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
          onChange(model.getValue())
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

  // Update font size when prop changes
  useEffect(() => {
    if (editorInstanceRef.current) {
      editorInstanceRef.current.updateOptions({ fontSize })
    }
  }, [fontSize])

  return (
    <div className="h-full w-full overflow-hidden">
      <div className="h-10 border-b border-zinc-800/80 flex items-center px-3 text-xs text-zinc-400 bg-zinc-950/60">
        <span className="truncate">App.tsx</span>
      </div>
      <div 
        ref={editorRef}
        className="h-[calc(100%-2.5rem)] w-full"
      />
    </div>
  )
}