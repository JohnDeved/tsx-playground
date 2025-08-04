import { useEffect, useRef, useCallback } from "react"
import { init } from "modern-monaco"
import { MONACO_CONFIG, EDITOR_OPTIONS, PANEL_HEADER_CLASS } from "@/lib/constants"
import { parseImports, loadTypesForPackages } from "@/lib/type-loader"

interface EditorPaneProps {
  value: string
  onChange: (value: string) => void
  fontSize: number
}

export function EditorPane({ value, onChange, fontSize }: EditorPaneProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const monacoRef = useRef<any>(null)
  const editorInstanceRef = useRef<any>(null)
  const loadedTypesRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!editorRef.current || editorInstanceRef.current) return

    const initEditor = async () => {
      try {
        const monaco = await init(MONACO_CONFIG)
        monacoRef.current = monaco
        
        // Configure TypeScript compiler options
        if (monaco.languages?.typescript?.typescriptDefaults) {
          monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.ES2020,
            module: monaco.languages.typescript.ModuleKind.ESNext,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.Bundler,
            allowNonTsExtensions: true,
            allowJs: true,
            strict: true,
            allowSyntheticDefaultImports: true,
            esModuleInterop: true,
            skipLibCheck: true,
            jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
            jsxImportSource: 'react',
          })

          // Enable TypeScript diagnostics
          monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: false,
            noSyntaxValidation: false,
            noSuggestionDiagnostics: false,
          })
        }
        
        // Load types for the initial code
        await loadTypesForCode(value)
        
        // Create editor with options
        const editor = monaco.editor.create(editorRef.current, {
          ...EDITOR_OPTIONS,
          fontSize,
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

        // Listen for content changes and update types accordingly
        model.onDidChangeContent(async () => {
          const currentValue = model.getValue()
          onChange(currentValue)
          
          // Debounce type loading to avoid excessive API calls
          clearTimeout((window as any).__typeLoadTimeout)
          ;(window as any).__typeLoadTimeout = setTimeout(async () => {
            await loadTypesForCode(currentValue)
          }, 1000) // 1 second debounce
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

  // Function to dynamically load type definitions for detected imports
  const loadTypesForCode = useCallback(async (code: string) => {
    if (!monacoRef.current) return

    try {
      // Parse imports from the code
      const imports = parseImports(code)
      
      // Filter out packages we've already loaded
      const newImports = imports.filter(pkg => !loadedTypesRef.current.has(pkg))
      
      if (newImports.length === 0) return

      console.log('Loading types for packages:', newImports)
      
      // Load type definitions for new imports
      const typeDefinitions = await loadTypesForPackages(newImports)
      
      // Add type definitions to Monaco
      for (const [packageName, typeContent] of Object.entries(typeDefinitions)) {
        if (monacoRef.current?.languages?.typescript?.typescriptDefaults?.addExtraLib) {
          monacoRef.current.languages.typescript.typescriptDefaults.addExtraLib(
            typeContent,
            `file:///node_modules/@types/${packageName}/index.d.ts`
          )
          
          // Mark this package as loaded
          loadedTypesRef.current.add(packageName)
          console.log(`Loaded types for ${packageName}`)
        }
      }

    } catch (error) {
      console.warn("Failed to load dynamic types:", error)
    }
  }, [])

  // Update editor value when prop changes (but also reload types)
  useEffect(() => {
    if (editorInstanceRef.current) {
      const model = editorInstanceRef.current.getModel()
      if (model && model.getValue() !== value) {
        model.setValue(value)
        // Load types for the new content
        loadTypesForCode(value)
      }
    }
  }, [value, loadTypesForCode])

  // Update font size when prop changes
  useEffect(() => {
    if (editorInstanceRef.current) {
      editorInstanceRef.current.updateOptions({ fontSize })
    }
  }, [fontSize])

  return (
    <div className="h-full w-full overflow-hidden">
      <div className={PANEL_HEADER_CLASS}>
        <span className="truncate">App.tsx</span>
      </div>
      <div 
        ref={editorRef}
        className="h-[calc(100%-2.5rem)] w-full"
      />
    </div>
  )
}