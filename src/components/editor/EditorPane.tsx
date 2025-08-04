import { useEffect, useRef } from "react"
import { init } from "modern-monaco"
import { MONACO_CONFIG, EDITOR_OPTIONS, PANEL_HEADER_CLASS } from "@/lib/constants"

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
        const monaco = await init(MONACO_CONFIG)
        monacoRef.current = monaco
        
        // Add extra type definitions for better TypeScript support
        await addTypeDefinitions(monaco)
        
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

  // Function to add explicit type definitions
  const addTypeDefinitions = async (monaco: any) => {
    try {
      // Read type definitions from external file
      const typeDefinitions = await import('/src/types/external-libs.d.ts?raw')
        .then(module => module.default)
        .catch(() => {
          // Fallback to inline definitions if import fails
          return `
declare module 'react-icons/io5' {
  import { IconType } from 'react-icons';
  export const IoSparkles: IconType;
  export const IoHeart: IconType;
  export const IoStar: IconType;
  export const IoPlay: IconType;
  export const IoPause: IconType;
  export const IoStop: IconType;
  export const IoHome: IconType;
  export const IoSettings: IconType;
  export const IoSearch: IconType;
  export const IoMenu: IconType;
  export const IoClose: IconType;
  export const IoAdd: IconType;
  export const IoRemove: IconType;
  export const IoCheckmark: IconType;
  export const IoArrowBack: IconType;
  export const IoArrowForward: IconType;
  export const IoArrowUp: IconType;
  export const IoArrowDown: IconType;
}

declare module 'react-icons' {
  export interface IconBaseProps extends React.SVGAttributes<SVGElement> {
    children?: React.ReactNode;
    size?: string | number;
    color?: string;
    title?: string;
  }
  export type IconType = React.ComponentType<IconBaseProps>;
}

declare module 'framer-motion' {
  export interface MotionProps {
    initial?: any;
    animate?: any;
    exit?: any;
    transition?: any;
    whileHover?: any;
    whileTap?: any;
    whileInView?: any;
    variants?: any;
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
  }
  
  export interface MotionComponent {
    (props: MotionProps & React.HTMLAttributes<HTMLElement>): JSX.Element;
  }
  
  export const motion: {
    div: MotionComponent;
    span: MotionComponent;
    h1: MotionComponent;
    h2: MotionComponent;
    h3: MotionComponent;
    p: MotionComponent;
    button: MotionComponent;
    img: MotionComponent;
    section: MotionComponent;
    article: MotionComponent;
    header: MotionComponent;
    footer: MotionComponent;
    nav: MotionComponent;
    main: MotionComponent;
    aside: MotionComponent;
    ul: MotionComponent;
    ol: MotionComponent;
    li: MotionComponent;
    form: MotionComponent;
    input: MotionComponent;
    textarea: MotionComponent;
    select: MotionComponent;
    label: MotionComponent;
    table: MotionComponent;
    tr: MotionComponent;
    td: MotionComponent;
    th: MotionComponent;
    thead: MotionComponent;
    tbody: MotionComponent;
    tfoot: MotionComponent;
  };
  
  export const AnimatePresence: React.ComponentType<{
    children?: React.ReactNode;
    mode?: 'wait' | 'sync' | 'popLayout';
    initial?: boolean;
    onExitComplete?: () => void;
  }>;
}
`
        })

      // Safely access TypeScript defaults and add extra lib
      if (monaco.languages?.typescript?.typescriptDefaults?.addExtraLib) {
        monaco.languages.typescript.typescriptDefaults.addExtraLib(
          typeDefinitions,
          "file:///node_modules/@types/custom-types/index.d.ts"
        )

        // Configure TypeScript language service for better type checking
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

    } catch (error) {
      console.warn("Failed to add type definitions:", error)
    }
  }

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