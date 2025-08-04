import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extract import statements from TypeScript/JSX code
 */
export function extractImports(code: string): string[] {
  if (!code) return []
  return Array.from(
    code.matchAll(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g), 
    match => match[1]
  )
}

/**
 * Extract the default export name from TypeScript/JSX code
 * Supports various export patterns:
 * - export default function App()
 * - export default function OtherName()
 * - export default const OtherName =
 * - export default App;
 */
export function extractDefaultExportName(code: string): string {
  if (!code) return "App"
  
  // Match: export default function SomeName
  const functionMatch = code.match(/export\s+default\s+function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
  if (functionMatch) return functionMatch[1];
  
  // Match: export default const SomeName = 
  const constMatch = code.match(/export\s+default\s+const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
  if (constMatch) return constMatch[1];
  
  // Match: export default SomeName;
  const identifierMatch = code.match(/export\s+default\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*;/);
  if (identifierMatch) return identifierMatch[1];
  
  // Fallback to "App" if no match found
  return "App";
}
