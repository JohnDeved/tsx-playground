// Dynamic type loader for Monaco editor
// Provides built-in TypeScript definitions for commonly used packages

/**
 * Parse import statements from TypeScript/TSX code
 */
export function parseImports(code: string): string[] {
  const imports = new Set<string>()
  
  // Regex to match import statements
  const importRegex = /import\s+(?:.*?\s+from\s+)?['"`]([^'"`]+)['"`]/g
  let match
  
  while ((match = importRegex.exec(code)) !== null) {
    const importPath = match[1]
    
    // Skip relative imports and built-in modules
    if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
      // Extract package name (handle scoped packages like @react-icons/io5)
      const packageName = importPath.startsWith('@') 
        ? importPath.split('/').slice(0, 2).join('/')
        : importPath.split('/')[0]
      
      imports.add(packageName)
    }
  }
  
  return Array.from(imports)
}