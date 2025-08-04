// Shared styling constants
export const BORDER_CLASS = "border-zinc-800/80"
export const BACKGROUND_PANEL = "bg-zinc-950/60"
export const BACKGROUND_MAIN = "bg-zinc-950"

// Panel header styling
export const PANEL_HEADER_CLASS = `h-10 border-b ${BORDER_CLASS} flex items-center px-3 text-xs text-zinc-400 ${BACKGROUND_PANEL}`

// Container styling
export const PANEL_CONTAINER_CLASS = `h-full rounded-lg border ${BORDER_CLASS} overflow-hidden ${BACKGROUND_MAIN}`

// Console log styling helpers
export const getConsoleLogClass = (type: "log" | "warn" | "error") => {
  const baseClass = "rounded-md px-2 py-1"
  switch (type) {
    case "error":
      return `${baseClass} bg-red-500/10 text-red-400 border border-red-500/20`
    case "warn":
      return `${baseClass} bg-amber-500/10 text-amber-300 border border-amber-500/20`
    default:
      return `${baseClass} bg-zinc-500/10 text-zinc-200 border border-zinc-500/20`
  }
}

// Monaco editor configuration
export const MONACO_CONFIG = {
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
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        skipLibCheck: true,
        noEmit: true,
        types: ["react", "react-dom"] as string[],
      },
      importMap: {
        imports: {
          "react": "https://esm.sh/react@18",
          "react-dom": "https://esm.sh/react-dom@18", 
          "react-dom/client": "https://esm.sh/react-dom@18/client",
          "react-icons": "https://esm.sh/react-icons@5",
          "react-icons/io5": "https://esm.sh/react-icons@5/io5",
          "framer-motion": "https://esm.sh/framer-motion@12",
        },
        scopes: {}
      },
      // Ensure TypeScript version compatibility
      tsVersion: "5.5.4",
    },
  },
}

// Editor options
export const EDITOR_OPTIONS = {
  minimap: { enabled: false },
  roundedSelection: true,
  scrollBeyondLastLine: false,
  wordWrap: "on" as const,
  tabSize: 2,
  automaticLayout: true,
  smoothScrolling: true,
  theme: "vs-dark",
} as const

// Debounce delay for preview updates
export const PREVIEW_DEBOUNCE_DELAY = 250