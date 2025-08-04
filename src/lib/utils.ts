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
